"""AI incident signal classifier and runbook router — stdlib Python.

Part 1: Incident signal classifier.
  Takes a set of observed metric deltas (output-quality drop, cost spike,
  tool-call anomaly, safety-classifier hit) and assigns the incident to one
  of four categories: QUALITY, COST, TOOL_USE, or SAFETY.
  Safety always wins if the safety classifier fires, regardless of other
  signals — the "safety is always at least P1" rule from the lesson.

Part 2: Runbook router.
  Takes a category + a dict of checked conditions and prints the next
  recommended runbook step, encoding the Detect → Scope → Diagnose →
  Mitigate → Escalate chain as an executable policy.

The driver runs two synthetic incidents through both parts and prints the
triage path end-to-end. No network, no pip, no ML model required.
"""

from __future__ import annotations

from dataclasses import dataclass, field
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
    P1 = "P1 — 5 min ack, 30 min mitigation"
    P2 = "P2 — 15 min ack, 2 h mitigation"
    P3 = "P3 — next business day"
    P4 = "P4 — scheduled sprint"


@dataclass
class MetricDeltas:
    """Snapshot of observed metric changes at incident declaration time.

    Positive values = metric went UP, negative = metric went DOWN.
    All values are percentage-point changes from a rolling 7-day baseline.
    """
    judge_score_delta: float = 0.0          # L3 quality: LLM-as-judge score
    output_length_delta: float = 0.0        # L3 quality: mean output length
    cost_per_request_delta: float = 0.0     # L2 platform: token cost
    context_length_p95_delta: float = 0.0   # L2 platform: context length
    tool_error_rate_delta: float = 0.0      # agentic: tool-call error rate
    tool_loop_detected: bool = False        # agentic: agent looped
    safety_classifier_score: float = 0.0   # safety: 0.0–1.0; >=0.7 is a hit


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
    tool_loop_detected: bool = False      # also checked in TOOL_USE runbook routing
    context_length_spike: bool = False    # checked in COST runbook routing


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

    # Safety gate — unconditional override
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

    # Category assignment: pick whichever bucket has the most evidence,
    # with safety already handled above.
    scores = {
        Category.TOOL_USE: len(agentic_signals),
        Category.COST: len(cost_signals),
        Category.QUALITY: len(quality_signals),
    }
    category = max(scores, key=lambda c: scores[c])

    # If no signals at all, fall back to quality (human review needed)
    if scores[category] == 0:
        category = Category.QUALITY
        reasons.append("no threshold crossed — manual quality review recommended")

    # Collect the winning reasons
    signal_map = {
        Category.TOOL_USE: agentic_signals,
        Category.COST: cost_signals,
        Category.QUALITY: quality_signals,
    }
    reasons.extend(signal_map[category])

    # Severity: any single signal crossing threshold → P2; loop → P1
    if category is Category.TOOL_USE and m.tool_loop_detected:
        severity = Severity.P1
    elif scores[category] >= 2:
        severity = Severity.P2
    elif scores[category] == 1:
        severity = Severity.P2
    else:
        severity = Severity.P3

    return category, severity, "; ".join(reasons)


# ---------------------------------------------------------------------------
# Part 2: Runbook router
# ---------------------------------------------------------------------------

RUNBOOK_STEPS: dict[Category, list[tuple[str, str, str | None]]] = {
    # Each tuple: (condition_key | None, step text, mitigation hint | None)
    # condition_key None means "always show this step"
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
         "Disable the affected tool via the permission layer (Phase 15 · 10).",
         "MITIGATE: remove tool from allowed list until schema is reconciled."),
        (None,
         "ESCALATE to agent ops if an irreversible side-effect occurred (Phase 15 · 16).",
         None),
    ],
    Category.SAFETY: [
        (None,
         "Flag session IDs associated with the safety signal. Preserve logs — do not delete.",
         None),
        (None,
         "Disable the AI feature for the affected user segment immediately.",
         "MITIGATE: kill switch on the feature flag — do not wait for root cause."),
        ("safety_threshold_changed",
         "Check whether the safety-classifier threshold was recently lowered (performance optimisation).",
         "MITIGATE: revert threshold change."),
        (None,
         "ESCALATE to Safety lead within 15 minutes — mandatory, regardless of scope.",
         None),
        (None,
         "Treat as model-level issue until proven otherwise. Do not mitigate by prompt tuning alone.",
         None),
    ],
}


def route_runbook(
    category: Category, state: IncidentState, verbose: bool = True
) -> list[str]:
    """Print and return the ordered runbook steps for a given category.

    Steps whose condition_key is not None are shown only if the corresponding
    IncidentState attribute is True (i.e., the condition was checked and is
    relevant). Always-shown steps (key=None) print unconditionally.
    """
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
# Driver
# ---------------------------------------------------------------------------

INCIDENTS: list[tuple[str, MetricDeltas, IncidentState]] = [
    (
        "INCIDENT A — Silent model update (quality regression)",
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
        "INCIDENT B — Prompt template bug (cost spike)",
        MetricDeltas(
            cost_per_request_delta=85.0,
            context_length_p95_delta=70.0,
        ),
        IncidentState(
            feature_flag_changed=True,
        ),
    ),
    (
        "INCIDENT C — Agent loop + MCP schema drift (tool-use)",
        MetricDeltas(
            tool_error_rate_delta=55.0,
            tool_loop_detected=True,
        ),
        IncidentState(
            tool_loop_detected=True,
            mcp_schema_changed=True,
        ),
    ),
    (
        "INCIDENT D — Safety classifier hit (overrides quality signal)",
        MetricDeltas(
            judge_score_delta=-8.0,
            safety_classifier_score=0.84,
        ),
        IncidentState(
            safety_threshold_changed=True,
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

    print()
    print(sep)
    print("HEADLINE: triage the category before you open any dashboard")
    print(thin)
    print(f"  Incidents by category : { {c.value: n for c, n in category_counts.items() if n} }")
    print(f"  Incidents by severity : { {s.name: n for s, n in severity_counts.items() if n} }")
    print()
    print("  Incident D (safety score 0.84) overrode the quality signal entirely.")
    print("  Safety is always at least P1 — no other category can outrank it.")
    print()
    print("  Incident B: cost spike traced to context-length p95 +70% and a")
    print("  feature-flag change — the runbook router printed the mitigation")
    print("  (revert flag, apply max_tokens cap) without requiring ML expertise.")
    print()
    print("  The four runbooks cover every observed production AI incident type.")
    print("  Write them before the first incident. Run a game-day exercise.")
    print("  Agree on rollback authority in advance.")


if __name__ == "__main__":
    main()
