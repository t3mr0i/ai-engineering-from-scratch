"""
Meeting Artifact Classifier and Action Quality Scorer
======================================================

Two deterministic models of the core decisions in the meeting facilitation lesson:

Part 1 — Artifact Classifier
    Assigns each raw meeting note to one of four types:
    Decision, Action, OpenQuestion, or ParkingLot.
    Uses rule-based pattern matching so the policy is explicit and auditable.

Part 2 — Action Quality Scorer
    Evaluates an Action artifact against the four-field quality rubric
    (task description, single owner, deadline, definition of done).
    Returns a score, a pass/fail verdict, and the list of failing fields.

The driver runs a sample set of seven raw meeting items through both parts
and prints a summary showing how many are ready to publish vs blocked.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Artifact types
# ---------------------------------------------------------------------------

class ArtifactType(str, Enum):
    DECISION = "Decision"
    ACTION = "Action"
    OPEN_QUESTION = "OpenQuestion"
    PARKING_LOT = "ParkingLot"


# ---------------------------------------------------------------------------
# Part 1 — Artifact Classifier
# ---------------------------------------------------------------------------

@dataclass
class RawItem:
    text: str


@dataclass
class ClassifiedItem:
    raw: RawItem
    artifact_type: ArtifactType
    reason: str


# Signal patterns for each artifact type.
# Earlier patterns take priority (the list is evaluated in order).
_DECISION_SIGNALS = [
    r"\bwe (?:decided|agreed|chose|selected|approved|resolved|confirmed)\b",
    r"\bthe decision is\b",
    r"\bgoing with\b",
    r"\bwe will (?:use|adopt|proceed with)\b",
]

_ACTION_SIGNALS = [
    r"\b(?:will|needs? to|must|should|to-?do|action item|assigned to|owner:)\b",
    r"\bby (?:monday|tuesday|wednesday|thursday|friday|eod|eow|next week|end of|sprint|q[1-4])\b",
    r"@\w+",  # @mention implies assignment
]

_OPEN_QUESTION_SIGNALS = [
    r"\?$",                                         # ends with question mark
    r"\b(?:still unclear|tbd|to be determined|open question|unresolved|need to find out)\b",
    r"\bshould we\b",
    r"\bdo we know\b",
]

_PARKING_LOT_SIGNALS = [
    r"\b(?:park(?:ing lot)?|table this|revisit|out of scope for today|defer|follow.?up later)\b",
    r"\bnot today\b",
    r"\bnext quarter\b",
]


def _matches_any(text: str, patterns: list[str]) -> Optional[str]:
    """Return the first matching pattern string, or None."""
    low = text.lower()
    for p in patterns:
        if re.search(p, low):
            return p
    return None


def classify(item: RawItem) -> ClassifiedItem:
    """Route one raw meeting note to an artifact type."""
    checks = [
        (_DECISION_SIGNALS, ArtifactType.DECISION),
        (_ACTION_SIGNALS, ArtifactType.ACTION),
        (_OPEN_QUESTION_SIGNALS, ArtifactType.OPEN_QUESTION),
        (_PARKING_LOT_SIGNALS, ArtifactType.PARKING_LOT),
    ]
    for patterns, atype in checks:
        match = _matches_any(item.text, patterns)
        if match:
            return ClassifiedItem(raw=item, artifact_type=atype, reason=f"matched: '{match}'")
    # Default: parking lot — unclassifiable items should not silently become decisions or actions.
    return ClassifiedItem(raw=item, artifact_type=ArtifactType.PARKING_LOT, reason="no signal matched — defaulted to ParkingLot")


# ---------------------------------------------------------------------------
# Part 2 — Action Quality Scorer
# ---------------------------------------------------------------------------

@dataclass
class ActionItem:
    description: str          # The task text
    owner: str                # Supposed owner
    deadline: str             # Supposed deadline
    definition_of_done: str   # Supposed DoD


@dataclass
class QualityReport:
    item: ActionItem
    field_results: dict[str, bool] = field(default_factory=dict)
    failing_fields: list[str] = field(default_factory=list)

    @property
    def score(self) -> int:
        return sum(self.field_results.values())

    @property
    def max_score(self) -> int:
        return len(self.field_results)

    @property
    def passed(self) -> bool:
        return self.score == self.max_score


_VAGUE_DEADLINE_PATTERN = re.compile(r"\b(asap|soon|tbd|later|eventually|when possible)\b", re.I)
_VAGUE_OWNER_PATTERN = re.compile(r"\b(the team|tbd|everyone|whoever|we|us)\b", re.I)
_VAGUE_DESCRIPTION_PATTERN = re.compile(r"^\s*[\w\s]{1,20}\s*$")  # very short noun phrases


def _check_description(text: str) -> bool:
    """Pass: contains a verb and is longer than a bare noun phrase."""
    has_verb = bool(re.search(r"\b(update|send|review|create|write|schedule|confirm|deliver|build|fix|complete|finalize|share|prepare|present|draft)\b", text, re.I))
    long_enough = len(text.split()) >= 5
    return has_verb and long_enough


def _check_owner(owner: str) -> bool:
    """Pass: single person name, not a group or TBD."""
    if not owner or not owner.strip():
        return False
    if _VAGUE_OWNER_PATTERN.search(owner):
        return False
    # Reject if it looks like multiple names (contains comma or ' and ')
    if "," in owner or re.search(r"\band\b", owner, re.I):
        return False
    return True


def _check_deadline(deadline: str) -> bool:
    """Pass: specific date or sprint, not vague."""
    if not deadline or not deadline.strip():
        return False
    if _VAGUE_DEADLINE_PATTERN.search(deadline):
        return False
    return True


def _check_dod(dod: str) -> bool:
    """Pass: non-empty and not just a single vague word."""
    if not dod or not dod.strip():
        return False
    return len(dod.split()) >= 3


def score_action(item: ActionItem) -> QualityReport:
    """Score an action item against the four-field quality rubric."""
    checks = {
        "description": _check_description(item.description),
        "single_owner": _check_owner(item.owner),
        "deadline": _check_deadline(item.deadline),
        "definition_of_done": _check_dod(item.definition_of_done),
    }
    failing = [k for k, v in checks.items() if not v]
    return QualityReport(item=item, field_results=checks, failing_fields=failing)


# ---------------------------------------------------------------------------
# Sample data and driver
# ---------------------------------------------------------------------------

SAMPLE_RAW_ITEMS = [
    RawItem("We decided to migrate the reporting database to PostgreSQL by end of Q3."),
    RawItem("Alex will update the pricing deck to reflect Q3 numbers by Friday."),
    RawItem("Do we know if the legal team has reviewed the DPA?"),
    RawItem("We should revisit the mobile roadmap — park this for next quarter."),
    RawItem("The team needs to handle the security review somehow soon."),
    RawItem("We agreed the new onboarding flow will go live in the June 30 release."),
    RawItem("There's a question about whether we should use Kafka or RabbitMQ — still unresolved."),
]

SAMPLE_ACTIONS = [
    ActionItem(
        description="Update the pricing deck to reflect Q3 actuals and send to sales leadership",
        owner="Alex Mueller",
        deadline="2026-06-27",
        definition_of_done="Sales lead confirms receipt and deck is in SharePoint",
    ),
    ActionItem(
        description="Security review",        # vague noun phrase, no verb
        owner="the team",                     # group owner
        deadline="asap",                      # vague
        definition_of_done="done",            # too short
    ),
    ActionItem(
        description="Schedule kick-off call with the client and share agenda beforehand",
        owner="Priya Sharma",
        deadline="Sprint 24",
        definition_of_done="Calendar invite accepted and agenda doc linked in Slack",
    ),
    ActionItem(
        description="Write architecture decision record for the Kafka vs RabbitMQ choice",
        owner="Jonas Weber, Mia Becker",      # multiple owners
        deadline="2026-07-04",
        definition_of_done="ADR merged to main branch and reviewed by one senior engineer",
    ),
]


def main() -> None:
    print("=" * 70)
    print("PART 1 — ARTIFACT CLASSIFIER")
    print("=" * 70)

    type_counts: dict[ArtifactType, int] = {t: 0 for t in ArtifactType}
    for item in SAMPLE_RAW_ITEMS:
        result = classify(item)
        type_counts[result.artifact_type] += 1
        print(f"\n[{result.artifact_type.value}]")
        print(f"  Text   : {result.raw.text}")
        print(f"  Reason : {result.reason}")

    print("\n--- Classification summary ---")
    for atype, count in type_counts.items():
        print(f"  {atype.value:<14}: {count}")

    print()
    print("=" * 70)
    print("PART 2 — ACTION QUALITY SCORER")
    print("=" * 70)

    passed_count = 0
    blocked_count = 0

    for action in SAMPLE_ACTIONS:
        report = score_action(action)
        verdict = "PASS" if report.passed else "BLOCK"
        if report.passed:
            passed_count += 1
        else:
            blocked_count += 1

        print(f"\n[{verdict}] {action.description[:60]!r}")
        print(f"  Score  : {report.score}/{report.max_score}")
        if report.failing_fields:
            print(f"  Failed : {', '.join(report.failing_fields)}")
        else:
            print("  All fields pass.")

    print()
    print("=" * 70)
    total = passed_count + blocked_count
    print(
        f"HEADLINE: {passed_count}/{total} action items ready to publish; "
        f"{blocked_count}/{total} blocked for rework."
    )
    print("=" * 70)


if __name__ == "__main__":
    main()
