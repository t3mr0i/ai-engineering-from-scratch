from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson02_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class DenseNetworkTests(unittest.TestCase):
    def test_layer_output_has_one_value_per_neuron(self):
        layer = main.Layer(2, 3, weights=((1, 0), (0, 1), (1, 1)), biases=(0, 0, 0))
        self.assertEqual(len(layer.forward((2, 3))), 3)

    def test_layer_rejects_wrong_input_width(self):
        with self.assertRaises(ValueError):
            main.Layer(2, 1).forward((1,))
        with self.assertRaises(ValueError):
            main.Layer(2.5, 2)

    def test_sigmoid_is_stable_at_large_logits(self):
        self.assertAlmostEqual(main.sigmoid(1000), 1.0)
        self.assertAlmostEqual(main.sigmoid(-1000), 0.0)

    def test_hand_tuned_network_solves_xor(self):
        self.assertEqual(main.xor_predictions(), [0, 1, 1, 0])

    def test_parameter_count_includes_biases(self):
        self.assertEqual(main.parameter_count((2, 3, 1)), 13)
        with self.assertRaises(ValueError):
            main.parameter_count((2.5, 3))

    def test_network_rejects_disconnected_layers(self):
        with self.assertRaises(ValueError):
            main.Network((main.Layer(2, 3), main.Layer(2, 1)))

    def test_canonical_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("parameters=", result.stdout)


if __name__ == "__main__":
    unittest.main()
