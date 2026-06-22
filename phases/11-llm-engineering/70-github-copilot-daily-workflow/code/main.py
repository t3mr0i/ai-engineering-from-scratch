"""GitHub Copilot daily-workflow decision models — stdlib Python.

Two deterministic decision policies, made runnable:

1. route_task(): map a task description to the right rung of the Copilot
   capability ladder (completion -> chat -> edits -> agent mode -> coding agent).
2. acceptance(): given a proposed diff and a test result, decide
   MERGE / REQUEST_CHANGES / BLOCK. Encodes the rule from the lesson:
   "green tests are necessary, not sufficient" — a diff whose only change to
   a test is a weakened assertion is BLOCKED even when the suite passes.

No model, no network. The point is to make the decision policy explicit.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------- Part 1: task -> ladder rung ----------

class Rung(Enum):
    COMPLETION = "completion (ghost text)"
    CHAT = "copilot chat"
    EDITS = "edits (multi-file)"
    AGENT = "agent mode (in-IDE)"
    CODING_AGENT = "coding agent (server-side PR)"


# Signals are checked from most-autonomous downward; first match wins.
def route_task(task: str) -> tuple[Rung, str]:
    t = task.lower()

    # Server-side: explicitly delegated, no human at the keyboard.
    if any(k in t for k in ("assign the issue", "open a pr", "background", "while i'm out")):
        return Rung.CODING_AGENT, "delegated end-to-end; produces a draft PR to review later"

    # Agent mode: cross-repo work that needs running tests / iterating.
    if any(k in t for k in ("migrate", "across", "refactor the whole", "add tests and", "run the tests")):
        return Rung.AGENT, "multi-file + needs a run/verify loop; agent plans and iterates"

    # Edits: a coordinated change over a known, small set of files.
    if any(k in t for k in ("rename", "update both", "change the signature", "two files", "these files")):
        return Rung.EDITS, "coordinated change over a pinned file set; review the whole diff"

    # Chat: understanding / explanation, read-default.
    if any(k in t for k in ("explain", "why does", "what does", "how do i", "review")):
        return Rung.CHAT, "read-only Q&A; you apply edits manually"

    # Default: a localized edit is a completion.
    return Rung.COMPLETION, "localized single-hunk edit; accept the line"


# ---------- Part 2: diff + tests -> merge decision ----------

class Decision(Enum):
    MERGE = "MERGE"
    REQUEST_CHANGES = "REQUEST CHANGES"
    BLOCK = "BLOCK"


@dataclass
class Diff:
    files_changed: int
    touches_tests: bool
    weakened_assertion: bool   # a test assertion was loosened/removed
    has_secret_literal: bool   # an inline credential appeared
    unreviewed_by_human: bool  # nobody read the diff yet


def acceptance(diff: Diff, tests_pass: bool) -> tuple[Decision, str]:
    """Green tests are necessary, not sufficient."""
    # Hard blocks first — these override a green suite.
    if diff.has_secret_literal:
        return Decision.BLOCK, "inline secret literal in the diff"
    if diff.touches_tests and diff.weakened_assertion:
        return Decision.BLOCK, "test assertion weakened to pass — reward hacking (P14.38)"
    if not tests_pass:
        return Decision.REQUEST_CHANGES, "test suite is red"
    if diff.unreviewed_by_human:
        return Decision.REQUEST_CHANGES, "green, but no human has read the diff yet"
    return Decision.MERGE, "green tests + human-reviewed diff"


# ---------- Driver ----------

def main() -> None:
    print("=" * 78)
    print("PART 1 — task router: which rung of the Copilot ladder?")
    print("=" * 78)
    tasks = [
        "add a null check before this dereference",
        "explain why this function returns None on empty input",
        "rename getUser to fetchUser and update both call sites",
        "migrate the auth module to the new token API and run the tests",
        "assign the issue to Copilot and open a PR while I'm out",
    ]
    for task in tasks:
        rung, why = route_task(task)
        print(f"  - {task}")
        print(f"      -> {rung.value:<32} ({why})")

    print()
    print("=" * 78)
    print("PART 2 — acceptance: green tests are necessary, not sufficient")
    print("=" * 78)
    cases = [
        ("clean refactor, reviewed",
         Diff(files_changed=3, touches_tests=False, weakened_assertion=False,
              has_secret_literal=False, unreviewed_by_human=False), True),
        ("green, but nobody read it",
         Diff(files_changed=5, touches_tests=False, weakened_assertion=False,
              has_secret_literal=False, unreviewed_by_human=True), True),
        ("tests pass — because the assertion was loosened",
         Diff(files_changed=2, touches_tests=True, weakened_assertion=True,
              has_secret_literal=False, unreviewed_by_human=True), True),
        ("agent inlined an API key",
         Diff(files_changed=1, touches_tests=False, weakened_assertion=False,
              has_secret_literal=True, unreviewed_by_human=False), True),
        ("red suite",
         Diff(files_changed=4, touches_tests=False, weakened_assertion=False,
              has_secret_literal=False, unreviewed_by_human=True), False),
    ]
    for label, diff, passes in cases:
        decision, reason = acceptance(diff, passes)
        flag = "tests:GREEN" if passes else "tests:RED  "
        print(f"  [{flag}] {label}")
        print(f"      -> {decision.value:<16} ({reason})")

    print()
    print("-" * 78)
    print("HEADLINE: the rung sets the blast radius; the verifier owns the merge.")
    print("Two of five green-test diffs above are NOT merge-ready. Reading the")
    print("diff — not the test color — is the step you cannot delegate.")


if __name__ == "__main__":
    main()
