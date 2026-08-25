# Convex-optimization tests for phases/01-math-foundations/18-convex-optimization/docs/en.md.
# They use analytic fixtures so a sampled convexity check is tied to known behavior.
# The implementation is Python standard-library only.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.

from __future__ import annotations

import math
from pathlib import Path
import random
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from convex import (  # noqa: E402
    GradientDescent,
    check_convexity,
    hessian_eigenvalues_2d,
    invert_2x2,
    is_positive_semidefinite_2d,
    lagrange_solve,
    newtons_method,
    optimize_gd,
)


class ConvexOptimizationTests(unittest.TestCase):
    def test_sampled_convexity_distinguishes_bowl_and_sine(self) -> None:
        random.seed(7)
        bowl, bowl_violations = check_convexity(lambda x: x[0] ** 2, 1, samples=300)
        random.seed(7)
        sine, sine_violations = check_convexity(lambda x: math.sin(x[0]), 1, samples=300)
        self.assertTrue(bowl)
        self.assertEqual(bowl_violations, 0)
        self.assertFalse(sine)
        self.assertGreater(sine_violations, 0)

    def test_hessian_eigenvalues_and_psd_decision(self) -> None:
        eigenvalues = hessian_eigenvalues_2d([[10.0, 0.0], [0.0, 2.0]])
        self.assertEqual(eigenvalues, (10.0, 2.0))
        self.assertTrue(is_positive_semidefinite_2d([[10.0, 0.0], [0.0, 2.0]]))
        self.assertFalse(is_positive_semidefinite_2d([[2.0, 0.0], [0.0, -2.0]]))

    def test_gradient_descent_reduces_quadratic(self) -> None:
        objective = lambda x: x[0] ** 2 + 3.0 * x[1] ** 2
        gradient = lambda x: [2.0 * x[0], 6.0 * x[1]]
        history = optimize_gd(gradient, [2.0, 1.0], lr=0.05, steps=200)
        self.assertLess(objective(history[-1]), objective(history[0]))
        self.assertLess(objective(history[-1]), 1e-8)

    def test_newton_reaches_quadratic_minimum(self) -> None:
        gradient = lambda x: [2.0 * x[0], 6.0 * x[1]]
        hessian = lambda x: [[2.0, 0.0], [0.0, 6.0]]
        history = newtons_method(gradient, hessian, [2.0, 1.0], steps=5)
        self.assertEqual(history[-1], [0.0, 0.0])
        self.assertLessEqual(len(history), 3)

    def test_lagrange_loop_approaches_equality_solution(self) -> None:
        history = lagrange_solve(
            lambda x: [2.0 * x[0], 2.0 * x[1]],
            lambda x: x[0] + x[1] - 1.0,
            lambda x: [1.0, 1.0],
            [0.0, 0.0],
            lr=0.01,
            lr_lambda=0.01,
            steps=5000,
        )
        point, _, constraint_value = history[-1]
        self.assertAlmostEqual(point[0], 0.5, places=3)
        self.assertAlmostEqual(point[1], 0.5, places=3)
        self.assertAlmostEqual(constraint_value, 0.0, places=3)

    def test_two_by_two_inverse_reconstructs_matrix(self) -> None:
        matrix = [[4.0, 1.0], [2.0, 3.0]]
        inverse = invert_2x2(matrix)
        self.assertIsNotNone(inverse)
        product = [
            [sum(matrix[i][k] * inverse[k][j] for k in range(2)) for j in range(2)]
            for i in range(2)
        ]
        self.assertAlmostEqual(product[0][0], 1.0)
        self.assertAlmostEqual(product[1][1], 1.0)

    def test_singular_hessian_returns_no_inverse(self) -> None:
        self.assertIsNone(invert_2x2([[1.0, 2.0], [2.0, 4.0]]))

    def test_gradient_descent_step_has_expected_direction(self) -> None:
        self.assertEqual(GradientDescent(lr=0.1).step([2.0, -1.0], [4.0, -2.0]), [1.6, -0.8])


if __name__ == "__main__":
    unittest.main()
