from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("open_vocab_segmentation_lesson", CODE / "main.py")
assert SPEC and SPEC.loader
main = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = main
SPEC.loader.exec_module(main)


class OpenVocabularySegmentationTests(unittest.TestCase):
    def test_split_concepts_preserves_noun_phrase(self):
        self.assertEqual(main.split_concepts("cats, dogs and balloons"), ["cats", "dogs", "balloons"])
        self.assertEqual(main.split_concepts("yellow school bus"), ["yellow school bus"])

    def test_split_rejects_empty_sentence_or_segment(self):
        with self.assertRaises(ValueError):
            main.split_concepts("  ")
        with self.assertRaises(ValueError):
            main.split_concepts("cats, , dogs")

    def test_rle_roundtrip_mixed_mask(self):
        mask = np.array([[0, 1, 1], [0, 0, 1]], dtype=np.uint8)
        encoded = main.rle_encode(mask)
        np.testing.assert_array_equal(main.rle_decode(encoded, mask.shape), mask)

    def test_rle_rejects_truncated_or_nonbinary_runs(self):
        with self.assertRaises(ValueError):
            main.rle_decode("1x2", (2, 2))
        with self.assertRaises(ValueError):
            main.rle_decode("2x4", (2, 2))

    def test_stub_returns_contract_valid_detections(self):
        image = np.zeros((20, 30, 3), dtype=np.uint8)
        detections = main.StubOpenVocabSeg().detect(image, "bus")
        self.assertEqual(len(detections), 2)
        for detection in detections:
            mask = main.rle_decode(detection.mask_rle, image.shape[:2])
            self.assertGreater(mask.sum(), 0)
            self.assertEqual(detection.concept, "bus")

    def test_multi_concept_expands_each_concept(self):
        detections = main.run_multi_concept(main.StubOpenVocabSeg(), np.zeros((20, 30)), "cats; dogs")
        self.assertEqual([item.concept for item in detections], ["cats", "cats", "dogs", "dogs"])

    def test_iou_is_one_for_same_mask(self):
        mask = np.array([[1, 0], [0, 1]], dtype=np.uint8)
        self.assertEqual(main.mask_iou(mask, mask), 1.0)

    def test_detection_rejects_invalid_score(self):
        with self.assertRaises(ValueError):
            main.ConceptDetection("cat", 0, (0, 0, 1, 1), 1.2, "1x1")

    def test_demo_exits_and_reports_count(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("detections=4", result.stdout)


if __name__ == "__main__":
    unittest.main()
