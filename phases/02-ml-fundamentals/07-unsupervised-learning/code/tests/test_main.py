import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from clustering import (  # noqa: E402
    agglomerative_clustering,
    compute_inertia,
    dbscan,
    euclidean_distance,
    gmm,
    kmeans,
    make_blobs,
    make_moons,
    silhouette_score,
)


class ClusteringTests(unittest.TestCase):
    def setUp(self):
        self.data, self.truth = make_blobs([[0, 0], [5, 5]], n_per_cluster=8, spread=0.05, seed=4)

    def test_distance_requires_matching_nonempty_vectors(self):
        self.assertAlmostEqual(euclidean_distance([0, 0], [3, 4]), 5)
        with self.assertRaises(ValueError):
            euclidean_distance([0], [0, 1])

    def test_kmeans_returns_assignments_centroids_and_low_inertia(self):
        assignments, centroids = kmeans(self.data, 2, seed=3)
        self.assertEqual(len(assignments), len(self.data))
        self.assertEqual(len(centroids), 2)
        self.assertLess(compute_inertia(self.data, assignments, centroids), 1)

    def test_silhouette_is_high_for_separated_blobs(self):
        assignments, _ = kmeans(self.data, 2, seed=3)
        self.assertGreater(silhouette_score(self.data, assignments), 0.8)

    def test_dbscan_finds_two_dense_groups(self):
        labels = dbscan(self.data, eps=0.3, min_samples=2)
        self.assertEqual(len({label for label in labels if label >= 0}), 2)

    def test_gmm_responsibilities_are_probabilities(self):
        assignments, means, weights, responsibilities = gmm(self.data, 2, max_iterations=30, seed=2)
        self.assertEqual(len(assignments), len(self.data))
        self.assertEqual(len(means), 2)
        self.assertAlmostEqual(sum(weights), 1.0, places=5)
        self.assertTrue(all(abs(sum(row) - 1) < 1e-6 for row in responsibilities))

    def test_gmm_normalizes_responsibilities_in_high_dimension(self):
        data = [[0.0] * 1000, [1.0] * 1000]
        _, _, _, responsibilities = gmm(data, 2, max_iterations=10, seed=5)
        for row in responsibilities:
            self.assertTrue(all(value >= 0 and math.isfinite(value) for value in row))
            self.assertAlmostEqual(sum(row), 1.0, places=12)

    def test_agglomerative_history_has_one_merge_per_reduction(self):
        labels, history = agglomerative_clustering(self.data[:6], n_clusters=2, linkage="average")
        self.assertEqual(len(labels), 6)
        self.assertEqual(len(history), 4)

    def test_moons_fixture_has_expected_size(self):
        data, labels = make_moons(20, noise=0, seed=1)
        self.assertEqual((len(data), len(labels)), (20, 20))
        odd_data, odd_labels = make_moons(21, noise=0, seed=1)
        self.assertEqual((len(odd_data), len(odd_labels)), (21, 21))

    def test_parameter_contracts_are_explicit(self):
        with self.assertRaises(ValueError):
            kmeans(self.data, 0)
        with self.assertRaises(ValueError):
            dbscan(self.data, eps=0, min_samples=2)
        with self.assertRaises(ValueError):
            gmm(self.data, 99)


if __name__ == "__main__":
    unittest.main()
