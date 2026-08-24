"""Unit tests for assessment completeness helpers."""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "check_assessments.py"
SPEC = importlib.util.spec_from_file_location("check_assessments", SCRIPT)
assert SPEC and SPEC.loader
assessments = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = assessments
SPEC.loader.exec_module(assessments)


class AssessmentHelperTests(unittest.TestCase):
    def test_extracts_named_section_without_consuming_next_section(self) -> None:
        text = "## Exercises\n\n1. First\n2. Second\n3. Third\n\n## Reference Solution\n\nAnswer here."
        self.assertEqual(assessments.section_body(text, "Exercises"), "1. First\n2. Second\n3. Third")

    def test_counts_unittest_methods(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            tests = Path(directory)
            (tests / "test_main.py").write_text(
                "class T:\n" + "".join(f"    def test_{i}(self): pass\n" for i in range(5)),
                encoding="utf-8",
            )
            self.assertEqual(assessments.test_case_count(tests), 5)

    def test_counts_node_test_calls(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            tests = Path(directory)
            (tests / "main.test.mjs").write_text("\n".join(f'test("{i}", () => {{}});' for i in range(5)), encoding="utf-8")
            self.assertEqual(assessments.test_case_count(tests), 5)

    def test_counts_rust_and_julia_tests(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            tests = Path(directory)
            (tests / "tests.rs").write_text("#[test]\nfn one() {}\n#[test]\nfn two() {}", encoding="utf-8")
            (tests / "runtests.jl").write_text("@test 1 == 1\n@test 2 == 2\n@test 3 == 3", encoding="utf-8")
            self.assertEqual(assessments.test_case_count(tests), 5)

    def test_missing_tests_directory_counts_as_zero(self) -> None:
        self.assertEqual(assessments.test_case_count(Path("not-present")), 0)


if __name__ == "__main__":
    unittest.main()
