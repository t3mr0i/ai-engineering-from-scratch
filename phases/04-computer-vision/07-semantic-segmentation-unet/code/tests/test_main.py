from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("segmentation_lesson", CODE / "main.py")
segmentation = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(segmentation)


class SegmentationTests(unittest.TestCase):
    def test_synthetic_fixture_shape_and_reproducibility(self) -> None:
        images, masks = segmentation.synthetic_segmentation(3, 16, 3, seed=3)
        self.assertEqual(images.shape, (3, 16, 16, 3))
        self.assertEqual(masks.shape, (3, 16, 16))
        np.testing.assert_array_equal(images, segmentation.synthetic_segmentation(3, 16, 3, seed=3)[0])
        self.assertTrue(set(np.unique(masks)).issubset({0, 1, 2}))

    def test_softmax_is_finite_and_normalized_per_pixel(self) -> None:
        logits = np.array([[[[1000, 0]], [[999, 1]], [[-1000, 2]]]], dtype=float)
        probs = segmentation.softmax(logits)
        self.assertTrue(np.isfinite(probs).all())
        np.testing.assert_allclose(probs.sum(axis=1), 1.0)

    def test_pixel_cross_entropy_known_shape_and_label_guard(self) -> None:
        logits = np.array([[[[4]], [[0]]]], dtype=float)
        self.assertLess(segmentation.pixel_cross_entropy(logits, np.array([[[0]]])), 0.05)
        with self.assertRaises(ValueError):
            segmentation.pixel_cross_entropy(logits, np.array([[[2]]]))
        with self.assertRaises(ValueError):
            segmentation.pixel_cross_entropy(np.zeros((1, 2, 0, 1)), np.zeros((1, 0, 1), dtype=int))

    def test_dice_loss_is_near_zero_for_confident_perfect_logits(self) -> None:
        targets = np.array([[[0, 1], [1, 0]]], dtype=np.int64)
        logits = np.where(targets[:, None] == np.arange(2)[None, :, None, None], 12.0, -12.0)
        self.assertLess(segmentation.dice_loss(logits, targets, 2), 1e-4)
        total, parts = segmentation.combined_loss(logits, targets, 2, lam=0.5)
        self.assertAlmostEqual(total, parts["cross_entropy"] + 0.5 * parts["dice_loss"])

    def test_iou_reports_absent_class_as_nan(self) -> None:
        targets = np.zeros((1, 2, 2), dtype=np.int64)
        predictions = np.zeros_like(targets)
        iou = segmentation.iou_per_class(predictions, targets, 2)
        self.assertEqual(iou[0], 1.0)
        self.assertTrue(np.isnan(iou[1]))
        with self.assertRaises(ValueError):
            segmentation.iou_per_class(predictions, np.ones((1, 2, 3), dtype=int), 2)

    def test_double_conv_preserves_nchw_shape_and_rejects_nan(self) -> None:
        x = np.random.default_rng(1).normal(size=(2, 3, 8, 9))
        self.assertEqual(segmentation.double_conv(x).shape, x.shape)
        with self.assertRaises(ValueError):
            segmentation.double_conv(np.full((1, 1, 2, 2), np.nan))

    def test_unet_shape_trace_has_matching_skip_resolutions(self) -> None:
        trace = dict(segmentation.unet_shape_trace((1, 3, 32, 32), levels=2, base=8))
        self.assertEqual(trace["bottleneck"], (1, 32, 8, 8))
        self.assertEqual(trace["decoder_1_with_skip"], (1, 8, 32, 32))
        with self.assertRaises(ValueError):
            segmentation.unet_shape_trace((1, 3, 30, 32), levels=2)

    def test_invalid_loss_parameters_are_rejected(self) -> None:
        logits = np.zeros((1, 2, 2, 2))
        targets = np.zeros((1, 2, 2), dtype=int)
        with self.assertRaises(ValueError):
            segmentation.dice_loss(logits, targets, 2, eps=0)
        with self.assertRaises(ValueError):
            segmentation.combined_loss(logits, targets, 2, lam=-1)
        with self.assertRaises(ValueError):
            segmentation.synthetic_segmentation(1, 8)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("fixture", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
