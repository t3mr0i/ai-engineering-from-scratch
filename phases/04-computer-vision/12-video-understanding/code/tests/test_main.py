from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("video_contracts", CODE / "main.py")
video = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(video)


class VideoUnderstandingTests(unittest.TestCase):
    def test_uniform_sampler_covers_short_and_long_sequences(self) -> None:
        self.assertEqual(video.sample_uniform(5, 8).tolist(), [0, 1, 2, 3, 4, 4, 4, 4])
        self.assertEqual(video.sample_uniform(10, 4).tolist(), [0, 2, 5, 7])
        with self.assertRaises(ValueError):
            video.sample_uniform(0, 4)

    def test_dense_sampler_is_seeded_and_contiguous(self) -> None:
        first = video.sample_dense(20, 5, np.random.default_rng(3))
        second = video.sample_dense(20, 5, np.random.default_rng(3))
        np.testing.assert_array_equal(first, second)
        np.testing.assert_array_equal(np.diff(first), 1)
        self.assertTrue(np.all((first >= 0) & (first < 20)))

    def test_temporal_pool_handles_batched_features_and_indices(self) -> None:
        features = np.arange(2 * 4 * 3, dtype=float).reshape(2, 4, 3)
        pooled = video.temporal_pool(features, np.array([1, 3]))
        self.assertEqual(pooled.shape, (2, 3))
        np.testing.assert_allclose(pooled[0], (features[0, 1] + features[0, 3]) / 2)
        with self.assertRaises(ValueError):
            video.temporal_pool(features, np.array([4]))

    def test_inflated_kernel_preserves_spatial_kernel_average(self) -> None:
        kernel = np.arange(2 * 3 * 3 * 3, dtype=float).reshape(2, 3, 3, 3)
        inflated = video.inflate_kernel_2d(kernel, time_kernel=5)
        self.assertEqual(inflated.shape, (2, 3, 5, 3, 3))
        np.testing.assert_allclose(inflated.sum(axis=2), kernel)
        with self.assertRaises(ValueError):
            video.inflate_kernel_2d(kernel, time_kernel=0)

    def test_conv2plus1d_parameter_formula_is_named(self) -> None:
        counts = video.conv2plus1d_parameter_count(3, 16, mid_channels=8)
        self.assertEqual(counts, {"mid_channels": 8, "spatial": 216, "temporal": 384, "total": 600})
        with self.assertRaises(ValueError):
            video.conv2plus1d_parameter_count(3, 16, mid_channels=0)

    def test_temporal_split_is_contiguous_and_nonoverlapping(self) -> None:
        train, test = video.temporal_split(10, 0.6)
        np.testing.assert_array_equal(train, [0, 1, 2, 3, 4, 5])
        np.testing.assert_array_equal(test, [6, 7, 8, 9])
        self.assertEqual(set(train).intersection(test), set())
        with self.assertRaises(ValueError):
            video.temporal_split(1, 0.8)

    def test_synthetic_video_is_reproducible(self) -> None:
        first = video.synthetic_video(6, 8, 10, seed=7)
        second = video.synthetic_video(6, 8, 10, seed=7)
        np.testing.assert_array_equal(first, second)
        self.assertEqual(first.shape, (6, 8, 10, 1))
        self.assertGreater(float(first.max()), 0.9)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("temporal_split", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
