from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("vision_fundamentals", CODE / "main.py")
vision = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(vision)


class ImageFundamentalsTests(unittest.TestCase):
    def test_fixture_is_reproducible_hwc_uint8(self) -> None:
        first = vision.synthetic_image(5, 7, seed=4)
        self.assertEqual(first.shape, (5, 7, 3))
        self.assertEqual(first.dtype, np.uint8)
        np.testing.assert_array_equal(first, vision.synthetic_image(5, 7, seed=4))

    def test_layout_roundtrip_preserves_values(self) -> None:
        image = vision.synthetic_image(4, 6, seed=1)
        chw = vision.hwc_to_chw(image)
        self.assertEqual(chw.shape, (3, 4, 6))
        np.testing.assert_array_equal(vision.chw_to_hwc(chw), image)

    def test_layout_rejects_wrong_channel_axis(self) -> None:
        with self.assertRaises(ValueError):
            vision.hwc_to_chw(np.zeros((3, 4, 4), dtype=np.uint8))
        with self.assertRaises(ValueError):
            vision.chw_to_hwc(np.zeros((4, 4, 4), dtype=np.float32))

    def test_grayscale_uses_bt601_weights(self) -> None:
        image = np.array([[[255, 0, 0], [0, 255, 0], [0, 0, 255]]], dtype=np.uint8)
        np.testing.assert_allclose(vision.rgb_to_grayscale(image), [[76.245, 149.685, 29.07]], rtol=1e-5)

    def test_ycbcr_separates_luma_and_chroma(self) -> None:
        red = vision.rgb_to_ycbcr(np.array([[[255, 0, 0]]], dtype=np.uint8))[0, 0]
        np.testing.assert_allclose(red, [76.245, 84.972, 255.5], atol=0.01)

    def test_hsv_known_colors_and_ranges(self) -> None:
        hsv = vision.rgb_to_hsv(np.array([[[255, 0, 0], [0, 255, 0], [0, 0, 255], [0, 0, 0]]], dtype=np.uint8))
        np.testing.assert_allclose(hsv[0, :3, 0], [0, 120, 240], atol=1e-5)
        np.testing.assert_allclose(hsv[0, :3, 1:], 1.0, atol=1e-5)
        np.testing.assert_array_equal(hsv[0, 3], [0, 0, 0])
        self.assertTrue(np.all((hsv[..., 0] >= 0) & (hsv[..., 0] <= 360)))

    def test_preprocess_deprocess_is_byte_roundtrip(self) -> None:
        image = vision.synthetic_image(6, 5, seed=2)
        normalized = vision.preprocess_imagenet(image)
        self.assertEqual(normalized.shape, (3, 6, 5))
        np.testing.assert_array_equal(vision.deprocess_imagenet(normalized), image)

    def test_resize_nearest_has_requested_shape_and_corners(self) -> None:
        image = np.array([[1, 2], [3, 4]], dtype=np.uint8)
        resized = vision.resize_nearest(image, 4, 6)
        self.assertEqual(resized.shape, (4, 6))
        self.assertEqual(int(resized[0, 0]), 1)
        self.assertEqual(int(resized[-1, -1]), 4)

    def test_numeric_and_size_contracts_are_explicit(self) -> None:
        with self.assertRaises(ValueError):
            vision.synthetic_image(0, 3)
        with self.assertRaises(ValueError):
            vision.synthetic_image(3, 3, seed=True)
        with self.assertRaises(ValueError):
            vision.rgb_to_hsv(np.full((2, 2, 3), np.nan))
        with self.assertRaises(ValueError):
            vision.local_roughness(np.ones((1, 2)))

    def test_inspection_reports_observable_contract(self) -> None:
        image = vision.synthetic_image(3, 4, seed=0)
        report = vision.inspect_image(image, "fixture")
        self.assertEqual(report["label"], "fixture")
        self.assertEqual(report["shape"], (3, 4, 3))
        self.assertEqual(report["dtype"], "uint8")
        self.assertEqual(len(report["mean"]), 3)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("roundtrip", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
