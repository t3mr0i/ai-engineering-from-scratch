"""AI output risk classifier and approval gate simulator — stdlib Python.

Part 1: Risk classifier.
  Takes a description of an AI output (type, reversibility, audience,
  downstream action) and assigns it one of four risk tiers, each with its
  own gate requirement (no gate / async / sync / dual sign-off).

Part 2: Approval gate simulator.
  Runs a synthetic batch through a Tier 2/3 gate. Some outputs are accepted,
  one requires revision, one escalates through the named reviewer chain, and
  one demonstrates rubber-stamp detection (approved faster than the mandatory
  hold period). The simulator prints a decision trace and a summary.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------- Risk tiers ----------

class RiskTier(Enum):
    LOW = 1       # Tier 1: internal, reversible, human-visible
    MEDIUM = 2    # Tier 2: customer-facing or triggers downstream action
    HIGH = 3      # Tier 3: legal, medical, financial, personnel
    CRITICAL = 4  # Tier 4: safety, regulatory, irreversible commitment


TIER_LABELS = {
    RiskTier.LOW:      "Tier 1 — Low      (monitoring only; no gate required)",
    RiskTier.MEDIUM:   "Tier 2 — Medium   (async review; 4-hour SLA)",
    RiskTier.HIGH:     "Tier 3 — High     (sync human sign-off before action)",
    RiskTier.CRITICAL: "Tier 4 — Critical (dual reviewer + audit log + rollback plan)",
}


@dataclass
class OutputDescription:
    name: str
    reversible: bool       # Can the downstream action be undone?
    audience: str          # "internal" | "customer" | "regulatory" | "safety"
    downstream_action: str # "none" | "notification" | "data_write" | "legal" | "financial"


def classify_risk(o: OutputDescription) -> RiskTier:
    """Rule-based classifier. Reversibility and blast radius determine tier,
    not confidence score. A 97% confident model output in Tier 4 still gets
    the gate."""
    if o.audience == "safety" or o.downstream_action == "safety_system":
        return RiskTier.CRITICAL
    if not o.reversible and o.audience == "regulatory":
        return RiskTier.CRITICAL
    if o.downstream_action in ("legal", "financial") and not o.reversible:
        return RiskTier.HIGH
    if o.audience in ("customer", "regulatory"):
        return RiskTier.MEDIUM
    if o.downstream_action in ("data_write",) and not o.reversible:
        return RiskTier.MEDIUM
    return RiskTier.LOW


# ---------- Gate decisions ----------

class GateDecision(Enum):
    ACCEPT = "ACCEPT"
    REVISE = "REQUEST REVISION"
    ESCALATE = "ESCALATE"
    REJECT = "REJECT"
    HOLD = "HOLD (conservative default)"


RUBBER_STAMP_THRESHOLD_S = {
    RiskTier.LOW: 0,       # no minimum; no gate
    RiskTier.MEDIUM: 30,   # 30-second mandatory hold
    RiskTier.HIGH: 60,     # 60-second mandatory hold
    RiskTier.CRITICAL: 120,# 2-minute mandatory hold
}


@dataclass
class ReviewEvent:
    output_id: str
    tier: RiskTier
    reviewer: str
    decision: GateDecision
    review_duration_s: float
    revision_notes: str = ""


@dataclass
class SimulatedOutput:
    output_id: str
    description: str
    tier: RiskTier
    # Simulated reviewer behaviour: what the first reviewer does, how long
    # they take. Escalation triggers if decision is ESCALATE.
    primary_decision: GateDecision
    primary_duration_s: float
    secondary_decision: GateDecision = GateDecision.HOLD
    secondary_duration_s: float = 0.0


# ---------- Gate runner ----------

ESCALATION_CHAIN = [
    "primary_reviewer",
    "senior_reviewer",
    "decision_owner",
]
CONSERVATIVE_DEFAULT = GateDecision.HOLD


def run_gate(output: SimulatedOutput) -> list[ReviewEvent]:
    """Simulate the approval gate for a single output. Returns the audit trail."""
    events: list[ReviewEvent] = []
    hold = RUBBER_STAMP_THRESHOLD_S[output.tier]

    # Primary review
    primary_event = ReviewEvent(
        output_id=output.output_id,
        tier=output.tier,
        reviewer=ESCALATION_CHAIN[0],
        decision=output.primary_decision,
        review_duration_s=output.primary_duration_s,
    )
    events.append(primary_event)

    if output.primary_decision != GateDecision.ESCALATE:
        return events

    # Escalation: secondary reviewer
    secondary_event = ReviewEvent(
        output_id=output.output_id,
        tier=output.tier,
        reviewer=ESCALATION_CHAIN[1],
        decision=output.secondary_decision,
        review_duration_s=output.secondary_duration_s,
    )
    events.append(secondary_event)

    if output.secondary_decision != GateDecision.ESCALATE:
        return events

    # All escalation paths exhausted: conservative default
    default_event = ReviewEvent(
        output_id=output.output_id,
        tier=output.tier,
        reviewer="decision_owner (timeout -> conservative default)",
        decision=CONSERVATIVE_DEFAULT,
        review_duration_s=0.0,
    )
    events.append(default_event)
    return events


def is_rubber_stamp(event: ReviewEvent) -> bool:
    """An approval faster than the mandatory hold period is a rubber-stamp
    signal for Tier 2+. Tier 1 has no hold requirement."""
    if event.tier == RiskTier.LOW:
        return False
    if event.decision not in (GateDecision.ACCEPT,):
        return False
    hold = RUBBER_STAMP_THRESHOLD_S[event.tier]
    return event.review_duration_s < hold


# ---------- Synthetic batch ----------

BATCH: list[SimulatedOutput] = [
    SimulatedOutput(
        output_id="OUT-001",
        description="Internal draft summary of a meeting transcript",
        tier=classify_risk(OutputDescription(
            name="meeting-summary",
            reversible=True,
            audience="internal",
            downstream_action="none",
        )),
        primary_decision=GateDecision.ACCEPT,
        primary_duration_s=0,  # no gate needed
    ),
    SimulatedOutput(
        output_id="OUT-002",
        description="Customer-facing email draft: subscription renewal notice",
        tier=classify_risk(OutputDescription(
            name="renewal-email",
            reversible=True,   # draft; not sent yet
            audience="customer",
            downstream_action="notification",
        )),
        primary_decision=GateDecision.ACCEPT,
        primary_duration_s=95.0,  # healthy: above the 30-second hold
    ),
    SimulatedOutput(
        output_id="OUT-003",
        description="AI-generated contract clause for supplier agreement",
        tier=classify_risk(OutputDescription(
            name="contract-clause",
            reversible=False,
            audience="customer",   # supplier contract, not a regulatory filing
            downstream_action="legal",
        )),
        primary_decision=GateDecision.REVISE,
        primary_duration_s=180.0,
    ),
    SimulatedOutput(
        output_id="OUT-004",
        description="Tier 3 financial settlement recommendation (irreversible)",
        tier=classify_risk(OutputDescription(
            name="settlement-recommendation",
            reversible=False,
            audience="customer",
            downstream_action="financial",
        )),
        primary_decision=GateDecision.ACCEPT,
        primary_duration_s=8.0,   # RUBBER STAMP: below 60-second hold
    ),
    SimulatedOutput(
        output_id="OUT-005",
        description="AI recommendation escalated: ambiguous safety classification",
        tier=RiskTier.CRITICAL,
        primary_decision=GateDecision.ESCALATE,
        primary_duration_s=240.0,
        secondary_decision=GateDecision.ESCALATE,  # secondary also escalates
        secondary_duration_s=120.0,
        # -> all paths exhausted -> conservative default
    ),
]


# ---------- Driver ----------

def main() -> None:
    print("=" * 80)
    print("HITL GATE SIMULATOR (Phase 11, Lesson 109)")
    print("=" * 80)

    print()
    print("PART 1: RISK CLASSIFICATION")
    print("-" * 80)
    for o in BATCH:
        label = TIER_LABELS[o.tier]
        print(f"  {o.output_id}  {label}")
        print(f"          {o.description}")
    print()

    print("PART 2: APPROVAL GATE SIMULATION")
    print("-" * 80)
    rubber_stamps: list[ReviewEvent] = []

    for output in BATCH:
        events = run_gate(output)
        final = events[-1]
        print(f"\n  {output.output_id} | {output.description[:55]}")
        for ev in events:
            stamp_flag = " [RUBBER STAMP DETECTED]" if is_rubber_stamp(ev) else ""
            dur = f"{ev.review_duration_s:.0f}s" if ev.review_duration_s > 0 else "n/a"
            print(f"    reviewer={ev.reviewer:<38} decision={ev.decision.value:<22}"
                  f" duration={dur}{stamp_flag}")
            if is_rubber_stamp(ev):
                rubber_stamps.append(ev)

    print()
    print("=" * 80)
    print("HEADLINE: gates must be measured, not assumed")
    print("-" * 80)
    print(f"  Outputs processed:    {len(BATCH)}")
    print(f"  Rubber stamps caught: {len(rubber_stamps)}")
    for rs in rubber_stamps:
        hold = RUBBER_STAMP_THRESHOLD_S[rs.tier]
        print(f"    -> {rs.output_id}: approved in {rs.review_duration_s:.0f}s,"
              f" minimum hold is {hold}s for {rs.tier.name}")
    print()
    print("  OUT-005 exhausted all escalation paths -> conservative default (HOLD).")
    print("  Changing conservative_default to ACCEPT is the most commonly")
    print("  violated principle in gate design. See Exercise 2.")


if __name__ == "__main__":
    main()
