from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock


SCRIPT = Path(__file__).resolve().parents[1] / "check_output_contract.py"
SPEC = importlib.util.spec_from_file_location("check_output_contract", SCRIPT)
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = module
SPEC.loader.exec_module(module)


class OutputContractTests(unittest.TestCase):
    def lesson(self, root: Path, lesson_type: str) -> Path:
        lesson = root / "phases" / "01-phase" / "01-lesson"
        (lesson / "docs").mkdir(parents=True)
        (lesson / "docs" / "en.md").write_text(f"# Lesson\n\n**Type:** {lesson_type}\n", encoding="utf-8")
        return lesson

    def test_build_requires_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            lesson = self.lesson(Path(tmp), "Build")
            with mock.patch.object(module, "ROOT", Path(tmp)):
                self.assertEqual(module.validate_lesson(lesson)[0].rule, "O002")

    def test_learn_requires_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            lesson = self.lesson(Path(tmp), "Learn")
            with mock.patch.object(module, "ROOT", Path(tmp)):
                self.assertEqual(module.validate_lesson(lesson)[0].rule, "O002")

    def test_reference_may_opt_out(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            lesson = self.lesson(Path(tmp), "Reference")
            with mock.patch.object(module, "ROOT", Path(tmp)):
                self.assertEqual(module.validate_lesson(lesson), [])

    def test_tiny_placeholder_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            lesson = self.lesson(Path(tmp), "Build")
            (lesson / "outputs").mkdir()
            (lesson / "outputs" / "artifact.md").write_text("TODO\n", encoding="utf-8")
            with mock.patch.object(module, "ROOT", Path(tmp)):
                self.assertEqual(module.validate_lesson(lesson)[0].rule, "O002")

    def test_substantial_artifact_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            lesson = self.lesson(Path(tmp), "Build")
            (lesson / "outputs").mkdir()
            (lesson / "outputs" / "artifact.md").write_text("Reusable artifact. " * 8, encoding="utf-8")
            with mock.patch.object(module, "ROOT", Path(tmp)):
                self.assertEqual(module.validate_lesson(lesson), [])


if __name__ == "__main__":
    unittest.main()
