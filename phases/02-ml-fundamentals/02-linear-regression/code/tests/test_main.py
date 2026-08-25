import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from linear_regression import (  # noqa: E402
    LinearRegression,
    LinearRegressionNormal,
    MultipleLinearRegression,
    PolynomialRegression,
    RidgeRegression,
    standardize,
)


class LinearRegressionTests(unittest.TestCase):
    def setUp(self):
        self.X = [0, 1, 2, 3, 4]
        self.y = [7, 10, 13, 16, 19]

    def test_gradient_descent_reduces_cost(self):
        model = LinearRegression(learning_rate=0.01).fit(self.X, self.y, epochs=800)
        self.assertLess(model.cost_history[-1], model.cost_history[0])
        self.assertAlmostEqual(model.w, 3, delta=0.08)
        self.assertAlmostEqual(model.b, 7, delta=0.08)

    def test_gradient_and_normal_equation_agree(self):
        gradient = LinearRegression(learning_rate=0.01).fit(self.X, self.y, epochs=800)
        normal = LinearRegressionNormal().fit(self.X, self.y)
        self.assertAlmostEqual(gradient.w, normal.w, delta=0.08)
        self.assertAlmostEqual(gradient.b, normal.b, delta=0.08)

    def test_normal_equation_r_squared_is_one_for_line(self):
        model = LinearRegressionNormal().fit(self.X, self.y)
        self.assertAlmostEqual(model.r_squared(self.X, self.y), 1.0)

    def test_standardize_returns_zero_means_and_unit_scales(self):
        scaled, means, stds = standardize([[1, 10], [2, 20], [3, 30]])
        self.assertEqual(means, [2, 20])
        self.assertAlmostEqual(stds[0], (2 / 3) ** 0.5)
        self.assertAlmostEqual(sum(row[0] for row in scaled) / 3, 0.0)
        self.assertAlmostEqual(sum(row[1] for row in scaled) / 3, 0.0)

    def test_multiple_regression_learns_two_coefficients(self):
        X = [[x, 2 * x] for x in range(1, 7)]
        y = [4 * row[0] + 2 * row[1] + 1 for row in X]
        model = MultipleLinearRegression(2, learning_rate=0.01).fit(X, y, epochs=1500)
        self.assertAlmostEqual(model.predict([[3, 6]])[0], 25, delta=0.2)

    def test_polynomial_features_have_expected_powers(self):
        model = PolynomialRegression(3)
        self.assertEqual(model.make_features([2]), [[2, 4, 8]])

    def test_ridge_shrinks_weights_and_rejects_invalid_alpha(self):
        with self.assertRaises(ValueError):
            RidgeRegression(2, alpha=-1)
        plain = MultipleLinearRegression(2, learning_rate=0.01).fit([[1, 0], [2, 0], [3, 0]], [1, 2, 3], epochs=500)
        ridge = RidgeRegression(2, learning_rate=0.01, alpha=1).fit([[1, 0], [2, 0], [3, 0]], [1, 2, 3], epochs=500)
        self.assertLess(abs(ridge.weights[0]), abs(plain.weights[0]))

    def test_shape_and_empty_contracts(self):
        with self.assertRaises(ValueError):
            LinearRegression().fit([], [])
        with self.assertRaises(ValueError):
            MultipleLinearRegression(2).fit([[1]], [1])


if __name__ == "__main__":
    unittest.main()
