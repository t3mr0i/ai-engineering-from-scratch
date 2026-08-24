#!/usr/bin/env python3
"""Validate the documented lesson contract across the whole curriculum.

This is stricter than audit_lessons.py: the audit protects basic filesystem
invariants, while this check enforces the learner-facing metadata contract.
It is stdlib-only and reports every violation in one run.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PHASES = ROOT / "phases"
VALID_TYPES = {"Learn", "Build", "Reference"}
LANGUAGE_BY_SUFFIX = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".rs": "Rust",
    ".jl": "Julia",
}
FIELD_RE = re.compile(r"^\*\*(Type|Languages|Prerequisites|Time):\*\*\s*(.*?)\s*$", re.MULTILINE)
OBJECTIVES_RE = re.compile(
    r"^## Learning Objectives\s*$\n(?P<body>.*?)(?=^##\s|\Z)",
    re.MULTILINE | re.DOTALL,
)
LESSON_RE = re.compile(r"^[0-9]{2,3}-[a-z0-9][a-z0-9-]*[a-z0-9]$")
PHASE_RE = re.compile(r"^[0-9]{2}-[a-z0-9][a-z0-9-]*[a-z0-9]$")


@dataclass(frozen=True)
class ContractIssue:
    rule: str
    lesson: str
    message: str


def parse_fields(text: str) -> dict[str, str]:
    """Return the four canonical metadata fields found in a lesson document."""

    return {name: value.strip() for name, value in FIELD_RE.findall(text)}


def objective_count(text: str) -> int:
    """Count top-level bullets in the canonical objectives section."""

    match = OBJECTIVES_RE.search(text)
    return len(re.findall(r"^-\s+\S", match.group("body"), re.MULTILINE)) if match else 0


def entrypoint_languages(code_dir: Path) -> list[str]:
    """Derive canonical language names from code/main.* entry points."""

    languages = {
        LANGUAGE_BY_SUFFIX[path.suffix]
        for path in code_dir.glob("main.*")
        if path.is_file() and path.suffix in LANGUAGE_BY_SUFFIX
    }
    order = {name: index for index, name in enumerate(LANGUAGE_BY_SUFFIX.values())}
    return sorted(languages, key=order.__getitem__)


def declared_languages(value: str) -> list[str]:
    if value == "None":
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


def validate_lesson(lesson: Path) -> list[ContractIssue]:
    doc = lesson / "docs" / "en.md"
    text = doc.read_text(encoding="utf-8")
    fields = parse_fields(text)
    rel = lesson.relative_to(ROOT).as_posix()
    issues: list[ContractIssue] = []

    for field in ("Type", "Languages", "Prerequisites", "Time"):
        if not fields.get(field):
            issues.append(ContractIssue("C001", rel, f"missing or empty {field} field"))

    lesson_type = fields.get("Type", "")
    if lesson_type and lesson_type not in VALID_TYPES:
        issues.append(
            ContractIssue(
                "C002",
                rel,
                f"Type must be one of {sorted(VALID_TYPES)}, got {lesson_type!r}",
            )
        )

    count = objective_count(text)
    if not 4 <= count <= 6:
        issues.append(ContractIssue("C003", rel, f"Learning Objectives must contain 4..6 bullets, got {count}"))

    actual = entrypoint_languages(lesson / "code")
    declared = declared_languages(fields.get("Languages", ""))
    if declared != actual:
        issues.append(
            ContractIssue(
                "C004",
                rel,
                f"Languages must match code/main.*: declared {declared!r}, actual {actual!r}",
            )
        )

    if lesson_type == "Build" and not actual:
        issues.append(ContractIssue("C005", rel, "Build lesson requires a supported code/main.* entry point"))

    return issues


def iter_lessons() -> list[Path]:
    return [
        lesson
        for phase in sorted(PHASES.iterdir())
        if phase.is_dir() and PHASE_RE.fullmatch(phase.name)
        for lesson in sorted(phase.iterdir())
        if lesson.is_dir() and LESSON_RE.fullmatch(lesson.name) and (lesson / "docs" / "en.md").is_file()
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit machine-readable output")
    args = parser.parse_args(argv)

    lessons = iter_lessons()
    issues = [issue for lesson in lessons for issue in validate_lesson(lesson)]
    if args.json:
        json.dump(
            {"lessons_checked": len(lessons), "issues": [asdict(issue) for issue in issues]},
            sys.stdout,
            indent=2,
        )
        sys.stdout.write("\n")
    else:
        print(f"check_lesson_contract.py — {len(lessons)} lesson(s), {len(issues)} issue(s)")
        for issue in issues:
            print(f"  [{issue.rule}] {issue.lesson}: {issue.message}")
    return 1 if issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
