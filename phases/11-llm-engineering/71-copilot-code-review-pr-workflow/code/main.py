"""Copilot code-review & PR-workflow decision models — stdlib Python.

Two deterministic policies, made runnable:

1. reviewability(): given a PR's properties, return REVIEWABLE / NEEDS_SPLIT /
   NEEDS_CONTEXT with the failing criterion named. Encodes the contract:
   bounded + intent stated + verification shipped + issue linked.
2. triage(): sort automated review comments into fix / wontfix / false_positive
   using a confidence-and-category rule, so a disposition policy beats both
   "resolve everything" and "ignore the bot".

No model, no network.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------- Part 1: is this PR reviewable? ----------

class Reviewability(Enum):
    REVIEWABLE = "REVIEWABLE"
    NEEDS_SPLIT = "NEEDS SPLIT"
    NEEDS_CONTEXT = "NEEDS CONTEXT"


@dataclass
class PR:
    files_changed: int
    logical_changes: int   # distinct unrelated concerns in the diff
    has_intent: bool       # body says what+why, not a diff restatement
    has_tests: bool        # ships verification (test / repro / benchmark)
    links_issue: bool      # closing keyword present


def reviewability(pr: PR) -> tuple[Reviewability, str]:
    # Bounding comes first: an unbounded diff can't be meaningfully reviewed
    # no matter how good its body is.
    if pr.logical_changes > 1:
        return Reviewability.NEEDS_SPLIT, (
            f"{pr.logical_changes} unrelated concerns in one diff — split them")
    if pr.files_changed > 20:
        return Reviewability.NEEDS_SPLIT, "too large to hold one mental model"
    if not pr.has_intent:
        return Reviewability.NEEDS_CONTEXT, "body restates the diff; state what+why"
    if not pr.has_tests:
        return Reviewability.NEEDS_CONTEXT, "no shipped verification"
    if not pr.links_issue:
        return Reviewability.NEEDS_CONTEXT, "no linked issue — intent not traceable"
    return Reviewability.REVIEWABLE, "bounded + intent + verification + issue"


# ---------- Part 2: triage automated review comments ----------

class Disposition(Enum):
    FIX = "fix"
    WONTFIX = "wontfix"
    FALSE_POSITIVE = "false_positive"


@dataclass
class Comment:
    category: str   # security | bug | style | nit
    confidence: float
    matches_repo_policy: bool  # the flagged thing is actually allowed here


def triage(c: Comment) -> tuple[Disposition, str]:
    # A flag against something the repo explicitly permits is a false positive,
    # regardless of confidence — the fix is the instructions file, not the code.
    if c.matches_repo_policy:
        return Disposition.FALSE_POSITIVE, "flags an allowed pattern; tune copilot-instructions.md"
    # High-signal categories: always act.
    if c.category in ("security", "bug") and c.confidence >= 0.6:
        return Disposition.FIX, f"{c.category} with confidence {c.confidence:.2f}"
    # Low-value style/nit below the bar: decline explicitly, don't ignore.
    if c.category in ("style", "nit") and c.confidence < 0.8:
        return Disposition.WONTFIX, "low-value nit below the attention bar"
    return Disposition.FIX, "actionable by default"


# ---------- Driver ----------

def main() -> None:
    print("=" * 78)
    print("PART 1 — reviewability: what makes a PR reviewable")
    print("=" * 78)
    prs = [
        ("redis session store fix, tested, linked",
         PR(files_changed=4, logical_changes=1, has_intent=True,
            has_tests=True, links_issue=True)),
        ("refactor + bugfix + dep bump in one",
         PR(files_changed=12, logical_changes=3, has_intent=True,
            has_tests=True, links_issue=True)),
        ("coding-agent PR, body says 'implements the feature'",
         PR(files_changed=9, logical_changes=1, has_intent=False,
            has_tests=True, links_issue=False)),
        ("green but ships no test",
         PR(files_changed=2, logical_changes=1, has_intent=True,
            has_tests=False, links_issue=True)),
    ]
    for label, pr in prs:
        verdict, why = reviewability(pr)
        print(f"  - {label}")
        print(f"      -> {verdict.value:<14} ({why})")

    print()
    print("=" * 78)
    print("PART 2 — triage: disposition beats 'resolve everything' / 'ignore bot'")
    print("=" * 78)
    comments = [
        ("unhandled exception on parse failure",
         Comment(category="bug", confidence=0.9, matches_repo_policy=False)),
        ("possible SQL string interpolation",
         Comment(category="security", confidence=0.75, matches_repo_policy=False)),
        ("missing docstring on private helper",
         Comment(category="nit", confidence=0.5, matches_repo_policy=True)),
        ("prefer single-quotes (style)",
         Comment(category="style", confidence=0.4, matches_repo_policy=False)),
    ]
    for label, c in comments:
        disp, why = triage(c)
        print(f"  - {label}")
        print(f"      -> {disp.value:<14} ({why})")

    print()
    print("-" * 78)
    print("HEADLINE: bound the PR, state intent, ship the test, link the issue —")
    print("then any reviewer adds value. Give every bot comment a disposition;")
    print("the false positive is fixed in the instructions file, not the code.")


if __name__ == "__main__":
    main()
