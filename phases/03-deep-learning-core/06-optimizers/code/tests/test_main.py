from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson06_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class OptimizerTests(unittest.TestCase):
    def test_sgd_update(self):
        params = [1.0]
        main.SGD(0.1).step(params, [0.5])
        self.assertAlmostEqual(params[0], 0.95)

    def test_momentum_accumulates_velocity(self):
        params = [1.0]
        optimizer = main.SGDMomentum(0.1, 0.9)
        optimizer.step(params, [0.5])
        optimizer.step(params, [0.5])
        self.assertAlmostEqual(optimizer.velocity[0], 0.95)

    def test_adam_first_step_bias_correction(self):
        params = [1.0]
        optimizer = main.Adam(0.1)
        optimizer.step(params, [2.0])
        self.assertAlmostEqual(optimizer.m[0] / (1 - optimizer.beta1), 2.0)
        self.assertAlmostEqual(optimizer.v[0] / (1 - optimizer.beta2), 4.0)

    def test_adamw_decays_even_with_zero_gradient(self):
        params = [2.0]
        main.AdamW(lr=0.1, weight_decay=0.5).step(params, [0.0])
        self.assertAlmostEqual(params[0], 1.9)

    def test_adamw_uses_pre_step_value_for_nonzero_gradient(self):
        params = [2.0]
        main.AdamW(lr=0.1, weight_decay=0.5).step(params, [1.0])
        self.assertAlmostEqual(params[0], 1.8, places=7)

    def test_optimizer_hyperparameters_reject_nonfinite_values(self):
        for constructor, kwargs in (
            (main.SGD, {"lr": float("nan")}),
            (main.SGDMomentum, {"lr": float("inf")}),
            (main.Adam, {"lr": float("nan")}),
            (main.Adam, {"epsilon": float("nan")}),
            (main.AdamW, {"weight_decay": float("nan")}),
        ):
            with self.assertRaises(ValueError):
                constructor(**kwargs)

    def test_optimizer_rejects_shape_mismatch(self):
        with self.assertRaises(ValueError):
            main.SGD().step([1.0], [1.0, 2.0])

    def test_state_reset_allows_new_parameter_width(self):
        optimizer = main.Adam()
        params = [1.0]
        optimizer.step(params, [1.0])
        optimizer.reset_state()
        new_params = [1.0, 2.0]
        optimizer.step(new_params, [1.0, 1.0])
        self.assertEqual(len(optimizer.m), 2)

    def test_quadratic_training_reduces_loss(self):
        history = main.OptimizerTestNetwork(main.SGD(0.1)).train(10)
        self.assertLess(history[-1], history[0])

    def test_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
