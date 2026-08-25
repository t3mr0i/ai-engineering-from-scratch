from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson05_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class LossTests(unittest.TestCase):
    def test_mse_and_gradient(self):
        self.assertAlmostEqual(main.mse((1, 3), (0, 2)), 1.0)
        self.assertEqual(main.mse_gradient((1, 3), (0, 2)), [1.0, 1.0])

    def test_pairwise_losses_reject_empty_or_mismatched_inputs(self):
        with self.assertRaises(ValueError):
            main.mse((), ())
        with self.assertRaises(ValueError):
            main.mse((1,), (1, 2))

    def test_bce_has_expected_positive_example_value(self):
        self.assertAlmostEqual(main.binary_cross_entropy((0.9,), (1,)), -__import__("math").log(0.9))
        self.assertAlmostEqual(main.bce_gradient((0.9,), (1,))[0], -1 / 0.9)

    def test_bce_rejects_nonbinary_labels(self):
        with self.assertRaises(ValueError):
            main.binary_cross_entropy((0.5,), (2,))
        with self.assertRaises(ValueError):
            main.binary_cross_entropy((0.5,), ("1",))
        with self.assertRaises(ValueError):
            main.binary_cross_entropy((0.5,), (1,), eps=float("nan"))

    def test_softmax_and_cce_gradient(self):
        probabilities = main.softmax((0.0, 0.0))
        self.assertEqual(probabilities, [0.5, 0.5])
        self.assertAlmostEqual(sum(main.cce_gradient((0.0, 0.0), 0)), 0.0)
        with self.assertRaises(ValueError):
            main.categorical_cross_entropy((1.0,), 1)
        with self.assertRaises(ValueError):
            main.categorical_cross_entropy((1.0, 0.0), 0.5)
        with self.assertRaises(ValueError):
            main.categorical_cross_entropy((1.0, 0.0), 0, eps=float("nan"))

    def test_label_smoothing_and_cosine_contracts(self):
        self.assertLess(main.label_smoothed_cce((2.0, 0.0), 0, 2), 0.4)
        with self.assertRaises(ValueError):
            main.label_smoothed_cce((2.0, 0.0), 0, 2, eps=float("nan"))
        self.assertAlmostEqual(main.cosine_similarity((1, 0), (0, 1)), 0.0)
        with self.assertRaises(ValueError):
            main.cosine_similarity((1,), (1, 2))
        with self.assertRaises(ValueError):
            main.cosine_similarity((float("inf"), 0), (1, 0))

    def test_contrastive_temperature_must_be_positive(self):
        with self.assertRaises(ValueError):
            main.contrastive_loss((1, 0), (1, 0), ((0, 1),), temperature=0)
        with self.assertRaises(ValueError):
            main.contrastive_loss((1, 0), (1, 0), ((0, 1),), temperature=float("nan"))

    def test_logistic_wrapper_rejects_nonfinite_learning_rate(self):
        with self.assertRaises(ValueError):
            main.LossComparisonNetwork(lr=float("nan"))
        with self.assertRaises(ValueError):
            main.LossComparisonNetwork(lr=float("inf"))

    def test_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
