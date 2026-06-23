"""
AI Project Reporting and Steering — Core Decision Logic

Two parts:
  Part 1 — SteeringSignalClassifier
    Takes a list of project signals. Assigns each a tier (T1-T4) and checks
    staleness against the tier's threshold. Returns the set of admissible
    signals (those with a tier and within the staleness window).

  Part 2 — PackSectionRouter
    Takes the set of admissible signals and the section context (whether a
    blocker or threshold breach is present). Returns the section type
    (STATUS_CONFIRMATION, RISK_ESCALATION, or DECISION_REQUEST), the required
    closing form, and any quality-gate failures that must be resolved before
    the section can be presented.

No network calls. No third-party dependencies.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


# ---------------------------------------------------------------------------
# Domain types
# ---------------------------------------------------------------------------

class SignalTier(Enum):
    T1 = "T1 — Measured outcomes"
    T2 = "T2 — Delivery metrics"
    T3 = "T3 — Qualitative assessments"
    T4 = "T4 — Proxy signals"


# Staleness thresholds in days per tier
STALENESS_THRESHOLD_DAYS: dict = {
    SignalTier.T1: 1,
    SignalTier.T2: 3,
    SignalTier.T3: 7,
    SignalTier.T4: 14,  # "as available" — generous but not infinite
}


class SectionType(Enum):
    STATUS_CONFIRMATION = "Status confirmation"
    RISK_ESCALATION = "Risk escalation"
    DECISION_REQUEST = "Decision request"


@dataclass
class ProjectSignal:
    name: str
    value: str
    tier: SignalTier
    age_days: float          # how many days since this signal was measured
    is_blocker: bool = False  # True if this signal represents an active blocker
    threshold_breached: bool = False  # True if a pre-agreed threshold is exceeded


@dataclass
class ClassifiedSignal:
    signal: ProjectSignal
    admissible: bool
    rejection_reason: Optional[str] = None


@dataclass
class SectionDecision:
    section_type: SectionType
    closing_form: str
    admissible_signals: List[ClassifiedSignal]
    quality_gate_failures: List[str] = field(default_factory=list)
    has_t1_or_t2: bool = False


# ---------------------------------------------------------------------------
# Part 1 — SteeringSignalClassifier
# ---------------------------------------------------------------------------

def classify_signals(signals: List[ProjectSignal]) -> List[ClassifiedSignal]:
    """
    For each signal: check whether it is within its tier's staleness threshold.
    Returns a list of ClassifiedSignal. Admissible signals are those that pass.
    """
    results = []
    for sig in signals:
        threshold = STALENESS_THRESHOLD_DAYS[sig.tier]
        if sig.age_days > threshold:
            results.append(ClassifiedSignal(
                signal=sig,
                admissible=False,
                rejection_reason=(
                    f"Stale: {sig.age_days:.0f}d old, "
                    f"threshold for {sig.tier.name} is {threshold}d"
                ),
            ))
        else:
            results.append(ClassifiedSignal(signal=sig, admissible=True))
    return results


# ---------------------------------------------------------------------------
# Part 2 — PackSectionRouter
# ---------------------------------------------------------------------------

def route_section(classified: List[ClassifiedSignal]) -> SectionDecision:
    """
    Given classified signals, determine:
      - the section type
      - the required closing form
      - quality gate failures

    Rules (in priority order):
      1. If any admissible signal is a blocker → DECISION_REQUEST
      2. If any admissible signal has a threshold breach → RISK_ESCALATION
      3. If admissible T1/T2 signals exist → STATUS_CONFIRMATION
      4. If only T3/T4 admissible signals exist → RISK_ESCALATION
         (insufficient evidence for status confirmation)
      5. If no admissible signals at all → DECISION_REQUEST
         (cannot confirm status; need information to decide)
    """
    admissible = [c for c in classified if c.admissible]
    has_blocker = any(c.signal.is_blocker for c in admissible)
    has_breach = any(c.signal.threshold_breached for c in admissible)
    has_t1_or_t2 = any(
        c.signal.tier in (SignalTier.T1, SignalTier.T2) for c in admissible
    )

    # Determine section type
    if has_blocker:
        section_type = SectionType.DECISION_REQUEST
        closing_form = (
            "DECISION REQUEST: The team needs a decision on [specific question] "
            "by [date]. Options: A ([trade-off]), B ([trade-off]). "
            "Recommended: [option with rationale]."
        )
    elif has_breach:
        section_type = SectionType.RISK_ESCALATION
        closing_form = (
            "CONTINGENT DECISION: If [trigger condition] occurs before [date], "
            "the team will [pre-agreed response]. Noted for awareness."
        )
    elif has_t1_or_t2:
        section_type = SectionType.STATUS_CONFIRMATION
        closing_form = (
            "NO DECISION NEEDED: On current trajectory, [outcome] is expected "
            "by [date]. No steering action required."
        )
    elif admissible:
        # Only T3/T4 — not enough for confirmation
        section_type = SectionType.RISK_ESCALATION
        closing_form = (
            "CONTINGENT DECISION: Status cannot be confirmed with current "
            "evidence tier (T3/T4 only). If T1/T2 signals confirm deterioration "
            "before [date], escalate to [response]."
        )
    else:
        # No admissible signals at all
        section_type = SectionType.DECISION_REQUEST
        closing_form = (
            "DECISION REQUEST: No admissible evidence available. "
            "The team needs a decision on whether to proceed, pause, or "
            "replan based on [available qualitative context]."
        )

    # Quality gate checks
    gates: List[str] = []

    stale = [c for c in classified if not c.admissible]
    if stale:
        gates.append(
            f"GATE FAIL — Staleness: {len(stale)} signal(s) excluded as stale: "
            + ", ".join(c.signal.name for c in stale)
        )

    if not has_t1_or_t2 and admissible:
        gates.append(
            "GATE FAIL — Signal tier: No T1/T2 signals admitted. "
            "Status confirmation is not possible; section must be escalation or decision."
        )

    if not admissible:
        gates.append(
            "GATE FAIL — Evidence traceability: Zero admissible signals. "
            "Section cannot be presented without at least one in-threshold signal."
        )

    return SectionDecision(
        section_type=section_type,
        closing_form=closing_form,
        admissible_signals=admissible,
        quality_gate_failures=gates,
        has_t1_or_t2=has_t1_or_t2,
    )


# ---------------------------------------------------------------------------
# Printing helpers
# ---------------------------------------------------------------------------

def print_classification(classified: List[ClassifiedSignal]) -> None:
    print("  Signal classification:")
    for c in classified:
        status = "ADMITTED" if c.admissible else f"REJECTED ({c.rejection_reason})"
        print(f"    [{c.signal.tier.name}] {c.signal.name}: {c.signal.value} — {status}")


def print_decision(decision: SectionDecision) -> None:
    print(f"  Section type : {decision.section_type.value}")
    print(f"  T1/T2 present: {decision.has_t1_or_t2}")
    print(f"  Closing form : {decision.closing_form}")
    if decision.quality_gate_failures:
        print("  Quality gates:")
        for g in decision.quality_gate_failures:
            print(f"    * {g}")
    else:
        print("  Quality gates: ALL PASSED")


# ---------------------------------------------------------------------------
# main — demonstration scenarios
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 70)
    print("AI Project Status & Steering Pack — Decision Logic Demonstration")
    print("=" * 70)

    # ------------------------------------------------------------------
    # Scenario A: healthy project — T1 + T2 signals, all fresh
    # ------------------------------------------------------------------
    print("\nScenario A: Healthy project (T1+T2 signals, fresh)")
    print("-" * 50)
    scenario_a = [
        ProjectSignal("Production error rate", "0.03%",   SignalTier.T1, age_days=0.5),
        ProjectSignal("Deployment frequency",  "3/week",  SignalTier.T2, age_days=1.0),
        ProjectSignal("Open blocker count",    "0",       SignalTier.T2, age_days=1.0),
        ProjectSignal("Team confidence",       "High",    SignalTier.T3, age_days=3.0),
    ]
    classified_a = classify_signals(scenario_a)
    print_classification(classified_a)
    decision_a = route_section(classified_a)
    print_decision(decision_a)

    # ------------------------------------------------------------------
    # Scenario B: stale T4-only signal used as sole evidence
    # ------------------------------------------------------------------
    print("\nScenario B: T4-only signal, no T1/T2 (the 'exercise 1' case)")
    print("-" * 50)
    scenario_b = [
        ProjectSignal("Meeting attendance rate", "80%", SignalTier.T4, age_days=5.0),
        ProjectSignal("Open PR age (median)",    "4d",  SignalTier.T4, age_days=2.0),
    ]
    classified_b = classify_signals(scenario_b)
    print_classification(classified_b)
    decision_b = route_section(classified_b)
    print_decision(decision_b)

    # ------------------------------------------------------------------
    # Scenario B augmented: add a T1 signal
    # ------------------------------------------------------------------
    print("\nScenario B+: Same as B but with a T1 signal added")
    print("-" * 50)
    scenario_b_plus = scenario_b + [
        ProjectSignal("API error rate", "0.05%", SignalTier.T1, age_days=0.5),
    ]
    classified_b_plus = classify_signals(scenario_b_plus)
    print_classification(classified_b_plus)
    decision_b_plus = route_section(classified_b_plus)
    print_decision(decision_b_plus)

    # ------------------------------------------------------------------
    # Scenario C: stale signals (the 'exercise 2' case)
    # ------------------------------------------------------------------
    print("\nScenario C: Mixed freshness — some signals stale")
    print("-" * 50)
    scenario_c = [
        ProjectSignal("Sprint velocity",       "42 pts", SignalTier.T2, age_days=6.0),  # stale
        ProjectSignal("Stakeholder satisfaction", "7/10", SignalTier.T3, age_days=10.0),  # stale
        ProjectSignal("API error rate",        "0.8%",   SignalTier.T1, age_days=0.8),  # fresh
        ProjectSignal("Planned vs actual scope", "-12%", SignalTier.T2, age_days=2.0,
                      threshold_breached=True),
    ]
    classified_c = classify_signals(scenario_c)
    print_classification(classified_c)
    decision_c = route_section(classified_c)
    print_decision(decision_c)

    # ------------------------------------------------------------------
    # Scenario D: blocker present — forces decision request
    # ------------------------------------------------------------------
    print("\nScenario D: Active blocker present")
    print("-" * 50)
    scenario_d = [
        ProjectSignal("Production error rate", "0.04%",   SignalTier.T1, age_days=0.5),
        ProjectSignal("Dependency availability", "BLOCKED",
                      SignalTier.T2, age_days=1.0, is_blocker=True),
    ]
    classified_d = classify_signals(scenario_d)
    print_classification(classified_d)
    decision_d = route_section(classified_d)
    print_decision(decision_d)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 70)
    results = [
        ("A (healthy)", decision_a.section_type.value, len(decision_a.quality_gate_failures) == 0),
        ("B (T4 only)", decision_b.section_type.value, len(decision_b.quality_gate_failures) == 0),
        ("B+ (T4+T1)", decision_b_plus.section_type.value, len(decision_b_plus.quality_gate_failures) == 0),
        ("C (stale)",  decision_c.section_type.value, len(decision_c.quality_gate_failures) == 0),
        ("D (blocker)", decision_d.section_type.value, len(decision_d.quality_gate_failures) == 0),
    ]
    print("HEADLINE: Steering section routing summary")
    print(f"  {'Scenario':<15} {'Section type':<25} {'Gates pass?'}")
    print(f"  {'-'*15} {'-'*25} {'-'*11}")
    for name, stype, gates_ok in results:
        print(f"  {name:<15} {stype:<25} {'YES' if gates_ok else 'NO'}")
    print()
    print("  Key finding: Adding a single T1 signal to scenario B changes the")
    print("  routing from RISK_ESCALATION to STATUS_CONFIRMATION and clears")
    print("  the tier-coverage gate. Evidence tier, not volume, is the lever.")
    print("=" * 70)


if __name__ == "__main__":
    main()
