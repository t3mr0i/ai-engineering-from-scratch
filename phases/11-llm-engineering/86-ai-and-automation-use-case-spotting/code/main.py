"""Use-case intake scorer and pilot ranker — stdlib Python.

Part 1: A use-case scorer that classifies each process candidate into one of
four buckets (PILOT_NOW, IMPROVE_FIRST, DEPRIORITISE, DEFER) based on a
value score (1-5), an automation readiness score (1-5), and three risk flags.

Part 2: A pilot ranker that takes the PILOT_NOW candidates, applies risk
penalties to the combined score, and outputs the recommended first pilot with
a one-line rationale.

No network, no pip installs. The driver runs a synthetic portfolio of eight
candidates that covers all classification outcomes and risk edge cases.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------- Classification outcomes ----------

class Classification(Enum):
    PILOT_NOW = "PILOT_NOW"
    IMPROVE_FIRST = "IMPROVE_FIRST"
    DEPRIORITISE = "DEPRIORITISE"
    DEFER = "DEFER"


# ---------- Data shapes ----------

@dataclass
class UseCase:
    name: str
    value: int            # 1-5: business value density
    readiness: int        # 1-5: automation readiness
    # Risk flags
    regulatory: bool = False     # regulated decision or personal data (GDPR)
    blast_radius_high: bool = False  # > 1 000 affected per day
    data_not_ready: bool = False     # > 4 weeks to prepare training data


@dataclass
class ScoredCandidate:
    use_case: UseCase
    classification: Classification
    adjusted_readiness: int
    combined_score: int
    notes: list[str] = field(default_factory=list)


# ---------- Part 1: Scorer ----------

PILOT_THRESHOLD_VALUE = 3
PILOT_THRESHOLD_READINESS = 3


def score(uc: UseCase) -> ScoredCandidate:
    """Classify a use case and compute its adjusted combined score.

    The regulatory flag subtracts 1 from the effective readiness score —
    it does not block the pilot, but it lowers the ranking.
    The data_not_ready flag forces a DEFER regardless of other scores.
    The blast_radius_high flag adds a HITL constraint note.
    """
    notes: list[str] = []
    adjusted_readiness = uc.readiness

    # Risk overlay: regulatory penalty
    if uc.regulatory:
        adjusted_readiness = max(1, adjusted_readiness - 1)
        notes.append("regulatory: readiness adjusted -1 (GDPR / regulated output)")

    # Risk overlay: blast radius
    if uc.blast_radius_high:
        notes.append("blast-radius: requires human-in-the-loop gate before go-live")

    # Risk overlay: data not ready
    if uc.data_not_ready:
        notes.append("data: > 4 weeks to prepare — defer to next intake cycle")

    combined = uc.value + adjusted_readiness

    # Classification rules (applied in priority order)
    if uc.data_not_ready:
        classification = Classification.DEFER
    elif uc.value < PILOT_THRESHOLD_VALUE and adjusted_readiness < PILOT_THRESHOLD_READINESS:
        classification = Classification.DEPRIORITISE
    elif uc.value < PILOT_THRESHOLD_VALUE or adjusted_readiness < PILOT_THRESHOLD_READINESS:
        # One axis is below threshold
        if adjusted_readiness < PILOT_THRESHOLD_READINESS:
            classification = Classification.IMPROVE_FIRST
        else:
            # Value is the weak axis — business case not strong enough
            classification = Classification.DEPRIORITISE
    else:
        classification = Classification.PILOT_NOW

    return ScoredCandidate(
        use_case=uc,
        classification=classification,
        adjusted_readiness=adjusted_readiness,
        combined_score=combined,
        notes=notes,
    )


# ---------- Part 2: Pilot ranker ----------

def rank_pilots(candidates: list[ScoredCandidate]) -> list[ScoredCandidate]:
    """Return PILOT_NOW candidates ordered by combined_score descending.

    Within the same combined_score, higher value wins (lower risk to the
    business case). Ties are broken alphabetically for determinism.
    """
    pilots = [c for c in candidates if c.classification is Classification.PILOT_NOW]
    pilots.sort(key=lambda c: (-c.combined_score, -c.use_case.value, c.use_case.name))
    return pilots


# ---------- Driver ----------

SYNTHETIC_PORTFOLIO: list[UseCase] = [
    UseCase(
        name="Invoice extraction (AP team)",
        value=5,
        readiness=5,
    ),
    UseCase(
        name="Support ticket triage",
        value=4,
        readiness=4,
    ),
    UseCase(
        name="Credit-risk flag (lending)",
        value=4,
        readiness=4,
        regulatory=True,            # GDPR + regulated output -> readiness drops to 3
    ),
    UseCase(
        name="Contract clause review",
        value=4,
        readiness=3,
        blast_radius_high=False,
    ),
    UseCase(
        name="Mass customer-email personalisation",
        value=3,
        readiness=4,
        blast_radius_high=True,     # > 1 000 customers/day -> HITL gate required
    ),
    UseCase(
        name="Meeting notes summarisation",
        value=2,
        readiness=5,                # Easy to build but weak business case
    ),
    UseCase(
        name="Medical imaging pre-screening",
        value=5,
        readiness=2,
        regulatory=True,
        data_not_ready=True,        # Labelled clinical data: > 4 weeks
    ),
    UseCase(
        name="Ad-hoc analyst Q&A chatbot",
        value=2,
        readiness=2,
    ),
    UseCase(
        name="Procurement spend categorisation",
        value=4,
        readiness=2,        # Data is siloed across five ERP systems -> IMPROVE_FIRST
    ),
]


def print_table(candidates: list[ScoredCandidate]) -> None:
    header = (
        f"  {'Use case':<40} {'V':>2} {'R':>2} {'Adj-R':>5} "
        f"{'Comb':>4} {'Classification':<16} Notes"
    )
    print(header)
    print("  " + "-" * 110)
    for sc in candidates:
        uc = sc.use_case
        notes_str = "; ".join(sc.notes) if sc.notes else "-"
        print(
            f"  {uc.name:<40} {uc.value:>2} {uc.readiness:>2} "
            f"{sc.adjusted_readiness:>5} {sc.combined_score:>4} "
            f"{sc.classification.value:<16} {notes_str}"
        )


def main() -> None:
    print("=" * 80)
    print("USE-CASE INTAKE SCORER AND PILOT RANKER (Phase 11, Lesson 86)")
    print("=" * 80)
    print()

    # --- Part 1: Score every candidate ---
    print("PART 1 — FULL PORTFOLIO SCORING")
    print()
    scored: list[ScoredCandidate] = [score(uc) for uc in SYNTHETIC_PORTFOLIO]
    print_table(scored)
    print()

    # Summary counts per classification
    by_class: dict[str, list[str]] = {}
    for sc in scored:
        key = sc.classification.value
        by_class.setdefault(key, []).append(sc.use_case.name)

    for cls, names in sorted(by_class.items()):
        print(f"  {cls}: {len(names)} candidate(s)")
        for n in names:
            print(f"    - {n}")
    print()

    # --- Part 2: Rank pilots ---
    print("PART 2 — PILOT RANKING (PILOT_NOW candidates only)")
    print()
    ranked = rank_pilots(scored)

    if not ranked:
        print("  No candidates reached PILOT_NOW in this portfolio.")
    else:
        for i, sc in enumerate(ranked, 1):
            hitl = " [HITL gate required]" if sc.use_case.blast_radius_high else ""
            print(f"  #{i}  {sc.use_case.name}")
            print(f"       Combined score: {sc.combined_score}  "
                  f"(value={sc.use_case.value}, readiness adj.={sc.adjusted_readiness}){hitl}")
            if sc.notes:
                for note in sc.notes:
                    print(f"       Note: {note}")
            print()

    top = ranked[0]
    second = ranked[1] if len(ranked) > 1 else None

    print("=" * 80)
    print("HEADLINE: scoring reveals two kinds of attractive-but-not-ready candidates")
    print("-" * 80)
    print(f"  Recommended first pilot: '{top.use_case.name}'")
    print(f"  Combined score {top.combined_score} (value={top.use_case.value}, "
          f"readiness adj.={top.adjusted_readiness}) — no risk flags.")
    if second:
        print()
        print(f"  Second-ranked: '{second.use_case.name}'")
        second_reason = (
            "lower combined score after regulatory readiness penalty"
            if second.use_case.regulatory
            else "lower combined score" if second.combined_score < top.combined_score
            else "lower value score within the same combined score"
        )
        print(f"  Not recommended first because: {second_reason}.")
    print()
    print("  Two patterns that look strong but fail the overlay:")
    print("  1. HIGH VALUE + HIGH READINESS + REGULATORY FLAG")
    print("     -> readiness adjusted down; pilot is still valid but ranks lower.")
    print("  2. HIGH VALUE + HIGH READINESS + DATA NOT READY")
    print("     -> hard DEFER; no pilot budget should be committed.")
    print("  The intake is a filter, not a ranking exercise alone.")


if __name__ == "__main__":
    main()
