from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson03_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class BackpropagationTests(unittest.TestCase):
    def test_addition_sends_upstream_gradient_to_both_inputs(self):
        a, b = main.Value(2.0), main.Value(3.0)
        out = a + b
        out.backward()
        self.assertEqual((a.grad, b.grad), (1.0, 1.0))

    def test_product_uses_the_other_factor(self):
        a, b = main.Value(3.0), main.Value(4.0)
        out = a * b
        out.backward()
        self.assertEqual((a.grad, b.grad), (4.0, 3.0))

    def test_chain_rule_for_square(self):
        x = main.Value(3.0)
        (x * x).backward()
        self.assertAlmostEqual(x.grad, 6.0)

    def test_sigmoid_derivative_at_zero(self):
        x = main.Value(0.0)
        y = x.sigmoid()
        y.backward()
        self.assertAlmostEqual(x.grad, 0.25)

    def test_zero_grad_prevents_accumulation(self):
        x = main.Value(2.0)
        out = x * x
        out.backward()
        self.assertEqual(x.grad, 4.0)

    def test_repeated_backward_recomputes_shared_intermediate_adjoints(self):
        x = main.Value(2.0)
        square = x * x
        objective = square * x
        objective.backward()
        self.assertAlmostEqual(square.grad, 2.0)
        self.assertAlmostEqual(x.grad, 12.0)
        objective.backward()
        self.assertAlmostEqual(square.grad, 2.0)
        self.assertAlmostEqual(x.grad, 24.0)
        x.grad = 0.0
        out = x * x
        out.backward()
        self.assertEqual(x.grad, 4.0)

    def test_neuron_rejects_wrong_width(self):
        neuron = main.Neuron(2, __import__("random").Random(1))
        with self.assertRaises(ValueError):
            neuron([main.Value(1.0)])

    def test_xor_training_produces_separating_probabilities(self):
        network = main.train_xor(epochs=400)
        values = []
        for inputs in ((0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0)):
            result = network([main.Value(value) for value in inputs])
            self.assertIsInstance(result, main.Value)
            values.append(result.data)
        self.assertLess(values[0], 0.5)
        self.assertGreater(values[1], 0.5)
        self.assertGreater(values[2], 0.5)
        self.assertLess(values[3], 0.5)

    def test_canonical_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
