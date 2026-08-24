#!/usr/bin/env python3
"""Enforce quizzes, exercises, reference solutions, and lesson-code tests."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PHASES = ROOT / "phases"
QUESTION_KEYS = {"stage", "question", "options", "correct", "explanation"}
EXPECTED_STAGES = Counter({"pre": 1, "check": 3, "post": 2})
SECTION_RE = re.compile(r"^## (?P<name>Exercises|Reference Solution)\s*$\n(?P<body>.*?)(?=^##\s|\Z)", re.MULTILINE | re.DOTALL)


@dataclass(frozen=True)
class AssessmentIssue:
    rule: str
    lesson: str
    message: str


def test_case_count(tests_dir: Path) -> int:
    """Count stdlib-runner test declarations across supported languages."""

    count = 0
    if not tests_dir.is_dir():
        return 0
    for path in tests_dir.iterdir():
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if path.suffix == ".py":
            count += len(re.findall(r"^\s*def test_", text, re.MULTILINE))
        elif path.suffix in {".ts", ".js", ".mjs"}:
            count += len(re.findall(r"\b(?:test|it)\s*\(", text))
        elif path.suffix == ".rs":
            count += text.count("#[test]")
        elif path.suffix == ".jl":
            count += len(re.findall(r"@test\b", text))
    return count


def section_body(text: str, name: str) -> str | None:
    for match in SECTION_RE.finditer(text):
        if match.group("name") == name:
            return match.group("body").strip()
    return None


def quiz_issues(lesson: Path, rel: str) -> list[AssessmentIssue]:
    quiz_path = lesson / "quiz.json"
    if not quiz_path.is_file():
        return [AssessmentIssue("A001", rel, "missing quiz.json")]
    try:
        data = json.loads(quiz_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        return [AssessmentIssue("A001", rel, f"invalid quiz.json: {error}")]
    if not isinstance(data, dict) or not isinstance(data.get("questions"), list):
        return [AssessmentIssue("A001", rel, "quiz must be an object with questions[]")]

    issues: list[AssessmentIssue] = []
    questions = data["questions"]
    if data.get("lesson") != lesson.name:
        issues.append(AssessmentIssue("A002", rel, f"quiz lesson must equal {lesson.name!r}"))
    if not isinstance(data.get("title"), str) or not data["title"].strip():
        issues.append(AssessmentIssue("A002", rel, "quiz title must be non-empty"))
    if len(questions) != 6:
        issues.append(AssessmentIssue("A003", rel, f"quiz must contain exactly 6 questions, got {len(questions)}"))

    stages: Counter[str] = Counter()
    for index, question in enumerate(questions):
        if not isinstance(question, dict) or set(question) != QUESTION_KEYS:
            issues.append(AssessmentIssue("A004", rel, f"question[{index}] must have exactly {sorted(QUESTION_KEYS)}"))
            continue
        stages[question["stage"]] += 1
        options = question["options"]
        if not isinstance(question["question"], str) or not question["question"].strip():
            issues.append(AssessmentIssue("A004", rel, f"question[{index}] text is empty"))
        if not isinstance(options, list) or len(options) != 4 or len({str(option).strip() for option in options}) != 4:
            issues.append(AssessmentIssue("A004", rel, f"question[{index}] must have 4 distinct options"))
        elif not isinstance(question["correct"], int) or not 0 <= question["correct"] < 4:
            issues.append(AssessmentIssue("A004", rel, f"question[{index}] correct index is invalid"))
        if not isinstance(question["explanation"], str) or not question["explanation"].strip():
            issues.append(AssessmentIssue("A004", rel, f"question[{index}] explanation is empty"))
    if stages != EXPECTED_STAGES:
        issues.append(AssessmentIssue("A005", rel, f"quiz stages must be {dict(EXPECTED_STAGES)}, got {dict(stages)}"))
    return issues


def validate_lesson(lesson: Path) -> list[AssessmentIssue]:
    rel = lesson.relative_to(ROOT).as_posix()
    doc = (lesson / "docs" / "en.md").read_text(encoding="utf-8")
    issues = quiz_issues(lesson, rel)

    exercises = section_body(doc, "Exercises")
    exercise_count = len(re.findall(r"^(?:[-*]|\d+\.)\s+\S", exercises or "", re.MULTILINE))
    if exercise_count < 3:
        issues.append(AssessmentIssue("A006", rel, f"Exercises must contain at least 3 tasks, got {exercise_count}"))

    solution = section_body(doc, "Reference Solution")
    if solution is None or len(solution.split()) < 20:
        issues.append(AssessmentIssue("A007", rel, "Reference Solution must contain at least 20 words"))

    has_entrypoint = any(path.is_file() for path in (lesson / "code").glob("main.*"))
    if has_entrypoint:
        count = test_case_count(lesson / "code" / "tests")
        if count < 5:
            issues.append(AssessmentIssue("A008", rel, f"code/tests must declare at least 5 tests, got {count}"))
    return issues


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
        print(f"check_assessments.py — {len(lessons)} lesson(s), {len(issues)} issue(s)")
        for issue in issues:
            print(f"  [{issue.rule}] {issue.lesson}: {issue.message}")
    return 1 if issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
