"""AI Ecosystem Vendor and Platform Scoring Simulator — stdlib Python.

Part 1: Vendor/platform scorer.
  Takes a workload descriptor (data-residency requirement, monthly token volume,
  latency requirement, open-weights preference) and scores a hardcoded catalog
  of model provider + platform combinations. Non-feasible options are eliminated
  first (compliance gate); the rest are ranked by weighted score.

Part 2: Deployment-mode router.
  Maps (task type, volume tier, latency class) to the recommended model cost
  band (flagship / balanced / commodity) with cost reasoning shown.

No pip, no network. The point is to make the scoring policy explicit and
runnable — the same way Phase 15 · 10 made the permission-mode decision
runnable.
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
    REALTIME = "realtime"    # TTFT < 300ms required
    INTERACTIVE = "interactive"  # TTFT < 1s acceptable
    BATCH = "batch"          # latency not a hard constraint


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
    # Monthly cost per 1M tokens (blended input+output estimate, USD)
    cost_per_1m: float
    # Average TTFT class
    latency_class: LatencyClass
    # Offers open-weight self-hosting option
    open_weights: bool
    # Has enterprise DPA / GDPR Art.28 processor terms
    enterprise_dpa: bool
    model_band: ModelBand
    notes: str = ""


PLATFORM_CATALOG: list[Platform] = [
    Platform(
        name="Azure AI Foundry (Germany West Central)",
        provider="Azure / Anthropic",
        supported_residency=[DataResidency.EU, DataResidency.ANY],
        cost_per_1m=22.0,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.FLAGSHIP,
        notes="Claude Fable 5 / Opus 4.x via Azure Marketplace; LHIND default for EU",
    ),
    Platform(
        name="Azure AI Foundry (East US) — OpenAI o3",
        provider="Azure / OpenAI",
        supported_residency=[DataResidency.US, DataResidency.ANY],
        cost_per_1m=20.0,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.FLAGSHIP,
        notes="o3 in US East; not suitable for EU data-residency workloads",
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
        notes="US East routing by default; DPA available; lowest latency for Claude",
    ),
    Platform(
        name="AWS Bedrock (eu-central-1) — Claude Sonnet 4.x",
        provider="AWS / Anthropic",
        supported_residency=[DataResidency.EU, DataResidency.ANY],
        cost_per_1m=5.0,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.BALANCED,
        notes="EU-resident Bedrock; cross-region failover to eu-west-1 available",
    ),
    Platform(
        name="Google Vertex AI (europe-west3) — Gemini 2.0 Flash",
        provider="Google",
        supported_residency=[DataResidency.EU, DataResidency.ANY],
        cost_per_1m=0.6,
        latency_class=LatencyClass.REALTIME,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.COMMODITY,
        notes="Gemini 2.0 Flash; EU-resident; sub-200ms TTFT typical; strong for high-volume triage",
    ),
    Platform(
        name="Groq API — Llama 4 70B",
        provider="Groq / Meta",
        supported_residency=[DataResidency.US, DataResidency.ANY],
        cost_per_1m=0.8,
        latency_class=LatencyClass.REALTIME,
        open_weights=True,
        enterprise_dpa=False,
        model_band=ModelBand.BALANCED,
        notes="LPU inference; lowest latency for open-weight models; no EU DPA",
    ),
    Platform(
        name="Self-hosted Llama 4 8B (on-premise GPU)",
        provider="Meta (open weights)",
        supported_residency=[DataResidency.EU, DataResidency.US, DataResidency.ANY],
        cost_per_1m=0.15,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=True,
        enterprise_dpa=True,  # you are the data processor on-premise
        model_band=ModelBand.COMMODITY,
        notes="No per-token billing; GPU infra required; full data locality",
    ),
    Platform(
        name="AWS Bedrock (us-east-1) — Haiku 4.x",
        provider="AWS / Anthropic",
        supported_residency=[DataResidency.US, DataResidency.ANY],
        cost_per_1m=0.35,
        latency_class=LatencyClass.INTERACTIVE,
        open_weights=False,
        enterprise_dpa=True,
        model_band=ModelBand.COMMODITY,
        notes="Haiku 4.x; cheapest Anthropic tier; US-only; high-volume extraction/routing",
    ),
]


@dataclass
class WorkloadDescriptor:
    name: str
    data_residency: DataResidency
    monthly_token_volume_millions: float  # combined input+output
    latency_requirement: LatencyClass
    open_weights_required: bool
    preferred_band: Optional[ModelBand] = None


def score_platform(p: Platform, w: WorkloadDescriptor) -> tuple[bool, str, float]:
    """Return (feasible, elimination_reason, score).

    Feasibility is a hard gate — eliminated options are never ranked.
    Score is 0-100: lower cost_per_1m and matching latency class score higher.
    """
    # Gate 1: data residency
    if w.data_residency not in (p.supported_residency + [DataResidency.ANY]):
        if w.data_residency not in p.supported_residency:
            return False, f"data residency mismatch ({w.data_residency.value} not supported)", 0.0

    # Gate 2: open weights requirement
    if w.open_weights_required and not p.open_weights:
        return False, "open-weights required but platform does not offer it", 0.0

    # Gate 3: latency
    latency_rank = {LatencyClass.REALTIME: 0, LatencyClass.INTERACTIVE: 1, LatencyClass.BATCH: 2}
    if latency_rank[p.latency_class] > latency_rank[w.latency_requirement]:
        return False, f"latency class too slow ({p.latency_class.value} vs required {w.latency_requirement.value})", 0.0

    # Scoring (higher = better)
    # Cost component: inverse of monthly cost, normalized to 0-60 range
    monthly_cost = w.monthly_token_volume_millions * p.cost_per_1m
    cost_score = 60.0 / (1.0 + monthly_cost / 1000.0)

    # DPA bonus
    dpa_score = 20.0 if p.enterprise_dpa else 0.0

    # Latency bonus: reward platforms faster than required
    latency_bonus = 20.0 if latency_rank[p.latency_class] < latency_rank[w.latency_requirement] else 10.0

    # Band match bonus
    band_bonus = 5.0 if (w.preferred_band and p.model_band == w.preferred_band) else 0.0

    score = cost_score + dpa_score + latency_bonus + band_bonus
    return True, "", round(score, 1)


def evaluate_workload(w: WorkloadDescriptor) -> None:
    print(f"\n  Workload: {w.name}")
    print(f"    Residency={w.data_residency.value}  "
          f"Volume={w.monthly_token_volume_millions:.0f}M tok/mo  "
          f"Latency={w.latency_requirement.value}  "
          f"OpenWeights={w.open_weights_required}")
    print()

    feasible = []
    eliminated = []
    for p in PLATFORM_CATALOG:
        ok, reason, score = score_platform(p, w)
        if ok:
            monthly_cost = w.monthly_token_volume_millions * p.cost_per_1m
            feasible.append((score, p, monthly_cost))
        else:
            eliminated.append((p, reason))

    feasible.sort(reverse=True)

    print(f"  ELIMINATED ({len(eliminated)}):")
    for p, reason in eliminated:
        print(f"    - {p.name:<55} reason: {reason}")

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
    volume_tier: str   # "high" (>20M tok/mo), "medium" (2-20M), "low" (<2M)
    latency_class: LatencyClass
    complexity: str    # "high" (multi-step reasoning), "medium", "low" (extraction/classification)


# Prices per 1M tokens (blended input+output, approximate 2026 midpoints)
BAND_COST_PER_1M = {
    ModelBand.FLAGSHIP: 25.0,
    ModelBand.BALANCED: 4.0,
    ModelBand.COMMODITY: 0.35,
}

VOLUME_MILLIONS = {
    "high": 50.0,
    "medium": 10.0,
    "low": 0.5,
}


def route_task(t: TaskSpec) -> ModelBand:
    """Deterministic routing: complexity and volume drive band selection."""
    # High complexity always warrants at least balanced; flagship if high volume too
    if t.complexity == "high":
        if t.volume_tier == "high":
            return ModelBand.BALANCED  # cost control: don't burn flagship at high volume
        return ModelBand.FLAGSHIP

    # Medium complexity at high volume: balanced is the sweet spot
    if t.complexity == "medium":
        return ModelBand.BALANCED

    # Low complexity (classification, extraction, routing): commodity
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
# Main driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 80)
    print("AI ECOSYSTEM VENDOR & PLATFORM SCORING SIMULATOR (Phase 11, Lesson 89)")
    print("=" * 80)

    # --- Part 1: workload scoring ---
    print("\nPART 1 — PLATFORM SCORING BY WORKLOAD CONSTRAINTS")
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
        evaluate_workload(w)

    # --- Part 2: task-to-band routing ---
    print("\n")
    print("PART 2 — TASK-TO-MODEL-BAND ROUTING")
    print("-" * 80)
    print()

    tasks = [
        TaskSpec("Complex code generation",    "Generate and test multi-file refactor", "low",    LatencyClass.INTERACTIVE, "high"),
        TaskSpec("RAG answer synthesis",        "Summarize retrieved docs into answer",  "medium", LatencyClass.INTERACTIVE, "medium"),
        TaskSpec("Intent classification",       "Route query to one of 12 intents",      "high",   LatencyClass.REALTIME,    "low"),
        TaskSpec("Contract clause extraction",  "Extract structured fields from PDF",    "high",   LatencyClass.BATCH,       "low"),
        TaskSpec("Multi-step reasoning chain",  "Plan + execute 10-step analysis",       "medium", LatencyClass.BATCH,       "high"),
        TaskSpec("Embedding rerank scoring",    "Score passage relevance 0-1",           "high",   LatencyClass.REALTIME,    "low"),
    ]

    show_routing(tasks)

    print()
    print("=" * 80)
    print("HEADLINE: route by task, not by default")
    print("-" * 80)
    print("  Flagship models are required for complex reasoning and code generation.")
    print("  Classification, extraction, and reranking belong on commodity-band models.")
    print("  At 50M tokens/month, misrouting low-complexity tasks to flagship")
    print(f"  costs ${VOLUME_MILLIONS['high'] * BAND_COST_PER_1M[ModelBand.FLAGSHIP]:,.0f}/mo")
    print(f"  vs ${VOLUME_MILLIONS['high'] * BAND_COST_PER_1M[ModelBand.COMMODITY]:,.0f}/mo on commodity —")
    print(f"  a ${(VOLUME_MILLIONS['high'] * BAND_COST_PER_1M[ModelBand.FLAGSHIP]) - (VOLUME_MILLIONS['high'] * BAND_COST_PER_1M[ModelBand.COMMODITY]):,.0f}/mo pricing error dressed as a capability decision.")


if __name__ == "__main__":
    main()
