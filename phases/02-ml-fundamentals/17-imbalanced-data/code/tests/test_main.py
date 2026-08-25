import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import imbalanced as im


class ImbalanceContracts(unittest.TestCase):
    def setUp(self):
        self.X = np.array([[0.0], [0.2], [1.0], [1.2], [1.4], [1.6]])
        self.y = np.array([0, 0, 0, 1, 1, 1])

    def test_fixture_is_reproducible_and_binary(self):
        X1, y1 = im.make_imbalanced_data(20, 4, seed=2)
        X2, y2 = im.make_imbalanced_data(20, 4, seed=2)
        np.testing.assert_array_equal(X1, X2)
        np.testing.assert_array_equal(y1, y2)
        self.assertEqual(set(y1), {0, 1})

    def test_neighbors_preserve_original_indices(self):
        self.assertEqual(set(im.find_k_neighbors(self.X, 5, 2)), {3, 4})
        with self.assertRaises(ValueError):
            im.find_k_neighbors(self.X, 0, 6)

    def test_smote_interpolates_and_validates(self):
        synthetic = im.smote(self.X[3:], k=2, n_synthetic=12, seed=1)
        self.assertEqual(synthetic.shape, (12, 1))
        self.assertTrue(np.all(synthetic >= self.X[3:].min()))
        self.assertTrue(np.all(synthetic <= self.X[3:].max()))
        with self.assertRaises(ValueError):
            im.smote(self.X[3:], k=0)
        with self.assertRaises(ValueError):
            im.smote([[1.0]], n_synthetic=1)

    def test_resampling_balances_classes(self):
        X_over, y_over = im.random_oversample(self.X, np.array([0, 0, 0, 0, 1, 1]))
        X_under, y_under = im.random_undersample(self.X, np.array([0, 0, 0, 0, 1, 1]))
        self.assertEqual(np.bincount(y_over).tolist(), [4, 4])
        self.assertEqual(np.bincount(y_under).tolist(), [2, 2])
        self.assertEqual(len(X_over), len(y_over))
        with self.assertRaises(ValueError):
            im.random_oversample(self.X[:3], np.zeros(3, dtype=int))
        with self.assertRaises(ValueError):
            im.random_undersample(self.X[:3], np.zeros(3, dtype=int))

    def test_weighted_logistic_and_class_weights(self):
        weights = im.compute_class_weights(self.y)
        self.assertAlmostEqual(weights[self.y == 0].mean(), 1.0)
        w, b = im.logistic_regression_weighted(self.X, self.y, weights, epochs=10)
        self.assertEqual(w.shape, (1,))
        self.assertTrue(np.isfinite(b))
        with self.assertRaises(ValueError):
            im.logistic_regression_weighted(self.X, self.y, np.ones(2))
        with self.assertRaises(ValueError):
            im.logistic_regression_weighted(self.X, self.y, np.zeros(len(self.y)))

    def test_metrics_and_threshold_are_binary_and_finite(self):
        metrics = im.compute_metrics(self.y, np.array([0, 0, 1, 1, 1, 1]))
        self.assertAlmostEqual(metrics["recall"], 1.0)
        threshold, score = im.find_optimal_threshold(self.y, np.array([.1, .2, .3, .8, .9, .95]))
        self.assertTrue(0.05 <= threshold <= 0.95)
        self.assertTrue(0 <= score <= 1)
        with self.assertRaises(ValueError):
            im.compute_metrics([0, 1], [0])
        with self.assertRaises(ValueError):
            im.find_optimal_threshold(self.y, np.ones(len(self.y)), metric="accuracy")

    def test_probability_loss_rejects_bad_inputs(self):
        loss = im.class_weighted_loss(self.y, np.full(len(self.y), .5), np.ones(len(self.y)))
        self.assertAlmostEqual(loss, np.log(2), places=6)
        with self.assertRaises(ValueError):
            im.class_weighted_loss(self.y, np.full(len(self.y), 1.2), np.ones(len(self.y)))
        with self.assertRaises(ValueError):
            im.class_weighted_loss(self.y, np.full(len(self.y), .5), np.zeros(len(self.y)))
        with self.assertRaises(ValueError):
            im.compute_class_weights([1, 1, 1])


if __name__ == "__main__":
    unittest.main()
