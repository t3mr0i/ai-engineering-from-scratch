#!/usr/bin/env python3
"""Require a reusable output artifact for every non-reference lesson."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PHASES = ROOT / "phases"
TYPE_RE = re.compile(r"^\*\*Type:\*\*\s*(Learn|Build|Reference)\s*$", re.MULTILINE)
MIN_ARTIFACT_BYTES = 80


@dataclass(frozen=True)
class OutputIssue:
    rule: str
    lesson: str
    message: str


def reusable_files(lesson: Path) -> list[Path]:
    output_dir = lesson / "outputs"
    if not output_dir.is_dir():
        return []
    return sorted(
        path for path in output_dir.rglob("*")
        if path.is_file() and not path.name.startswith(".") and path.stat().st_size >= MIN_ARTIFACT_BYTES
    )


def validate_lesson(lesson: Path) -> list[OutputIssue]:
    rel = lesson.relative_to(ROOT).as_posix()
    doc = (lesson / "docs" / "en.md").read_text(encoding="utf-8")
    match = TYPE_RE.search(doc)
    if not match:
        return [OutputIssue("O001", rel, "missing canonical Type field")]
    lesson_type = match.group(1)
    if lesson_type == "Reference":
        return []
    if not reusable_files(lesson):
        return [
            OutputIssue(
                "O002",
                rel,
                f"{lesson_type} lesson requires a non-empty reusable file in outputs/",
            )
        ]
    return []


def iter_lessons() -> list[Path]:
    return sorted(path.parent.parent for path in PHASES.glob("*/*/docs/en.md"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    lessons = iter_lessons()
    issues = [issue for lesson in lessons for issue in validate_lesson(lesson)]
    if args.json:
        json.dump({"lessons_checked": len(lessons), "issues": [asdict(issue) for issue in issues]}, sys.stdout, indent=2)
        sys.stdout.write("\n")
    else:
        print(f"check_output_contract.py — {len(lessons)} lesson(s), {len(issues)} issue(s)")
        for issue in issues:
            print(f"  [{issue.rule}] {issue.lesson}: {issue.message}")
    return 1 if issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
