# Formula tests for phases/01-math-foundations/14-norms-and-distances/docs/en.md.
# The suite is stdlib-only and checks the exact metrics used by the local retrieval fixtures.
# It also covers empty/zero-direction behavior and nearest-neighbor ordering.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.
# No external vector database or scientific package is required.

from __future__ import annotations

from pathlib import Path
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from distances import (  # noqa: E402
    cosine_distance,
    cosine_similarity,
    edit_distance,
    find_k_nearest,
    find_nearest_neighbor,
    compute_covariance,
    invert_matrix,
    jaccard_similarity,
    kl_divergence,
    l1_distance,
    l1_norm,
    l2_distance,
    l2_norm,
    linf_distance,
    lp_distance,
    mahalanobis_distance,
    dot_product,
    wasserstein_1d,
)


class DistanceTests(unittest.TestCase):
    def test_norms_match_their_definitions(self) -> None:
        self.assertEqual(l1_norm([3, -4]), 7)
        self.assertEqual(l2_norm([3, -4]), 5)

    def test_cosine_ignores_positive_magnitude(self) -> None:
        self.assertAlmostEqual(cosine_similarity([1, 0], [2, 0]), 1.0)
        self.assertAlmostEqual(cosine_distance([1, 0], [2, 0]), 0.0)
        self.assertEqual(cosine_similarity([0, 0], [1, 0]), 0.0)

    def test_jaccard_and_edit_distance(self) -> None:
        self.assertAlmostEqual(jaccard_similarity({"a", "b", "c"}, {"b", "c", "d"}), 0.5)
        self.assertEqual(edit_distance("kitten", "sitting"), 3)

    def test_wasserstein_responds_to_bin_shifts(self) -> None:
        self.assertAlmostEqual(wasserstein_1d([1.0, 0.0], [0.0, 1.0]), 1.0)
        self.assertAlmostEqual(wasserstein_1d([0.5, 0.5], [0.5, 0.5]), 0.0)

    def test_matrix_inverse_and_mahalanobis(self) -> None:
        covariance = [[2.0, 0.0], [0.0, 4.0]]
        inverse = invert_matrix(covariance)
        self.assertEqual(inverse, [[0.5, 0.0], [0.0, 0.25]])
        self.assertAlmostEqual(mahalanobis_distance([0, 0], [2, 0], covariance), 2 / 2**0.5)

    def test_nearest_neighbor_uses_distance_order(self) -> None:
        points = [[0, 0], [3, 4], [1, 1]]
        self.assertEqual(find_nearest_neighbor([0, 0], points, lambda a, b: sum((x-y)**2 for x, y in zip(a, b)))[0], 0)
        self.assertEqual([idx for idx, _ in find_k_nearest([0, 0], points, lambda a, b: sum((x-y)**2 for x, y in zip(a, b)), k=2)], [0, 2])

    def test_singular_covariance_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            invert_matrix([[1.0, 2.0], [2.0, 4.0]])

    def test_coordinatewise_metrics_reject_empty_or_mismatched_vectors(self) -> None:
        pairwise = [
            l1_distance,
            l2_distance,
            lambda a, b: lp_distance(a, b, 2),
            linf_distance,
            dot_product,
            cosine_similarity,
            kl_divergence,
            wasserstein_1d,
        ]
        for metric in pairwise:
            with self.subTest(metric=metric):
                with self.assertRaises(ValueError):
                    metric([1.0, 2.0], [1.0])
                with self.assertRaises(ValueError):
                    metric([], [])

    def test_lp_order_and_mahalanobis_shape_are_validated(self) -> None:
        with self.assertRaises(ValueError):
            lp_distance([1.0], [2.0], 0)
        with self.assertRaises(ValueError):
            lp_distance([1.0], [2.0], -2)
        with self.assertRaises(ValueError):
            mahalanobis_distance([0.0], [1.0], [[1.0, 0.0], [0.0, 1.0]])
        with self.assertRaises(ValueError):
            mahalanobis_distance([0.0, 1.0], [1.0, 2.0], [[1.0, 0.0, 0.0]])

    def test_dataset_and_k_contracts_are_explicit(self) -> None:
        distance = lambda a, b: sum((x - y) ** 2 for x, y in zip(a, b))
        with self.assertRaises(ValueError):
            find_nearest_neighbor([0, 0], [], distance)
        with self.assertRaises(ValueError):
            find_k_nearest([0, 0], [[0, 0], [1, 1]], distance, k=0)
        with self.assertRaises(ValueError):
            find_k_nearest([0, 0], [[0, 0], [1, 1]], distance, k=3)
        with self.assertRaises(ValueError):
            find_k_nearest([0, 0], [[0], [1]], distance, k=1)

    def test_covariance_requires_nonempty_consistent_rows(self) -> None:
        with self.assertRaises(ValueError):
            compute_covariance([])
        with self.assertRaises(ValueError):
            compute_covariance([[1.0]])
        with self.assertRaises(ValueError):
            compute_covariance([[1.0, 2.0], [3.0]])


if __name__ == "__main__":
    unittest.main()
