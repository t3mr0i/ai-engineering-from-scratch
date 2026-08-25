import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from knn import (  # noqa: E402
    KDTree,
    KNN,
    cosine_distance,
    l1_distance,
    l2_distance,
    minkowski_distance,
    mse,
    standardize,
)


class KNNTests(unittest.TestCase):
    def test_distance_values(self):
        self.assertAlmostEqual(l1_distance([1, 2], [4, 6]), 7)
        self.assertAlmostEqual(l2_distance([1, 2], [4, 6]), 5)
        self.assertAlmostEqual(cosine_distance([1, 0], [2, 0]), 0)

    def test_minkowski_variants(self):
        self.assertAlmostEqual(minkowski_distance([0, 0], [3, 4], 2), 5)
        self.assertEqual(minkowski_distance([0, 0], [3, 4], float("inf")), 4)

    def test_classification_majority_and_weighted_vote(self):
        model = KNN(k=3).fit([[0], [1], [10]], ["near", "near", "far"])
        self.assertEqual(model.predict([[0.5]]), ["near"])
        nearest = KNN(k=1).fit([[0], [1], [10]], ["near", "near", "far"])
        self.assertEqual(nearest.predict([[0.5], [9.5]]), ["near", "far"])
        weighted = KNN(k=2, weighted=True).fit([[0], [10]], ["near", "far"])
        self.assertEqual(weighted.predict([[0.1]]), ["near"])

    def test_regression_and_mse(self):
        model = KNN(k=3, task="regression").fit([[0], [1], [2]], [10, 14, 16])
        self.assertAlmostEqual(model.predict([[1]])[0], 40 / 3)
        self.assertAlmostEqual(mse([10, 14], [11, 12]), 2.5)

    def test_standardize_and_constant_column(self):
        scaled, means, stds = standardize([[1, 10], [2, 10], [3, 10]])
        self.assertEqual(means, [2, 10])
        self.assertEqual(scaled[0][1], 0.0)
        self.assertGreater(stds[0], 0)

    def test_kdtree_returns_nearest_original_index(self):
        tree = KDTree([[0, 0], [5, 5], [1, 0]])
        result = tree.query([0.2, 0], k=2)
        self.assertEqual([row[1] for row in result], [0, 2])

    def test_predict_with_neighbors_preserves_training_indices(self):
        model = KNN(k=2, weighted=True).fit([[0], [10], [20]], ["zero", "ten", "twenty"])
        prediction, neighbors = model.predict_with_neighbors([11])
        self.assertEqual(prediction, "ten")
        self.assertEqual([item[1] for item in neighbors], [1, 2])
        self.assertEqual([item[2] for item in neighbors], ["ten", "twenty"])

    def test_invalid_shapes_and_k_are_rejected(self):
        with self.assertRaises(ValueError):
            l2_distance([1], [1, 2])
        with self.assertRaises(ValueError):
            KNN(k=0)
        with self.assertRaises(ValueError):
            KNN(k=4).fit([[0], [1]], [0, 1])
        with self.assertRaises(ValueError):
            minkowski_distance([0], [1], 0)


if __name__ == "__main__":
    unittest.main()
