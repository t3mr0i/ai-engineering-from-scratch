"""Regression tests for contextual README count checks."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "check_readme_counts.py"
SPEC = importlib.util.spec_from_file_location("check_readme_counts", SCRIPT)
assert SPEC and SPEC.loader
counts = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = counts
SPEC.loader.exec_module(counts)


class ReadmeCountTests(unittest.TestCase):
    def test_missing_optional_surface_is_not_an_error(self) -> None:
        pattern = counts.CountPattern(
            regex=counts.re.compile(r"hero (\d+)"),
            field="lessons",
            description="retired hero copy",
            required=False,
        )
        self.assertEqual(counts.find_mismatches("No hero here.", {"lessons": 12}, (pattern,)), [])

    def test_missing_required_surface_is_an_error(self) -> None:
        pattern = counts.CountPattern(
            regex=counts.re.compile(r"badge (\d+)"),
            field="lessons",
            description="canonical badge",
        )
        with self.assertRaisesRegex(counts.ReadmeStructureError, "canonical badge"):
            counts.find_mismatches("No badge here.", {"lessons": 12}, (pattern,))

    def test_present_optional_surface_still_detects_drift(self) -> None:
        pattern = counts.CountPattern(
            regex=counts.re.compile(r"hero (\d+)"),
            field="lessons",
            description="retired hero copy",
            required=False,
        )
        mismatches = counts.find_mismatches("hero 11", {"lessons": 12}, (pattern,))
        self.assertEqual(len(mismatches), 1)
        self.assertEqual(mismatches[0].expected, 12)


if __name__ == "__main__":
    unittest.main()
