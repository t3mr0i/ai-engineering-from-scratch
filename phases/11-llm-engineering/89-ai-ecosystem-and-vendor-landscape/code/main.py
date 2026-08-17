"""AI Ecosystem Vendor and Platform Scoring Simulator — stdlib Python.

Part 1: Vendor/platform scorer with exit-cost axis.
  Takes a workload descriptor (data-residency, monthly token volume, latency,
  open-weights) and scores a hardcoded catalog of model-provider+platform
  combinations. Non-feasible options are eliminated first; the rest are ranked
  by weighted score across FIVE axes (compliance, cost, latency, operational
  fit, exit cost). An exit-cost-blind variant is also computed for contrast.

Part 2: Deployment-mode router.
  Maps (task type, volume tier, latency class) to the recommended model cost
  band (flagship / balanced / commodity) with cost reasoning shown.

Part 3: Demonstration block — the flagship-default failure shape.
  Runs a workload through both the exit-cost-blind scorer and the exit-cost-
  aware scorer. The blind scorer recommends a deep-lock-in option because it
  weights model quality and ignores exit cost. The aware scorer down-ranks
  the same option. This is the lesson's core insight demonstrated by showing
  the system being wrong in a recognizable way.

No pip, no network. The point is to make the scoring policy — including the
exit-cost axis — explicit and runnable, the same way Phase 15 . 10 made the
permission-mode decision runnable.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Shared enums
# ---------------------------------------------------------------------------

class DataResidency(Enum):
    EU = "EU"
    US = "US"
    ANY = "any"


class LatencyClass(Enum):
    REALTIME = "realtime"       # TTFT < 300ms required
    INTERACTIVE = "interactive" # TTFT < 1s acceptable
    BATCH = "batch"             # latency not a hard constraint


class ModelBand(Enum):
    FLAGSHIP = "flagship"
    BALANCED = "balanced"
    COMMODITY = "commodity"


# ---------------------------------------------------------------------------
# Part 1: Vendor/platform catalog and scorer
# ---------------------------------------------------------------------------

@dataclass
class Platform:
    name: str
    provider: str
    supported_residency: list[DataResidency]
    cost_per_1m: float                # USD, blended input+output
    latency_class: LatencyClass
    open_weights: bool
    enterprise_dpa: bool
    model_band: ModelBand
    # Exit cost components (each 1-5; 5 = lowest exit cost)
    data_portability: int             # Can we export prompts/finetune/audit logs?
    code_portability: int             # Provider-specific SDK call sites
    eval_portability: int             # Eval suite lives in vendor tooling?
    compliance_portability: int       # DPA / security review re-attestation
    notes: str = ""


PLATFORM_CATALOG: list[Platform] = [
    Platform(
        name="Azure AI Foundry (Germany West Central) - Claude Fable 5",
        provider="Azure / Anthropic",
        supported_residency=[DataResidency.EU, DataResidency.ANY],
        cost_per_1m=22.0,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.FLAGSHIP,
        data_portability=3, code_portability=3, eval_portability=3,
        compliance_portability=3,
        notes="Flagship quality; EU-resident; LHIND default for EU flagship work",
    ),
    Platform(
        name="Azure AI Foundry (East US) - OpenAI o3",
        provider="Azure / OpenAI",
        supported_residency=[DataResidency.US, DataResidency.ANY],
        cost_per_1m=20.0,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.FLAGSHIP,
        data_portability=3, code_portability=2, eval_portability=2,
        compliance_portability=4,
        notes="US-East; OpenAI-specific eval tooling and SDK; highest lock-in for an o3 shop",
    ),
    Platform(
        name="Anthropic API direct (Claude Sonnet 4.x)",
        provider="Anthropic",
        supported_residency=[DataResidency.US, DataResidency.ANY],
        cost_per_1m=4.5,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.BALANCED,
        data_portability=4, code_portability=4, eval_portability=4,
        compliance_portability=4,
        notes="Direct API; portable via Anthropic SDK; DPA available; lowest lock-in among Anthropic paths",
    ),
    Platform(
        name="AWS Bedrock (eu-central-1) - Claude Sonnet 4.x",
        provider="AWS / Anthropic",
        supported_residency=[DataResidency.EU, DataResidency.ANY],
        cost_per_1m=5.0,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.BALANCED,
        data_portability=3, code_portability=3, eval_portability=3,
        compliance_portability=3,
        notes="EU-resident Bedrock; cross-region failover; AWS IAM coupling",
    ),
    Platform(
        name="Google Vertex AI (europe-west3) - Gemini 2.0 Flash",
        provider="Google",
        supported_residency=[DataResidency.EU, DataResidency.ANY],
        cost_per_1m=0.6,
        latency_class=LatencyClass.REALTIME,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.COMMODITY,
        data_portability=3, code_portability=3, eval_portability=3,
        compliance_portability=3,
        notes="Gemini Flash; EU-resident; sub-200ms TTFT; strong for high-volume triage",
    ),
    Platform(
        name="Groq API - Llama 4 Maverick",
        provider="Groq / Meta",
        supported_residency=[DataResidency.US, DataResidency.ANY],
        cost_per_1m=0.8,
        latency_class=LatencyClass.REALTIME,
        open_weights=True,
        enterprise_dpa=False,
        model_band=ModelBand.BALANCED,
        data_portability=4, code_portability=5, eval_portability=5,
        compliance_portability=2,
        notes="LPU inference; open weights; lowest code lock-in but no EU DPA",
    ),
    Platform(
        name="Self-hosted Llama 4 Scout (on-premise GPU)",
        provider="Meta (open weights)",
        supported_residency=[DataResidency.EU, DataResidency.US, DataResidency.ANY],
        cost_per_1m=0.15,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=True,
        enterprise_dpa=True,             # you are the data processor on-premise
        model_band=ModelBand.COMMODITY,
        data_portability=5, code_portability=5, eval_portability=5,
        compliance_portability=5,
        notes="No per-token billing; you own the weights and the data; lowest exit cost of any layer",
    ),
    Platform(
        name="AWS Bedrock (us-east-1) - Haiku 4.x",
        provider="AWS / Anthropic",
        supported_residency=[DataResidency.US, DataResidency.ANY],
        cost_per_1m=0.35,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.COMMODITY,
        data_portability=3, code_portability=3, eval_portability=3,
        compliance_portability=3,
        notes="Haiku 4.x; cheapest Anthropic tier; US-only; high-volume extraction/routing",
    ),
]


@dataclass
class WorkloadDescriptor:
    name: str
    data_residency: DataResidency
    monthly_token_volume_millions: float
    latency_requirement: LatencyClass
    open_weights_required: bool
    preferred_band: Optional[ModelBand] = None


# Weights for the five-axis scoring rubric. Sum = 100.
# Exit cost is weighted at parity with monthly cost because a procurement
# decision that minimizes this year's run-rate but maximizes next year's
# migration cost has not actually saved money.
AXIS_WEIGHTS = {
    "cost": 25,
    "exit_cost": 25,
    "compliance": 20,
    "latency": 15,
    "band_match": 15,
}


def score_platform(p: Platform, w: WorkloadDescriptor) -> tuple[bool, str, float]:
    """Return (feasible, elimination_reason, score 0-100)."""
    # --- Hard gates (eliminate before scoring) ---
    if w.data_residency not in (p.supported_residency + [DataResidency.ANY]):
        return False, f"data residency mismatch ({w.data_residency.value} not supported)", 0.0
    if w.open_weights_required and not p.open_weights:
        return False, "open-weights required but platform does not offer it", 0.0
    latency_rank = {LatencyClass.REALTIME: 0, LatencyClass.INTERACTIVE: 1, LatencyClass.BATCH: 2}
    if latency_rank[p.latency_class] > latency_rank[w.latency_requirement]:
        return False, f"latency class too slow ({p.latency_class.value} vs required {w.latency_requirement.value})", 0.0

    # --- Cost axis (25 pts): cheaper at expected volume scores higher ---
    monthly_cost = w.monthly_token_volume_millions * p.cost_per_1m
    cost_score = AXIS_WEIGHTS["cost"] / (1.0 + monthly_cost / 500.0)

    # --- Exit-cost axis (25 pts): average of four portability components ---
    # Each component is 1-5 where 5 = lowest exit cost. Normalize to 0-25.
    avg_portability = (
        p.data_portability + p.code_portability
        + p.eval_portability + p.compliance_portability
    ) / 4.0
    exit_cost_score = AXIS_WEIGHTS["exit_cost"] * (avg_portability / 5.0)

    # --- Compliance axis (20 pts): DPA + region fit ---
    compliance_score = AXIS_WEIGHTS["compliance"] if p.enterprise_dpa else 0.0
    if w.data_residency == DataResidency.EU and DataResidency.EU in p.supported_residency:
        compliance_score = AXIS_WEIGHTS["compliance"]

    # --- Latency axis (15 pts): reward platforms faster than required ---
    if latency_rank[p.latency_class] < latency_rank[w.latency_requirement]:
        latency_score = AXIS_WEIGHTS["latency"]
    elif latency_rank[p.latency_class] == latency_rank[w.latency_requirement]:
        latency_score = AXIS_WEIGHTS["latency"] * 0.7
    else:
        latency_score = 0.0  # eliminated above, kept for completeness

    # --- Band match axis (15 pts) ---
    band_bonus = AXIS_WEIGHTS["band_match"] if (w.preferred_band and p.model_band == w.preferred_band) else AXIS_WEIGHTS["band_match"] * 0.3

    score = cost_score + exit_cost_score + compliance_score + latency_score + band_bonus
    return True, "", round(score, 1)


def score_platform_exit_cost_blind(p: Platform, w: WorkloadDescriptor) -> tuple[bool, str, float]:
    """A naive scorer that prefers the preferred band and ignores exit cost entirely.

    This is the rubric that produces the flagship-default failure shape. It is
    included so the demonstration block can show what goes wrong when exit
    cost is not on the scorecard. The key property: when a workload specifies
    a preferred_band, the naive scorer rewards matching that band heavily,
    even when the matching option is the deepest lock-in in the catalog.
    """
    ok, reason, _ = score_platform(p, w)
    if not ok:
        return False, reason, 0.0

    monthly_cost = w.monthly_token_volume_millions * p.cost_per_1m
    cost_score = 50.0 / (1.0 + monthly_cost / 500.0)
    dpa_score = 15.0 if p.enterprise_dpa else 0.0
    # Heavy band-match reward: 35 points for matching the preferred band.
    # This is the lever that produces the flagship-default failure shape.
    band_bonus = 35.0 if (w.preferred_band and p.model_band == w.preferred_band) else 0.0
    return True, "", round(cost_score + dpa_score + band_bonus, 1)


def evaluate_workload(w: WorkloadDescriptor, scorer) -> None:
    print(f"\n  Workload: {w.name}")
    print(f"    Residency={w.data_residency.value}  "
          f"Volume={w.monthly_token_volume_millions:.0f}M tok/mo  "
          f"Latency={w.latency_requirement.value}  "
          f"OpenWeights={w.open_weights_required}")
    print()

    feasible = []
    eliminated = []
    for p in PLATFORM_CATALOG:
        ok, reason, score = scorer(p, w)
        if ok:
            monthly_cost = w.monthly_token_volume_millions * p.cost_per_1m
            feasible.append((score, p, monthly_cost))
        else:
            eliminated.append((p, reason))

    feasible.sort(reverse=True)

    print(f"  ELIMINATED ({len(eliminated)}):")
    for p, reason in eliminated:
        print(f"    - {p.name:<62} reason: {reason}")

    print(f"\n  RANKED ({len(feasible)}):")
    for rank, (score, p, monthly_cost) in enumerate(feasible, 1):
        print(f"    {rank}. score={score:5.1f}  ${monthly_cost:8,.0f}/mo  "
              f"[{p.model_band.value:<10}]  {p.name}")
        if rank == 1:
            print(f"         -> RECOMMENDED: {p.notes}")


# ---------------------------------------------------------------------------
# Part 2: Deployment-mode router
# ---------------------------------------------------------------------------

@dataclass
class TaskSpec:
    task_type: str
    description: str
    volume_tier: str            # "high" (>20M), "medium" (2-20M), "low" (<2M)
    latency_class: LatencyClass
    complexity: str             # "high" / "medium" / "low"


BAND_COST_PER_1M = {
    ModelBand.FLAGSHIP: 25.0,
    ModelBand.BALANCED: 4.0,
    ModelBand.COMMODITY: 0.35,
}

VOLUME_MILLIONS = {"high": 50.0, "medium": 10.0, "low": 0.5}


def route_task(t: TaskSpec) -> ModelBand:
    """Complexity + volume drive band selection."""
    if t.complexity == "high":
        if t.volume_tier == "high":
            return ModelBand.BALANCED   # cost control: don't burn flagship at high volume
        return ModelBand.FLAGSHIP
    if t.complexity == "medium":
        return ModelBand.BALANCED
    return ModelBand.COMMODITY


def show_routing(tasks: list[TaskSpec]) -> None:
    header = f"  {'Task':<30} {'Volume':<8} {'Complexity':<12} {'Band':<12} {'$/mo':<10} Notes"
    print(header)
    print("  " + "-" * (len(header) - 2))
    for t in tasks:
        band = route_task(t)
        volume_m = VOLUME_MILLIONS[t.volume_tier]
        monthly = volume_m * BAND_COST_PER_1M[band]
        flagship_monthly = volume_m * BAND_COST_PER_1M[ModelBand.FLAGSHIP]
        saving = flagship_monthly - monthly
        note = f"saves ${saving:,.0f}/mo vs flagship" if band != ModelBand.FLAGSHIP else "flagship required"
        print(f"  {t.task_type:<30} {t.volume_tier:<8} {t.complexity:<12} "
              f"{band.value:<12} ${monthly:>7,.0f}  {note}")


# ---------------------------------------------------------------------------
# Part 3: Demonstration block — the flagship-default failure shape
# ---------------------------------------------------------------------------

@dataclass
class FailureShape:
    """A named, recurring failure shape from the field notes."""
    name: str
    workload: WorkloadDescriptor
    what_the_naive_scorer_picks: str
    what_a_senior_consultant_picks: str
    lesson: str


def demonstrate_failure_shape() -> FailureShape:
    """Run a realistic workload through both scorers and show the divergence.

    The workload is a US-resident, interactive-latency multi-step reasoning
    pipeline at moderate volume where the team has stated a 'flagship' band
    preference (the RFP evaluation scorecard weighted "model quality" most
    heavily). The naive scorer — which has no exit-cost axis and rewards
    band-match — picks the flagship Azure o3 option because it matches the
    preferred band. The exit-cost-aware scorer recognizes that the same
    workload fits the balanced band and picks Anthropic direct, which has
    materially lower lock-in. This is the failure shape: a procurement
    decision that bought the most expensive tier because the scorecard
    weighted quality most heavily, and the deepest lock-in because exit cost
    was not on the rubric.
    """
    w = WorkloadDescriptor(
        name="US-resident multi-step reasoning pipeline (15M tok/mo)",
        data_residency=DataResidency.US,
        monthly_token_volume_millions=15.0,
        latency_requirement=LatencyClass.INTERACTIVE,
        open_weights_required=False,
        preferred_band=ModelBand.FLAGSHIP,
    )

    print()
    print("=" * 80)
    print("PART 3 — DEMONSTRATION: the flagship-default failure shape")
    print("=" * 80)
    print()
    print("  Workload under test:")
    print(f"    {w.name}")
    print(f"    US-resident, 15M tok/mo, interactive latency, FLAGSHIP band preferred.")
    print()
    print("  Scenario: a procurement committee has two scorers on the table.")
    print("  Scorer A is the naive rubric (cost + heavy band-match reward, no exit cost).")
    print("  Scorer B is the five-axis rubric from this lesson (exit cost weighted 25%).")
    print()
    print("  Trap: the team asked for 'flagship quality.' The naive scorer gave them")
    print("  flagship. The exit-cost scorer asked whether the workload actually needs it.")
    print()

    # Scorer A: naive, exit-cost-blind
    print("  --- Scorer A (exit-cost-blind, heavy band-match reward) ---")
    feasible_a = []
    for p in PLATFORM_CATALOG:
        ok, reason, score = score_platform_exit_cost_blind(p, w)
        if ok:
            feasible_a.append((score, p, w.monthly_token_volume_millions * p.cost_per_1m))
    feasible_a.sort(reverse=True)
    for rank, (score, p, monthly_cost) in enumerate(feasible_a[:3], 1):
        marker = " <-- Scorer A picks this" if rank == 1 else ""
        print(f"    {rank}. score={score:5.1f}  ${monthly_cost:8,.0f}/mo  [{p.model_band.value:<10}]  {p.name}{marker}")

    # Scorer B: exit-cost-aware
    print()
    print("  --- Scorer B (five-axis, exit cost weighted 25%) ---")
    feasible_b = []
    for p in PLATFORM_CATALOG:
        ok, reason, score = score_platform(p, w)
        if ok:
            feasible_b.append((score, p, w.monthly_token_volume_millions * p.cost_per_1m))
    feasible_b.sort(reverse=True)
    for rank, (score, p, monthly_cost) in enumerate(feasible_b[:3], 1):
        marker = " <-- Scorer B picks this" if rank == 1 else ""
        print(f"    {rank}. score={score:5.1f}  ${monthly_cost:8,.0f}/mo  [{p.model_band.value:<10}]  {p.name}{marker}")

    print()
    print("  --- The divergence ---")
    top_a = feasible_a[0][1]
    top_b = feasible_b[0][1]
    top_a_cost = feasible_a[0][2]
    top_b_cost = feasible_b[0][2]
    annual_delta = (top_a_cost - top_b_cost) * 12
    if top_a.name == top_b.name:
        print(f"    Both scorers agree on {top_a.name}.")
        print(f"    (The exit-cost axis did not change the recommendation on this workload.)")
    else:
        print(f"    Scorer A picks: {top_a.name}")
        print(f"                   [{top_a.model_band.value} band]  ${top_a_cost:,.0f}/mo  ${top_a_cost * 12:,.0f}/yr")
        print(f"                   Lock-in: data portability {top_a.data_portability}/5, code {top_a.code_portability}/5,")
        print(f"                   eval {top_a.eval_portability}/5, compliance {top_a.compliance_portability}/5.")
        print(f"                   Estimated 12-month-later migration: 8-14 engineer-weeks.")
        print()
        print(f"    Scorer B picks: {top_b.name}")
        print(f"                   [{top_b.model_band.value} band]  ${top_b_cost:,.0f}/mo  ${top_b_cost * 12:,.0f}/yr")
        print(f"                   Lock-in: data portability {top_b.data_portability}/5, code {top_b.code_portability}/5,")
        print(f"                   eval {top_b.eval_portability}/5, compliance {top_b.compliance_portability}/5.")
        print(f"                   Estimated 12-month-later migration: 2-4 engineer-weeks.")
        print()
        print(f"    Annual run-rate delta (Scorer A minus Scorer B): ${annual_delta:,.0f}/yr")
        print(f"    Estimated migration-cost delta at 12 months:  6-10 engineer-weeks")
        print(f"    At a fully-loaded engineering cost of ~$2,500/week, that migration delta")
        print(f"    is worth ${6 * 2500:,}-${10 * 2500:,} — comparable to or larger than the run-rate delta.")
        print(f"    The naive scorer did not model it. The exit-cost-aware scorer did.")

    return FailureShape(
        name="flagship-default scorecard",
        workload=w,
        what_the_naive_scorer_picks=top_a.name,
        what_a_senior_consultant_picks=top_b.name,
        lesson=(
            "The naive rubric gave the team the flagship tier they asked for, "
            "on the deepest-lock-in platform in the feasible set. The exit-cost-"
            "aware rubric asked whether the workload actually needs flagship and "
            "down-ranked it, surfacing the self-hosted option with the lowest "
            "lock-in. Same compliance posture, same DPA, materially lower run-"
            "rate AND lower exit cost."
        ),
    )


# ---------------------------------------------------------------------------
# Main driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 80)
    print("AI ECOSYSTEM VENDOR & PLATFORM SCORING SIMULATOR (Phase 11, Lesson 89)")
    print("=" * 80)

    # --- Part 1a: workload scoring with the exit-cost-aware rubric ---
    print("\nPART 1a — PLATFORM SCORING (five-axis rubric, exit cost weighted 25%)")
    print("-" * 80)

    workloads = [
        WorkloadDescriptor(
            name="EU-resident document analysis pipeline",
            data_residency=DataResidency.EU,
            monthly_token_volume_millions=10.0,
            latency_requirement=LatencyClass.INTERACTIVE,
            open_weights_required=False,
        ),
        WorkloadDescriptor(
            name="High-volume classification (US, cost-first)",
            data_residency=DataResidency.US,
            monthly_token_volume_millions=50.0,
            latency_requirement=LatencyClass.REALTIME,
            open_weights_required=False,
        ),
        WorkloadDescriptor(
            name="Air-gapped on-premise inference (any region)",
            data_residency=DataResidency.ANY,
            monthly_token_volume_millions=5.0,
            latency_requirement=LatencyClass.INTERACTIVE,
            open_weights_required=True,
        ),
    ]

    for w in workloads:
        evaluate_workload(w, score_platform)

    # --- Part 1b: same workloads, naive scorer (exit cost ignored) ---
    print("\n")
    print("PART 1b — SAME WORKLOADS, EXIT-COST-BLIND SCORER (cost-only rubric)")
    print("-" * 80)
    print("  For contrast: the rubric a procurement committee often builds first.")
    print()
    for w in workloads:
        evaluate_workload(w, score_platform_exit_cost_blind)

    # --- Part 2: task-to-band routing ---
    print("\n")
    print("PART 2 — TASK-TO-MODEL-BAND ROUTING")
    print("-" * 80)
    print()

    tasks = [
        TaskSpec("Complex code generation",   "Generate and test multi-file refactor", "low",    LatencyClass.INTERACTIVE, "high"),
        TaskSpec("RAG answer synthesis",       "Summarize retrieved docs into answer",  "medium", LatencyClass.INTERACTIVE, "medium"),
        TaskSpec("Intent classification",      "Route query to one of 12 intents",      "high",   LatencyClass.REALTIME,    "low"),
        TaskSpec("Contract clause extraction", "Extract structured fields from PDF",    "high",   LatencyClass.BATCH,       "low"),
        TaskSpec("Multi-step reasoning chain", "Plan + execute 10-step analysis",       "medium", LatencyClass.BATCH,       "high"),
        TaskSpec("Embedding rerank scoring",   "Score passage relevance 0-1",           "high",   LatencyClass.REALTIME,    "low"),
    ]

    show_routing(tasks)

    # --- Part 3: the failure shape ---
    failure = demonstrate_failure_shape()

    print()
    print("=" * 80)
    print(f"HEADLINE: the failure shape demonstrated above is '{failure.name}'.")
    print("-" * 80)
    print(f"  Naive (exit-cost-blind) scorer picked: {failure.what_the_naive_scorer_picks}")
    print(f"  Exit-cost-aware scorer picked:         {failure.what_a_senior_consultant_picks}")
    print()
    print(f"  Lesson: {failure.lesson}")
    print()
    print("  Three rules from the field notes:")
    print("    1. Weight exit cost at parity with monthly run-rate (25/25 of 100).")
    print("    2. Treat the absent gateway as a retrofit, not an optional layer.")
    print("    3. Run a dry-run migration once a year; the touch-point count is")
    print("       the real budget for the next real migration.")


if __name__ == "__main__":
    main()