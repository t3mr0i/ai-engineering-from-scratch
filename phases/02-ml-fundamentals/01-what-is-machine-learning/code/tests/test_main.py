import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parents[1]))
from ml_intro import (  # noqa: E402
    NearestCentroid,
    generate_classification_data,
    majority_baseline,
    random_baseline,
    train_test_split,
)


class IntroMLTests(unittest.TestCase):
    def test_fixture_shape_and_labels(self):
        X, y = generate_classification_data(8, 3, separation=2.0, seed=7)
        self.assertEqual(X.shape, (16, 3))
        self.assertEqual(sorted(np.unique(y).tolist()), [0, 1])

    def test_fit_centroids_are_class_means(self):
        model = NearestCentroid().fit([[0, 0], [2, 0], [5, 5]], [0, 0, 1])
        np.testing.assert_allclose(model.centroids, [[1, 0], [5, 5]])

    def test_nearest_centroid_predicts_closest_class(self):
        model = NearestCentroid().fit([[0, 0], [4, 4]], [0, 1])
        self.assertEqual(model.predict([[1, 1], [3, 3]]).tolist(), [0, 1])

    def test_score_is_fraction_of_correct_rows(self):
        model = NearestCentroid().fit([[0, 0], [4, 4]], [0, 1])
        self.assertEqual(model.score([[0, 0], [0, 0]], [0, 1]), 0.5)

    def test_split_is_reproducible_and_partitioned(self):
        X, y = generate_classification_data(10, 2, seed=3)
        parts = train_test_split(X, y, test_fraction=0.2, seed=9)
        again = train_test_split(X, y, test_fraction=0.2, seed=9)
        for left, right in zip(parts, again):
            np.testing.assert_array_equal(left, right)
        self.assertEqual(len(parts[0]) + len(parts[1]), len(X))

    def test_baselines_return_probabilities(self):
        self.assertGreaterEqual(random_baseline([0, 1, 1], [0, 1], seed=1), 0)
        self.assertLessEqual(random_baseline([0, 1, 1], [0, 1], seed=1), 1)
        self.assertEqual(majority_baseline([0, 1, 1], [1, 0]), 0.5)

    def test_invalid_inputs_are_rejected(self):
        with self.assertRaises(ValueError):
            generate_classification_data(0)
        with self.assertRaises(ValueError):
            train_test_split([[1]], [0], test_fraction=0)
        with self.assertRaises(RuntimeError):
            NearestCentroid().predict([[1, 2]])


if __name__ == "__main__":
    unittest.main()
