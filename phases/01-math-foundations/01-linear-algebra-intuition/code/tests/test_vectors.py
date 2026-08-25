"""Behavioral tests for the from-scratch vector and matrix primitives."""

from __future__ import annotations

import math
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))
from vectors import Matrix, Vector, gram_schmidt, is_independent  # noqa: E402


class VectorTests(unittest.TestCase):
    def test_vector_arithmetic_and_dot(self):
        a, b = Vector([1, 2]), Vector([3, 4])
        self.assertEqual((a + b).components, [4, 6])
        self.assertEqual((b - a).components, [2, 2])
        self.assertEqual(a.dot(b), 11)

    def test_norm_and_cosine(self):
        self.assertAlmostEqual(Vector([3, 4]).magnitude(), 5.0)
        self.assertAlmostEqual(Vector([1, 0]).cosine_similarity(Vector([2, 0])), 1.0)
        self.assertAlmostEqual(Vector([1, 0]).angle_between(Vector([0, 1])), 90.0)

    def test_projection_has_orthogonal_residual(self):
        a, b = Vector([3, 4]), Vector([1, 0])
        projection = a.project_onto(b)
        self.assertEqual(projection.components, [3.0, 0.0])
        self.assertAlmostEqual((a - projection).dot(b), 0.0)

    def test_gram_schmidt_returns_orthonormal_vectors(self):
        basis = gram_schmidt([Vector([1, 1]), Vector([1, 0])])
        self.assertEqual(len(basis), 2)
        self.assertAlmostEqual(basis[0].magnitude(), 1.0)
        self.assertAlmostEqual(basis[1].magnitude(), 1.0)
        self.assertAlmostEqual(basis[0].dot(basis[1]), 0.0)

    def test_independence_and_rank(self):
        e1, e2 = Vector([1, 0]), Vector([0, 1])
        self.assertTrue(is_independent([e1, e2]))
        self.assertFalse(is_independent([e1, Vector([2, 0])]))
        self.assertEqual(Matrix([[1, 2], [2, 4]]).rank(), 1)

    def test_matrix_vector_product_and_transpose(self):
        matrix = Matrix([[1, 2, 3], [0, 1, 0]])
        self.assertEqual((matrix @ Vector([2, 1, 4])).components, [16, 1])
        self.assertEqual(matrix.transpose().shape, (3, 2))

    def test_invalid_zero_and_shape_inputs_are_explicit(self):
        with self.assertRaises(ValueError):
            Vector([0, 0]).normalize()
        with self.assertRaises(ValueError):
            Vector([1]).dot(Vector([1, 2]))
        with self.assertRaises(ValueError):
            Matrix([[1, 2]]) @ Vector([1])

    def test_canonical_demo_exits_successfully(self):
        result = subprocess.run(
            [sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Matrix Rank", result.stdout)


if __name__ == "__main__":
    unittest.main()
