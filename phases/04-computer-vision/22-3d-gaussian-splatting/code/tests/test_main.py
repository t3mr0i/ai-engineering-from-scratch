from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("gaussian_splats_lesson", CODE / "main.py")
assert SPEC and SPEC.loader
main = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = main
SPEC.loader.exec_module(main)


class GaussianSplatTests(unittest.TestCase):
    def test_projection_matches_pinhole_center(self):
        point, covariance = main.project_gaussian([1.0, 2.0, 4.0], np.eye(3), [8.0, 10.0, 2.0, 3.0])
        np.testing.assert_allclose(point, [4.0, 8.0])
        self.assertEqual(covariance.shape, (2, 2))
        self.assertTrue(np.all(np.linalg.eigvalsh(covariance) > 0))

    def test_projection_rejects_behind_camera(self):
        with self.assertRaises(ValueError):
            main.project_gaussian([0.0, 0.0, 0.0], np.eye(3), [8.0, 8.0, 4.0, 4.0])

    def test_density_peak_is_at_mean(self):
        points = np.array([[[0.0, 0.0], [1.0, 0.0]]])
        density = main.eval_2d_gaussian([[0.0, 0.0]], [[[1.0, 0.0], [0.0, 1.0]]], points)
        self.assertGreater(density[0, 0, 0], density[0, 0, 1])

    def test_raster_order_controls_colour_and_transmittance(self):
        image, residual = main.rasterise_2d(
            [[1.0, 1.0], [1.0, 1.0]], [np.eye(2), np.eye(2)],
            [[1.0, 0.0, 0.0], [0.0, 0.0, 1.0]], [0.5, 0.5], [2.0, 1.0], (3, 3),
        )
        self.assertGreater(image[1, 1, 2], image[1, 1, 0])
        self.assertLess(residual[1, 1], 1.0)

    def test_raster_rejects_bad_opacity(self):
        with self.assertRaises(ValueError):
            main.rasterise_2d([[0.0, 0.0]], [np.eye(2)], [[1.0, 1.0, 1.0]], [1.1], [0.0], (2, 2))

    def test_sh_basis_and_evaluation_shapes(self):
        directions = np.eye(3)
        basis = main.sh_degree_3_basis(directions)
        self.assertEqual(basis.shape, (3, 16))
        values = main.eval_sh_degree_3(np.zeros((3, 16, 3)), directions)
        np.testing.assert_allclose(values, 0.0)

    def test_zero_sh_direction_is_rejected(self):
        with self.assertRaises(ValueError):
            main.sh_degree_3_basis([[0.0, 0.0, 0.0]])

    def test_demo_exits_and_reports_artifact(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("image shape", result.stdout)


if __name__ == "__main__":
    unittest.main()
