"""Numerical regression tests for the bias/variance fixture."""

from pathlib import Path
import sys
import unittest
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import bias_variance


class BiasVarianceTests(unittest.TestCase):
    def test_true_function_is_vectorized(self):
        values = bias_variance.true_function(np.array([-1.0, 0.0, 1.0]))
        self.assertEqual(values.shape, (3,))
        self.assertAlmostEqual(float(values[1]), 0.0)

    def test_data_generation_repeats_for_seed(self):
        first = bias_variance.generate_data(12, seed=5)
        second = bias_variance.generate_data(12, seed=5)
        np.testing.assert_allclose(first[0], second[0])
        np.testing.assert_allclose(first[1], second[1])

    def test_polynomial_fit_predict_shapes(self):
        x = np.array([-1.0, 0.0, 1.0])
        y = 2 * x + 1
        weights = bias_variance.fit_polynomial(x, y, degree=1)
        self.assertEqual(weights.shape, (2,))
        np.testing.assert_allclose(bias_variance.predict_polynomial(x, weights), y, atol=1e-10)

    def test_ridge_penalty_changes_non_intercept_solution(self):
        x = np.linspace(-1, 1, 10)
        y = x**3
        plain = bias_variance.fit_polynomial(x, y, degree=5, lam=0.0)
        ridge = bias_variance.fit_polynomial(x, y, degree=5, lam=10.0)
        self.assertLess(np.linalg.norm(ridge[1:]), np.linalg.norm(plain[1:]))

    def test_decomposition_contains_nonnegative_terms(self):
        result = bias_variance.bias_variance_decomposition([1, 3], n_bootstrap=12, n_train=20, n_test=30)
        self.assertEqual(set(result), {1, 3})
        for terms in result.values():
            self.assertGreaterEqual(terms["bias_sq"], 0.0)
            self.assertGreaterEqual(terms["variance"], 0.0)
            self.assertGreaterEqual(terms["total_error"], 0.0)
            self.assertAlmostEqual(terms["noise"], 0.25)

    def test_find_optimal_returns_known_degree_key(self):
        result = {1: {"total_error": 2.0}, 2: {"total_error": 1.0}}
        self.assertEqual(bias_variance.find_optimal(result), 2)


if __name__ == "__main__":
    unittest.main()
