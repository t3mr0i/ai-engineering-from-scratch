# Numerical contract tests for phases/01-math-foundations/11-singular-value-decomposition/docs/en.md.
# They compare the local NumPy implementation with algebraic identities, not external libraries.
# Fixtures are small so the suite remains fast and deterministic.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.
# Julia is a parallel optional entry point and is checked statically when unavailable.

from __future__ import annotations

from pathlib import Path
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from svd import (  # noqa: E402
    compression_ratio,
    pseudoinverse_via_svd,
    reconstruct,
    svd_from_scratch,
    truncated_svd,
)


class SVDTests(unittest.TestCase):
    def test_scratch_svd_reconstructs_a_rectangular_matrix(self) -> None:
        np.random.seed(7)
        A = np.array([[3.0, 1.0], [1.0, 3.0], [2.0, -1.0]])
        U, S, V = svd_from_scratch(A)
        self.assertEqual(U.shape, (3, 2))
        self.assertEqual(S.shape, (2,))
        self.assertEqual(V.shape, (2, 2))
        self.assertTrue(np.allclose(reconstruct(U, S, V.T), A, atol=1e-6))

    def test_singular_values_are_descending(self) -> None:
        U, S, Vt = truncated_svd(np.diag([5.0, 2.0, 1.0]), 2)
        self.assertTrue(np.all(np.diff(S) <= 0.0))
        self.assertTrue(np.allclose(reconstruct(U, S, Vt), np.diag([5.0, 2.0, 0.0])))

    def test_truncated_rank_two_error_is_no_larger_than_rank_one(self) -> None:
        A = np.array([[3.0, 0.0, 0.0], [0.0, 2.0, 0.0], [0.0, 0.0, 1.0]])
        U1, S1, Vt1 = truncated_svd(A, 1)
        U2, S2, Vt2 = truncated_svd(A, 2)
        err1 = np.linalg.norm(A - reconstruct(U1, S1, Vt1))
        err2 = np.linalg.norm(A - reconstruct(U2, S2, Vt2))
        self.assertLessEqual(err2, err1)

    def test_pseudoinverse_solves_least_squares_projection(self) -> None:
        A = np.array([[1.0, 1.0], [2.0, 1.0], [3.0, 1.0]])
        b = np.array([3.0, 5.0, 6.0])
        x = pseudoinverse_via_svd(A) @ b
        self.assertTrue(np.allclose(A.T @ (A @ x - b), 0.0, atol=1e-8))

    def test_pseudoinverse_handles_rank_deficiency(self) -> None:
        A = np.array([[1.0, 2.0], [2.0, 4.0]])
        pinv = pseudoinverse_via_svd(A)
        self.assertTrue(np.allclose(A @ pinv @ A, A, atol=1e-8))

    def test_compression_ratio_matches_factor_storage(self) -> None:
        self.assertAlmostEqual(compression_ratio(100, 80, 5), 5 * (100 + 80 + 1) / 8000)

    def test_reconstruction_rejects_mismatched_factor_shapes_by_numpy(self) -> None:
        U = np.eye(3)[:, :2]
        with self.assertRaises(ValueError):
            reconstruct(U, np.array([1.0]), np.eye(2))


if __name__ == "__main__":
    unittest.main()
