from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("yolo_geometry", CODE / "main.py")
yolo = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(yolo)


class YOLOGeometryTests(unittest.TestCase):
    def test_iou_identity_and_partial_overlap(self) -> None:
        first = np.array([[0, 0, 10, 10]], dtype=float)
        second = np.array([[5, 0, 15, 10]], dtype=float)
        self.assertAlmostEqual(yolo.box_iou(first, first)[0, 0], 1.0)
        self.assertAlmostEqual(yolo.box_iou(first, second)[0, 0], 1 / 3)
        self.assertEqual(yolo.box_iou(np.zeros((0, 4)), first).shape, (0, 1))

    def test_box_and_score_contracts(self) -> None:
        with self.assertRaises(ValueError):
            yolo.validate_boxes(np.array([[0, 0, 0, 1]], dtype=float))
        with self.assertRaises(ValueError):
            yolo.validate_boxes(np.array([[0, 0, np.nan, 1]], dtype=float))
        with self.assertRaises(ValueError):
            yolo.nms(np.array([[0, 0, 1, 1]], dtype=float), np.array([0.5]), iou_threshold=2)

    def test_nms_is_score_ordered_and_stable_for_ties(self) -> None:
        boxes = np.array([[0, 0, 10, 10], [1, 1, 9, 9], [20, 20, 30, 30]], dtype=float)
        keep = yolo.nms(boxes, np.array([0.8, 0.8, 0.7]), iou_threshold=0.5)
        np.testing.assert_array_equal(keep, [0, 2])

    def test_encode_decode_roundtrip(self) -> None:
        box = np.array([18, 20, 50, 68], dtype=float)
        encoded = yolo.encode(box, 1, 1, 32, (32, 48))
        np.testing.assert_allclose(yolo.decode(encoded, 1, 1, 32, (32, 48)), box, atol=1e-6)
        with self.assertRaises(ValueError):
            yolo.encode(box, 0, 0, 32, (32, 48))

        boundary = np.array([60, 4, 68, 12], dtype=float)  # center x=64, the next cell at stride 32
        with self.assertRaises(ValueError):
            yolo.encode(boundary, 1, 0, 32, (8, 8))
        encoded_boundary = yolo.encode(boundary, 2, 0, 32, (8, 8))
        np.testing.assert_allclose(yolo.decode(encoded_boundary, 2, 0, 32, (8, 8)), boundary, atol=1e-4)

    def test_assign_target_sets_one_anchor_and_one_class(self) -> None:
        target, mask = yolo.assign_targets([[18, 20, 50, 68]], [1], [(16, 24), (32, 48)], 32, (4, 4), 3)
        self.assertEqual(target.shape, (4, 4, 2, 8))
        self.assertEqual(int(mask.sum()), 1)
        active = target[mask][0]
        self.assertEqual(float(active[4]), 1.0)
        self.assertEqual(float(active[6]), 1.0)

    def test_loss_is_finite_and_has_named_components(self) -> None:
        target, mask = yolo.assign_targets([[18, 20, 50, 68]], [1], [(16, 24), (32, 48)], 32, (4, 4), 3)
        total, parts = yolo.yolo_loss(np.zeros_like(target), target, mask)
        self.assertTrue(np.isfinite(total))
        self.assertEqual(set(parts), {"box", "obj", "noobj", "class"})
        with self.assertRaises(ValueError):
            yolo.yolo_loss(np.zeros((4, 4, 2, 7)), target, mask)

    def test_postprocess_threshold_and_shape(self) -> None:
        anchors = [(16, 24)]
        raw = np.zeros((1, 1, 1, 1, 7), dtype=float)
        raw[0, 0, 0, 0, 4] = 6
        raw[0, 0, 0, 0, 6] = 6
        boxes, scores, classes = yolo.postprocess(raw, anchors, 32, conf_threshold=0.8)
        self.assertEqual(boxes.shape, (1, 4))
        self.assertGreater(scores[0], 0.8)
        self.assertEqual(int(classes[0]), 1)
        empty = yolo.postprocess(raw, anchors, 32, conf_threshold=1.0)
        self.assertEqual(empty[0].shape, (0, 4))
        no_candidates = np.full((1, 1, 1, 1, 6), -100.0)
        for invalid_iou in (np.nan, -0.1, 1.1):
            with self.assertRaises(ValueError):
                yolo.postprocess(no_candidates, [(10, 10)], 8, conf_threshold=1.0, iou_threshold=invalid_iou)

    def test_invalid_target_and_anchor_contracts(self) -> None:
        with self.assertRaises(ValueError):
            yolo.assign_targets([[0, 0, 1, 1]], [2], [(1, 1)], 1, 1, 2)
        with self.assertRaises(ValueError):
            yolo.assign_targets([[0, 0, 1, 1]], [0, 0], [(1, 1)], 1, 1, 2)
        with self.assertRaises(ValueError):
            yolo.decode([0, 0, 0, 0], 0, 0, 1, (0, 2))
        with self.assertRaises(ValueError):
            yolo.assign_targets(
                [[1, 1, 9, 9], [2, 2, 10, 10]], [0, 1], [(8, 8)], 16, 1, 2
            )

    def test_assign_targets_preserves_distinct_cell_slots(self) -> None:
        target, mask = yolo.assign_targets(
            [[1, 1, 9, 9], [17, 1, 25, 9]], [0, 1], [(8, 8)], 16, (1, 2), 2
        )
        self.assertEqual(int(mask.sum()), 2)
        self.assertEqual(float(target[0, 0, 0, 5]), 1.0)
        self.assertEqual(float(target[0, 1, 0, 6]), 1.0)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("postprocess", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
