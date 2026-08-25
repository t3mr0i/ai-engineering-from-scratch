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
    spec = importlib.util.spec_from_file_location("lesson12_functional", MAIN)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load lesson main")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


lesson = load_main()


class FunctionalBridgeTests(unittest.TestCase):
    def test_linear_and_width_contract(self) -> None:
        params = {"w": (2.0, -1.0), "b": 0.5}
        self.assertAlmostEqual(lesson.linear(params, (3.0, 4.0)), 2.5)
        with self.assertRaises(ValueError):
            lesson.linear(params, (3.0,))

    def test_finite_difference_matches_known_derivative(self) -> None:
        derivative = lesson.finite_difference_gradient(lambda value: value**2, 3.0)
        self.assertAlmostEqual(derivative, 6.0, places=5)
        with self.assertRaises(ValueError):
            lesson.finite_difference_gradient(lambda value: value, 1.0, epsilon=0.0)

    def test_vmap_and_shape_checked(self) -> None:
        square_rows = lesson.vmap(lambda row: row[0] ** 2, ((1.0,), (2.0,), (3.0,)))
        self.assertEqual(square_rows, (1.0, 4.0, 9.0))
        mapped = lesson.shape_checked(lambda row: sum(row), 2)
        self.assertEqual(mapped((2.0, 3.0)), 5.0)
        with self.assertRaises(ValueError):
            mapped((2.0,))

    def test_explicit_seed_split_is_reproducible(self) -> None:
        self.assertEqual(lesson.split_seed(42), lesson.split_seed(42))
        self.assertNotEqual(lesson.split_seed(42), lesson.split_seed(43))
        self.assertEqual(lesson.random_vector(7, 3), lesson.random_vector(7, 3))
        with self.assertRaises(ValueError):
            lesson.random_vector(7, 0)

    def test_update_is_pure_and_training_reduces_loss(self) -> None:
        params = {"w": (0.0,), "b": 0.0}
        updated = lesson.update_params(params, {"w": (-1.0,), "b": -1.0}, 0.1)
        self.assertEqual(params, {"w": (0.0,), "b": 0.0})
        self.assertEqual(updated, {"w": (0.1,), "b": 0.1})
        fitted, trace = lesson.train_linear(steps=20)
        self.assertLess(trace[-1], trace[0])
        self.assertAlmostEqual(lesson.linear(fitted, (2.0,)), 5.0, delta=0.2)

    def test_mse_and_parameter_contracts(self) -> None:
        params = {"w": (1.0,), "b": 0.0}
        self.assertAlmostEqual(lesson.mse(params, ((1.0,), (3.0,)), (1.0, 3.0)), 0.0)
        with self.assertRaises(ValueError):
            lesson.mse(params, ((1.0,),), (1.0, 2.0))
        with self.assertRaises(ValueError):
            lesson.update_params(params, {"w": (1.0,), "b": 0.0}, float("nan"))

    def test_empty_batches_and_nonfinite_values_fail_explicitly(self) -> None:
        with self.assertRaises(ValueError):
            lesson.vmap(lambda value: value, ())
        with self.assertRaises(ValueError):
            lesson.linear({"w": (float("inf"),), "b": 0.0}, (1.0,))
        with self.assertRaises(ValueError):
            lesson.train_linear(steps=0)

    def test_code_has_no_jax_or_banned_import(self) -> None:
        for path in (CODE / "main.py", CODE / "jax_intro.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            imported = []
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    imported.extend(alias.name.split(".")[0] for alias in node.names)
                elif isinstance(node, ast.ImportFrom) and node.module:
                    imported.append(node.module.split(".")[0])
            self.assertNotIn("jax", imported)
            self.assertNotIn("optax", imported)
            self.assertNotIn("sklearn", imported)

    def test_canonical_and_compatibility_demos_exit_cleanly(self) -> None:
        for filename in ("main.py", "jax_intro.py"):
            result = subprocess.run(
                [sys.executable, filename], cwd=CODE, text=True,
                capture_output=True, check=False, timeout=10,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn("Traceback", result.stderr)
            self.assertIn("JAX conceptual bridge", result.stdout)


if __name__ == "__main__":
    unittest.main()
