"""Behavioral checks for the scratch ensemble learners."""

from pathlib import Path
import sys
import unittest
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ensembles


class EnsembleTests(unittest.TestCase):
    def setUp(self):
        self.X, self.y = ensembles.make_classification_data(80, n_features=3, seed=6)

    def test_split_is_deterministic_and_disjoint(self):
        first = ensembles.train_test_split(self.X, self.y, seed=2)
        second = ensembles.train_test_split(self.X, self.y, seed=2)
        for a, b in zip(first, second):
            np.testing.assert_array_equal(a, b)
        self.assertEqual(len(first[0]) + len(first[1]), len(self.y))

    def test_stump_predicts_both_signed_classes(self):
        stump = ensembles.DecisionStump()
        stump.fit(self.X, self.y, np.full(len(self.y), 1 / len(self.y)))
        prediction = stump.predict(self.X)
        self.assertEqual(prediction.shape, self.y.shape)
        self.assertTrue(set(prediction).issubset({-1.0, 1.0}))

    def test_adaboost_keeps_one_alpha_per_stump(self):
        model = ensembles.AdaBoostScratch(n_estimators=5)
        model.fit(self.X, self.y)
        self.assertEqual(len(model.stumps), 5)
        self.assertEqual(len(model.alphas), 5)
        self.assertTrue(np.isfinite(model.accuracy(self.X, self.y)))

    def test_regression_tree_returns_finite_predictions(self):
        X, y = ensembles.make_regression_data(60, n_features=3, seed=4)
        tree = ensembles.SimpleRegressionTree(max_depth=3)
        tree.fit(X, y)
        prediction = tree.predict(X[:7])
        self.assertEqual(prediction.shape, (7,))
        self.assertTrue(np.isfinite(prediction).all())

    def test_gradient_boosting_reduces_training_error_from_baseline(self):
        X, y = ensembles.make_regression_data(80, n_features=3, seed=4)
        model = ensembles.GradientBoostingScratch(n_estimators=12, max_depth=2)
        baseline = np.mean((y - np.mean(y)) ** 2)
        model.fit(X, y)
        self.assertLess(model.mse(X, y), baseline)

    def test_bagging_has_requested_number_of_trees(self):
        model = ensembles.BaggingClassifier(n_estimators=4, max_depth=2)
        model.fit(self.X, self.y)
        self.assertEqual(len(model.trees), 4)
        self.assertTrue(np.isfinite(model.accuracy(self.X, self.y)))

    def test_stacking_produces_signed_predictions(self):
        class Wrapper:
            def __init__(self):
                self.tree = None

            def fit(self, X, y):
                self.tree = ensembles.SimpleRegressionTree(max_depth=2)
                self.tree.fit(X, y)

            def predict(self, X):
                return np.sign(self.tree.predict(X))

        model = ensembles.StackingClassifier([Wrapper, Wrapper], n_folds=4)
        model.fit(self.X, self.y)
        self.assertTrue(set(model.predict(self.X[:8])).issubset({-1.0, 1.0}))

    def test_fit_resets_ensemble_state_and_prefit_predict_is_rejected(self):
        ada = ensembles.AdaBoostScratch(n_estimators=2)
        with self.assertRaises(RuntimeError):
            ada.predict(self.X[:2])
        ada.fit(self.X, self.y)
        ada.fit(self.X, self.y)
        self.assertEqual(len(ada.stumps), 2)
        booster = ensembles.GradientBoostingScratch(n_estimators=2, max_depth=2)
        booster.fit(self.X, self.y)
        booster.fit(self.X, self.y)
        self.assertEqual(len(booster.trees), 2)
        bag = ensembles.BaggingClassifier(n_estimators=2, max_depth=2)
        bag.fit(self.X, self.y)
        bag.fit(self.X, self.y)
        self.assertEqual(len(bag.trees), 2)

    def test_classification_and_parameter_contracts(self):
        for factory in (
            lambda: ensembles.AdaBoostScratch(n_estimators=0),
            lambda: ensembles.BaggingClassifier(max_depth=0),
            lambda: ensembles.SimpleRegressionTree(max_depth=0),
        ):
            with self.assertRaises(ValueError):
                factory()
        with self.assertRaises(ValueError):
            ensembles.AdaBoostScratch(n_estimators=2).fit(self.X, np.zeros(len(self.y)))
        with self.assertRaises(ValueError):
            ensembles.AdaBoostScratch(n_estimators=2).fit(self.X, ["-1"] * len(self.y))
        with self.assertRaises(ValueError):
            ensembles.DecisionStump().fit(self.X, self.y[:-1], np.ones(len(self.y)))

    def test_tie_policy_never_returns_zero(self):
        tree = ensembles.SimpleRegressionTree(max_depth=1)
        tree.fit(np.zeros((4, 1)), np.array([-1.0, -1.0, 1.0, 1.0]))
        bag = ensembles.BaggingClassifier(n_estimators=2, max_depth=1)
        bag.fit(self.X, self.y)
        self.assertTrue(set(bag.predict(self.X[:10])).issubset({-1.0, 1.0}))
        empty_guard_tree = ensembles.SimpleRegressionTree().fit(self.X, np.arange(len(self.X), dtype=float))
        with self.assertRaises(ValueError):
            empty_guard_tree.predict(np.empty((0, self.X.shape[1])))
        with self.assertRaises(ValueError):
            ensembles.GradientBoostingScratch(n_estimators=1).mse(self.X, self.y[:-1])


if __name__ == "__main__":
    unittest.main()
