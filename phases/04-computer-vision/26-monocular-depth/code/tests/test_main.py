from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("monocular_depth_lesson", CODE / "main.py")
assert SPEC and SPEC.loader
main = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = main
SPEC.loader.exec_module(main)


class MonocularDepthTests(unittest.TestCase):
    def test_abs_rel_and_delta(self):
        truth = np.array([[4.0, 2.0]])
        prediction = np.array([[5.0, 2.0]])
        self.assertAlmostEqual(main.abs_rel_error(prediction, truth), 0.125)
        self.assertEqual(main.delta_accuracy(prediction, truth), 1.0)

    def test_delta_boundary_is_strict(self):
        self.assertEqual(main.delta_accuracy([[5.0]], [[4.0]], threshold=1.25), 0.0)

    def test_alignment_recovers_affine_depth(self):
        truth = np.array([[1.0, 2.0, 3.0]])
        prediction = 3.0 * truth + 0.7
        aligned = main.align_scale_shift(prediction, truth)
        np.testing.assert_allclose(aligned, truth)

    def test_alignment_rejects_constant_predictions(self):
        with self.assertRaises(ValueError):
            main.align_scale_shift(np.ones((2, 2)), np.ones((2, 2)))

    def test_point_cloud_uses_pinhole_equation(self):
        points = main.depth_to_point_cloud([[2.0]], (4.0, 4.0, 0.0, 0.0))
        np.testing.assert_allclose(points, [[[0.0, 0.0, 2.0]]])

    def test_invalid_depth_and_intrinsics_rejected(self):
        with self.assertRaises(ValueError):
            main.abs_rel_error([[1.0]], [[0.0]])
        with self.assertRaises(ValueError):
            main.depth_to_point_cloud([[1.0]], (0.0, 4.0, 0.0, 0.0))

    def test_ply_contains_vertex_count(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "points.ply"
            main.write_ply(path, np.zeros((2, 3)))
            self.assertIn("element vertex 2", path.read_text(encoding="utf-8"))

    def test_synthetic_depth_is_positive(self):
        depth = main.synthetic_depth(8)
        self.assertEqual(depth.shape, (8, 8))
        self.assertTrue(np.all(depth > 0))

    def test_demo_exits_and_writes_path(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("point_cloud", result.stdout)


if __name__ == "__main__":
    unittest.main()
