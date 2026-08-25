from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson10_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class MiniFrameworkTests(unittest.TestCase):
    def test_linear_forward_and_backward_shapes(self):
        layer = main.Linear(2, 2, seed=1)
        output = layer.forward((1.0, -2.0))
        self.assertEqual(len(output), 2)
        input_grad = layer.backward((1.0, 1.0))
        self.assertEqual(len(input_grad), 2)
        self.assertTrue(any(parameter.grad != 0.0 for parameter in layer.parameters()))

    def test_linear_backward_requires_forward_and_rejects_width(self):
        layer = main.Linear(2, 1)
        with self.assertRaises(RuntimeError):
            layer.backward((1.0,))
        with self.assertRaises(ValueError):
            layer.forward((1.0,))

    def test_sequential_propagates_train_eval_and_parameters(self):
        model = main.Sequential(main.Linear(2, 3, seed=2), main.Tanh(), main.Linear(3, 1, seed=3), main.Sigmoid())
        self.assertEqual(len(model.parameters()), 13)
        model.eval()
        self.assertFalse(model.training)
        self.assertTrue(all(not child.training for child in model.modules))
        model.train()
        self.assertTrue(all(child.training for child in model.modules))

    def test_dropout_is_random_in_train_and_identity_in_eval(self):
        layer = main.Dropout(0.5, seed=4)
        train_output = layer.forward((1.0, 2.0, 3.0))
        self.assertIn(train_output, ([0.0, 0.0, 0.0], [0.0, 0.0, 6.0], [0.0, 4.0, 0.0], [0.0, 4.0, 6.0], [2.0, 0.0, 0.0], [2.0, 0.0, 6.0], [2.0, 4.0, 0.0], [2.0, 4.0, 6.0]))
        layer.eval()
        self.assertEqual(layer.forward((1.0, 2.0, 3.0)), [1.0, 2.0, 3.0])

    def test_loss_and_optimizer_contracts(self):
        loss = main.MSELoss()
        self.assertAlmostEqual(loss((1.0, 3.0), (0.0, 2.0)), 1.0)
        self.assertEqual(loss.backward(), [1.0, 1.0])
        with self.assertRaises(ValueError):
            loss((1.0,), (0.0, 1.0))
        with self.assertRaises(ValueError):
            main.SGD([main.Parameter(1.0)], lr=0.0)

    def test_dataloader_batches_and_seed(self):
        data = [((float(i),), i % 2) for i in range(5)]
        first = list(main.DataLoader(data, batch_size=2, shuffle=True, seed=8))
        second = list(main.DataLoader(data, batch_size=2, shuffle=True, seed=8))
        self.assertEqual(first, second)
        self.assertEqual([len(batch) for batch in first], [2, 2, 1])

    def test_xor_training_reduces_loss_and_predicts_classes(self):
        _, history, predictions = main.train_xor(epochs=800, lr=0.5, seed=3)
        self.assertLess(history[-1], history[0])
        self.assertEqual(predictions, [0, 1, 1, 0])

    def test_canonical_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("xor=", result.stdout)


if __name__ == "__main__":
    unittest.main()
