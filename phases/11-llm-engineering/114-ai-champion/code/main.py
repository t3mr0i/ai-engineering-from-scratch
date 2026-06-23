"""AI Champion decision model — stdlib Python.

Part 1: Artifact Prioritizer
  Given an (audience_level, knowledge_type) pair, returns the recommended
  artifact format and the next artifact in the compounding chain.
  Models the core triage decision every AI Champion makes when an enablement
  request lands.

Part 2: Pilot Gate Evaluator
  Given a pilot's current evidence record, returns which of the three gates
  (feasibility, quality, transfer) the pilot has passed, which it is blocked
  on, and what the champion must produce before proceeding.

The driver runs a synthetic set of champion scenarios and prints a
structured recommendation for each, ending in a HEADLINE summary.
No network, no pip, no arguments required.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Enums and data shapes
# ---------------------------------------------------------------------------

class AudienceLevel(Enum):
    L1_AWARE = "L1 — Aware"
    L2_PRACTITIONER = "L2 — Practitioner"
    L3_BUILDER = "L3 — Builder"


class KnowledgeType(Enum):
    CONCEPTUAL = "conceptual"   # what is this thing and why does it matter
    PROCEDURAL = "procedural"   # how do I do this step by step
    EVALUATIVE = "evaluative"   # how do I know if it is working


class ArtifactType(Enum):
    DECISION_AID = "Decision aid (one-page table / checklist)"
    REFERENCE_IMPL = "Reference implementation (runnable, annotated)"
    EVAL_HARNESS = "Eval harness (fixture tasks + scoring rubric)"
    SESSION = "Session (brown bag or workshop — must produce one persistent artifact)"


class PilotGate(Enum):
    G1_FEASIBILITY = "Gate 1 — Feasibility"
    G2_QUALITY = "Gate 2 — Quality"
    G3_TRANSFER = "Gate 3 — Transfer"


@dataclass
class ArtifactRecommendation:
    audience: AudienceLevel
    knowledge_type: KnowledgeType
    primary: ArtifactType
    next_in_chain: ArtifactType | None
    rationale: str


@dataclass
class PilotEvidence:
    name: str
    has_working_prototype: bool
    failure_cases_documented: bool
    has_eval_harness: bool
    eval_pass_rate_pct: float        # 0–100; meaningful only if has_eval_harness
    quality_threshold_pct: float     # team-defined minimum pass rate
    has_decision_aid: bool
    has_reference_impl: bool
    colleague_reproduced: bool       # True if someone not on the pilot ran it


@dataclass
class PilotVerdict:
    name: str
    gates_passed: list[PilotGate]
    blocked_at: PilotGate | None
    required_next: str


# ---------------------------------------------------------------------------
# Part 1: Artifact Prioritizer
# ---------------------------------------------------------------------------

# Routing table: (AudienceLevel, KnowledgeType) -> (primary, next_in_chain, rationale)
_ARTIFACT_ROUTES: dict[
    tuple[AudienceLevel, KnowledgeType],
    tuple[ArtifactType, ArtifactType | None, str],
] = {
    (AudienceLevel.L1_AWARE, KnowledgeType.CONCEPTUAL): (
        ArtifactType.DECISION_AID,
        None,
        "L1 needs a concrete answer to one question; prose or a deck is not reusable.",
    ),
    (AudienceLevel.L1_AWARE, KnowledgeType.PROCEDURAL): (
        ArtifactType.SESSION,
        ArtifactType.DECISION_AID,
        "L1 procedural needs a live demo; the session must close by producing a decision aid.",
    ),
    (AudienceLevel.L1_AWARE, KnowledgeType.EVALUATIVE): (
        ArtifactType.DECISION_AID,
        None,
        "L1 evaluative: a yes/no table is the limit of what will be used; no harness yet.",
    ),
    (AudienceLevel.L2_PRACTITIONER, KnowledgeType.CONCEPTUAL): (
        ArtifactType.DECISION_AID,
        ArtifactType.REFERENCE_IMPL,
        "L2 conceptual: decision aid first, then a runnable reference to ground the concept.",
    ),
    (AudienceLevel.L2_PRACTITIONER, KnowledgeType.PROCEDURAL): (
        ArtifactType.REFERENCE_IMPL,
        ArtifactType.EVAL_HARNESS,
        "L2 procedural: a runnable reference is the right format; follow with an eval harness.",
    ),
    (AudienceLevel.L2_PRACTITIONER, KnowledgeType.EVALUATIVE): (
        ArtifactType.EVAL_HARNESS,
        None,
        "L2 evaluative: the harness is the artifact; they will run it themselves.",
    ),
    (AudienceLevel.L3_BUILDER, KnowledgeType.CONCEPTUAL): (
        ArtifactType.REFERENCE_IMPL,
        ArtifactType.EVAL_HARNESS,
        "L3 conceptual: they absorb concept from code; follow with an eval harness.",
    ),
    (AudienceLevel.L3_BUILDER, KnowledgeType.PROCEDURAL): (
        ArtifactType.REFERENCE_IMPL,
        ArtifactType.EVAL_HARNESS,
        "L3 procedural: reference implementation with an eval harness as the follow-on.",
    ),
    (AudienceLevel.L3_BUILDER, KnowledgeType.EVALUATIVE): (
        ArtifactType.EVAL_HARNESS,
        None,
        "L3 evaluative: the harness is the conversation; they will extend it.",
    ),
}


def recommend_artifact(
    audience: AudienceLevel,
    knowledge_type: KnowledgeType,
) -> ArtifactRecommendation:
    primary, next_artifact, rationale = _ARTIFACT_ROUTES[audience, knowledge_type]
    return ArtifactRecommendation(
        audience=audience,
        knowledge_type=knowledge_type,
        primary=primary,
        next_in_chain=next_artifact,
        rationale=rationale,
    )


# ---------------------------------------------------------------------------
# Part 2: Pilot Gate Evaluator
# ---------------------------------------------------------------------------

def evaluate_pilot(ev: PilotEvidence) -> PilotVerdict:
    """Return which gates the pilot has passed and where it is blocked."""
    gates_passed: list[PilotGate] = []

    # Gate 1: feasibility
    g1_ok = ev.has_working_prototype and ev.failure_cases_documented
    if g1_ok:
        gates_passed.append(PilotGate.G1_FEASIBILITY)
    else:
        missing = []
        if not ev.has_working_prototype:
            missing.append("working prototype (2-day timebox)")
        if not ev.failure_cases_documented:
            missing.append("documented failure cases")
        return PilotVerdict(
            name=ev.name,
            gates_passed=gates_passed,
            blocked_at=PilotGate.G1_FEASIBILITY,
            required_next="Produce: " + ", ".join(missing),
        )

    # Gate 2: quality
    g2_ok = (
        ev.has_eval_harness
        and ev.eval_pass_rate_pct >= ev.quality_threshold_pct
    )
    if g2_ok:
        gates_passed.append(PilotGate.G2_QUALITY)
    else:
        missing = []
        if not ev.has_eval_harness:
            missing.append(
                f"eval harness with fixture tasks (pass rate currently unknown; "
                f"threshold is {ev.quality_threshold_pct:.0f}%)"
            )
        elif ev.eval_pass_rate_pct < ev.quality_threshold_pct:
            missing.append(
                f"higher pass rate ({ev.eval_pass_rate_pct:.0f}% < "
                f"{ev.quality_threshold_pct:.0f}% threshold)"
            )
        return PilotVerdict(
            name=ev.name,
            gates_passed=gates_passed,
            blocked_at=PilotGate.G2_QUALITY,
            required_next="Produce: " + ", ".join(missing),
        )

    # Gate 3: transfer
    g3_ok = ev.has_decision_aid and ev.has_reference_impl and ev.colleague_reproduced
    if g3_ok:
        gates_passed.append(PilotGate.G3_TRANSFER)
        return PilotVerdict(
            name=ev.name,
            gates_passed=gates_passed,
            blocked_at=None,
            required_next="All gates passed — pilot is ready to scale.",
        )
    else:
        missing = []
        if not ev.has_decision_aid:
            missing.append("decision aid")
        if not ev.has_reference_impl:
            missing.append("reference implementation")
        if not ev.colleague_reproduced:
            missing.append("colleague reproduction run (someone not on the pilot must succeed)")
        return PilotVerdict(
            name=ev.name,
            gates_passed=gates_passed,
            blocked_at=PilotGate.G3_TRANSFER,
            required_next="Produce: " + ", ".join(missing),
        )


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def _print_artifact_section() -> None:
    print("PART 1 — ARTIFACT PRIORITIZER")
    print("-" * 80)

    scenarios: list[tuple[AudienceLevel, KnowledgeType]] = [
        (AudienceLevel.L1_AWARE, KnowledgeType.CONCEPTUAL),
        (AudienceLevel.L1_AWARE, KnowledgeType.PROCEDURAL),
        (AudienceLevel.L2_PRACTITIONER, KnowledgeType.PROCEDURAL),
        (AudienceLevel.L2_PRACTITIONER, KnowledgeType.EVALUATIVE),
        (AudienceLevel.L3_BUILDER, KnowledgeType.EVALUATIVE),
    ]

    for audience, ktype in scenarios:
        rec = recommend_artifact(audience, ktype)
        chain_str = (
            f" -> {rec.next_in_chain.value}"
            if rec.next_in_chain
            else " -> (no follow-on artifact required)"
        )
        print(f"\n  Audience : {rec.audience.value}")
        print(f"  Knowledge: {rec.knowledge_type.value}")
        print(f"  Primary  : {rec.primary.value}")
        print(f"  Chain    : {chain_str}")
        print(f"  Why      : {rec.rationale}")

    print()


def _print_pilot_section() -> None:
    print("PART 2 — PILOT GATE EVALUATOR")
    print("-" * 80)

    pilots: list[PilotEvidence] = [
        PilotEvidence(
            name="RAG Q&A over internal policy docs",
            has_working_prototype=True,
            failure_cases_documented=True,
            has_eval_harness=False,
            eval_pass_rate_pct=0.0,
            quality_threshold_pct=80.0,
            has_decision_aid=False,
            has_reference_impl=False,
            colleague_reproduced=False,
        ),
        PilotEvidence(
            name="Automated meeting-note summarizer",
            has_working_prototype=True,
            failure_cases_documented=True,
            has_eval_harness=True,
            eval_pass_rate_pct=61.0,
            quality_threshold_pct=80.0,
            has_decision_aid=True,
            has_reference_impl=True,
            colleague_reproduced=False,
        ),
        PilotEvidence(
            name="Code review assistant (Claude Sonnet 4.x)",
            has_working_prototype=True,
            failure_cases_documented=True,
            has_eval_harness=True,
            eval_pass_rate_pct=87.0,
            quality_threshold_pct=80.0,
            has_decision_aid=True,
            has_reference_impl=True,
            colleague_reproduced=True,
        ),
        PilotEvidence(
            name="Ticket-triage agent (first sprint, no harness yet)",
            has_working_prototype=False,
            failure_cases_documented=False,
            has_eval_harness=False,
            eval_pass_rate_pct=0.0,
            quality_threshold_pct=75.0,
            has_decision_aid=False,
            has_reference_impl=False,
            colleague_reproduced=False,
        ),
    ]

    for ev in pilots:
        verdict = evaluate_pilot(ev)
        passed_str = (
            ", ".join(g.value for g in verdict.gates_passed)
            if verdict.gates_passed
            else "none"
        )
        blocked_str = verdict.blocked_at.value if verdict.blocked_at else "—"
        print(f"\n  Pilot    : {verdict.name}")
        print(f"  Passed   : {passed_str}")
        print(f"  Blocked  : {blocked_str}")
        print(f"  Next     : {verdict.required_next}")

    print()


def main() -> None:
    print("=" * 80)
    print("AI CHAMPION DECISION MODEL (Phase 11, Lesson 114)")
    print("=" * 80)
    print()

    _print_artifact_section()
    _print_pilot_section()

    print("=" * 80)
    print("HEADLINE: structure is the product")
    print("-" * 80)
    print("  An AI Champion who produces only sessions extracts no compounding value.")
    print("  Every session must close with a persistent artifact; every pilot must")
    print("  clear all three gates before it scales. The artifact chain —")
    print("  session -> decision aid -> reference impl -> eval harness — is the")
    print("  difference between a CoP that dies in month four and one that")
    print("  generates signal in year two.")
    print("=" * 80)


if __name__ == "__main__":
    main()
