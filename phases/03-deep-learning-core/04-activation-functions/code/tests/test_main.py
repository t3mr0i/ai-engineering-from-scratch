from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson04_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class ActivationTests(unittest.TestCase):
    def test_sigmoid_and_tanh_derivatives_at_zero(self):
        self.assertAlmostEqual(main.sigmoid_derivative(0.0), 0.25)
        self.assertAlmostEqual(main.tanh_derivative(0.0), 1.0)

    def test_relu_has_zero_negative_branch(self):
        self.assertEqual(main.relu(-2.0), 0.0)
        self.assertEqual(main.relu_derivative(-2.0), 0.0)
        self.assertEqual(main.relu_derivative(2.0), 1.0)

    def test_leaky_relu_preserves_negative_gradient(self):
        self.assertAlmostEqual(main.leaky_relu(-2.0), -0.02)
        self.assertAlmostEqual(main.leaky_relu_derivative(-2.0), 0.01)

    def test_gelu_and_swish_are_finite(self):
        for value in (-100.0, -2.0, 0.0, 2.0, 100.0):
            self.assertTrue(all(map(__import__("math").isfinite, (main.gelu(value), main.gelu_derivative(value), main.swish(value), main.swish_derivative(value)))))

    def test_softmax_is_stable_and_normalized(self):
        probabilities = main.softmax((1000.0, 999.0, 998.0))
        self.assertAlmostEqual(sum(probabilities), 1.0)
        self.assertGreater(probabilities[0], probabilities[1])

    def test_softmax_rejects_empty_or_nonfinite_logits(self):
        with self.assertRaises(ValueError):
            main.softmax(())
        with self.assertRaises(ValueError):
            main.softmax((float("nan"), 1.0))

    def test_network_seed_and_shape_contract(self):
        a = main.ActivationNetwork(main.relu, main.relu_derivative, seed=7)
        b = main.ActivationNetwork(main.relu, main.relu_derivative, seed=7)
        self.assertEqual(a.forward((0.2, -0.4)), b.forward((0.2, -0.4)))
        with self.assertRaises(ValueError):
            a.forward((0.2,))
        with self.assertRaises(ValueError):
            main.ActivationNetwork(main.relu, main.relu_derivative, lr=float("nan"))
        with self.assertRaises(ValueError):
            main.ActivationNetwork(main.relu, main.relu_derivative, lr=float("inf"))

    def test_canonical_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
