"""Regression tests for scripts/lesson_run.py discovery."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "lesson_run", ROOT / "scripts" / "lesson_run.py"
)
assert SPEC and SPEC.loader
lesson_run = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = lesson_run
SPEC.loader.exec_module(lesson_run)


class LessonDirectoryPatternTests(unittest.TestCase):
    def test_accepts_two_digit_lesson_number(self) -> None:
        self.assertIsNotNone(lesson_run.LESSON_DIR_RE.match("01-introduction"))

    def test_accepts_three_digit_lesson_number(self) -> None:
        self.assertIsNotNone(lesson_run.LESSON_DIR_RE.match("110-operating-model"))

    def test_rejects_unpadded_lesson_number(self) -> None:
        self.assertIsNone(lesson_run.LESSON_DIR_RE.match("1-introduction"))


if __name__ == "__main__":
    unittest.main()
