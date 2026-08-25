from __future__ import annotations

import ast
import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest


CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"


def load_main():
    spec = importlib.util.spec_from_file_location("lesson13_diagnostics", MAIN)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load lesson main")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


lesson = load_main()


class DiagnosticContractTests(unittest.TestCase):
    def test_finite_stats_and_nonfinite_boundary(self) -> None:
        stats = lesson.finite_stats((1.0, 2.0, 3.0))
        self.assertEqual(stats["count"], 3.0)
        self.assertAlmostEqual(stats["mean"], 2.0)
        self.assertAlmostEqual(stats["std"], (2.0 / 3.0) ** 0.5)
        with self.assertRaises(ValueError):
            lesson.finite_stats((1.0, float("nan")))
        self.assertEqual(lesson.classify_values((1.0, float("inf"))), "NAN_OR_INF")

    def test_loss_statuses_are_distinct(self) -> None:
        self.assertEqual(lesson.loss_health((1.0,)), "NOT_ENOUGH_DATA")
        self.assertEqual(lesson.loss_health((1.0, float("nan"))), "NAN_OR_INF")
        self.assertEqual(lesson.loss_health((1.0, 1.0, 1.0, 1.0)), "NOT_DECREASING")
        self.assertEqual(lesson.loss_health(tuple([1.0] * 20)), "NOT_DECREASING")
        self.assertEqual(lesson.loss_health((1.0, 0.8, 0.6, 0.4)), "HEALTHY")
        self.assertEqual(lesson.loss_health((1.0, 0.5, 1.0, 0.5)), "OSCILLATING")
        with self.assertRaises(ValueError):
            lesson.loss_health((1.0, 0.9), tolerance=0.0)

    def test_activation_report_flags_real_failure_modes(self) -> None:
        dead = lesson.activation_report("dead", (0.0, 0.0, 0.0, 1.0))
        self.assertIn("DEAD_NEURONS", dead["issues"])
        exploding = lesson.activation_report("large", (200.0, 201.0, 199.0))
        self.assertIn("EXPLODING_ACTIVATIONS", exploding["issues"])
        collapsed = lesson.activation_report("flat", (2.0, 2.0, 2.0))
        self.assertIn("COLLAPSED_ACTIVATIONS", collapsed["issues"])

    def test_gradient_report_flags_small_and_large_magnitudes(self) -> None:
        self.assertIn("VANISHING_GRADIENT", lesson.gradient_report("early", (1e-9, 2e-9))["issues"])
        self.assertIn("EXPLODING_GRADIENT", lesson.gradient_report("late", (101.0, 102.0))["issues"])
        self.assertEqual(lesson.gradient_report("ok", (0.1, 0.2))["issues"], ("HEALTHY",))

    def test_central_difference_matches_known_function(self) -> None:
        self.assertAlmostEqual(lesson.central_difference(lambda value: value**2, 3.0), 6.0, places=5)
        with self.assertRaises(ValueError):
            lesson.central_difference(lambda value: value, 1.0, epsilon=0.0)
        with self.assertRaises(ValueError):
            lesson.central_difference(lambda value: float("nan"), 1.0)

    def test_diagnose_contains_serializable_evidence(self) -> None:
        report = lesson.diagnose(
            (1.0, 0.8, 0.6),
            {"hidden": (0.0, 1.0)},
            {"output": (0.1, 0.2)},
        )
        self.assertEqual(report["loss_status"], "HEALTHY")
        self.assertEqual(report["activation_reports"][0]["name"], "hidden")
        self.assertEqual(report["gradient_reports"][0]["name"], "output")
        with self.assertRaises(ValueError):
            lesson.diagnose((), {"hidden": (1.0,)}, {"output": (1.0,)})

    def test_torch_probe_is_boolean_and_does_not_require_backend(self) -> None:
        self.assertIsInstance(lesson.torch_available(), bool)
        source = MAIN.read_text(encoding="utf-8")
        self.assertNotIn("import torch", source)

    def test_source_compiles_and_has_no_banned_imports(self) -> None:
        for path in (CODE / "main.py", CODE / "debug_neural_nets.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            compile(tree, str(path), "exec")
            imported = []
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    imported.extend(alias.name.split(".")[0] for alias in node.names)
                elif isinstance(node, ast.ImportFrom) and node.module:
                    imported.append(node.module.split(".")[0])
            self.assertNotIn("torch", imported)

    def test_canonical_and_compatibility_demos_exit_cleanly(self) -> None:
        for filename in ("main.py", "debug_neural_nets.py"):
            result = subprocess.run(
                [sys.executable, filename], cwd=CODE, text=True,
                capture_output=True, check=False, timeout=10,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn("Traceback", result.stderr)
            self.assertIn("stdlib neural-network diagnostics", result.stdout)


if __name__ == "__main__":
    unittest.main()
