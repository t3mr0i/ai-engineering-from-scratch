"""Heatmap geometry, model shape, and synthetic-fixture contract tests."""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import unittest
import warnings

import numpy as np
try:
    import torch
except ModuleNotFoundError:
    torch = None

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
SPEC = importlib.util.spec_from_file_location("lesson_pose", MAIN)
POSE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(POSE)


class NumpyBuildTests(unittest.TestCase):
    def test_numpy_heatmap_peak_decodes_x_then_y(self) -> None:
        heatmaps = np.zeros((1, 1, 8, 10), dtype=np.float32)
        heatmaps[0, 0, 2, 4] = 3.0
        self.assertEqual(POSE.numpy_heatmap_to_coords(heatmaps).tolist(), [[[4.0, 2.0]]])

    def test_numpy_subpixel_refine_leaves_border_and_stays_bounded(self) -> None:
        heatmaps = np.zeros((1, 1, 8, 8), dtype=np.float32)
        heatmaps[0, 0, 0, 0] = 1.0
        heatmaps[0, 0, 4, 4] = 2.0
        refined = POSE.numpy_subpixel_refine(heatmaps)
        self.assertEqual(refined[0, 0].tolist(), [4.0, 4.0])
        self.assertTrue(np.all(np.abs(refined - POSE.numpy_heatmap_to_coords(heatmaps)) <= 0.25))

    def test_numpy_sample_is_reproducible_and_matches_decoded_targets(self) -> None:
        image_a, heatmaps_a, points_a = POSE.make_synthetic_sample(24, np.random.default_rng(3))
        image_b, heatmaps_b, points_b = POSE.make_synthetic_sample(24, np.random.default_rng(3))
        self.assertTrue(np.array_equal(image_a, image_b) and np.array_equal(heatmaps_a, heatmaps_b) and np.array_equal(points_a, points_b))
        decoded = POSE.numpy_heatmap_to_coords(heatmaps_a[None])[0]
        self.assertTrue(np.allclose(decoded, points_a))

    def test_numpy_heatmap_contract_rejects_empty_nonfinite_and_wrong_rank(self) -> None:
        for value in (np.empty((1, 1, 0, 4)), np.full((1, 1, 4, 4), np.nan), np.zeros((1, 4, 4))):
            with self.subTest(shape=value.shape), self.assertRaises(ValueError):
                POSE.numpy_heatmap_to_coords(value)

    def test_numpy_gaussian_and_sample_boundaries_are_explicit(self) -> None:
        self.assertEqual(POSE.gaussian_heatmap(24, 10, 10).shape, (24, 24))
        with warnings.catch_warnings():
            warnings.simplefilter("error", RuntimeWarning)
            with self.assertRaises(ValueError):
                POSE.gaussian_heatmap(24, 10, 10, sigma=5e-324)
        with self.assertRaises(ValueError):
            POSE.make_synthetic_sample(23)
        with self.assertRaises(ValueError):
            POSE.make_synthetic_sample(24, rng="seed")


class PoseTests(unittest.TestCase):
    def setUp(self) -> None:
        if torch is None:
            self.skipTest("optional PyTorch dependency is unavailable")

    def test_gaussian_peak_is_at_the_requested_integer_coordinate(self) -> None:
        heatmap = POSE.gaussian_heatmap(16, 5, 7)
        index = int(heatmap.argmax())
        self.assertEqual((index % 16, index // 16), (5, 7))
        self.assertAlmostEqual(float(heatmap[7, 5]), 1.0, places=6)

    def test_gaussian_rejects_out_of_range_and_nonpositive_sigma(self) -> None:
        with self.assertRaises(ValueError):
            POSE.gaussian_heatmap(16, 16, 7)
        for sigma in (0.0, -1.0, True, float("nan")):
            with self.subTest(sigma=sigma), self.assertRaises(ValueError):
                POSE.gaussian_heatmap(16, 5, 7, sigma=sigma)

    def test_heatmap_to_coords_decodes_x_then_y(self) -> None:
        heatmaps = torch.zeros(2, 3, 8, 10)
        heatmaps[0, 0, 2, 4] = 3
        coords = POSE.heatmap_to_coords(heatmaps)
        self.assertEqual(coords[0, 0].tolist(), [4.0, 2.0])

    def test_subpixel_refine_is_zero_at_border_and_bounded_inside(self) -> None:
        heatmaps = torch.zeros(1, 1, 8, 8)
        heatmaps[0, 0, 0, 0] = 1
        heatmaps[0, 0, 4, 4] = 2
        refined = POSE.subpixel_refine(heatmaps)
        self.assertEqual(refined[0, 0].tolist(), [4.0, 4.0])
        border_only = POSE.subpixel_refine(heatmaps[:, :, :4, :4])
        self.assertEqual(border_only.shape, (1, 1, 2))

    def test_keypoint_model_preserves_divisible_spatial_shape(self) -> None:
        model = POSE.TinyKeypointNet(num_keypoints=4, base=4)
        output = model(torch.zeros(2, 3, 16, 20))
        self.assertEqual(tuple(output.shape), (2, 4, 16, 20))
        with self.assertRaises(ValueError):
            model(torch.zeros(1, 3, 15, 16))

    def test_synthetic_sample_is_reproducible_and_has_matching_targets(self) -> None:
        image_a, heatmaps_a, points_a = POSE.make_synthetic_sample(24, np.random.default_rng(3))
        image_b, heatmaps_b, points_b = POSE.make_synthetic_sample(24, np.random.default_rng(3))
        self.assertTrue(np.array_equal(image_a, image_b))
        self.assertTrue(np.array_equal(heatmaps_a, heatmaps_b))
        self.assertTrue(np.array_equal(points_a, points_b))
        self.assertEqual((image_a.shape, heatmaps_a.shape, points_a.shape), ((3, 24, 24), (4, 24, 24), (4, 2)))

    def test_synthetic_sample_rejects_tiny_size_and_bad_rng(self) -> None:
        with self.assertRaises(ValueError):
            POSE.make_synthetic_sample(23)
        with self.assertRaises(ValueError):
            POSE.make_synthetic_sample(24, rng="seed")

    def test_demo_exits_without_traceback(self) -> None:
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=45, env=os.environ.copy())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        self.assertIn("mean L2 error", result.stdout)


class PoseFallbackTests(unittest.TestCase):
    def test_source_compiles_without_importing_torch(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_module_exposes_dependency_state(self) -> None:
        self.assertIn(POSE.TORCH_AVAILABLE, (True, False))

    def test_canonical_command_is_bounded_when_torch_is_missing(self) -> None:
        if torch is not None:
            self.skipTest("fallback branch is only exercised without PyTorch")
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("skipped cleanly", result.stdout)


if __name__ == "__main__":
    unittest.main()
