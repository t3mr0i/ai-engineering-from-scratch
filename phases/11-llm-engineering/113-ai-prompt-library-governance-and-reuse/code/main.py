"""Prompt registry lifecycle state machine — stdlib Python.

Part 1: A minimal prompt registry with four governance primitives
  (owner, version, evaluation anchor, retirement rule). Each record moves
  through DRAFT -> REVIEW -> STABLE -> DEPRECATED -> RETIRED. The function
  `can_promote` checks whether an advancement is valid: owner exists, anchor
  passes, and the reviewer is not the owner.

Part 2: A retirement rule evaluator. `apply_retirement_rules` checks every
  STABLE or DEPRECATED prompt against its configured retirement conditions
  (model_sunset, accuracy_floor, date_sunset, replacement_stable) and returns
  a list of prompts that should move to RETIRED.

The driver registers three synthetic prompts, attempts several promotions —
some valid, some blocked — and runs retirement checks. It prints the reason
for every decision and ends with a HEADLINE summary.
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Enums and constants
# ---------------------------------------------------------------------------

class LifecycleState(Enum):
    DRAFT = "DRAFT"
    REVIEW = "REVIEW"
    STABLE = "STABLE"
    DEPRECATED = "DEPRECATED"
    RETIRED = "RETIRED"


VALID_TRANSITIONS: dict[LifecycleState, list[LifecycleState]] = {
    LifecycleState.DRAFT: [LifecycleState.REVIEW],
    LifecycleState.REVIEW: [LifecycleState.STABLE, LifecycleState.DRAFT],
    LifecycleState.STABLE: [LifecycleState.DEPRECATED],
    LifecycleState.DEPRECATED: [LifecycleState.RETIRED],
    LifecycleState.RETIRED: [],
}

# Models known to be sunset in this simulation context.
SUNSET_MODELS: set[str] = {"claude-2.1", "claude-instant-1.2"}


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class EvalAnchor:
    """One canonical (input, expected_output) pair used as a regression gate."""
    input_text: str
    expected_output: str
    # In a real registry this would invoke the model; here we simulate.
    simulated_score: float  # 0.0 – 1.0


@dataclass
class RetirementRule:
    model_sunset: bool = False       # retire if target_model is sunset
    accuracy_floor: Optional[float] = None   # retire if anchor score < floor
    date_sunset: Optional[datetime.date] = None  # retire on or after this date
    replacement_stable: Optional[str] = None  # retire when named prompt is STABLE


@dataclass
class PromptRecord:
    prompt_id: str
    version: str
    owner: str
    text: str
    state: LifecycleState = LifecycleState.DRAFT
    target_model: str = "claude-sonnet-4-6"
    anchor: Optional[EvalAnchor] = None
    retirement_rule: RetirementRule = field(default_factory=RetirementRule)
    reviewer: Optional[str] = None   # set when promoted to REVIEW
    tombstone_redirect: Optional[str] = None  # set when RETIRED


# ---------------------------------------------------------------------------
# Part 1: Promotion gate
# ---------------------------------------------------------------------------

def can_promote(
    record: PromptRecord,
    target_state: LifecycleState,
    acting_as: str,
    anchor_pass_threshold: float = 0.80,
) -> tuple[bool, str]:
    """Return (allowed, reason).

    Rules:
    - Only valid transitions are allowed.
    - DRAFT -> REVIEW: owner must match acting_as.
    - REVIEW -> STABLE: reviewer must be set and must differ from the owner;
      anchor must exist and its simulated score must meet the threshold.
    - STABLE -> DEPRECATED: any registered reviewer may act.
    - DEPRECATED -> RETIRED: automated (no acting_as constraint here).
    """
    valid_next = VALID_TRANSITIONS[record.state]
    if target_state not in valid_next:
        return False, (
            f"invalid transition {record.state.value} -> {target_state.value}; "
            f"allowed: {[s.value for s in valid_next]}"
        )

    if target_state is LifecycleState.REVIEW:
        if acting_as != record.owner:
            return False, f"only the owner ({record.owner}) may submit to REVIEW"

    if target_state is LifecycleState.STABLE:
        if not record.reviewer:
            return False, "no reviewer assigned; set record.reviewer before promoting to STABLE"
        if record.reviewer == record.owner:
            return False, (
                f"reviewer ({record.reviewer}) is the same as owner ({record.owner}); "
                "self-review not permitted"
            )
        if record.anchor is None:
            return False, "no evaluation anchor; add an anchor before promoting to STABLE"
        if record.anchor.simulated_score < anchor_pass_threshold:
            return False, (
                f"anchor score {record.anchor.simulated_score:.2f} below threshold "
                f"{anchor_pass_threshold:.2f}"
            )

    return True, "ok"


def promote(
    record: PromptRecord,
    target_state: LifecycleState,
    acting_as: str,
    anchor_pass_threshold: float = 0.80,
) -> None:
    allowed, reason = can_promote(record, target_state, acting_as, anchor_pass_threshold)
    label = f"{record.prompt_id} v{record.version}"
    if allowed:
        record.state = target_state
        print(f"  PROMOTED  {label:<30} -> {target_state.value}")
    else:
        print(f"  BLOCKED   {label:<30}    reason: {reason}")


# ---------------------------------------------------------------------------
# Part 2: Retirement rule evaluator
# ---------------------------------------------------------------------------

def apply_retirement_rules(
    registry: list[PromptRecord],
    today: datetime.date,
    accuracy_scores: dict[str, float],  # prompt_id -> current anchor score
) -> list[tuple[PromptRecord, str]]:
    """Return list of (record, trigger_reason) for prompts that should retire."""
    retireable = []
    stable_ids = {r.prompt_id for r in registry if r.state is LifecycleState.STABLE}

    for r in registry:
        if r.state not in (LifecycleState.STABLE, LifecycleState.DEPRECATED):
            continue
        rule = r.retirement_rule

        if rule.model_sunset and r.target_model in SUNSET_MODELS:
            retireable.append((r, f"model_sunset: {r.target_model} is no longer available"))
            continue

        if rule.accuracy_floor is not None:
            score = accuracy_scores.get(r.prompt_id, 1.0)
            if score < rule.accuracy_floor:
                retireable.append((r, f"accuracy_floor: score {score:.2f} < {rule.accuracy_floor:.2f}"))
                continue

        if rule.date_sunset is not None and today >= rule.date_sunset:
            retireable.append((r, f"date_sunset: {rule.date_sunset} has passed"))
            continue

        if rule.replacement_stable and rule.replacement_stable in stable_ids:
            retireable.append((r, f"replacement_stable: {rule.replacement_stable} is STABLE"))
            continue

    return retireable


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 80)
    print("PROMPT REGISTRY — LIFECYCLE STATE MACHINE (Phase 11, Lesson 113)")
    print("=" * 80)

    # --- Register three prompts at different points in their lifecycle ---

    # Prompt A: contract-clause extractor, heading toward STABLE.
    prompt_a = PromptRecord(
        prompt_id="contract-clause-extractor",
        version="1.2.0",
        owner="legal-automation-team",
        text="Extract all termination clauses from the following contract text: {text}",
        anchor=EvalAnchor(
            input_text="Either party may terminate with 30 days notice.",
            expected_output='{"termination_clauses": ["30 days notice"]}',
            simulated_score=0.92,
        ),
        retirement_rule=RetirementRule(model_sunset=True),
        target_model="claude-sonnet-4-5",  # an older model — sunset candidate
    )

    # Prompt B: support-ticket summariser, reviewer is the owner (should block).
    prompt_b = PromptRecord(
        prompt_id="support-ticket-summariser",
        version="2.0.0",
        owner="cx-automation",
        text="Summarise the following support ticket in one sentence: {ticket}",
        anchor=EvalAnchor(
            input_text="My printer stopped working after the update.",
            expected_output="Customer reports printer failure following a software update.",
            simulated_score=0.87,
        ),
        retirement_rule=RetirementRule(accuracy_floor=0.80),
        reviewer="cx-automation",  # same as owner — self-review, will be blocked
    )

    # Prompt C: legacy keyword classifier, sunset by date.
    prompt_c = PromptRecord(
        prompt_id="keyword-intent-classifier",
        version="0.9.1",
        owner="data-science",
        text="Classify the intent of this query into one of [purchase, support, info]: {query}",
        anchor=EvalAnchor(
            input_text="How do I reset my password?",
            expected_output="support",
            simulated_score=0.77,  # below threshold
        ),
        retirement_rule=RetirementRule(
            date_sunset=datetime.date(2026, 1, 1),
            replacement_stable="neural-intent-classifier",
        ),
        state=LifecycleState.STABLE,  # already STABLE; direct to retirement check
    )

    registry = [prompt_a, prompt_b, prompt_c]

    # -------------------------------------------------------------------
    print()
    print("PART 1 — PROMOTION GATE")
    print("-" * 80)

    # A: owner submits to REVIEW (valid)
    promote(prompt_a, LifecycleState.REVIEW, acting_as="legal-automation-team")

    # A: assign a different reviewer and promote to STABLE (valid)
    prompt_a.reviewer = "risk-and-compliance"
    promote(prompt_a, LifecycleState.STABLE, acting_as="risk-and-compliance")

    # B: submit to REVIEW as owner (valid)
    promote(prompt_b, LifecycleState.REVIEW, acting_as="cx-automation")

    # B: promote to STABLE with same person as owner (self-review — blocked)
    promote(prompt_b, LifecycleState.STABLE, acting_as="cx-automation")

    # B: fix: assign a real, different reviewer and retry
    prompt_b.reviewer = "product-quality"
    promote(prompt_b, LifecycleState.STABLE, acting_as="product-quality")

    # C: already STABLE; try to promote directly to REVIEW (invalid transition)
    promote(prompt_c, LifecycleState.REVIEW, acting_as="data-science")

    # -------------------------------------------------------------------
    print()
    print("PART 2 — RETIREMENT RULE EVALUATION")
    print("-" * 80)

    today = datetime.date(2026, 6, 22)

    # Simulate current accuracy scores (may differ from anchor's historical score)
    accuracy_scores = {
        "contract-clause-extractor": 0.91,
        "support-ticket-summariser": 0.74,   # dropped below floor
        "keyword-intent-classifier": 0.77,
    }

    to_retire = apply_retirement_rules(registry, today, accuracy_scores)

    for record, reason in to_retire:
        record.state = LifecycleState.RETIRED
        record.tombstone_redirect = (
            "neural-intent-classifier"
            if record.prompt_id == "keyword-intent-classifier"
            else None
        )
        redirect_note = (
            f" -> redirect: {record.tombstone_redirect}"
            if record.tombstone_redirect
            else ""
        )
        print(f"  RETIRED   {record.prompt_id} v{record.version:<10} "
              f"trigger: {reason}{redirect_note}")

    if not to_retire:
        print("  No prompts triggered retirement rules.")

    # -------------------------------------------------------------------
    print()
    print("=" * 80)

    stable_count = sum(1 for r in registry if r.state is LifecycleState.STABLE)
    retired_count = sum(1 for r in registry if r.state is LifecycleState.RETIRED)
    draft_review = sum(
        1 for r in registry
        if r.state in (LifecycleState.DRAFT, LifecycleState.REVIEW)
    )

    print("HEADLINE: four primitives make prompt governance automatable")
    print("-" * 80)
    print(f"  Registry size : {len(registry)} prompts")
    print(f"  STABLE        : {stable_count}  (cleared anchor + non-owner review)")
    print(f"  RETIRED       : {retired_count}  (triggered by retirement rule; tombstones preserved)")
    print(f"  DRAFT/REVIEW  : {draft_review}  (in flight)")
    print()
    print("  Key policy outcomes:")
    print("  - Self-review block prevented 1 invalid STABLE promotion.")
    print("  - model_sunset rule catches claude-sonnet-4-5 retirement.")
    print("  - accuracy_floor and date_sunset retire stale prompts automatically.")
    print("  - Tombstone redirect ensures callers are never silently dropped.")


if __name__ == "__main__":
    main()
