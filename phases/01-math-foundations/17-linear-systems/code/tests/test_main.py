# Numerical solver tests for phases/01-math-foundations/17-linear-systems/docs/en.md.
# They compare each from-scratch path with residuals or NumPy linear algebra.
# Fixtures stay small and local; NumPy is the only required dependency.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.

from __future__ import annotations

from pathlib import Path
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from linear_systems import (  # noqa: E402
    cholesky,
    cholesky_solve,
    condition_number,
    conjugate_gradient,
    gaussian_elimination,
    least_squares_normal,
    lu_decompose,
    lu_solve,
    ridge_regression,
)


class LinearSystemTests(unittest.TestCase):
    def test_gaussian_elimination_pivots_and_solves(self) -> None:
        matrix = np.array([[0.0, 1.0], [1.0, 1.0]])
        target = np.array([1.0, 2.0])
        solution = gaussian_elimination(matrix, target)
        np.testing.assert_allclose(solution, [1.0, 1.0])
        np.testing.assert_allclose(matrix @ solution, target)

    def test_lu_factorization_reconstructs_and_reuses_right_hand_sides(self) -> None:
        matrix = np.array([[2.0, 1.0, 1.0], [4.0, 3.0, 3.0], [2.0, 3.0, 1.0]])
        permutation, lower, upper = lu_decompose(matrix)
        np.testing.assert_allclose(permutation @ matrix, lower @ upper)
        for target in (np.array([8.0, 20.0, 12.0]), np.array([1.0, 0.0, 0.0])):
            np.testing.assert_allclose(lu_solve(permutation, lower, upper, target), np.linalg.solve(matrix, target))

    def test_cholesky_factor_and_solve(self) -> None:
        matrix = np.array([[4.0, 2.0], [2.0, 5.0]])
        factor = cholesky(matrix)
        np.testing.assert_allclose(factor @ factor.T, matrix)
        np.testing.assert_allclose(cholesky_solve(factor, np.array([6.0, 9.0])), np.linalg.solve(matrix, [6.0, 9.0]))

    def test_least_squares_matches_lstsq_on_overdetermined_fixture(self) -> None:
        design = np.array([[1.0, 0.0], [1.0, 1.0], [1.0, 2.0], [1.0, 3.0]])
        target = np.array([1.0, 3.0, 5.0, 7.0])
        np.testing.assert_allclose(least_squares_normal(design, target), [1.0, 2.0], atol=1e-10)
        np.testing.assert_allclose(least_squares_normal(design, target), np.linalg.lstsq(design, target, rcond=None)[0])

    def test_ridge_regularization_reduces_weight_norm(self) -> None:
        design = np.array([[1.0, 0.0], [1.0, 1.0], [1.0, 2.0], [1.0, 3.0]])
        target = np.array([1.0, 3.0, 5.0, 7.0])
        ordinary = least_squares_normal(design, target)
        ridge = ridge_regression(design, target, 10.0)
        self.assertLess(np.linalg.norm(ridge), np.linalg.norm(ordinary))

    def test_condition_number_detects_collinearity(self) -> None:
        well_conditioned = condition_number(np.eye(2))
        ill_conditioned = condition_number(np.array([[1.0, 1.0], [1.0, 1.0 + 1e-10]]))
        self.assertAlmostEqual(well_conditioned, 1.0)
        self.assertGreater(ill_conditioned, 1e9)

    def test_conjugate_gradient_matches_direct_solution(self) -> None:
        matrix = np.array([[4.0, 1.0], [1.0, 3.0]])
        target = np.array([1.0, 2.0])
        solution, iterations = conjugate_gradient(matrix, target, tol=1e-12)
        np.testing.assert_allclose(solution, np.linalg.solve(matrix, target), atol=1e-10)
        self.assertLessEqual(iterations, 2)

    def test_cholesky_rejects_non_positive_definite_matrix(self) -> None:
        with self.assertRaises(ValueError):
            cholesky(np.array([[1.0, 2.0], [2.0, 1.0]]))


if __name__ == "__main__":
    unittest.main()
