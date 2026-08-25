from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lesson09_main", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class ScheduleTests(unittest.TestCase):
    def test_constant_and_step_decay_values(self):
        self.assertEqual(main.constant_schedule(7, lr=0.03), 0.03)
        self.assertAlmostEqual(main.step_decay_schedule(3, lr=0.1, step_size=4, gamma=0.5), 0.1)
        self.assertAlmostEqual(main.step_decay_schedule(8, lr=0.1, step_size=4, gamma=0.5), 0.025)

    def test_cosine_has_explicit_endpoints(self):
        self.assertAlmostEqual(main.cosine_schedule(0, lr=0.1, total_steps=10, lr_min=0.01), 0.1)
        self.assertAlmostEqual(main.cosine_schedule(10, lr=0.1, total_steps=10, lr_min=0.01), 0.01)
        self.assertAlmostEqual(main.cosine_schedule(99, lr=0.1, total_steps=10, lr_min=0.01), 0.01)

    def test_warmup_reaches_peak_then_decays(self):
        values = main.schedule_values(main.warmup_cosine_schedule, 10, lr=0.1, warmup_steps=3, lr_min=0.01)
        self.assertEqual(len(values), 10)
        self.assertAlmostEqual(values[0], 0.1 / 3)
        self.assertAlmostEqual(values[2], 0.1)
        self.assertAlmostEqual(values[3], 0.1)
        self.assertLess(values[-1], values[3])

    def test_one_cycle_rises_and_finishes_at_floor(self):
        values = main.schedule_values(main.one_cycle_schedule, 12, lr=0.1)
        self.assertAlmostEqual(values[0], 0.1 / 25)
        self.assertAlmostEqual(max(values), 0.1)
        self.assertAlmostEqual(values[-1], 0.1 / 10000)

    def test_invalid_schedule_contracts_raise(self):
        with self.assertRaises(ValueError):
            main.cosine_schedule(0, lr=0.1, total_steps=0)
        with self.assertRaises(ValueError):
            main.warmup_cosine_schedule(0, lr=0.1, total_steps=5, warmup_steps=5)
        with self.assertRaises(ValueError):
            main.step_decay_schedule(0, gamma=1.5)
        with self.assertRaises(ValueError):
            main.constant_schedule(-1)

    def test_schedule_values_are_finite_and_nonnegative(self):
        for schedule, kwargs in (
            (main.constant_schedule, {}),
            (main.step_decay_schedule, {"step_size": 3}),
            (main.cosine_schedule, {"lr_min": 0.001}),
            (main.warmup_cosine_schedule, {"warmup_steps": 2, "lr_min": 0.001}),
            (main.one_cycle_schedule, {}),
        ):
            values = main.schedule_values(schedule, 20, lr=0.05, **kwargs)
            self.assertTrue(all(value >= 0.0 for value in values))

    def test_quadratic_fixture_moves_toward_target(self):
        result = main.train_quadratic(main.cosine_schedule, steps=20, base_lr=0.1, lr_min=0.01)
        self.assertLess(result["losses"][-1], result["losses"][0])
        self.assertEqual(len(result["rates"]), 20)

    def test_circle_fixture_is_seeded(self):
        self.assertEqual(main.make_circle_data(5, seed=4), main.make_circle_data(5, seed=4))

    def test_canonical_demo_exits_cleanly(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("warmup_cosine", result.stdout)


if __name__ == "__main__":
    unittest.main()
