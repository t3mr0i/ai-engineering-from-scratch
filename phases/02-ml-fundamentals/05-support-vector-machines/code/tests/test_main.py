import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from svm import (  # noqa: E402
    LinearSVM,
    accuracy,
    compute_kernel_matrix,
    dot,
    hinge_loss,
    linear_kernel,
    polynomial_kernel,
    rbf_kernel,
    vec_norm,
)


class SVMTests(unittest.TestCase):
    def test_vector_and_kernel_identities(self):
        self.assertEqual(dot([1, 2], [3, 4]), 11)
        self.assertEqual(linear_kernel([1, 2], [3, 4]), 11)
        self.assertAlmostEqual(vec_norm([3, 4]), 5)

    def test_hinge_loss_zero_outside_margin(self):
        self.assertAlmostEqual(hinge_loss([[2]], [1], [1], 0), 0.0)
        self.assertAlmostEqual(hinge_loss([[0.5]], [1], [1], 0), 0.5)

    def test_kernel_values_and_symmetry(self):
        self.assertAlmostEqual(polynomial_kernel([1], [1], degree=2, c=1), 4)
        self.assertAlmostEqual(rbf_kernel([0], [0]), 1.0)
        matrix = compute_kernel_matrix([[0], [1], [2]], rbf_kernel)
        self.assertEqual(matrix, [list(row) for row in zip(*matrix)])

    def test_linear_svm_learns_separable_fixture(self):
        X = [[-2], [-1], [1], [2]]
        y = [-1, -1, 1, 1]
        model = LinearSVM(lr=0.01, lambda_param=0.01, n_epochs=200).fit(X, y)
        self.assertGreaterEqual(accuracy(y, model.predict(X)), 0.75)
        self.assertGreater(model.margin_width(), 0)

    def test_decision_function_has_signed_margin(self):
        model = LinearSVM(lr=0.01, lambda_param=0.01, n_epochs=50).fit([[-1], [1]], [-1, 1])
        values = model.decision_function([[-1], [1]])
        self.assertLess(values[0], values[1])

    def test_support_vector_indices_are_in_range(self):
        X = [[-2], [-1], [1], [2]]
        y = [-1, -1, 1, 1]
        model = LinearSVM(n_epochs=100).fit(X, y)
        indices = model.find_support_vectors(X, y, tol=10)
        self.assertTrue(all(0 <= index < len(X) for index in indices))

    def test_fitted_methods_have_explicit_contracts(self):
        model = LinearSVM()
        with self.assertRaises(RuntimeError):
            model.decision_function([[0]])
        with self.assertRaises(RuntimeError):
            model.margin_width()
        with self.assertRaises(RuntimeError):
            model.find_support_vectors([[0]], [1])
        model.fit([[-1], [1]], [-1, 1])
        with self.assertRaises(ValueError):
            model.decision_function([[]])
        with self.assertRaises(ValueError):
            model.find_support_vectors([[-1], [1]], [0, 1])
        with self.assertRaises(ValueError):
            model.find_support_vectors([[-1]], [-1], tol=-1)

    def test_invalid_vectors_and_labels_are_rejected(self):
        with self.assertRaises(ValueError):
            dot([1], [1, 2])
        with self.assertRaises(ValueError):
            LinearSVM().fit([[1]], [0])
        with self.assertRaises(ValueError):
            rbf_kernel([0], [1], gamma=0)


if __name__ == "__main__":
    unittest.main()
