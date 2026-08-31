"""Executable lab for ../docs/en.md: GitHub Copilot's daily workflow.
Builds a bounded project brief, routes it to a Copilot surface, and gates merge.
Sources: official GitHub Copilot agent-mode, coding-agent, and review docs.
Stdlib-only and offline: no project data is sent to an external service.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import PurePosixPath


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


# ---------- Part 3: project ticket -> bounded Copilot brief ----------

@dataclass(frozen=True)
class ProjectTask:
    """Sanitized input contract for the project-transfer lab."""

    title: str
    goal: str
    allowed_files: tuple[str, ...]
    acceptance_checks: tuple[str, ...]
    forbidden_changes: tuple[str, ...] = ()
    data_classification: str = "internal"


@dataclass(frozen=True)
class CopilotBrief:
    rung: Rung
    routing_reason: str
    prompt: str
    review_gate: tuple[str, ...]


def _validate_project_task(task: ProjectTask) -> None:
    if not task.title.strip() or not task.goal.strip():
        raise ValueError("title and goal must be non-empty")
    if not task.allowed_files:
        raise ValueError("allowed_files must name at least one repository path")
    if not task.acceptance_checks:
        raise ValueError("acceptance_checks must contain observable evidence")
    if task.data_classification not in {"public", "internal", "restricted"}:
        raise ValueError("data_classification must be public, internal, or restricted")
    if task.data_classification == "restricted":
        raise ValueError("restricted project material must be sanitized before assistant use")

    for raw_path in task.allowed_files:
        normalized = raw_path.replace("\\", "/")
        path = PurePosixPath(normalized)
        if not normalized.strip() or path.is_absolute() or ".." in path.parts:
            raise ValueError(f"allowed file must be a relative in-repository path: {raw_path!r}")


def build_copilot_brief(task: ProjectTask) -> CopilotBrief:
    """Turn a sanitized project task into a bounded, reviewable prompt."""
    _validate_project_task(task)

    routing_text = task.goal
    if len(task.allowed_files) > 1:
        routing_text += " across these files"
    if any("test" in check.lower() for check in task.acceptance_checks):
        routing_text += " and run the tests"
    rung, reason = route_task(routing_text)

    forbidden = task.forbidden_changes or (
        "Do not change public interfaces outside the named files",
        "Do not weaken or delete existing tests",
        "Do not add dependencies, credentials, or unrelated cleanup",
    )
    sections = [
        f"TASK: {task.title.strip()}",
        f"GOAL: {task.goal.strip()}",
        "ALLOWED FILES:\n" + "\n".join(f"- {path}" for path in task.allowed_files),
        "FORBIDDEN CHANGES:\n" + "\n".join(f"- {item}" for item in forbidden),
        "ACCEPTANCE CHECKS:\n" + "\n".join(f"- {item}" for item in task.acceptance_checks),
        (
            "OUTPUT CONTRACT:\n"
            "- Propose a short plan before editing.\n"
            "- Stop if the change requires a file outside ALLOWED FILES.\n"
            "- Return the final diff summary, commands run, observed results, and residual risks."
        ),
    ]
    review_gate = (
        "Every changed line traces to the task goal",
        "No secret, personal data, or restricted project detail entered the prompt or diff",
        "Test changes preserve or strengthen assertions",
        "A human reads the diff and owns the merge decision",
    )
    return CopilotBrief(
        rung=rung,
        routing_reason=reason,
        prompt="\n\n".join(sections),
        review_gate=review_gate,
    )


def example_project_task() -> ProjectTask:
    """Sanitized LCAG-style fallback when no real project ticket is available."""
    return ProjectTask(
        title="Make booking synchronization retries idempotent",
        goal=(
            "Prevent a repeated delivery event from creating a duplicate status update "
            "while preserving the service's public API and current error semantics"
        ),
        allowed_files=(
            "src/booking_sync.py",
            "tests/test_booking_sync.py",
        ),
        acceptance_checks=(
            "Run python3 -m unittest discover tests -v",
            "A repeated event id produces one status update",
            "A new event id still follows the existing success path",
            "Malformed input keeps the documented validation error",
        ),
        forbidden_changes=(
            "Do not change the public handler signature",
            "Do not weaken existing assertions",
            "Do not add a dependency or log booking identifiers",
        ),
        data_classification="internal",
    )


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
    print("=" * 78)
    print("PART 3 — project transfer: sanitized ticket -> bounded prompt")
    print("=" * 78)
    brief = build_copilot_brief(example_project_task())
    print(f"  selected rung: {brief.rung.value}")
    print(f"  routing reason: {brief.routing_reason}")
    print()
    print(brief.prompt)
    print()
    print("HUMAN REVIEW GATE:")
    for item in brief.review_gate:
        print(f"- {item}")

    print()
    print("-" * 78)
    print("HEADLINE: the rung sets the blast radius; the verifier owns the merge.")
    print("Two of five green-test diffs above are NOT merge-ready. The project brief")
    print("bounds the work; the captured evidence and human diff review decide merge.")


if __name__ == "__main__":
    main()
