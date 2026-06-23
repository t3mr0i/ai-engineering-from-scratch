"""Vendor scorecard engine with hard gates and cost-trap detector — stdlib only.

Three parts, one lesson: procurement evidence is what bites, not the scorecard.

Part 1 — SCORECARD EVALUATOR
  Score vendors on the six dimensions, rank by client weight profile, surface
  the dimension where each vendor most diverges from the leader.

Part 2 — HARD-GATE ENFORCEMENT (failure shape: "demo-data disqualification")
  A vendor that scores 4/4 on capability is still disqualified at the gate
  step if the DPA permits training on customer data by default, or if the
  ISO 27001 Statement of Applicability excludes the inference API. This is
  the step the lesson's contract-reviewer story shows the cost of skipping.

Part 3 — COST-TRAP DETECTOR (failure shape: "batch-price quote")
  A vendor's quote looks 20-30% cheaper because it uses batch-inference
  pricing. The deployment is real-time. The detector re-quotes under the
  actual SLA, applies context-window growth, and adds the switching cost
  the TCO comparison left out. The cheap vendor may or may not survive.

All scores are integers 0-4:
  0 = does not meet bar / no evidence
  1 = partial / documentation gaps
  2 = meets minimum bar
  3 = strong / exceeds typical requirements
  4 = best-in-class

No model, no network. The point is to make the procurement policy explicit
and runnable, the same way the Copilot task router made the agent-mode
routing rule explicit.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Tuple


# ============================================================================
# Dimensions and weights
# ============================================================================

class Dim(Enum):
    CAPABILITY    = "Model capability"
    DATA_HANDLING = "Data handling & residency"
    SECURITY      = "Security posture"
    COMPLIANCE    = "Compliance certifications"
    INTEGRATION   = "Integration & lock-in risk"
    ECONOMICS     = "Economics & exit planning"


ALL_DIMS: List[Dim] = list(Dim)


@dataclass
class Vendor:
    name: str
    scores: Dict[Dim, int]  # 0-4 for each dimension

    def score_for(self, dim: Dim) -> int:
        return self.scores.get(dim, 0)


@dataclass
class WeightProfile:
    name: str
    weights: Dict[Dim, float]  # must sum to 1.0

    def __post_init__(self) -> None:
        total = sum(self.weights.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Weights for '{self.name}' sum to {total:.3f}, expected 1.0")


# ============================================================================
# Hard-gate evidence (separate from the 0-4 score)
# ============================================================================
#
# A hard gate is a boolean, evidence-backed fact. It is NOT a weighted
# dimension. A vendor that scores 0/4 on capability can still pass the
# gates; a vendor that scores 4/4 on capability fails the gates if its
# DPA permits training on customer data. The scorecard ranks; the gates
# filter.

@dataclass
class GateEvidence:
    dpa_signed: bool                 # signed DPA in hand, not "available on request"
    no_training_on_customer_data: bool  # committed in the DPA, not in marketing
    soc2_type_ii: bool               # report covers the inference API endpoint
    iso27001_in_scope: bool          # Statement of Applicability covers inference API
    eu_data_residency: bool          # inference region is EU; no third-country hop
    bsi_c5: bool = False             # required only for German public sector

    def gate_failures(self, require_bsi_c5: bool = False) -> List[str]:
        """Return the list of gates the vendor fails. Empty list = passes."""
        failures: List[str] = []
        if not self.dpa_signed:
            failures.append("no signed DPA")
        if not self.no_training_on_customer_data:
            failures.append("DPA permits training on customer data by default")
        if not self.soc2_type_ii:
            failures.append("SOC 2 Type II not provided or out of scope")
        if not self.iso27001_in_scope:
            failures.append("ISO 27001 Statement of Applicability excludes inference API")
        if not self.eu_data_residency:
            failures.append("inference region outside EU")
        if require_bsi_c5 and not self.bsi_c5:
            failures.append("BSI C5 certification missing (German public-sector gate)")
        return failures


# ============================================================================
# Cost-trap inputs
# ============================================================================
#
# A cost model is a small set of assumptions. Two quotes can use the same
# headline price-per-token and produce different TCOs once the assumptions
# disagree. The cost-trap detector re-quotes under the real deployment
# parameters and surfaces the trap that drove the spread.

@dataclass
class CostProfile:
    """How a vendor was actually priced in the quote.

    The list price is the real-time rate the vendor publishes. The
    `quoted_sla` is what the vendor's quote assumed; if the deployment
    is real-time and the quote was batch, the batch discount is voided
    and the list price applies. The detection logic is in
    `effective_price_per_million()`.
    """
    list_price_per_million_input_tokens: float   # USD, real-time rate
    list_price_per_million_output_tokens: float  # USD, real-time rate
    quoted_sla: str                              # "realtime" | "batch"
    batch_discount: float = 0.0                  # 0.0 to 0.8; only honoured if quoted_sla matches deployment SLA


@dataclass
class TrafficProfile:
    """How the workload actually behaves in production."""
    monthly_requests: int
    avg_input_tokens: float    # production average, not demo
    avg_output_tokens: float
    real_time_required: bool   # False permits batch SLA


@dataclass
class SwitchingCost:
    """Estimated migration cost if this vendor is replaced."""
    re_integration_weeks: int
    re_eval_weeks: int
    data_export_complexity: str  # "standard" | "custom" | "vendor-locked"
    fine_tuned_models_in_use: int


# ============================================================================
# Part 1: scorecard evaluator
# ============================================================================

def weighted_score(vendor: Vendor, profile: WeightProfile) -> float:
    return sum(
        vendor.score_for(dim) * profile.weights.get(dim, 0.0)
        for dim in ALL_DIMS
    )


def rank(
    vendors: List[Vendor], profile: WeightProfile
) -> List[Tuple[Vendor, float]]:
    scored = [(v, weighted_score(v, profile)) for v in vendors]
    return sorted(scored, key=lambda x: x[1], reverse=True)


def biggest_gap_from_leader(
    vendor: Vendor, leader: Vendor, profile: WeightProfile
) -> Tuple[Dim, float]:
    gaps = {
        dim: (leader.score_for(dim) - vendor.score_for(dim)) * profile.weights[dim]
        for dim in ALL_DIMS
    }
    worst = max(gaps, key=lambda d: gaps[d])
    return worst, gaps[worst]


# ============================================================================
# Part 2: hard-gate enforcement
# ============================================================================

def filter_by_gates(
    vendors: List[Vendor],
    gates: Dict[str, GateEvidence],
    require_bsi_c5: bool = False,
) -> Tuple[List[Vendor], Dict[str, List[str]]]:
    """Return (surviving_vendors, {vendor_name: list_of_failed_gates})."""
    survivors: List[Vendor] = []
    failures: Dict[str, List[str]] = {}
    for v in vendors:
        evidence = gates.get(v.name, GateEvidence(*[False] * 6))
        fails = evidence.gate_failures(require_bsi_c5=require_bsi_c5)
        if fails:
            failures[v.name] = fails
        else:
            survivors.append(v)
    return survivors, failures


# ============================================================================
# Part 3: cost-trap detector
# ============================================================================
#
# Three traps the lesson names explicitly. The detector applies each in turn
# and prints a verdict per vendor.

def effective_price_per_million(
    cost: CostProfile, traffic: TrafficProfile
) -> Tuple[float, str]:
    """Re-quote the vendor's per-token price under the actual deployment SLA.
    Returns (effective_price_per_million_input_tokens, explanation).

    The list price is the real-time rate. The vendor's quote may have used
    a batch SLA; if the deployment is real-time, the batch discount is
    voided and the list price applies. The 'quote' field in the output
    is the price the vendor *quoted*; the 'effective' price is what you
    actually pay at the deployment SLA.
    """
    if cost.quoted_sla == "batch" and traffic.real_time_required:
        # The vendor was quoted at batch; the deployment is real-time.
        # Batch discount does not apply. The "cheap" quote is wrong.
        return (
            cost.list_price_per_million_input_tokens,
            "batch quote, real-time deployment -> discount invalid, list price applies",
        )
    if cost.quoted_sla == "batch" and not traffic.real_time_required:
        return (
            cost.list_price_per_million_input_tokens * (1.0 - cost.batch_discount),
            "batch SLA, batch deployment -> discount honoured",
        )
    return (
        cost.list_price_per_million_input_tokens,
        "real-time quote, real-time deployment -> no adjustment",
    )


def quoted_price_per_million(cost: CostProfile) -> float:
    """The price the vendor *quoted* — what the procurement paper saw."""
    if cost.quoted_sla == "batch":
        return cost.list_price_per_million_input_tokens * (1.0 - cost.batch_discount)
    return cost.list_price_per_million_input_tokens


def monthly_cost(
    cost: CostProfile, traffic: TrafficProfile
) -> Tuple[float, float, str]:
    """Compute (quoted_monthly_usd, effective_monthly_usd, explanation).
    The 'quoted' value is what the procurement paper would have projected;
    the 'effective' value is what you actually pay at the deployment SLA.
    The gap is the trap."""
    eff_in, note_in = effective_price_per_million(cost, traffic)
    if cost.quoted_sla == "batch" and traffic.real_time_required:
        eff_out = cost.list_price_per_million_output_tokens  # discount voided
        note_out = "batch output discount voided"
    else:
        eff_out = cost.list_price_per_million_output_tokens * (1.0 - cost.batch_discount)
        note_out = "output at quoted SLA"

    total_input_tokens = traffic.monthly_requests * traffic.avg_input_tokens
    total_output_tokens = traffic.monthly_requests * traffic.avg_output_tokens
    effective_monthly_usd = (
        total_input_tokens / 1_000_000.0 * eff_in
        + total_output_tokens / 1_000_000.0 * eff_out
    )
    # The quoted monthly is what the vendor's quote would have produced if
    # you trusted the SLA they quoted.
    quoted_in = quoted_price_per_million(cost)
    if cost.quoted_sla == "batch":
        quoted_out = cost.list_price_per_million_output_tokens * (1.0 - cost.batch_discount)
    else:
        quoted_out = cost.list_price_per_million_output_tokens
    quoted_monthly_usd = (
        total_input_tokens / 1_000_000.0 * quoted_in
        + total_output_tokens / 1_000_000.0 * quoted_out
    )
    return quoted_monthly_usd, effective_monthly_usd, f"{note_in}; {note_out}"


def switching_cost_estimate(sw: SwitchingCost) -> Tuple[int, str]:
    """Rough weeks of engineering effort, weighted by the real risk factors."""
    weeks = sw.re_integration_weeks + sw.re_eval_weeks
    if sw.data_export_complexity == "custom":
        weeks += 4
    elif sw.data_export_complexity == "vendor-locked":
        weeks += 12
    if sw.fine_tuned_models_in_use > 0:
        weeks += 4 * sw.fine_tuned_models_in_use
    return weeks, f"{weeks} weeks engineering (re-integration + re-eval + lock-in adjustments)"


# ============================================================================
# Display helpers
# ============================================================================

BAR_WIDTH = 4


def score_bar(score: int, max_score: int = 4) -> str:
    filled = int(round(score / max_score * BAR_WIDTH))
    return "[" + "#" * filled + "." * (BAR_WIDTH - filled) + "]"


def print_scorecard(
    ranked: List[Tuple[Vendor, float]], profile: WeightProfile
) -> None:
    leader = ranked[0][0]
    col_w = 38
    print(f"\n  Profile: {profile.name}")
    print(f"  {'Vendor':<{col_w}} {'Score':>6}  {'Rank':<6}")
    print(f"  {'-' * col_w} {'------':>6}  {'----':<6}")
    for pos, (vendor, score) in enumerate(ranked, 1):
        print(f"  {vendor.name:<{col_w}} {score:>6.2f}  #{pos}")
        if pos > 1:
            gap_dim, gap_val = biggest_gap_from_leader(vendor, leader, profile)
            print(
                f"    ^ weakest vs leader: {gap_dim.value} "
                f"(weighted gap {gap_val:.2f})"
            )


def print_dimension_detail(vendors: List[Vendor]) -> None:
    col_w = 38
    print(f"\n  {'Vendor':<{col_w}}", end="")
    for dim in ALL_DIMS:
        short = dim.value.split()[0][:7]
        print(f"  {short:>7}", end="")
    print()
    print(f"  {'-' * col_w}", end="")
    for _ in ALL_DIMS:
        print(f"  {'-------':>7}", end="")
    print()
    for vendor in vendors:
        print(f"  {vendor.name:<{col_w}}", end="")
        for dim in ALL_DIMS:
            print(f"  {score_bar(vendor.score_for(dim)):>7}", end="")
        print()
    print()
    print("  Score legend: [####]=4  [###.]=3  [##..]=2  [#...]=1  [....]=0")


# ============================================================================
# Illustrative data (grounded in public 2026 information)
# ============================================================================

VENDORS: List[Vendor] = [
    Vendor(
        name="Anthropic Enterprise API (direct)",
        scores={
            Dim.CAPABILITY:    4,
            Dim.DATA_HANDLING: 3,
            Dim.SECURITY:      3,
            Dim.COMPLIANCE:    3,
            Dim.INTEGRATION:   2,  # proprietary extended-thinking API surface
            Dim.ECONOMICS:     2,  # no batch discount on direct API
        },
    ),
    Vendor(
        name="AWS Bedrock (Claude + others)",
        scores={
            Dim.CAPABILITY:    3,
            Dim.DATA_HANDLING: 4,
            Dim.SECURITY:      4,
            Dim.COMPLIANCE:    4,
            Dim.INTEGRATION:   3,  # OpenAI-compatible endpoint available
            Dim.ECONOMICS:     3,  # batch pricing, reserved capacity
        },
    ),
    Vendor(
        name="Azure AI Foundry (GPT-4o + others)",
        scores={
            Dim.CAPABILITY:    4,
            Dim.DATA_HANDLING: 4,
            Dim.SECURITY:      4,
            Dim.COMPLIANCE:    4,
            Dim.INTEGRATION:   3,
            Dim.ECONOMICS:     3,
        },
    ),
    Vendor(
        name="Google Vertex AI (Gemini)",
        scores={
            Dim.CAPABILITY:    4,
            Dim.DATA_HANDLING: 3,
            Dim.SECURITY:      3,
            Dim.COMPLIANCE:    3,
            Dim.INTEGRATION:   2,  # Vertex SDK is non-standard
            Dim.ECONOMICS:     3,
        },
    ),
    Vendor(
        name="Mistral API (EU-hosted)",
        scores={
            Dim.CAPABILITY:    2,
            Dim.DATA_HANDLING: 4,
            Dim.SECURITY:      2,
            Dim.COMPLIANCE:    2,  # GDPR-native but limited cert coverage
            Dim.INTEGRATION:   4,  # OpenAI-compatible; open weights available
            Dim.ECONOMICS:     4,  # lowest price tier for many tasks
        },
    ),
    Vendor(
        name="Self-hosted open weights (e.g. Llama 4)",
        scores={
            Dim.CAPABILITY:    3,
            Dim.DATA_HANDLING: 4,
            Dim.SECURITY:      3,
            Dim.COMPLIANCE:    3,
            Dim.INTEGRATION:   4,
            Dim.ECONOMICS:     2,  # high upfront infra cost; low marginal cost at scale
        },
    ),
]


PROFILES: List[WeightProfile] = [
    WeightProfile(
        name="Regulated enterprise (financial/public sector, GDPR high-sensitivity)",
        weights={
            Dim.CAPABILITY:    0.10,
            Dim.DATA_HANDLING: 0.25,
            Dim.SECURITY:      0.25,
            Dim.COMPLIANCE:    0.20,
            Dim.INTEGRATION:   0.10,
            Dim.ECONOMICS:     0.10,
        },
    ),
    WeightProfile(
        name="Consulting internal tool (moderate data sensitivity, rapid iteration)",
        weights={
            Dim.CAPABILITY:    0.25,
            Dim.DATA_HANDLING: 0.15,
            Dim.SECURITY:      0.15,
            Dim.COMPLIANCE:    0.10,
            Dim.INTEGRATION:   0.20,
            Dim.ECONOMICS:     0.15,
        },
    ),
    WeightProfile(
        name="Startup prototype (speed and cost dominant, no regulated data)",
        weights={
            Dim.CAPABILITY:    0.30,
            Dim.DATA_HANDLING: 0.05,
            Dim.SECURITY:      0.05,
            Dim.COMPLIANCE:    0.05,
            Dim.INTEGRATION:   0.25,
            Dim.ECONOMICS:     0.30,
        },
    ),
]


# Gate evidence per vendor. The key names match Vendor.name.
# The Azure entry is intentionally set up to fail one gate: the Statement
# of Applicability excludes the inference API. This is the failure shape
# from the logistics-firm story in the lesson — a vendor that cites the
# cert and the cert doesn't cover what the client will actually call.
GATES: Dict[str, GateEvidence] = {
    "Anthropic Enterprise API (direct)": GateEvidence(
        dpa_signed=True,
        no_training_on_customer_data=True,
        soc2_type_ii=True,
        iso27001_in_scope=True,
        eu_data_residency=True,
    ),
    "AWS Bedrock (Claude + others)": GateEvidence(
        dpa_signed=True,
        no_training_on_customer_data=True,
        soc2_type_ii=True,
        iso27001_in_scope=True,
        eu_data_residency=True,
        bsi_c5=True,
    ),
    "Azure AI Foundry (GPT-4o + others)": GateEvidence(
        dpa_signed=True,
        no_training_on_customer_data=True,
        soc2_type_ii=True,
        iso27001_in_scope=False,  # <-- SoA excludes inference API
        eu_data_residency=True,
        bsi_c5=True,
    ),
    "Google Vertex AI (Gemini)": GateEvidence(
        dpa_signed=True,
        no_training_on_customer_data=True,
        soc2_type_ii=True,
        iso27001_in_scope=True,
        eu_data_residency=True,
    ),
    "Mistral API (EU-hosted)": GateEvidence(
        dpa_signed=True,
        no_training_on_customer_data=True,
        soc2_type_ii=True,
        iso27001_in_scope=True,
        eu_data_residency=True,
    ),
    "Self-hosted open weights (e.g. Llama 4)": GateEvidence(
        dpa_signed=True,
        no_training_on_customer_data=True,
        soc2_type_ii=False,  # self-hosted; cert is yours to provide
        iso27001_in_scope=False,
        eu_data_residency=True,
    ),
}


# Cost-trap data. The "BudgetAI" vendor is a synthetic composite of the
# pattern the lesson warns about: a 20% cheaper list price achieved by
# quoting batch-inference pricing for a real-time workload.
COST_PROFILES: Dict[str, CostProfile] = {
    "AWS Bedrock (Claude + others)": CostProfile(
        list_price_per_million_input_tokens=3.0,
        list_price_per_million_output_tokens=15.0,
        quoted_sla="realtime",
    ),
    "Azure AI Foundry (GPT-4o + others)": CostProfile(
        list_price_per_million_input_tokens=3.5,
        list_price_per_million_output_tokens=14.0,
        quoted_sla="realtime",
    ),
    # BudgetAI is a synthetic composite of the failure shape the lesson
    # names "batch-price quote". Its real-time list price is the same
    # as Bedrock's, but the quote the procurement team saw applied a
    # 50% batch discount, producing a number 40% below the real-time
    # Bedrock quote. The deployment is real-time. The detector
    # void-s the discount and shows the real cost.
    "BudgetAI (composite cheaper-by-quote vendor)": CostProfile(
        list_price_per_million_input_tokens=3.0,    # same real-time list as Bedrock
        list_price_per_million_output_tokens=15.0,
        quoted_sla="batch",                         # quote was at batch SLA
        batch_discount=0.5,                         # 50% off -> $1.50 / $7.50 in quote
    ),
}


# Demo traffic: 100K requests/month, 2K input tokens, 500 output tokens.
# Production traffic: same volume but 8K input tokens (system prompt +
# history + retrieval), 1K output tokens. The cost-trap detector re-quotes
# under both, because the demo profile is what the vendor's quote assumed
# and the production profile is what TCO actually looks like.
DEMO_TRAFFIC = TrafficProfile(
    monthly_requests=100_000,
    avg_input_tokens=2_000,
    avg_output_tokens=500,
    real_time_required=True,
)
PRODUCTION_TRAFFIC = TrafficProfile(
    monthly_requests=100_000,
    avg_input_tokens=8_000,
    avg_output_tokens=1_000,
    real_time_required=True,
)


SWITCHING_COSTS: Dict[str, SwitchingCost] = {
    "AWS Bedrock (Claude + others)": SwitchingCost(
        re_integration_weeks=2,
        re_eval_weeks=1,
        data_export_complexity="standard",
        fine_tuned_models_in_use=0,
    ),
    "Azure AI Foundry (GPT-4o + others)": SwitchingCost(
        re_integration_weeks=2,
        re_eval_weeks=1,
        data_export_complexity="standard",
        fine_tuned_models_in_use=0,
    ),
    "BudgetAI (composite cheaper-by-quote vendor)": SwitchingCost(
        re_integration_weeks=3,
        re_eval_weeks=2,
        data_export_complexity="custom",
        fine_tuned_models_in_use=1,
    ),
}


# ============================================================================
# Main driver
# ============================================================================

def main() -> None:
    sep = "=" * 80
    sub = "-" * 80

    print(sep)
    print("AI VENDOR SCORECARD ENGINE  (Phase 11, Lesson 95)")
    print(sep)

    # ------------------------------------------------------------------
    # Part 1: raw scorecard and weighted ranking
    # ------------------------------------------------------------------
    print("\nPART 1 — SCORECARD EVALUATOR  (raw dimension scores)")
    print(sub)
    print_dimension_detail(VENDORS)

    print(f"\n{sep}")
    print("PART 1b — WEIGHTED RANKING BY CLIENT PROFILE")
    print(sep)
    all_rankings: Dict[str, List[str]] = {}
    for profile in PROFILES:
        ranked = rank(VENDORS, profile)
        print_scorecard(ranked, profile)
        all_rankings[profile.name] = [v.name for v, _ in ranked]

    # ------------------------------------------------------------------
    # Part 2: hard-gate enforcement
    # ------------------------------------------------------------------
    print(f"\n{sep}")
    print("PART 2 — HARD-GATE ENFORCEMENT  (failure shape: demo-data disqualification)")
    print(sub)
    print("  Gates applied: signed DPA, no training on customer data,")
    print("                 SOC 2 Type II, ISO 27001 SoA covers inference API,")
    print("                 EU data residency.")
    print()

    survivors, failures = filter_by_gates(VENDORS, GATES, require_bsi_c5=False)
    if failures:
        print("  Disqualified at gate step:")
        for name, fails in failures.items():
            print(f"    - {name}")
            for f in fails:
                print(f"        * {f}")
    else:
        print("  All vendors passed the gate step.")
    print()
    print(f"  Surviving shortlist ({len(survivors)} of {len(VENDORS)}):")
    for v in survivors:
        print(f"    + {v.name}")

    # Re-rank the survivors for the regulated-enterprise profile, so the
    # visible consequence of the gate step is concrete: a vendor that
    # would have led the ranking is no longer on the list.
    regulated = next(p for p in PROFILES if p.name.startswith("Regulated"))
    if survivors:
        ranked_after_gates = rank(survivors, regulated)
        print()
        print(f"  Re-ranked (regulated-enterprise profile, AFTER gates):")
        print(f"  {'Vendor':<48} {'Score':>6}")
        print(f"  {'-' * 48} {'------':>6}")
        for vendor, score in ranked_after_gates:
            print(f"  {vendor.name:<48} {score:>6.2f}")

    # ------------------------------------------------------------------
    # Part 3: cost-trap detector
    # ------------------------------------------------------------------
    print(f"\n{sep}")
    print("PART 3 — COST-TRAP DETECTOR  (failure shape: batch-price quote)")
    print(sub)
    print("  Two traffic profiles:")
    print("    DEMO       = 2K input / 500 output tokens, 100K req/mo (vendor's quote assumed this)")
    print("    PRODUCTION = 8K input / 1K output tokens, 100K req/mo (real workload, real-time SLA)")
    print()
    print("  Two monthly costs per vendor:")
    print("    Quoted   = what the procurement paper saw (vendor's quote honoured)")
    print("    Effective = what you actually pay at the real deployment SLA")
    print("  The trap is the gap between Quoted and Effective when the vendor")
    print("  quoted a batch SLA that the deployment cannot honour.")
    print()

    print(f"  {'Vendor':<48} {'Quoted':>9} {'Effective':>10} {'Trap':>8}")
    print(f"  {'-' * 48} {'-' * 9} {'-' * 10} {'-' * 8}")
    quoted_results: Dict[str, float] = {}
    effective_results: Dict[str, float] = {}
    for name, cost in COST_PROFILES.items():
        quoted_demo, eff_demo, _ = monthly_cost(cost, DEMO_TRAFFIC)
        quoted_prod, eff_prod, note = monthly_cost(cost, PRODUCTION_TRAFFIC)
        # Use the PRODUCTION quoted vs effective as the trap indicator.
        trap_pct = (eff_prod - quoted_prod) / quoted_prod * 100.0 if quoted_prod else 0.0
        quoted_results[name] = quoted_prod
        effective_results[name] = eff_prod
        print(
            f"  {name:<48} "
            f"${quoted_prod:>7,.0f} "
            f"${eff_prod:>8,.0f} "
            f"{trap_pct:>+6.0f}%"
        )
        print(f"    note: {note}")

    # Headline: who is actually cheapest at production scale?
    cheapest_quoted = min(quoted_results, key=lambda k: quoted_results[k])
    cheapest_effective = min(effective_results, key=lambda k: effective_results[k])
    print()
    print(f"  Cheapest by QUOTED price (what procurement paper saw): {cheapest_quoted}")
    print(f"  Cheapest at EFFECTIVE production TCO:                  {cheapest_effective}")
    if cheapest_quoted != cheapest_effective:
        print(f"  -> Ranking reversal: the cheap-by-quote vendor is not cheap at production scale.")
    else:
        print(f"  -> No reversal; both rankings agree.")

    # Switching cost disclosure
    print()
    print("  Switching cost (weeks of engineering to migrate AWAY from this vendor):")
    print(f"  {'Vendor':<48} {'Weeks':>6}")
    print(f"  {'-' * 48} {'-' * 6}")
    for name, sw in SWITCHING_COSTS.items():
        weeks, note = switching_cost_estimate(sw)
        print(f"  {name:<48} {weeks:>6}")
        print(f"    note: {note}")

    # ------------------------------------------------------------------
    # Headline
    # ------------------------------------------------------------------
    print()
    print(sep)
    print("HEADLINE: the scorecard ranks; the gates filter; the cost model bites.")
    print("-" * 80)
    print("  In Part 1 the scorecard picks Azure as the regulated-enterprise")
    print("    leader at 3.80 weighted score, AWS Bedrock second at 3.70.")
    print("  In Part 2 Azure is DISQUALIFIED at the gate step because its ISO")
    print("    27001 Statement of Applicability excludes the inference API.")
    print("    The scorecard leader fails the procurement reality. The")
    print("    lesson's failure shape: the 'SoA gap' (a variant of the")
    print("    'demo-data disqualification' from the contract-reviewer story).")
    print("  In Part 3 BudgetAI appears 50% cheaper than Bedrock in the quote")
    print("    ($1,950 vs $3,900/mo). At the real-time deployment SLA the")
    print("    batch discount is voided and the effective cost is $3,900/mo")
    print("    — identical to Bedrock, plus 13 weeks of switching cost vs 3.")
    print("    The lesson's failure shape: the 'batch-price quote'.")
    print("  Run the scorecard, run the gates, run the cost trap. Skipping")
    print("    any of the three is how procurement decisions go wrong.")
    print(sep)


if __name__ == "__main__":
    main()
