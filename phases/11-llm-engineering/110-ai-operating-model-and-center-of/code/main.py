"""CoE readiness scorer and operating model router — stdlib Python.

Part 1: CoE Readiness Scorer
Takes a set of yes/no organizational signals and computes a maturity level
(1-5) with the next-step recommendation. Each signal is weighted; the scorer
shows which gap is the highest-leverage next move.

Part 2: Operating Model Router
Takes a decision type and routes it to the correct owner (CoE platform,
delivery team, or joint) based on the ownership boundary rules from the
AI Operating Model lesson. Shows where joint decisions are and why they
need a single accountable owner forced into them.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Sequence


# ---------------------------------------------------------------------------
# Shared enumerations
# ---------------------------------------------------------------------------

class MaturityLevel(Enum):
    AD_HOC         = 1
    OPPORTUNISTIC  = 2
    SYSTEMATIC     = 3
    DIFFERENTIATED = 4
    TRANSFORMATIONAL = 5


class Owner(Enum):
    COE_PLATFORM   = "CoE Platform"
    DELIVERY_TEAM  = "Delivery Team"
    JOINT          = "Joint (needs single DRI)"


# ---------------------------------------------------------------------------
# Part 1: CoE Readiness Scorer
# ---------------------------------------------------------------------------

@dataclass
class ReadinessSignal:
    key: str
    description: str
    weight: int          # higher = more impact on maturity score
    present: bool = False


# Five maturity signals; weights reflect the lesson's ownership boundary logic.
READINESS_SIGNALS: list[ReadinessSignal] = [
    ReadinessSignal(
        key="funded_team",
        description="CoE is formally funded with dedicated headcount (>= 2 FTE)",
        weight=25,
        present=False,
    ),
    ReadinessSignal(
        key="standards_enforced",
        description="Standards are enforced in CI (eval thresholds, cost tagging, security baseline)",
        weight=25,
        present=False,
    ),
    ReadinessSignal(
        key="asset_library_active",
        description="Asset library (prompts, harnesses, scaffolds) is in active use by >= 2 teams",
        weight=20,
        present=False,
    ),
    ReadinessSignal(
        key="champion_network",
        description="Champion network is active: >= 1 champion per BU with dedicated time",
        weight=20,
        present=False,
    ),
    ReadinessSignal(
        key="governance_cadence",
        description="Monthly portfolio review and quarterly standards review are running",
        weight=10,
        present=False,
    ),
]

LEVEL_THRESHOLDS = [
    (90, MaturityLevel.TRANSFORMATIONAL),
    (70, MaturityLevel.DIFFERENTIATED),
    (45, MaturityLevel.SYSTEMATIC),
    (20, MaturityLevel.OPPORTUNISTIC),
    (0,  MaturityLevel.AD_HOC),
]

NEXT_STEP_BY_LEVEL: dict[MaturityLevel, str] = {
    MaturityLevel.AD_HOC: (
        "Secure formal funding and appoint a CoE lead. Without a funded team "
        "no other signal is sustainable."
    ),
    MaturityLevel.OPPORTUNISTIC: (
        "Move standards from documents to CI enforcement. A standard that is "
        "not machine-checked is not a standard."
    ),
    MaturityLevel.SYSTEMATIC: (
        "Activate the champion network with dedicated time (20% per sprint). "
        "This is the load-bearing joint that prevents hub-and-spoke bottleneck."
    ),
    MaturityLevel.DIFFERENTIATED: (
        "Instrument asset reuse: measure how many sprints new projects save. "
        "Make that number visible to leadership to sustain investment."
    ),
    MaturityLevel.TRANSFORMATIONAL: (
        "Focus on model retirement planning and external benchmarking. "
        "The operating model is mature; the risk is now complacency."
    ),
}


def score_readiness(signals: list[ReadinessSignal]) -> tuple[int, MaturityLevel, str]:
    """Return (score_0_to_100, level, next_step_recommendation)."""
    score = sum(s.weight for s in signals if s.present)
    level = MaturityLevel.AD_HOC
    for threshold, lv in LEVEL_THRESHOLDS:
        if score >= threshold:
            level = lv
            break
    recommendation = NEXT_STEP_BY_LEVEL[level]
    return score, level, recommendation


def highest_leverage_next_signal(signals: list[ReadinessSignal]) -> ReadinessSignal | None:
    """Return the absent signal with the highest weight (biggest jump available)."""
    absent = [s for s in signals if not s.present]
    if not absent:
        return None
    return max(absent, key=lambda s: s.weight)


# ---------------------------------------------------------------------------
# Part 2: Operating Model Router
# ---------------------------------------------------------------------------

@dataclass
class Decision:
    name: str
    description: str
    # Tags used by the router
    affects_standards: bool = False
    affects_delivery_scope: bool = False
    is_portfolio_level: bool = False
    is_security_incident: bool = False


DECISIONS: list[Decision] = [
    Decision(
        name="Fund a new use case",
        description="A business unit proposes a new AI use case and requests budget.",
        affects_standards=False,
        affects_delivery_scope=True,
        is_portfolio_level=True,
        is_security_incident=False,
    ),
    Decision(
        name="Retire a model version",
        description="Provider announces end-of-life for a model the platform uses.",
        affects_standards=True,
        affects_delivery_scope=False,
        is_portfolio_level=False,
        is_security_incident=False,
    ),
    Decision(
        name="Adjust sprint priorities within approved cost envelope",
        description="Delivery team re-orders backlog items; total spend stays within CoE cap.",
        affects_standards=False,
        affects_delivery_scope=True,
        is_portfolio_level=False,
        is_security_incident=False,
    ),
    Decision(
        name="Respond to a prompt injection incident",
        description="A production agent was manipulated via indirect prompt injection in a user document.",
        affects_standards=True,
        affects_delivery_scope=True,
        is_portfolio_level=False,
        is_security_incident=True,
    ),
]


def route_decision(d: Decision) -> tuple[Owner, str]:
    """Route a decision to the correct owner with a short rationale."""
    if d.is_security_incident:
        # Security incidents always go to CoE first; delivery team executes the fix.
        return Owner.COE_PLATFORM, (
            "Security incidents require CoE to update the standard first; "
            "delivery team patches the affected integration under CoE direction."
        )
    if d.affects_standards and not d.affects_delivery_scope:
        return Owner.COE_PLATFORM, (
            "Touches platform standards only; no delivery-team input needed for the decision."
        )
    if d.affects_delivery_scope and not d.affects_standards and not d.is_portfolio_level:
        return Owner.DELIVERY_TEAM, (
            "Scope is within an approved cost envelope and does not change any standard. "
            "Delivery team owns this fully."
        )
    if d.is_portfolio_level and d.affects_delivery_scope:
        return Owner.JOINT, (
            "Portfolio funding touches both CoE priorities and BU delivery scope. "
            "Joint decision — appoint a single DRI (typically CoE lead) to break ties."
        )
    # Fallback
    return Owner.JOINT, (
        "Multiple ownership dimensions overlap. Escalate to monthly portfolio review; "
        "assign a single DRI before the decision is made."
    )


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    separator = "=" * 72

    print(separator)
    print("COE READINESS SCORER  (Phase 11, Lesson 110)")
    print(separator)

    # Sample organization: has a funded team and some written standards,
    # but standards are not enforced in CI, no champion network, no cadence.
    sample_signals = [
        ReadinessSignal(**{**vars(s)}) for s in READINESS_SIGNALS
    ]
    sample_signals[0].present = True   # funded_team: yes
    sample_signals[1].present = False  # standards_enforced: not yet in CI
    sample_signals[2].present = False  # asset_library_active: one team, not two
    sample_signals[3].present = False  # champion_network: not active
    sample_signals[4].present = False  # governance_cadence: ad hoc only

    print()
    print("  Organizational signals:")
    for s in sample_signals:
        mark = "[x]" if s.present else "[ ]"
        print(f"    {mark}  (weight={s.weight:>2})  {s.description}")

    score, level, recommendation = score_readiness(sample_signals)
    print()
    print(f"  Score:          {score}/100")
    print(f"  Maturity level: {level.value} — {level.name}")
    print(f"  Recommendation: {recommendation}")

    next_sig = highest_leverage_next_signal(sample_signals)
    if next_sig:
        print()
        print(f"  Highest-leverage next signal to activate:")
        print(f"    '{next_sig.key}'  (weight={next_sig.weight})")
        print(f"    {next_sig.description}")

    print()
    print("  --- What happens if we activate 'standards_enforced'? ---")
    sample_signals[1].present = True
    score2, level2, rec2 = score_readiness(sample_signals)
    print(f"  New score: {score2}/100  ->  Level {level2.value} ({level2.name})")
    print(f"  Recommendation: {rec2}")
    sample_signals[1].present = False  # reset for clarity

    print()
    print(separator)
    print("OPERATING MODEL ROUTER")
    print(separator)
    print()

    for d in DECISIONS:
        owner, rationale = route_decision(d)
        print(f"  Decision:  {d.name}")
        print(f"  Owner:     {owner.value}")
        print(f"  Rationale: {rationale}")
        print()

    print(separator)
    print("HEADLINE: the CoE owns the platform layer, not delivery")
    print("-" * 72)
    print("  Standards, assets, champion network, and cadence are CoE-owned.")
    print("  Sprint scope within approved envelopes is delivery-team-owned.")
    print("  Joint decisions exist — they need a named DRI or they fall through")
    print("  the seam. Portfolio funding is the canonical joint decision.")
    print("  The highest-leverage CoE move is usually standards enforcement in")
    print("  CI: a standard that is not machine-checked is not a standard.")


if __name__ == "__main__":
    main()
