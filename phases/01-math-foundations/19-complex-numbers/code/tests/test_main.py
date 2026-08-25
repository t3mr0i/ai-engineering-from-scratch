# Complex-number contract tests for phases/01-math-foundations/19-complex-numbers/docs/en.md.
# They exercise the operations used by the DFT and rotation demonstrations.
# The suite uses only the Python standard library and deterministic fixtures.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.

from __future__ import annotations

import math
from pathlib import Path
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from complex_numbers import (  # noqa: E402
    Complex,
    dft,
    euler,
    from_polar,
    idft,
    roots_of_unity,
    to_polar,
)


class ComplexNumberTests(unittest.TestCase):
    def test_arithmetic_matches_rectangular_rules(self) -> None:
        z = Complex(2, 3)
        w = Complex(1, -4)
        self.assertEqual(z + w, Complex(3, -1))
        self.assertEqual(z * w, Complex(14, -5))

    def test_conjugate_product_is_real_squared_magnitude(self) -> None:
        z = Complex(3, 4)
        product = z * z.conjugate()
        self.assertAlmostEqual(product.real, 25.0)
        self.assertAlmostEqual(product.imag, 0.0)
        self.assertAlmostEqual(z.magnitude() ** 2, product.real)

    def test_division_reconstructs_the_numerator(self) -> None:
        numerator = Complex(5, 2)
        denominator = Complex(1, -3)
        reconstructed = (numerator / denominator) * denominator
        self.assertAlmostEqual(reconstructed.real, numerator.real)
        self.assertAlmostEqual(reconstructed.imag, numerator.imag)

    def test_polar_round_trip_preserves_value(self) -> None:
        z = Complex(-2, 3)
        radius, phase = to_polar(z)
        self.assertAlmostEqual(from_polar(radius, phase).real, z.real)
        self.assertAlmostEqual(from_polar(radius, phase).imag, z.imag)

    def test_euler_rotation_preserves_unit_magnitude(self) -> None:
        rotated = euler(math.pi / 3)
        self.assertAlmostEqual(rotated.magnitude(), 1.0)
        self.assertAlmostEqual((euler(math.pi) + 1).magnitude(), 0.0, places=10)

    def test_roots_of_unity_sum_to_zero(self) -> None:
        total = Complex(0, 0)
        for root in roots_of_unity(8):
            total = total + root
        self.assertAlmostEqual(total.real, 0.0, places=10)
        self.assertAlmostEqual(total.imag, 0.0, places=10)

    def test_dft_idft_round_trip(self) -> None:
        signal = [1.0, -2.0, 0.5, 3.0]
        reconstructed = idft(dft(signal))
        for actual, expected in zip(reconstructed, signal):
            self.assertAlmostEqual(actual.real, expected, places=10)
            self.assertAlmostEqual(actual.imag, 0.0, places=10)

    def test_division_by_zero_is_rejected(self) -> None:
        with self.assertRaises(ZeroDivisionError):
            Complex(1, 2) / Complex(0, 0)


if __name__ == "__main__":
    unittest.main()
