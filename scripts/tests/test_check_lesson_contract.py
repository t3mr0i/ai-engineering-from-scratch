"""Unit tests for the learner-facing lesson contract."""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "check_lesson_contract.py"
SPEC = importlib.util.spec_from_file_location("check_lesson_contract", SCRIPT)
assert SPEC and SPEC.loader
contract = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = contract
SPEC.loader.exec_module(contract)


class ContractParsingTests(unittest.TestCase):
    def test_parses_exact_metadata_fields(self) -> None:
        text = """**Type:** Build
**Languages:** Python, Rust
**Prerequisites:** None
**Time:** ~30 minutes
"""
        self.assertEqual(
            contract.parse_fields(text),
            {"Type": "Build", "Languages": "Python, Rust", "Prerequisites": "None", "Time": "~30 minutes"},
        )

    def test_objective_count_requires_canonical_heading(self) -> None:
        canonical = "## Learning Objectives\n- Build one\n- Test two\n- Explain three\n- Compare four\n\n## Next\n"
        self.assertEqual(contract.objective_count(canonical), 4)
        self.assertEqual(contract.objective_count(canonical.replace("Learning Objectives", "Learning objectives")), 0)

    def test_entrypoint_languages_are_canonical_and_ordered(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            code = Path(directory)
            (code / "main.rs").touch()
            (code / "main.py").touch()
            (code / "helper.py").touch()
            self.assertEqual(contract.entrypoint_languages(code), ["Python", "Rust"])

    def test_none_declares_no_entrypoint_language(self) -> None:
        self.assertEqual(contract.declared_languages("None"), [])

    def test_valid_types_match_repository_contract(self) -> None:
        self.assertEqual(contract.VALID_TYPES, {"Learn", "Build", "Reference"})


if __name__ == "__main__":
    unittest.main()
