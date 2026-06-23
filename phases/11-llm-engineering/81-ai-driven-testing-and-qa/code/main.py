"""Eval-set designer + regression gate simulator — stdlib Python.

Part 1: Eval-set classifier.
  Given a feature type and coverage axes, recommends the evaluation layer
  mix (structural / behavioural / adversarial), minimum case counts, judge
  model tier, and threshold strategy.

Part 2: Regression gate simulator.
  Given a before/after metric portfolio (task-completion, faithfulness,
  coherence, latency-p95), applies absolute-floor and relative-delta rules
  and produces PASS / WARN / BLOCK with the specific rule that fired.

No network, no model calls.  The point is to make the decision policy
explicit and runnable, the same way Phase 15 · 10 made the permission
classifier runnable.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

class Layer(Enum):
    STRUCTURAL = "structural"
    BEHAVIOURAL = "behavioural"
    ADVERSARIAL = "adversarial"


class GateVerdict(Enum):
    PASS = "PASS"
    WARN = "WARN"
    BLOCK = "BLOCK"


# ---------------------------------------------------------------------------
# Part 1 — Eval-set classifier
# ---------------------------------------------------------------------------

@dataclass
class Feature:
    name: str
    # feature_type: "rag", "summarisation", "code_generation", "agent", "classifier"
    feature_type: str
    # coverage_axes: list of strings naming dimensions to test across
    coverage_axes: list[str]
    # user-facing: does it produce free-form text the user reads directly?
    user_facing_generative: bool = True
    # does it call external tools or retrieve from a knowledge base?
    retrieval_or_tool_use: bool = False


@dataclass
class EvalDesign:
    feature_name: str
    required_layers: list[Layer]
    optional_layers: list[Layer]
    min_cases_per_axis: int
    judge_model_tier: str   # "frontier" or "mid"
    threshold_strategy: str  # "absolute+relative" or "absolute-only"
    notes: list[str] = field(default_factory=list)


# Rule table: feature_type -> (required layers, optional layers, case floor,
#                               judge tier, threshold strategy)
_FEATURE_RULES: dict[str, tuple[list[Layer], list[Layer], int, str, str]] = {
    "rag": (
        [Layer.STRUCTURAL, Layer.BEHAVIOURAL],
        [Layer.ADVERSARIAL],
        75,
        "frontier",
        "absolute+relative",
    ),
    "summarisation": (
        [Layer.STRUCTURAL, Layer.BEHAVIOURAL],
        [Layer.ADVERSARIAL],
        50,
        "mid",
        "absolute+relative",
    ),
    "code_generation": (
        [Layer.STRUCTURAL, Layer.BEHAVIOURAL],
        [Layer.ADVERSARIAL],
        50,
        "frontier",
        "absolute+relative",
    ),
    "agent": (
        [Layer.STRUCTURAL, Layer.BEHAVIOURAL, Layer.ADVERSARIAL],
        [],
        100,
        "frontier",
        "absolute+relative",
    ),
    "classifier": (
        [Layer.STRUCTURAL, Layer.BEHAVIOURAL],
        [],
        30,
        "mid",
        "absolute-only",
    ),
}

_DEFAULT_RULE = (
    [Layer.STRUCTURAL, Layer.BEHAVIOURAL],
    [Layer.ADVERSARIAL],
    50,
    "mid",
    "absolute+relative",
)


def design_eval(f: Feature) -> EvalDesign:
    """Map a feature to an eval design recommendation."""
    req_layers, opt_layers, case_floor, judge_tier, threshold = (
        _FEATURE_RULES.get(f.feature_type, _DEFAULT_RULE)
    )

    # Retrieval or tool-use features always require adversarial layer
    if f.retrieval_or_tool_use and Layer.ADVERSARIAL not in req_layers:
        req_layers = list(req_layers) + [Layer.ADVERSARIAL]
        opt_layers = [l for l in opt_layers if l is not Layer.ADVERSARIAL]

    # Case-count scales with coverage axes
    total_cases = case_floor * max(len(f.coverage_axes), 1)

    notes: list[str] = []
    if f.feature_type == "rag":
        notes.append("Run RAGAS faithfulness + answer-relevance on every eval run.")
    if f.user_facing_generative:
        notes.append("Rubric preferred over golden-reference; use temperature=0 judge.")
    if f.feature_type == "agent":
        notes.append(
            "Add Phase 14 · 38 verification gates for tool-call trajectories."
        )

    return EvalDesign(
        feature_name=f.name,
        required_layers=req_layers,
        optional_layers=opt_layers,
        min_cases_per_axis=case_floor,
        judge_model_tier=judge_tier,
        threshold_strategy=threshold,
        notes=notes,
    )


# ---------------------------------------------------------------------------
# Part 2 — Regression gate simulator
# ---------------------------------------------------------------------------

@dataclass
class MetricSnapshot:
    label: str
    # Scores all 0.0 – 1.0 unless noted
    task_completion: float   # fraction of tasks completed correctly
    faithfulness: float      # RAGAS faithfulness (RAG features); 0.0 if N/A
    coherence: float         # LLM-judge coherence score, normalised to 0-1
    latency_p95_ms: float    # raw milliseconds

    def __str__(self) -> str:
        return (
            f"task_completion={self.task_completion:.2f}  "
            f"faithfulness={self.faithfulness:.2f}  "
            f"coherence={self.coherence:.2f}  "
            f"latency_p95={self.latency_p95_ms:.0f}ms"
        )


# Gate configuration
ABSOLUTE_FLOORS = {
    "task_completion": 0.70,
    "faithfulness": 0.80,
    "coherence": 0.65,
    "latency_p95_ms_max": 4000.0,  # block if p95 exceeds 4 s
}

# Maximum allowed relative drop (as a fraction of baseline value)
RELATIVE_DELTA_CAPS = {
    "task_completion": 0.10,   # no more than 10 % relative drop
    "faithfulness": 0.08,
    "coherence": 0.12,
    "latency_p95_ms": 0.25,    # latency can grow by at most 25 %
}


def run_gate(baseline: MetricSnapshot, candidate: MetricSnapshot) -> tuple[GateVerdict, str]:
    """Return (verdict, explanation) for promoting candidate over baseline."""

    # --- Absolute floor checks ---
    if candidate.task_completion < ABSOLUTE_FLOORS["task_completion"]:
        return (
            GateVerdict.BLOCK,
            f"task_completion {candidate.task_completion:.2f} below floor "
            f"{ABSOLUTE_FLOORS['task_completion']:.2f}",
        )
    if candidate.faithfulness < ABSOLUTE_FLOORS["faithfulness"]:
        return (
            GateVerdict.BLOCK,
            f"faithfulness {candidate.faithfulness:.2f} below floor "
            f"{ABSOLUTE_FLOORS['faithfulness']:.2f}",
        )
    if candidate.coherence < ABSOLUTE_FLOORS["coherence"]:
        return (
            GateVerdict.BLOCK,
            f"coherence {candidate.coherence:.2f} below floor "
            f"{ABSOLUTE_FLOORS['coherence']:.2f}",
        )
    if candidate.latency_p95_ms > ABSOLUTE_FLOORS["latency_p95_ms_max"]:
        return (
            GateVerdict.BLOCK,
            f"latency_p95 {candidate.latency_p95_ms:.0f}ms exceeds ceiling "
            f"{ABSOLUTE_FLOORS['latency_p95_ms_max']:.0f}ms",
        )

    # --- Relative delta checks ---
    warns: list[str] = []

    def _rel_drop(before: float, after: float) -> float:
        if before == 0.0:
            return 0.0
        return (before - after) / before  # positive = regression

    def _rel_growth(before: float, after: float) -> float:
        if before == 0.0:
            return 0.0
        return (after - before) / before  # positive = latency growth

    tc_drop = _rel_drop(baseline.task_completion, candidate.task_completion)
    if tc_drop > RELATIVE_DELTA_CAPS["task_completion"]:
        return (
            GateVerdict.BLOCK,
            f"task_completion dropped {tc_drop:.0%} (cap {RELATIVE_DELTA_CAPS['task_completion']:.0%})",
        )

    f_drop = _rel_drop(baseline.faithfulness, candidate.faithfulness)
    if f_drop > RELATIVE_DELTA_CAPS["faithfulness"]:
        return (
            GateVerdict.BLOCK,
            f"faithfulness dropped {f_drop:.0%} (cap {RELATIVE_DELTA_CAPS['faithfulness']:.0%})",
        )

    c_drop = _rel_drop(baseline.coherence, candidate.coherence)
    if c_drop > RELATIVE_DELTA_CAPS["coherence"]:
        return (
            GateVerdict.BLOCK,
            f"coherence dropped {c_drop:.0%} (cap {RELATIVE_DELTA_CAPS['coherence']:.0%})",
        )

    lat_growth = _rel_growth(baseline.latency_p95_ms, candidate.latency_p95_ms)
    if lat_growth > RELATIVE_DELTA_CAPS["latency_p95_ms"]:
        verdict_str = (
            f"latency_p95 grew {lat_growth:.0%} "
            f"(cap {RELATIVE_DELTA_CAPS['latency_p95_ms']:.0%})"
        )
        if lat_growth > 0.40:
            return GateVerdict.BLOCK, verdict_str
        warns.append(verdict_str)

    if warns:
        return GateVerdict.WARN, "; ".join(warns)

    return GateVerdict.PASS, "all floors and delta caps satisfied"


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    sep = "=" * 80
    print(sep)
    print("AI-DRIVEN TESTING & QA SIMULATOR (Phase 11, Lesson 81)")
    print(sep)

    # ------------------------------------------------------------------
    # Part 1: eval design for several representative feature types
    # ------------------------------------------------------------------
    print()
    print("PART 1 — EVAL-SET DESIGNER")
    print("-" * 80)

    features = [
        Feature(
            name="Document Q&A (RAG)",
            feature_type="rag",
            coverage_axes=["short_doc", "long_doc", "multilingual", "adversarial_query"],
            retrieval_or_tool_use=True,
        ),
        Feature(
            name="Meeting Summariser",
            feature_type="summarisation",
            coverage_axes=["short_meeting", "long_meeting", "technical"],
            user_facing_generative=True,
        ),
        Feature(
            name="Ticket Router (classifier)",
            feature_type="classifier",
            coverage_axes=["it_tickets", "hr_tickets", "finance_tickets"],
            user_facing_generative=False,
        ),
        Feature(
            name="Code-Writing Agent",
            feature_type="agent",
            coverage_axes=["python_stdlib", "with_deps", "multi_file", "edge_cases"],
            retrieval_or_tool_use=True,
        ),
    ]

    for f in features:
        design = design_eval(f)
        req_names = [l.value for l in design.required_layers]
        opt_names = [l.value for l in design.optional_layers]
        print(f"\n  Feature : {design.feature_name}")
        print(f"  Required layers   : {req_names}")
        print(f"  Optional layers   : {opt_names}")
        print(f"  Min cases / axis  : {design.min_cases_per_axis}")
        print(f"  Total floor       : {design.min_cases_per_axis * len(f.coverage_axes)} "
              f"({len(f.coverage_axes)} axes)")
        print(f"  Judge tier        : {design.judge_model_tier}")
        print(f"  Threshold strategy: {design.threshold_strategy}")
        for note in design.notes:
            print(f"  NOTE: {note}")

    # ------------------------------------------------------------------
    # Part 2: regression gate on five promotion scenarios
    # ------------------------------------------------------------------
    print()
    print()
    print("PART 2 — REGRESSION GATE SIMULATOR")
    print("-" * 80)

    baseline = MetricSnapshot(
        label="baseline (Sonnet 4.5, prompt v3)",
        task_completion=0.87,
        faithfulness=0.91,
        coherence=0.82,
        latency_p95_ms=1800.0,
    )

    scenarios = [
        (
            "Upgrade to Sonnet 4.6 — clean improvement",
            MetricSnapshot(
                label="candidate",
                task_completion=0.91,
                faithfulness=0.93,
                coherence=0.85,
                latency_p95_ms=1750.0,
            ),
        ),
        (
            "Prompt tweak — slight coherence regression within cap",
            MetricSnapshot(
                label="candidate",
                task_completion=0.86,
                faithfulness=0.91,
                coherence=0.74,   # dropped ~10 %, cap is 12 %
                latency_p95_ms=1810.0,
            ),
        ),
        (
            "Retrieval change — aggregate up, faithfulness quietly collapses",
            MetricSnapshot(
                label="candidate",
                task_completion=0.90,   # improved
                faithfulness=0.81,      # dropped 11 % (cap 8 %) -> BLOCK
                coherence=0.86,         # improved
                latency_p95_ms=1700.0,
            ),
        ),
        (
            "Switched to cheaper model — task_completion below absolute floor",
            MetricSnapshot(
                label="candidate",
                task_completion=0.65,   # below 0.70 floor
                faithfulness=0.89,
                coherence=0.80,
                latency_p95_ms=900.0,
            ),
        ),
        (
            "Latency spike from new retriever — latency grew 30 % (WARN range)",
            MetricSnapshot(
                label="candidate",
                task_completion=0.88,
                faithfulness=0.92,
                coherence=0.83,
                latency_p95_ms=2340.0,  # 30 % growth, cap is 25 % -> WARN
            ),
        ),
    ]

    print(f"\n  Baseline: {baseline.label}")
    print(f"    {baseline}")

    for desc, candidate in scenarios:
        verdict, reason = run_gate(baseline, candidate)
        print(f"\n  Scenario: {desc}")
        print(f"    {candidate}")
        print(f"    -> {verdict.value}  [{reason}]")

    print()
    print(sep)
    print("HEADLINE: aggregate scores can improve while a specific metric regresses")
    print("-" * 80)
    print("  Scenario 3 shows the trap: task_completion and coherence both went up,")
    print("  but faithfulness dropped 11 % (past the 8 % relative cap) — meaning")
    print("  the model is completing more tasks by hallucinating answers rather than")
    print("  grounding them in retrieved context.  The gate blocks correctly.")
    print("  Without a per-metric gate the aggregate score would have passed.")


if __name__ == "__main__":
    main()
