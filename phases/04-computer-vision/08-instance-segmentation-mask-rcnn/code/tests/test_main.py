from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("mask_rcnn_principles", CODE / "main.py")
mask = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(mask)


class InstanceSegmentationTests(unittest.TestCase):
    def test_roi_align_constant_feature_preserves_value(self) -> None:
        feature = np.full((2, 8, 8), 3.5)
        pooled = mask.roi_align(feature, [[1, 2, 7, 8]], output_size=(3, 4))
        self.assertEqual(pooled.shape, (1, 2, 3, 4))
        np.testing.assert_allclose(pooled, 3.5)

    def test_roi_align_spatial_scale_maps_image_box_to_feature_map(self) -> None:
        feature = np.arange(16, dtype=float).reshape(1, 4, 4)
        pooled = mask.roi_align(feature, [[0, 0, 8, 8]], output_size=2, spatial_scale=0.5)
        self.assertEqual(pooled.shape, (1, 1, 2, 2))
        np.testing.assert_allclose(pooled[0, 0], [[5.0, 7.0], [13.0, 15.0]])

    def test_box_contract_rejects_bad_coordinates(self) -> None:
        for boxes in ([[1, 1, 1, 3]], [[-1, 0, 2, 2]], [[0, 0, 9, 2]], [[0, 0, np.nan, 2]]):
            with self.assertRaises(ValueError):
                mask.validate_boxes(boxes, (8, 8))
        with self.assertRaises(ValueError):
            mask.validate_boxes(np.empty((0, 4)), (8, 8))
        with self.assertRaises(ValueError):
            mask.roi_align(np.zeros((1, 4, 4)), [[0, 0, 4, 4]], spatial_scale=0)
        with self.assertRaises(ValueError):
            mask.roi_align(np.zeros((1, 4, 4)), [[0, 0, 4, 4]], spatial_scale=True)

    def test_paste_mask_is_aligned_to_box(self) -> None:
        logits = np.full((2, 2), 10.0)
        pasted = mask.paste_mask(logits, [2, 3, 6, 7], (10, 10))
        self.assertEqual(int(pasted.sum()), 16)
        self.assertTrue(pasted[3:7, 2:6].all())
        self.assertFalse(pasted[:3].any())
        with self.assertRaises(ValueError):
            mask.paste_mask(logits, [2, 3, 6, 7], (10, 10), threshold=True)

    def test_mask_loss_is_stable_for_extreme_logits_and_bool_targets(self) -> None:
        logits = np.array([[[1000.0, -1000.0]]])
        targets = np.array([[[True, False]]])
        self.assertLess(mask.mask_bce_with_logits(logits, targets), 1e-10)
        with self.assertRaises(ValueError):
            mask.mask_bce_with_logits(np.zeros((1, 2, 2)), np.full((1, 2, 2), 2.0))

    def test_mask_iou_handles_overlap_and_empty_union(self) -> None:
        first = np.array([[True, True], [False, False]])
        second = np.array([[True, False], [False, True]])
        self.assertAlmostEqual(mask.mask_iou(first, second), 1 / 3)
        self.assertEqual(mask.mask_iou(np.zeros((2, 2), bool), np.zeros((2, 2), bool)), 1.0)
        with self.assertRaises(ValueError):
            mask.mask_iou(np.zeros((2, 2), bool), np.zeros((2, 3), bool))

    def test_synthetic_scene_is_reproducible_and_nonempty(self) -> None:
        edge_feature, edge_boxes, edge_masks = mask.synthetic_scene(8, 8)
        self.assertEqual(edge_feature.shape, (2, 8, 8))
        np.testing.assert_array_equal(edge_boxes, [[2, 3, 3, 4]])
        self.assertEqual(int(edge_masks.sum()), 1)
        first = mask.synthetic_scene(12, 14)
        second = mask.synthetic_scene(12, 14)
        for left, right in zip(first, second):
            np.testing.assert_array_equal(left, right)
        self.assertEqual(first[0].shape, (2, 12, 14))
        self.assertEqual(first[1].shape, (1, 4))
        self.assertGreater(int(first[2].sum()), 0)
        for shape in ((7, 8), (8, 7), (3, 3)):
            with self.assertRaises(ValueError):
                mask.synthetic_scene(*shape)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("pasted_iou", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
