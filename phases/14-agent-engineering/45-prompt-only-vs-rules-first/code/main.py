"""Deterministic prompt-only versus rules-first comparison.

Lesson: phases/14-agent-engineering/45-prompt-only-vs-rules-first/docs/en.md
References: Python dataclasses and JSON standard-library contracts.
The fixture workers are offline so the acceptance boundary stays testable.
Run: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from typing import Mapping


@dataclass(frozen=True)
class Task:
    """The smallest useful task contract for a scoped feature."""

    goal: str
    allowed_files: tuple[str, ...]
    required_checks: tuple[str, ...]

    def __post_init__(self) -> None:
        if not self.goal.strip():
            raise ValueError("goal must not be empty")
        if not self.allowed_files:
            raise ValueError("at least one allowed file is required")
        if not self.required_checks:
            raise ValueError("at least one required check is required")


@dataclass(frozen=True)
class Attempt:
    """A worker's output, kept separate from the worker's prose."""

    changed_files: tuple[str, ...]
    artifact: Mapping[str, str]
    completed_checks: tuple[str, ...]
    note: str = ""


@dataclass(frozen=True)
class AttemptVerdict:
    passed: bool
    violations: tuple[str, ...]


def validate_attempt(task: Task, attempt: Attempt) -> AttemptVerdict:
    """Validate scope and evidence without trusting the worker's note."""

    violations: list[str] = []
    allowed = set(task.allowed_files)
    changed = set(attempt.changed_files)
    outside = sorted(changed - allowed)
    if outside:
        violations.append("out-of-scope files: " + ", ".join(outside))

    missing_checks = [check for check in task.required_checks if check not in attempt.completed_checks]
    if missing_checks:
        violations.append("missing checks: " + ", ".join(missing_checks))

    missing_artifacts = sorted(path for path in changed if path not in attempt.artifact)
    if missing_artifacts:
        violations.append("missing artifact entries: " + ", ".join(missing_artifacts))

    return AttemptVerdict(not violations, tuple(violations))


def prompt_only_attempt(task: Task) -> Attempt:
    """A deliberately overconfident baseline worker."""

    del task
    return Attempt(
        changed_files=("src/validator.py", "tests/test_validator.py", "notes.txt"),
        artifact={"src/validator.py": "def validate(value): return bool(value)"},
        completed_checks=("unit",),
        note="looks good; ready to merge",
    )


def rules_first_attempt(task: Task) -> Attempt:
    """A deterministic worker that obeys the supplied contract."""

    return Attempt(
        changed_files=task.allowed_files,
        artifact={path: "implemented fixture" for path in task.allowed_files},
        completed_checks=task.required_checks,
        note="scope and acceptance recorded before completion",
    )


def compare(task: Task) -> dict[str, object]:
    """Run both attempts through the same independent validator."""

    prompt = prompt_only_attempt(task)
    rules = rules_first_attempt(task)
    prompt_verdict = validate_attempt(task, prompt)
    rules_verdict = validate_attempt(task, rules)
    return {
        "goal": task.goal,
        "prompt_only": {
            "attempt": asdict(prompt),
            "verdict": asdict(prompt_verdict),
        },
        "rules_first": {
            "attempt": asdict(rules),
            "verdict": asdict(rules_verdict),
        },
    }


def main() -> None:
    task = Task(
        goal="add input validation and prove it",
        allowed_files=("src/validator.py", "tests/test_validator.py"),
        required_checks=("unit", "acceptance"),
    )
    report = compare(task)
    print(json.dumps(report, indent=2, sort_keys=True))
    print("prompt-only verdict:", report["prompt_only"]["verdict"]["passed"])
    print("rules-first verdict:", report["rules_first"]["verdict"]["passed"])


if __name__ == "__main__":
    main()
