# Fourier-transform tests for phases/01-math-foundations/20-fourier-transform/docs/en.md.
# They verify transform conventions, spectral fixtures, and linear-convolution padding.
# The implementation is Python standard-library only.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.

from __future__ import annotations

import math
from pathlib import Path
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from fourier import (  # noqa: E402
    Complex,
    apply_window,
    convolve_direct,
    convolve_fft,
    dft,
    fft,
    generate_signal,
    hann_window,
    hamming_window,
    idft,
    ifft,
    magnitude_spectrum,
    positional_encoding,
    spectral_analysis,
)


class FourierTransformTests(unittest.TestCase):
    def test_constant_signal_has_only_dc_coefficient(self) -> None:
        spectrum = dft([1.0, 1.0, 1.0, 1.0])
        self.assertAlmostEqual(spectrum[0].real, 4.0)
        for coefficient in spectrum[1:]:
            self.assertAlmostEqual(coefficient.magnitude(), 0.0, places=10)

    def test_dft_and_idft_round_trip(self) -> None:
        signal = [1.0, -2.0, 0.5, 3.0]
        reconstructed = idft(dft(signal))
        for value, expected in zip(reconstructed, signal):
            self.assertAlmostEqual(value.real, expected, places=10)
            self.assertAlmostEqual(value.imag, 0.0, places=10)

    def test_radix_two_fft_matches_direct_dft(self) -> None:
        signal = [math.sin(0.3 * i) for i in range(8)]
        for actual, expected in zip(fft(signal), dft(signal)):
            self.assertAlmostEqual(actual.real, expected.real, places=10)
            self.assertAlmostEqual(actual.imag, expected.imag, places=10)

    def test_odd_length_fft_uses_the_same_transform_contract(self) -> None:
        signal = [0.0, 1.0, -1.0, 2.0, 0.5]
        for actual, expected in zip(fft(signal), dft(signal)):
            self.assertAlmostEqual(actual.real, expected.real, places=10)
            self.assertAlmostEqual(actual.imag, expected.imag, places=10)

    def test_sine_peak_is_at_its_frequency_bin(self) -> None:
        signal = generate_signal([5.0], [1.0], 32, 32)
        magnitudes = magnitude_spectrum(dft(signal))
        self.assertEqual(max(range(17), key=lambda index: magnitudes[index]), 5)
        self.assertAlmostEqual(magnitudes[5], 16.0, places=8)

    def test_fft_convolution_matches_direct_convolution(self) -> None:
        expected = convolve_direct([1.0, 2.0, 3.0], [2.0, -1.0])
        self.assertEqual(expected, [2.0, 3.0, 4.0, -3.0])
        for actual, reference in zip(convolve_fft([1.0, 2.0, 3.0], [2.0, -1.0]), expected):
            self.assertAlmostEqual(actual, reference, places=10)

    def test_window_and_spectral_analysis_shapes(self) -> None:
        window = hann_window(8)
        self.assertEqual(len(window), 8)
        self.assertAlmostEqual(window[0], 0.0)
        self.assertAlmostEqual(window[-1], 0.0)
        self.assertEqual(len(apply_window([1.0] * 8, hamming_window(8))), 8)
        frequencies, magnitudes = spectral_analysis([1.0] * 8, 8.0)
        self.assertEqual(len(frequencies), 5)
        self.assertEqual(len(magnitudes), 5)

    def test_positional_encoding_has_requested_dimension(self) -> None:
        encoding = positional_encoding(0, 4)
        self.assertEqual(encoding, [0.0, 1.0, 0.0, 1.0])
        self.assertEqual(len(positional_encoding(3, 8)), 8)


if __name__ == "__main__":
    unittest.main()
