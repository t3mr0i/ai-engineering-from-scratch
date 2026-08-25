"""Data-contract and pipeline behavior tests for the offline capstone."""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np
try:
    import torch
except ModuleNotFoundError:
    torch = None

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
SPEC = importlib.util.spec_from_file_location("lesson_pipeline", MAIN)
PIPELINE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = PIPELINE
SPEC.loader.exec_module(PIPELINE)


def fixture_pipe(min_crop: int = 16):
    return PIPELINE.VisionPipeline(
        PIPELINE.StubDetector(), PIPELINE.StubClassifier(), [f"class_{i}" for i in range(10)], min_crop=min_crop
    )


class NumpyBuildTests(unittest.TestCase):
    def test_numpy_preprocess_returns_chw_unit_range(self) -> None:
        result = PIPELINE.numpy_preprocess(np.full((4, 5, 3), 128, dtype=np.uint8))
        self.assertEqual(result.shape, (3, 4, 5))
        self.assertTrue(np.allclose(result, 128 / 255))

    def test_numpy_detector_has_three_valid_records(self) -> None:
        detections = PIPELINE.numpy_detect(np.zeros((3, 64, 96), dtype=np.float32))
        self.assertEqual(len(detections), 3)
        self.assertTrue(all(item.box[2] > item.box[0] and item.box[3] > item.box[1] for item in detections))

    def test_numpy_pipeline_preserves_detections_when_crop_gate_changes(self) -> None:
        image = np.zeros((64, 96, 3), dtype=np.uint8)
        normal = PIPELINE.numpy_pipeline(image)
        gated = PIPELINE.numpy_pipeline(image, min_crop=40)
        self.assertEqual(len(normal.detections), len(gated.detections), 3)
        self.assertEqual(len(normal.classifications), 3)
        self.assertEqual(gated.classifications, [])

    def test_numpy_classifier_is_finite_and_deterministic(self) -> None:
        crop = np.zeros((3, 16, 16), dtype=np.float32)
        self.assertEqual(PIPELINE.numpy_classify_crop(crop), PIPELINE.numpy_classify_crop(crop))
        class_id, score = PIPELINE.numpy_classify_crop(crop)
        self.assertEqual(class_id, 0)
        self.assertTrue(0 < score <= 1)

    def test_numpy_pipeline_rejects_bad_pixels_and_controls(self) -> None:
        with self.assertRaises(ValueError):
            PIPELINE.numpy_preprocess(np.zeros((4, 5), dtype=np.uint8))
        with self.assertRaises(ValueError):
            PIPELINE.numpy_preprocess(np.full((4, 5, 3), 2.0, dtype=np.float32))
        with self.assertRaises(ValueError):
            PIPELINE.numpy_pipeline(np.zeros((4, 5, 3), dtype=np.uint8), min_crop=0)

    def test_numpy_pipeline_distinguishes_none_defaults_from_empty_names(self) -> None:
        image = np.zeros((64, 96, 3), dtype=np.uint8)
        self.assertEqual(len(PIPELINE.numpy_pipeline(image, class_names=None).classifications), 3)
        for names in ([], ()):
            with self.subTest(names=names), self.assertRaises(ValueError):
                PIPELINE.numpy_pipeline(image, class_names=names)


class PipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        if torch is None:
            self.skipTest("optional PyTorch dependency is unavailable")

    def test_detection_contract_serializes_and_rejects_degenerate_boxes(self) -> None:
        record = PIPELINE.Detection((1, 2, 5, 8), 0.5, 2)
        self.assertEqual(record.to_dict()["box"], [1.0, 2.0, 5.0, 8.0])
        with self.assertRaises(ValueError):
            PIPELINE.Detection((1, 2, 1, 8), 0.5, 2)
        with self.assertRaises(ValueError):
            PIPELINE.Detection((1, 2, 5, 8), 1.1, 2)

    def test_preprocess_converts_uint8_hwc_and_float_chw(self) -> None:
        pipe = fixture_pipe()
        uint8 = np.zeros((8, 10, 3), dtype=np.uint8)
        self.assertEqual(tuple(pipe.preprocess(uint8).shape), (3, 8, 10))
        float_image = torch.zeros(3, 8, 10)
        self.assertTrue(torch.equal(pipe.preprocess(float_image), float_image))

    def test_preprocess_rejects_wrong_shape_range_and_type(self) -> None:
        pipe = fixture_pipe()
        with self.assertRaises(ValueError):
            pipe.preprocess(np.zeros((8, 10), dtype=np.uint8))
        with self.assertRaises(ValueError):
            pipe.preprocess(torch.full((3, 8, 10), 2.0))
        with self.assertRaises(TypeError):
            pipe.preprocess("pixels")

    def test_run_returns_three_detections_and_matching_classifications(self) -> None:
        result = fixture_pipe().run(np.zeros((64, 96, 3), dtype=np.uint8), image_id="fixture")
        self.assertEqual(result.image_id, "fixture")
        self.assertEqual(len(result.detections), 3)
        self.assertEqual(len(result.classifications), 3)
        self.assertTrue(all(0 <= item.score <= 1 for item in result.classifications))
        self.assertIn('"image_id": "fixture"', result.to_json())

    def test_small_crops_remain_records_but_are_not_classified(self) -> None:
        result = fixture_pipe(min_crop=40).run(np.zeros((64, 96, 3), dtype=np.uint8))
        self.assertEqual(len(result.detections), 3)
        self.assertEqual(result.classifications, [])

    def test_classifier_empty_batch_is_a_valid_noop(self) -> None:
        self.assertEqual(fixture_pipe().classify([]), [])
        with self.assertRaises(ValueError):
            fixture_pipe().classify([torch.zeros(2, 8, 8)])

    def test_benchmark_reports_each_stage_and_rejects_bad_runs(self) -> None:
        report = PIPELINE.benchmark(fixture_pipe(), num_runs=2, image_size=(16, 20))
        self.assertEqual(set(report), {"preprocess", "detect", "classify", "total"})
        with self.assertRaises(ValueError):
            PIPELINE.benchmark(fixture_pipe(), num_runs=0)
        with self.assertRaises(ValueError):
            PIPELINE.benchmark(fixture_pipe(), image_size=(0, 20))

    def test_demo_exits_without_traceback(self) -> None:
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=45, env=os.environ.copy())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        self.assertIn("benchmark", result.stdout)


class PipelineFallbackTests(unittest.TestCase):
    def test_source_compiles_without_importing_torch(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_module_exposes_dependency_state(self) -> None:
        self.assertIn(PIPELINE.TORCH_AVAILABLE, (True, False))

    def test_canonical_command_is_bounded_when_torch_is_missing(self) -> None:
        if torch is not None:
            self.skipTest("fallback branch is only exercised without PyTorch")
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("skipped cleanly", result.stdout)


if __name__ == "__main__":
    unittest.main()
