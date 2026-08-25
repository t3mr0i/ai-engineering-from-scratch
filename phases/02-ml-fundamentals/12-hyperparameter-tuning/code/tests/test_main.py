"""Behavioral tests for grid, random, and scratch Bayesian search."""

from pathlib import Path
import sys
import unittest
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import tuning


class TuningTests(unittest.TestCase):
    def setUp(self):
        self.X_train, self.y_train, self.X_val, self.y_val, _, _ = tuning.make_data(70, seed=3)

    def test_grid_evaluates_cartesian_product(self):
        params = {"n_estimators": [2, 4], "learning_rate": [0.05, 0.1], "max_depth": [1]}
        best, score, history = tuning.grid_search(params, self.X_train, self.y_train, self.X_val, self.y_val)
        self.assertEqual(len(history), 4)
        self.assertIn(best["n_estimators"], params["n_estimators"])
        self.assertTrue(np.isfinite(score))

    def test_sample_param_respects_discrete_and_numeric_specs(self):
        rng = np.random.RandomState(1)
        self.assertIn(tuning.sample_param([2, 5, 9], rng), [2, 5, 9])
        self.assertGreaterEqual(tuning.sample_param(("int", 2, 4), rng), 2)
        self.assertLessEqual(tuning.sample_param(("int", 2, 4), rng), 4)
        value = tuning.sample_param(("log_float", 0.01, 0.1), rng)
        self.assertTrue(0.01 <= value <= 0.1)

    def test_random_search_respects_iteration_budget(self):
        spec = {"n_estimators": ("int", 2, 4), "learning_rate": ("float", 0.05, 0.1), "max_depth": [1]}
        best, score, history = tuning.random_search(spec, self.X_train, self.y_train, self.X_val, self.y_val, n_iter=5, seed=4)
        self.assertEqual(len(history), 5)
        self.assertEqual(set(best), set(spec))
        self.assertTrue(np.isfinite(score))

    def test_convergence_curve_is_monotonic_best_so_far(self):
        curve = tuning.convergence_curve([({}, -4.0), ({}, -2.0), ({}, -3.0)])
        self.assertEqual(curve, [-4.0, -2.0, -2.0])

    def test_bayesian_optimizer_observes_every_trial(self):
        space = {"x": ("float", -1.0, 1.0)}
        optimizer = tuning.SimpleBayesianOptimizer(space, n_initial=2, seed=5)
        best, score, history = optimizer.optimize(lambda p: -(p["x"] ** 2), n_iter=6)
        self.assertEqual(len(history), 6)
        self.assertEqual(len(optimizer.X_observed), 6)
        self.assertAlmostEqual(score, max(item[1] for item in history))
        self.assertIn("x", best)

    def test_objective_is_negative_mse(self):
        model = tuning.GBMForTuning(n_estimators=2, max_depth=1)
        model.fit(self.X_train, self.y_train)
        self.assertAlmostEqual(tuning.neg_mse(model, self.X_val, self.y_val), -np.mean((model.predict(self.X_val) - self.y_val) ** 2))

    def test_invalid_parameter_specs_and_budgets_raise_value_error(self):
        rng = np.random.RandomState(2)
        for spec in [("wat", 2, 9), ("int", 4, 2), ("log_float", 0, 1), []]:
            with self.assertRaises(ValueError):
                tuning.sample_param(spec, rng)
        with self.assertRaises(ValueError):
            tuning.grid_search({}, self.X_train, self.y_train, self.X_val, self.y_val)
        with self.assertRaises(ValueError):
            tuning.random_search({"x": [1]}, self.X_train, self.y_train, self.X_val, self.y_val, n_iter=0)
        with self.assertRaises(ValueError):
            tuning.SimpleBayesianOptimizer({}, n_initial=1)

    def test_gbm_validates_parameters_and_resets_trees(self):
        for kwargs in (
            {"n_estimators": 0},
            {"learning_rate": -1},
            {"subsample": 0},
        ):
            with self.assertRaises(ValueError):
                tuning.GBMForTuning(**kwargs)
        model = tuning.GBMForTuning(n_estimators=2, max_depth=1)
        with self.assertRaises(RuntimeError):
            model.predict(self.X_val)
        model.fit(self.X_train, self.y_train)
        model.fit(self.X_train, self.y_train)
        self.assertEqual(len(model.trees), 2)


if __name__ == "__main__":
    unittest.main()
