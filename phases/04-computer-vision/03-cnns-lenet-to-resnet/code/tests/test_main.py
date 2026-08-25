from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("cnn_shapes", CODE / "main.py")
cnn = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(cnn)


class CNNShapeTests(unittest.TestCase):
    def test_lenet_trace_matches_classic_32_pixel_path(self) -> None:
        trace = dict(cnn.lenet_shape_trace())
        self.assertEqual(trace["conv1+tanh"], (1, 6, 28, 28))
        self.assertEqual(trace["avgpool2"], (1, 16, 5, 5))
        self.assertEqual(trace["flatten"], (1, 400))
        self.assertEqual(trace["logits"], (1, 10))

    def test_conv_shape_and_values_are_nchw(self) -> None:
        x = np.ones((2, 1, 4, 4), dtype=np.float32)
        w = np.ones((3, 1, 3, 3), dtype=np.float32)
        result = cnn.conv2d_nchw(x, w, padding=1)
        self.assertEqual(result.shape, (2, 3, 4, 4))
        self.assertEqual(float(result[0, 0, 1, 1]), 9.0)

    def test_avg_pool_and_relu(self) -> None:
        x = np.array([[[[-1, 2], [3, 5]]]], dtype=np.float32)
        np.testing.assert_allclose(cnn.avg_pool2d(x, kernel=2), [[[[2.25]]]])
        np.testing.assert_array_equal(cnn.relu(x), [[[[0, 2], [3, 5]]]])

    def test_dense_uses_output_by_feature_weights(self) -> None:
        x = np.array([[1.0, 2.0], [0.0, 1.0]])
        w = np.array([[1.0, 0.0], [0.0, 2.0]])
        np.testing.assert_allclose(cnn.dense(x, w, np.array([1.0, -1.0])), [[2.0, 3.0], [1.0, 1.0]])

    def test_residual_add_requires_matching_branches(self) -> None:
        x = np.ones((1, 4, 3, 3))
        np.testing.assert_allclose(cnn.residual_add(x, np.zeros_like(x)), x)
        with self.assertRaises(ValueError):
            cnn.residual_add(x, np.zeros((1, 5, 3, 3)))
        with self.assertRaises(ValueError):
            cnn.residual_add(x, np.zeros((4, 3, 3)))
        with self.assertRaises(ValueError):
            cnn.residual_add(np.zeros((0, 4, 3, 3)), np.zeros((0, 4, 3, 3)))

    def test_parameter_counts_are_positive_and_class_count_changes_head(self) -> None:
        counts = cnn.model_parameter_counts(7)
        self.assertTrue(all(value > 0 for value in counts.values()))
        self.assertGreater(cnn.model_parameter_counts(7)["LeNet5"], cnn.model_parameter_counts(3)["LeNet5"])
        with self.assertRaises(ValueError):
            cnn.model_parameter_counts(0)

    def test_invalid_shapes_and_nonfinite_values_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            cnn.conv2d_nchw(np.zeros((1, 3, 4, 4)), np.zeros((2, 2, 3, 3)))
        with self.assertRaises(ValueError):
            cnn.avg_pool2d(np.zeros((1, 1, 2, 2)), kernel=3)
        with self.assertRaises(ValueError):
            cnn.dense(np.ones((2, 2)), np.ones((3, 3)))
        with self.assertRaises(ValueError):
            cnn.dense(np.empty((0, 2)), np.ones((3, 2)))
        with self.assertRaises(ValueError):
            cnn.relu(np.array([np.nan]))

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("LeNet-5", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
