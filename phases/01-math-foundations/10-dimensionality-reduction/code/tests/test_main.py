# Numerical contract tests for phases/01-math-foundations/10-dimensionality-reduction/docs/en.md.
# The tests use the local NumPy implementation and deterministic synthetic fixtures.
# No dataset download, plotting library, sklearn, or UMAP installation is needed.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.
# The canonical demo is tested separately from these focused numerical assertions.

from __future__ import annotations

from pathlib import Path
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from dim_reduction import (  # noqa: E402
    PCA,
    kernel_pca,
    make_concentric_circles,
    make_synthetic_data,
    reconstruction_error,
)


class DimensionalityReductionTests(unittest.TestCase):
    def test_pca_centers_and_projects_to_requested_shape(self) -> None:
        X = make_synthetic_data(n_samples=40)
        pca = PCA(2)
        reduced = pca.fit_transform(X)
        self.assertEqual(reduced.shape, (40, 2))
        self.assertTrue(np.allclose(reduced.mean(axis=0), 0.0, atol=1e-10))

    def test_pca_variance_ratios_are_ordered_and_bounded(self) -> None:
        pca = PCA(3).fit(make_synthetic_data(n_samples=60))
        ratios = pca.explained_variance_ratio_
        self.assertTrue(np.all(ratios >= 0.0))
        self.assertTrue(np.all(np.diff(ratios) <= 1e-12))
        self.assertAlmostEqual(float(ratios.sum()), 1.0, places=8)

    def test_pca_reconstruction_error_is_lower_with_more_components(self) -> None:
        X = make_synthetic_data(n_samples=80)
        one = PCA(1).fit_transform(X)
        three_pca = PCA(3)
        three = three_pca.fit_transform(X)
        self.assertLessEqual(
            reconstruction_error(X, three_pca.inverse_transform(three)),
            reconstruction_error(X, PCA(1).fit(X).inverse_transform(one)),
        )

    def test_pca_rejects_unfitted_and_wrong_feature_shapes(self) -> None:
        pca = PCA(2)
        with self.assertRaises(RuntimeError):
            pca.transform(np.zeros((2, 3)))
        pca.fit(np.zeros((3, 3)))
        with self.assertRaises(ValueError):
            pca.transform(np.zeros((2, 2)))

    def test_rbf_kernel_pca_is_centered_and_has_requested_shape(self) -> None:
        X, _ = make_concentric_circles(n_per_ring=20)
        projected = kernel_pca(X, n_components=2, gamma=0.5)
        self.assertEqual(projected.shape, (40, 2))
        self.assertTrue(np.allclose(projected.mean(axis=0), 0.0, atol=1e-10))

    def test_kernel_pca_rejects_unknown_kernel_and_bad_gamma(self) -> None:
        X, _ = make_concentric_circles(n_per_ring=5)
        with self.assertRaises(ValueError):
            kernel_pca(X, 2, kernel="made-up")
        with self.assertRaises(ValueError):
            kernel_pca(X, 2, gamma=0.0)

    def test_reconstruction_error_checks_shapes(self) -> None:
        with self.assertRaises(ValueError):
            reconstruction_error(np.zeros((2, 2)), np.zeros((2, 1)))


if __name__ == "__main__":
    unittest.main()
