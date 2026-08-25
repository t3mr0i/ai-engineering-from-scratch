from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson01_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class PerceptronTests(unittest.TestCase):
    def test_step_boundary_is_one_at_zero(self):
        perceptron = main.Perceptron(1)
        self.assertEqual(perceptron.predict((0.0,)), 1)

    def test_and_training_updates_weights_and_converges(self):
        data = [((0, 0), 0), ((0, 1), 0), ((1, 0), 0), ((1, 1), 1)]
        perceptron = main.Perceptron(2)
        self.assertLessEqual(perceptron.train(data), 100)
        self.assertEqual([perceptron.predict(x) for x, _ in data], [0, 0, 0, 1])

    def test_wrong_input_width_is_rejected(self):
        with self.assertRaises(ValueError):
            main.Perceptron(2).predict((1.0,))

    def test_non_binary_labels_are_rejected(self):
        with self.assertRaises(ValueError):
            main.Perceptron(1).train([((1.0,), 2)])

    def test_hand_wired_xor(self):
        self.assertEqual([main.xor_predict(x) for x in ((0, 0), (0, 1), (1, 0), (1, 1))], [0, 1, 1, 0])

    def test_sigmoid_network_is_reproducible(self):
        data = [((0, 0), 0), ((0, 1), 1), ((1, 0), 1), ((1, 1), 0)]
        first = main.TwoLayerNetwork(seed=3)
        second = main.TwoLayerNetwork(seed=3)
        first.train(data, epochs=100)
        second.train(data, epochs=100)
        self.assertEqual(first.forward((0.2, 0.8)), second.forward((0.2, 0.8)))

    def test_sigmoid_network_rejects_nonfinite_learning_rate(self):
        with self.assertRaises(ValueError):
            main.TwoLayerNetwork(learning_rate=float("nan"))
        with self.assertRaises(ValueError):
            main.TwoLayerNetwork(learning_rate=float("inf"))

    def test_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
