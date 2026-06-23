"""AI incident signal classifier and runbook router — stdlib Python.

Part 1: Incident signal classifier.
  Takes a set of observed metric deltas (output-quality drop, cost spike,
  tool-call anomaly, safety-classifier hit) and assigns the incident to one
  of four categories: QUALITY, COST, TOOL_USE, or SAFETY.
  Safety always wins if the safety classifier fires, regardless of other
  signals — the "safety is always at least P1" rule from the lesson.

Part 2: Runbook router.
  Takes a category + a dict of checked conditions and prints the next
  recommended runbook step, encoding the Detect -> Scope -> Diagnose ->
  Mitigate -> Escalate chain as an executable policy.

Part 3 (demonstration): The silent-drift failure shape.
  Models the lesson's headline failure — a provider-side silent regression
  that an L1 dashboard cannot catch because the change is in CONTENT, not
  in transport. Walks the team through the synthetic incident and prints
  what they would have detected had they owned the L3 layer.

The driver runs three synthetic incidents through Parts 1 and 2, then runs
Part 3 as the headline demonstration. No network, no pip, no ML model
required.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

class Category(Enum):
    QUALITY = "quality"
    COST = "cost"
    TOOL_USE = "tool_use"
    SAFETY = "safety"


class Severity(Enum):
    P1 = "P1 - 5 min ack, 30 min mitigation"
    P2 = "P2 - 15 min ack, 2 h mitigation"
    P3 = "P3 - next business day"
    P4 = "P4 - scheduled sprint"


@dataclass
class MetricDeltas:
    """Snapshot of observed metric changes at incident declaration time.

    Positive values = metric went UP, negative = metric went DOWN.
    All values are percentage-point changes from a rolling 7-day baseline.
    """
    judge_score_delta: float = 0.0           # L3 quality: LLM-as-judge score
    output_length_delta: float = 0.0         # L3 quality: mean output length
    cost_per_request_delta: float = 0.0      # L2 platform: token cost
    context_length_p95_delta: float = 0.0    # L2 platform: context length
    tool_error_rate_delta: float = 0.0       # agentic: tool-call error rate
    tool_loop_detected: bool = False         # agentic: agent looped
    safety_classifier_score: float = 0.0     # safety: 0.0-1.0; >=0.7 is a hit


@dataclass
class IncidentState:
    """Evolving checklist state during a runbook walk-through."""
    provider_status_clean: bool = False
    prompt_template_changed: bool = False
    model_version_changed: bool = False
    feature_flag_changed: bool = False
    mcp_schema_changed: bool = False
    input_distribution_shift: bool = False
    safety_threshold_changed: bool = False
    tool_loop_detected: bool = False         # also checked in TOOL_USE runbook routing
    context_length_spike: bool = False       # checked in COST runbook routing


# ---------------------------------------------------------------------------
# Part 1: Incident signal classifier
# ---------------------------------------------------------------------------

def classify_incident(m: MetricDeltas) -> tuple[Category, Severity, str]:
    """Return (category, severity, reasoning).

    Safety always overrides other categories if the classifier fires.
    Within the remaining three categories the most severe observed signal
    determines the category.
    """
    reasons: list[str] = []

    # Safety gate - unconditional override
    if m.safety_classifier_score >= 0.7:
        severity = Severity.P1
        reasons.append(
            f"safety classifier score {m.safety_classifier_score:.2f} >= 0.70 threshold"
        )
        return Category.SAFETY, severity, "; ".join(reasons)

    # Tool-use / agentic signals
    agentic_signals = []
    if m.tool_error_rate_delta >= 20:
        agentic_signals.append(f"tool error rate +{m.tool_error_rate_delta:.0f}%")
    if m.tool_loop_detected:
        agentic_signals.append("agent loop detected")

    # Cost signals
    cost_signals = []
    if m.cost_per_request_delta >= 20:
        cost_signals.append(f"cost per request +{m.cost_per_request_delta:.0f}%")
    if m.context_length_p95_delta >= 30:
        cost_signals.append(f"context length p95 +{m.context_length_p95_delta:.0f}%")

    # Quality signals
    quality_signals = []
    if m.judge_score_delta <= -10:
        quality_signals.append(f"judge score {m.judge_score_delta:.0f}%")
    if m.output_length_delta <= -25 or m.output_length_delta >= 50:
        quality_signals.append(f"output length {m.output_length_delta:+.0f}%")

    # Category assignment: pick whichever bucket has the most evidence.
    scores = {
        Category.TOOL_USE: len(agentic_signals),
        Category.COST: len(cost_signals),
        Category.QUALITY: len(quality_signals),
    }
    category = max(scores, key=lambda c: scores[c])

    if scores[category] == 0:
        category = Category.QUALITY
        reasons.append("no threshold crossed - manual quality review recommended")

    signal_map = {
        Category.TOOL_USE: agentic_signals,
        Category.COST: cost_signals,
        Category.QUALITY: quality_signals,
    }
    reasons.extend(signal_map[category])

    # Severity: any single signal crossing threshold -> P2; loop -> P1
    if category is Category.TOOL_USE and m.tool_loop_detected:
        severity = Severity.P1
    elif scores[category] >= 1:
        severity = Severity.P2
    else:
        severity = Severity.P3

    return category, severity, "; ".join(reasons)


# ---------------------------------------------------------------------------
# Part 2: Runbook router
# ---------------------------------------------------------------------------

RUNBOOK_STEPS: dict[Category, list[tuple[str | None, str, str | None]]] = {
    # Each tuple: (condition_key | None, step text, mitigation hint | None)
    Category.QUALITY: [
        (None,
         "Sample 50 recent outputs. Compute mean output length and judge score vs 7-day baseline.",
         None),
        ("provider_status_clean",
         "Check provider status page and changelog for silent model updates.",
         None),
        ("prompt_template_changed",
         "Check git log for prompt template changes in the incident window.",
         "MITIGATE: roll back the prompt template."),
        ("model_version_changed",
         "Verify model version in config. Pin to a dated suffix if using a family alias.",
         "MITIGATE: pin explicit model version (e.g. claude-sonnet-4-6-20260501)."),
        ("input_distribution_shift",
         "Sample input distribution. Check for new traffic source or language.",
         None),
        (None,
         "ESCALATE to ML engineer if no root cause found within 30 minutes.",
         None),
    ],
    Category.COST: [
        (None,
         "Pull cost-per-request telemetry for last 24 h. Find the inflection point.",
         None),
        ("context_length_spike",
         "Check context-length p95 at inflection point (prompt bug often inlines conversation history).",
         None),
        ("feature_flag_changed",
         "Check whether a feature flag changed system prompt length in the incident window.",
         "MITIGATE: revert the feature flag."),
        (None,
         "Apply hard max_tokens limit to generation calls if spend is still climbing.",
         "MITIGATE: set max_tokens cap immediately."),
        (None,
         "ESCALATE to finance if overrun crosses pre-agreed threshold.",
         None),
    ],
    Category.TOOL_USE: [
        (None,
         "Pull tool-call logs. Compute error rate and mean calls-per-session vs baseline.",
         None),
        ("tool_loop_detected",
         "Confirm loop: same tool called >N times without state change.",
         "MITIGATE: set max_turns guard and disable the looping tool."),
        ("mcp_schema_changed",
         "Check MCP server schema version in the incident window (schema drift = leading cause of wrong tool selection).",
         "MITIGATE: roll back the MCP server schema."),
        (None,
         "Disable the affected tool via the permission layer (Phase 15 / 10).",
         "MITIGATE: remove tool from allowed list until schema is reconciled."),
        (None,
         "ESCALATE to agent ops if an irreversible side-effect occurred (Phase 15 / 16).",
         None),
    ],
    Category.SAFETY: [
        (None,
         "Flag session IDs associated with the safety signal. Preserve logs - do not delete.",
         None),
        (None,
         "Disable the AI feature for the affected user segment immediately.",
         "MITIGATE: kill switch on the feature flag - do not wait for root cause."),
        ("safety_threshold_changed",
         "Check whether the safety-classifier threshold was recently lowered (performance optimisation).",
         "MITIGATE: revert threshold change."),
        (None,
         "ESCALATE to Safety lead within 15 minutes - mandatory, regardless of scope.",
         None),
        (None,
         "Treat as model-level issue until proven otherwise. Do not mitigate by prompt tuning alone.",
         None),
    ],
}


def route_runbook(
    category: Category, state: IncidentState, verbose: bool = True
) -> list[str]:
    """Print and return the ordered runbook steps for a given category."""
    steps = RUNBOOK_STEPS[category]
    output: list[str] = []
    step_n = 1
    for key, text, mitigation in steps:
        show = (key is None) or bool(getattr(state, key, False))
        if show:
            line = f"  {step_n}. {text}"
            output.append(line)
            if verbose:
                print(line)
            if mitigation:
                m_line = f"     --> {mitigation}"
                output.append(m_line)
                if verbose:
                    print(m_line)
            step_n += 1
    return output


# ---------------------------------------------------------------------------
# Part 3: The silent-drift failure shape (headline demonstration)
# ---------------------------------------------------------------------------

@dataclass
class DashboardSnapshot:
    """What each layer of the signal hierarchy would show at a given moment."""
    l1_latency_p99_ms: float        # transport: API latency
    l1_error_rate_pct: float        # transport: 5xx + timeouts
    l2_cost_per_request_usd: float  # platform: token cost
    l3_judge_score: float           # AI quality: LLM-as-judge (0-100)
    l3_output_length_p50: int       # AI quality: median output length (chars)
    l4_satisfaction_pct: float      # business: user-facing satisfaction


def detect_silent_drift(
    before: DashboardSnapshot, after: DashboardSnapshot
) -> dict[str, tuple[bool, str]]:
    """What would have caught the regression, and what would have missed it?

    A layer catches the regression only if it raises a P1/P2 alert. L1
    alerts on latency and error spikes; L2 alerts on cost spikes; L3
    alerts on judge-score drops and output-length shifts; L4 alerts on
    satisfaction drops. In a silent-drift incident, transport and cost
    are clean or improved, so L1/L2 do NOT catch it.

    Returns a dict of layer -> (caught, explanation).
    """
    l1_latency_alert = after.l1_latency_p99_ms >= before.l1_latency_p99_ms * 1.10
    l1_errors_alert = after.l1_error_rate_pct >= before.l1_error_rate_pct + 0.5

    l2_cost_alert = after.l2_cost_per_request_usd >= before.l2_cost_per_request_usd * 1.20

    l3_judge_drop = (before.l3_judge_score - after.l3_judge_score) / before.l3_judge_score
    l3_length_drop = (before.l3_output_length_p50 - after.l3_output_length_p50) / before.l3_output_length_p50

    l4_sat_drop = before.l4_satisfaction_pct - after.l4_satisfaction_pct

    return {
        "L1 infrastructure": (
            l1_latency_alert or l1_errors_alert,
            f"latency {before.l1_latency_p99_ms:.0f}ms -> {after.l1_latency_p99_ms:.0f}ms; "
            f"errors {before.l1_error_rate_pct:.2f}% -> {after.l1_error_rate_pct:.2f}% "
            f"(transport is actually cleaner than before)",
        ),
        "L2 platform": (
            l2_cost_alert,
            f"cost ${before.l2_cost_per_request_usd:.4f} -> ${after.l2_cost_per_request_usd:.4f} per request "
            f"(essentially unchanged)",
        ),
        "L3 AI quality (judge)": (
            l3_judge_drop >= 0.10,
            f"judge score {before.l3_judge_score:.1f} -> {after.l3_judge_score:.1f} "
            f"(drop {l3_judge_drop*100:.1f}%)",
        ),
        "L3 AI quality (length)": (
            l3_length_drop >= 0.25,
            f"output length p50 {before.l3_output_length_p50} -> {after.l3_output_length_p50} chars "
            f"(drop {l3_length_drop*100:.1f}%)",
        ),
        "L4 business": (
            l4_sat_drop >= 5.0,
            f"satisfaction {before.l4_satisfaction_pct:.1f}% -> {after.l4_satisfaction_pct:.1f}% "
            f"(drop {l4_sat_drop:.1f} pts - below the 5pt alert threshold, "
            f"and lags by hours to days)",
        ),
    }


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

INCIDENTS: list[tuple[str, MetricDeltas, IncidentState]] = [
    (
        "INCIDENT A - Silent model update (quality regression)",
        MetricDeltas(
            judge_score_delta=-18.0,
            output_length_delta=-42.0,
            cost_per_request_delta=0.0,
        ),
        IncidentState(
            provider_status_clean=True,
            model_version_changed=True,
        ),
    ),
    (
        "INCIDENT B - Prompt template bug (cost spike)",
        MetricDeltas(
            cost_per_request_delta=85.0,
            context_length_p95_delta=70.0,
        ),
        IncidentState(
            feature_flag_changed=True,
        ),
    ),
    (
        "INCIDENT C - Agent loop + MCP schema drift (tool-use)",
        MetricDeltas(
            tool_error_rate_delta=55.0,
            tool_loop_detected=True,
        ),
        IncidentState(
            tool_loop_detected=True,
            mcp_schema_changed=True,
        ),
    ),
]


def main() -> None:
    sep = "=" * 78
    thin = "-" * 78

    print(sep)
    print("AI INCIDENT TRIAGE SIMULATOR (Phase 11, Lesson 96)")
    print(sep)

    category_counts: dict[Category, int] = {c: 0 for c in Category}
    severity_counts: dict[Severity, int] = {s: 0 for s in Severity}

    for name, metrics, state in INCIDENTS:
        print()
        print(thin)
        print(f"  {name}")
        print(thin)

        category, severity, reasoning = classify_incident(metrics)
        category_counts[category] += 1
        severity_counts[severity] += 1

        print(f"  Category  : {category.value.upper()}")
        print(f"  Severity  : {severity.value}")
        print(f"  Reasoning : {reasoning}")
        print()
        print(f"  Runbook [{category.value.upper()}]:")
        route_runbook(category, state)

    # ------------------------------------------------------------------
    # Part 3: the silent-drift failure shape (the lesson's headline)
    # ------------------------------------------------------------------
    print()
    print(sep)
    print("FAILURE SHAPE: SILENT DRIFT (the demo)")
    print(sep)
    print()
    print("  Scenario: a Sonnet-class provider does a silent rolling update.")
    print("  Latency improves. Errors stay flat. Cost is unchanged. Outputs")
    print("  get 38% shorter on average. LLM-as-judge score drops 14 points.")
    print()
    print("  Dashboard snapshots (before -> after the provider swap):")
    print()

    before = DashboardSnapshot(
        l1_latency_p99_ms=1850.0,
        l1_error_rate_pct=0.20,
        l2_cost_per_request_usd=0.0240,
        l3_judge_score=87.0,
        l3_output_length_p50=620,
        l4_satisfaction_pct=82.0,
    )
    after = DashboardSnapshot(
        l1_latency_p99_ms=1620.0,        # actually IMPROVED
        l1_error_rate_pct=0.18,          # essentially flat
        l2_cost_per_request_usd=0.0238,   # essentially flat
        l3_judge_score=73.0,             # -14 pts (-16%)
        l3_output_length_p50=384,        # -236 chars (-38%)
        l4_satisfaction_pct=78.5,        # -3.5 pts (lagging signal)
    )
    coverage = detect_silent_drift(before, after)

    print(f"    {'Layer':<30} {'Caught it?':<12} What changed")
    print(f"    {'-'*30} {'-'*12} {'-'*40}")
    for layer, (caught, explanation) in coverage.items():
        verdict = "YES" if caught else "NO"
        flag = "<--" if caught else ""
        print(f"    {layer:<30} {verdict:<12} {explanation} {flag}")

    caught_layers = [layer for layer, (caught, _) in coverage.items() if caught]
    missed_layers = [layer for layer, (caught, _) in coverage.items() if not caught]

    print()
    print(f"  Layers that CAUGHT the regression : {caught_layers}")
    print(f"  Layers that MISSED the regression : {missed_layers}")
    print()
    print("  Without L3, this regression is invisible to your dashboard until")
    print("  L4 satisfaction drifts enough for someone to ask a question. By")
    print("  then it has been live for weeks. Pin your model version, own L3.")

    print()
    print(sep)
    print("HEADLINE: the silent-drift failure shape is invisible to L1, cheap")
    print("to catch at L3, and weeks late at L4. Triage the category before")
    print("you open any dashboard.")
    print(thin)
    print(f"  Incidents triaged        : { {c.value: n for c, n in category_counts.items() if n} }")
    print(f"  Severity distribution    : { {s.name: n for s, n in severity_counts.items() if n} }")
    print()
    print("  The demo above is the lesson's headline failure: a silent model")
    print("  update that an L1 dashboard cannot catch because the change is")
    print("  in CONTENT, not in transport. LLM-as-judge + output-length p50")
    print("  at L3 is the minimum signal that detects it in minutes.")


if __name__ == "__main__":
    main()