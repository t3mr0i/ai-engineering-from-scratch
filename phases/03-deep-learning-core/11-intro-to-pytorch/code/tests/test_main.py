from __future__ import annotations

import ast
import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson11_pytorch_intro", CODE / "pytorch_intro.py")
lesson = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(lesson)


class OptionalPyTorchTests(unittest.TestCase):
    def test_module_import_does_not_require_torch(self):
        self.assertIsInstance(lesson.torch_available(), bool)

    def test_device_name_matches_availability_contract(self):
        if lesson.torch_available():
            self.assertIn(lesson.device_name(), {"cpu", "cuda"})
        else:
            self.assertEqual(lesson.device_name(), "unavailable")

    def test_missing_backend_is_an_explicit_runtime_error(self):
        if lesson.torch_available():
            self.skipTest("optional backend is installed; exercise the live path instead")
        with self.assertRaisesRegex(RuntimeError, "not installed"):
            lesson.build_model()

    def test_invalid_model_dimensions_are_rejected_before_backend_use(self):
        with self.assertRaises(ValueError):
            lesson.build_model(input_features=0)
        with self.assertRaises(ValueError):
            lesson.build_model(input_features=2.5)

    def test_training_budget_is_a_positive_integer(self):
        with self.assertRaises(ValueError):
            lesson.train_demo(steps=0)
        with self.assertRaises(ValueError):
            lesson.train_demo(steps=1.5)

    def test_fixture_contract_when_backend_is_available(self):
        if not lesson.torch_available():
            self.assertEqual(lesson.device_name(), "unavailable")
            return
        x, y = lesson.fixture()
        self.assertEqual(tuple(x.shape), (4, 2))
        self.assertEqual(tuple(y.shape), (4,))

    def test_live_training_is_finite_when_backend_is_available(self):
        if not lesson.torch_available():
            self.assertFalse(lesson.torch_available())
            return
        summary = lesson.train_demo(steps=5, device="cpu")
        self.assertEqual(summary["input_shape"], (4, 2))
        self.assertTrue(all(value == value for value in summary["losses"]))

    def test_canonical_demo_exits_without_traceback(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        if lesson.torch_available():
            self.assertIn("torch device=", result.stdout)
        else:
            self.assertIn("PyTorch unavailable", result.stdout)

    def test_no_top_level_torch_import(self):
        tree = ast.parse((CODE / "pytorch_intro.py").read_text(encoding="utf-8"))
        top_level_imports = [node for node in tree.body if isinstance(node, (ast.Import, ast.ImportFrom))]
        names = {alias.name.split(".")[0] for node in top_level_imports for alias in getattr(node, "names", ())}
        self.assertNotIn("torch", names)


if __name__ == "__main__":
    unittest.main()
