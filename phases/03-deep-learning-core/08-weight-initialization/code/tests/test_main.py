from __future__ import annotations

import importlib.util
from pathlib import Path
import random
import subprocess
import sys
import unittest


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson08_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class WeightInitializationTests(unittest.TestCase):
    def test_zero_initializer_shape_and_symmetry(self):
        weights = main.zero_init(3, 2)
        self.assertEqual(weights, [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]])
        self.assertEqual(main.symmetry_signature()["unique_rows"], 1)

    def test_seeded_initializers_are_reproducible_without_global_rng(self):
        first = main.xavier_init(4, 3, random.Random(8))
        second = main.xavier_init(4, 3, random.Random(8))
        self.assertEqual(first, second)
        random.seed(33)
        before = random.random()
        main.kaiming_init(4, 3)
        after = random.random()
        random.seed(33)
        self.assertEqual((before, after), (random.random(), random.random()))

    def test_xavier_and_kaiming_variance_formulas(self):
        xavier = main.xavier_init(1000, 1000, random.Random(1))
        kaiming = main.kaiming_init(1000, 1000, random.Random(1))
        self.assertAlmostEqual(main.matrix_variance(xavier), 2 / 2000, delta=0.00015)
        self.assertAlmostEqual(main.matrix_variance(kaiming), 2 / 1000, delta=0.0003)

    def test_invalid_dimensions_scales_and_matrices_raise(self):
        with self.assertRaises(ValueError):
            main.xavier_init(0, 2)
        with self.assertRaises(ValueError):
            main.random_init(2, 2, scale=float("nan"))
        with self.assertRaises(ValueError):
            main.matrix_variance([[1.0], [1.0, 2.0]])

    def test_forward_probe_is_finite_and_has_requested_depth(self):
        magnitudes = main.forward_deep(main.kaiming_init, main.relu, n_layers=6, width=8, n_samples=4, seed=5)
        self.assertEqual(len(magnitudes), 6)
        self.assertTrue(all(value >= 0.0 for value in magnitudes))

    def test_stable_activations_reject_nonfinite_inputs(self):
        with self.assertRaises(ValueError):
            main.sigmoid(float("inf"))
        with self.assertRaises(ValueError):
            main.relu(float("nan"))

    def test_variance_report_contains_local_oracle_values(self):
        report = main.variance_report(fan_in=8, trials=128, seed=2)
        self.assertEqual(set(report), {"random_scale_1", "xavier", "kaiming"})
        self.assertGreater(report["random_scale_1"][0], report["kaiming"][0])

    def test_canonical_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("xavier+sigmoid", result.stdout)


if __name__ == "__main__":
    unittest.main()
