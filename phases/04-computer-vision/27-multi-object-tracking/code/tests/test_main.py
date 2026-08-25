from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("mot_lesson", CODE / "main.py")
assert SPEC and SPEC.loader
main = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = main
SPEC.loader.exec_module(main)


class MultiObjectTrackingTests(unittest.TestCase):
    def test_iou_identity_and_no_overlap(self):
        first = np.array([[0.0, 0.0, 2.0, 2.0]])
        second = np.array([[0.0, 0.0, 2.0, 2.0], [3.0, 3.0, 4.0, 4.0]])
        values = main.bbox_iou(first, second)
        np.testing.assert_allclose(values, [[1.0, 0.0]])

    def test_iou_rejects_degenerate_box(self):
        with self.assertRaises(ValueError):
            main.bbox_iou([[0.0, 0.0, 0.0, 1.0]], [[0.0, 0.0, 1.0, 1.0]])

    def test_tracker_keeps_id_for_matching_detection(self):
        tracker = main.SimpleTracker(iou_threshold=0.3, max_age=1)
        first = tracker.step([[0.0, 0.0, 2.0, 2.0]], 0)
        second = tracker.step([[0.1, 0.0, 2.1, 2.0]], 1)
        self.assertEqual(first[0][0], second[0][0])

    def test_tracker_creates_id_after_unmatched_detection(self):
        tracker = main.SimpleTracker(iou_threshold=0.5, max_age=0)
        tracker.step([[0.0, 0.0, 2.0, 2.0]], 0)
        tracks = tracker.step([[10.0, 10.0, 12.0, 12.0]], 1)
        self.assertEqual([track_id for track_id, _box in tracks], [2])

    def test_tracker_age_removes_stale_track(self):
        tracker = main.SimpleTracker(max_age=1)
        tracker.step([[0.0, 0.0, 2.0, 2.0]], 0)
        tracker.step([], 1)
        self.assertEqual(tracker.step([], 2), [])

    def test_synthetic_frames_are_reproducible(self):
        first, truth = main.synthetic_frames(num_frames=4, num_objects=2, seed=2)
        second, _ = main.synthetic_frames(num_frames=4, num_objects=2, seed=2)
        self.assertEqual(first, second)
        self.assertEqual(len(truth), 4)

    def test_metrics_are_perfect_for_ground_truth_boxes(self):
        detections, truth = main.synthetic_frames(num_frames=4, num_objects=2, seed=1)
        tracks = [[(object_id + 1, box) for object_id, box in enumerate(frame)] for frame in detections]
        self.assertEqual(main.mota_score(tracks, truth), 1.0)
        self.assertEqual(main.idf1_score(tracks, truth), 1.0)

    def test_assignment_uses_global_best_pairing(self):
        iou = np.array([[0.9, 0.8], [0.85, 0.1]])
        self.assertEqual(main._assignment(iou, 0.0), [(0, 1), (1, 0)])

    def test_demo_exits_and_reports_mota(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("MOTA=", result.stdout)


if __name__ == "__main__":
    unittest.main()
