from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("convolution_lesson", CODE / "main.py")
conv = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(conv)


class ConvolutionTests(unittest.TestCase):
    def test_identity_kernel_is_cross_correlation_with_padding(self) -> None:
        image = np.arange(9, dtype=np.float32).reshape(1, 3, 3)
        identity = conv.KERNELS["identity"][None, None]
        np.testing.assert_allclose(conv.conv2d_naive(image, identity, padding=1)[0], image[0])

    def test_naive_and_im2col_agree_with_dilation(self) -> None:
        rng = np.random.default_rng(4)
        image = rng.normal(size=(2, 8, 9))
        kernel = rng.normal(size=(3, 2, 2, 3))
        bias = np.array([0.2, -0.4, 1.0])
        expected = conv.conv2d_naive(image, kernel, bias, stride=2, padding=2, dilation=2)
        actual = conv.conv2d_im2col(image, kernel, bias, stride=2, padding=2, dilation=2)
        np.testing.assert_allclose(actual, expected, rtol=1e-6, atol=1e-6)

    def test_output_size_matches_shape_formula(self) -> None:
        self.assertEqual(conv.output_size(32, 3, 1, 1), 32)
        self.assertEqual(conv.output_size(32, 3, 1, 2), 16)
        self.assertEqual(conv.output_size(10, 3, 0, 1, 2), 6)
        with self.assertRaises(ValueError):
            conv.output_size(2, 5)

    def test_im2col_scan_order_is_reconstructable(self) -> None:
        image = np.arange(16, dtype=np.float32).reshape(1, 4, 4)
        columns, height, width = conv.im2col(image, 2, 2)
        self.assertEqual((height, width), (3, 3))
        np.testing.assert_array_equal(columns[:, 0], [0, 1, 4, 5])
        np.testing.assert_array_equal(columns[:, -1], [10, 11, 14, 15])

    def test_max_pool_takes_spatial_maxima(self) -> None:
        image = np.array([[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]], dtype=np.float32)
        np.testing.assert_array_equal(conv.max_pool2d(image, 2), [[[6, 8], [14, 16]]])

    def test_max_pool_padding_uses_a_lower_neutral_value(self) -> None:
        negative = -np.arange(1, 10, dtype=np.float32).reshape(1, 3, 3)
        pooled = conv.max_pool2d(negative, kernel=2, stride=1, padding=1)
        self.assertEqual(float(pooled[0, 0, 0]), -1.0)

        negative_int = -np.arange(1, 10, dtype=np.int16).reshape(1, 3, 3)
        pooled_int = conv.max_pool2d(negative_int, kernel=2, stride=1, padding=1)
        self.assertEqual(int(pooled_int[0, 0, 0]), -1)

    def test_receptive_field_accounts_for_stride_and_dilation(self) -> None:
        self.assertEqual(conv.receptive_field([(3, 1), (3, 2), (3, 1)]), 9)
        self.assertEqual(conv.receptive_field([(3, 1, 2)]), 5)
        with self.assertRaises(ValueError):
            conv.receptive_field([])

    def test_apply_kernel_detects_a_step(self) -> None:
        image = conv.synthetic_step_image(8)[0]
        response = conv.apply_kernel(image, conv.KERNELS["sobel_x"])
        self.assertGreater(float(np.abs(response[:, 3:5]).max()), 0)
        self.assertLessEqual(float(np.abs(response[:, 0]).max()), 4)

    def test_invalid_tensor_and_bias_contracts(self) -> None:
        with self.assertRaises(ValueError):
            conv.conv2d_naive(np.zeros((3, 4, 4)), np.zeros((2, 4, 3, 3)))
        with self.assertRaises(ValueError):
            conv.conv2d_naive(np.zeros((1, 4, 4)), np.zeros((1, 1, 3, 3)), b=np.zeros(2))
        with self.assertRaises(ValueError):
            conv.conv2d_naive(np.zeros((1, 4, 4)), np.zeros((1, 1, 3, 3)), stride=0)
        with self.assertRaises(ValueError):
            conv.pad2d(np.zeros((1, 2, 2)), -1)

    def test_linearity_holds_for_zero_bias(self) -> None:
        rng = np.random.default_rng(9)
        image = rng.normal(size=(1, 5, 5))
        kernel = rng.normal(size=(1, 1, 3, 3))
        left = conv.conv2d_naive(image, kernel, padding=1)
        right = conv.conv2d_naive(2 * image, kernel, padding=1)
        np.testing.assert_allclose(right, 2 * left)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("equivalence", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
