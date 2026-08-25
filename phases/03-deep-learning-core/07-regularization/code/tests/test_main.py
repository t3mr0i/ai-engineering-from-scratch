from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson07_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class RegularizationTests(unittest.TestCase):
    def test_inverted_dropout_scales_retained_values(self):
        layer = main.Dropout(0.5, seed=1)
        output = layer.forward((2.0, 4.0), training=True)
        self.assertIn(output, ([0.0, 8.0], [4.0, 0.0], [4.0, 8.0], [0.0, 0.0]))

    def test_dropout_eval_is_identity(self):
        layer = main.Dropout(0.5, seed=1)
        self.assertEqual(layer.forward((2.0, 4.0), training=False), [2.0, 4.0])

    def test_dropout_backward_requires_forward_and_matches_shape(self):
        layer = main.Dropout(0.2, seed=2)
        with self.assertRaises(RuntimeError):
            layer.backward((1.0,))
        layer.forward((1.0, 2.0), training=True)
        self.assertEqual(len(layer.backward((1.0, 1.0))), 2)

    def test_l2_penalty_and_gradient(self):
        self.assertAlmostEqual(main.l2_regularization((3.0, -4.0), 0.1), 1.25)
        self.assertAlmostEqual(main.l2_gradient((3.0, -4.0), 0.1)[0], 0.3)
        self.assertAlmostEqual(main.l2_gradient((3.0, -4.0), 0.1)[1], -0.4)

    def test_normalizers_have_shape_contracts(self):
        self.assertEqual(len(main.LayerNorm(3).forward((1, 2, 3))), 3)
        self.assertEqual(len(main.RMSNorm(3).forward((1, 2, 3))), 3)
        with self.assertRaises(ValueError):
            main.LayerNorm(3).forward((1, 2))

    def test_layer_norm_centers_and_rms_norm_scales(self):
        layer = main.LayerNorm(3)
        output = layer.forward((1.0, 2.0, 3.0))
        self.assertAlmostEqual(sum(output) / 3, 0.0, places=4)
        rms = main.RMSNorm(3).forward((1.0, 2.0, 3.0))
        self.assertAlmostEqual(sum(value * value for value in rms) / 3, 1.0, places=4)

    def test_batch_norm_rejects_empty_and_wrong_width_batches(self):
        layer = main.BatchNorm(2)
        with self.assertRaises(ValueError):
            layer.forward(())
        with self.assertRaises(ValueError):
            layer.forward(((1.0,),))
        with self.assertRaises(ValueError):
            main.BatchNorm(2, eps=float("nan"))
        with self.assertRaises(ValueError):
            main.BatchNorm(2, eps=float("inf"))

    def test_network_evaluation_is_deterministic_for_a_seed(self):
        data = main.make_circle_data(10, seed=9)
        a = main.RegularizedNetwork(seed=4).evaluate(data)
        b = main.RegularizedNetwork(seed=4).evaluate(data)
        self.assertEqual(a, b)

    def test_train_model_returns_train_metrics_and_eval_remains_deterministic(self):
        data = main.make_circle_data(12, seed=3)
        network = main.RegularizedNetwork(seed=4, dropout_p=0.2, weight_decay=0.01)
        history = network.train_model(data, epochs=2)
        self.assertEqual(len(history), 2)
        self.assertEqual(network.evaluate(data), network.evaluate(data))
        with self.assertRaises(ValueError):
            main.RegularizedNetwork(lr=float("nan"))
        with self.assertRaises(ValueError):
            main.RegularizedNetwork(weight_decay=float("nan"))
        with self.assertRaises(ValueError):
            main.RegularizedNetwork(lr=float("inf"))
        with self.assertRaises(ValueError):
            main.RegularizedNetwork(weight_decay=float("inf"))

    def test_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
