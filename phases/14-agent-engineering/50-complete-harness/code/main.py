"""Compose seven workbench surfaces into one framework-free readiness report.

Lesson: phases/14-agent-engineering/50-complete-harness/docs/en.md
References: Python dataclasses and mapping contracts from the standard library.
The runner is offline and reports readiness; it performs no production writes.
Run: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from typing import Mapping, Sequence


@dataclass(frozen=True)
class ScopeContract:
    allowed_files: tuple[str, ...]
    forbidden_files: tuple[str, ...] = ()

    def violations(self, changed_files: Sequence[str]) -> tuple[str, ...]:
        def match(path: str, pattern: str) -> bool:
            pattern = pattern.rstrip("/")
            return path == pattern or path.startswith(pattern + "/")

        result: list[str] = []
        for path in changed_files:
            if any(match(path, forbidden) for forbidden in self.forbidden_files):
                result.append(f"forbidden: {path}")
            elif not any(match(path, allowed) for allowed in self.allowed_files):
                result.append(f"outside scope: {path}")
        return tuple(result)


@dataclass(frozen=True)
class Feedback:
    command: str
    passed: bool
    detail: str


@dataclass(frozen=True)
class CheckEvidence:
    name: str
    passed: bool
    detail: str


@dataclass(frozen=True)
class Review:
    passed: bool
    detail: str


@dataclass(frozen=True)
class HarnessState:
    task_id: str
    status: str
    touched_files: tuple[str, ...]
    next_action: str


@dataclass(frozen=True)
class HarnessReport:
    verdict: str
    state: HarnessState
    scope_violations: tuple[str, ...]
    feedback: tuple[Feedback, ...]
    checks: tuple[CheckEvidence, ...]
    review: Review
    handoff: Mapping[str, object]

    def as_dict(self) -> dict[str, object]:
        return asdict(self)


def review_candidate(
    scope_violations: Sequence[str],
    checks: Sequence[CheckEvidence],
    feedback: Sequence[Feedback],
) -> Review:
    """An independent read-only review over all evidence categories."""

    if scope_violations:
        return Review(False, "scope violations remain")
    if not checks or not all(check.passed for check in checks):
        return Review(False, "verification is incomplete")
    if not feedback or not all(item.passed for item in feedback):
        return Review(False, "runtime feedback contains a failure")
    return Review(True, "scope, feedback, and verification evidence are ready")


class Harness:
    """A small control plane that keeps seven surfaces explicit."""

    def __init__(self, task_id: str, scope: ScopeContract, required_checks: Sequence[str], instructions: Sequence[str]):
        if not task_id.strip() or not scope.allowed_files:
            raise ValueError("task id and scope are required")
        if not required_checks or any(not name.strip() for name in required_checks):
            raise ValueError("at least one named check is required")
        if not instructions or any(not item.strip() for item in instructions):
            raise ValueError("instructions must be non-empty")
        self.task_id = task_id
        self.scope = scope
        self.required_checks = tuple(required_checks)
        self.instructions = tuple(instructions)

    def run(
        self,
        changed_files: Sequence[str],
        completed_checks: Mapping[str, bool],
        feedback: Sequence[Feedback],
        *,
        next_action_on_failure: str = "repair the first failed surface",
    ) -> HarnessReport:
        violations = self.scope.violations(changed_files)
        checks = tuple(
            CheckEvidence(
                name,
                type(completed_checks.get(name)) is bool and completed_checks.get(name) is True,
                "passed" if completed_checks.get(name) is True else "missing or failed",
            )
            for name in self.required_checks
        )
        feedback_tuple = tuple(feedback)
        review = review_candidate(violations, checks, feedback_tuple)
        ready = review.passed
        state = HarnessState(
            self.task_id,
            "ready" if ready else "blocked",
            tuple(changed_files),
            "request human approval" if ready else next_action_on_failure,
        )
        handoff = {
            "task_id": self.task_id,
            "status": state.status,
            "changed_files": list(changed_files),
            "instructions_loaded": len(self.instructions),
            "review": review.detail,
            "next_action": state.next_action,
        }
        return HarnessReport(
            "ready" if ready else "blocked",
            state,
            tuple(violations),
            feedback_tuple,
            checks,
            review,
            handoff,
        )


def main() -> None:
    harness = Harness(
        "T-501",
        ScopeContract(("src", "tests"), ("secrets",)),
        ("unit", "acceptance"),
        ("read state", "respect scope", "verify before done"),
    )
    incomplete = harness.run(
        ("src/app.py", "secrets/key.txt"),
        {"unit": True},
        (Feedback("python3 -m unittest", True, "unit tests passed"),),
    )
    complete = harness.run(
        ("src/app.py", "tests/test_app.py"),
        {"unit": True, "acceptance": True},
        (Feedback("python3 -m unittest", True, "all checks passed"),),
    )
    print(json.dumps({"incomplete": incomplete.as_dict(), "complete": complete.as_dict()}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
