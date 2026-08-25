import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import feature_selection as fs


class FeatureSelectionContracts(unittest.TestCase):
    def setUp(self):
        self.X = np.array([[0., 0., 1.], [0., 1., 1.], [1., 0., 2.], [1., 1., 2.], [2., 1., 3.], [2., 0., 3.]])
        self.y = np.array([0, 1, 1, 0, 1, 0])

    def test_fixture_shape_and_variance_filter(self):
        X, y, names = fs.make_feature_selection_data(32, seed=4)
        self.assertEqual((X.shape, y.shape, len(names)), ((32, 20), (32,), 20))
        mask, variances = fs.variance_threshold(self.X, threshold=0.1)
        np.testing.assert_array_equal(mask, [True, True, True])
        self.assertTrue(np.all(variances >= 0))

    def test_discretize_and_mutual_information_are_finite(self):
        bins = fs.discretize(np.array([0., 1., 2., 3.]), n_bins=2)
        np.testing.assert_array_equal(bins, [0, 0, 1, 1])
        scores = fs.mutual_information(self.X, self.y, n_bins=3)
        self.assertEqual(scores.shape, (3,))
        self.assertTrue(np.isfinite(scores).all())
        with self.assertRaises(ValueError):
            fs.discretize([1., 2.], n_bins=0)

    def test_logistic_and_rfe_select_requested_width(self):
        weights, bias = fs.simple_logistic_importance(self.X, self.y, epochs=20)
        self.assertEqual(weights.shape, (3,))
        self.assertTrue(np.isfinite(bias))
        mask, ranks = fs.rfe(self.X, self.y, n_features_to_select=2, epochs=10)
        self.assertEqual(int(mask.sum()), 2)
        self.assertEqual(ranks.shape, (3,))

    def test_l1_and_tree_importance_are_deterministic(self):
        first_mask, first_w = fs.l1_feature_selection(self.X, self.y, alpha=.01, epochs=30)
        second_mask, second_w = fs.l1_feature_selection(self.X, self.y, alpha=.01, epochs=30)
        np.testing.assert_array_equal(first_mask, second_mask)
        np.testing.assert_allclose(first_w, second_w)
        imp = fs.tree_importance(self.X, self.y, n_trees=4, max_depth=2, seed=9)
        np.testing.assert_allclose(imp.sum(), 1.0)

    def test_tree_split_and_accuracy_have_explicit_boundaries(self):
        threshold, gain = fs.best_split(self.X, self.y, 0)
        self.assertIsNotNone(threshold)
        self.assertGreaterEqual(gain, 0)
        accuracy = fs.evaluate_accuracy(self.X, self.y, np.array([True, False, True]))
        self.assertTrue(0 <= accuracy <= 1)
        with self.assertRaises(ValueError):
            fs.evaluate_accuracy(self.X, self.y, [False, False, False])
        with self.assertRaises(ValueError):
            fs.best_split(self.X, self.y, 3)

    def test_invalid_data_and_parameters_fail_before_numpy_errors(self):
        with self.assertRaises(ValueError):
            fs.variance_threshold([[1.]], threshold=-1)
        with self.assertRaises(ValueError):
            fs.mutual_information(self.X[:-1], self.y)
        with self.assertRaises(ValueError):
            fs.rfe(self.X, self.y, n_features_to_select=0)
        with self.assertRaises(ValueError):
            fs.l1_feature_selection(self.X, self.y, lr=0)
        with self.assertRaises(ValueError):
            fs.make_feature_selection_data(1)
        for method in (fs.simple_logistic_importance, fs.rfe, fs.l1_feature_selection):
            with self.assertRaises(ValueError):
                method(self.X, np.array([0, 2, 0, 1, 0, 1]), epochs=2)
            with self.assertRaises(ValueError):
                method(self.X, np.array(["0", "1", "0", "1", "0", "1"]), epochs=2)
        with self.assertRaises(ValueError):
            fs.gini_impurity([0, 2, 1])


if __name__ == "__main__":
    unittest.main()
