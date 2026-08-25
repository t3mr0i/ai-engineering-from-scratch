from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("nerf_math", CODE / "main.py")
nerf = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(nerf)


class NeRFMathTests(unittest.TestCase):
    def test_positional_encoding_shape_and_zero_values(self) -> None:
        points = np.zeros((2, 3))
        encoded = nerf.positional_encoding(points, levels=4)
        self.assertEqual(encoded.shape, (2, 24))
        np.testing.assert_allclose(encoded[:, :12], 0.0)
        np.testing.assert_allclose(encoded[:, 12:], 1.0)

    def test_positional_encoding_rejects_wrong_dimension(self) -> None:
        with self.assertRaises(ValueError):
            nerf.positional_encoding(np.zeros((2, 2)), levels=4)
        with self.assertRaises(ValueError):
            nerf.positional_encoding(np.zeros((2, 3)), levels=0)

    def test_ray_sampling_has_expected_points(self) -> None:
        points, t_vals = nerf.sample_ray_points([[0, 0, 0]], [[0, 0, 1]], 2, 6, 3)
        np.testing.assert_allclose(t_vals, [2, 4, 6])
        np.testing.assert_allclose(t_vals[[0, -1]], [2, 6])
        np.testing.assert_allclose(points[0, :, 2], t_vals)
        with self.assertRaises(ValueError):
            nerf.sample_ray_points([[0, 0, 0]], [[0, 0, 1]], 2, 6, 1)
        with self.assertRaises(ValueError):
            nerf.sample_ray_points([[0, 0, 0]], [[0, 0, 1]], 4, 2, 3)
        with self.assertRaises(ValueError):
            nerf.sample_ray_points([[0, 0, 0]], [[0, 0, 1]], False, 2, 3)

    def test_zero_density_is_transparent(self) -> None:
        sigma = np.zeros(4)
        rgb = np.ones((4, 3))
        rendered, depth, weights = nerf.volume_render(sigma, rgb, np.arange(4, dtype=float), background=np.array([0.2, 0.3, 0.4]))
        np.testing.assert_allclose(rendered, [0.2, 0.3, 0.4])
        self.assertAlmostEqual(float(depth), 0.0)
        self.assertAlmostEqual(float(weights.sum()), 0.0)

    def test_volume_weights_are_front_to_back_and_bounded(self) -> None:
        sigma = np.array([10.0, 0.0, 0.0])
        rgb = np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]], dtype=float)
        rendered, depth, weights = nerf.volume_render(sigma, rgb, np.array([0.0, 1.0, 2.0]))
        self.assertGreater(weights[0], weights[1])
        self.assertLessEqual(float(weights.sum()), 1.0)
        self.assertGreaterEqual(float(depth), 0.0)
        self.assertTrue(np.all((rendered >= 0) & (rendered <= 1)))

    def test_opaque_density_keeps_residual_transmittance_nonnegative(self) -> None:
        sigma = np.array([1000.0, 1000.0, 1000.0])
        rgb = np.ones((3, 3))
        rendered, _, weights = nerf.volume_render(
            sigma, rgb, np.array([1.0, 2.0, 3.0]), background=np.zeros(3)
        )
        self.assertLessEqual(float(weights.sum()), 1.0)
        self.assertGreaterEqual(float(1.0 - weights.sum()), 0.0)
        np.testing.assert_allclose(rendered, [1.0, 1.0, 1.0])

    def test_volume_render_validates_density_color_and_depth(self) -> None:
        with self.assertRaises(ValueError):
            nerf.volume_render(np.array([-1.0, 0.0]), np.zeros((2, 3)), np.array([0.0, 1.0]))
        with self.assertRaises(ValueError):
            nerf.volume_render(np.ones(2), np.zeros((2, 3)), np.array([0.0, 0.0]))
        with self.assertRaises(ValueError):
            nerf.volume_render(np.ones(2), np.full((2, 3), 2.0), np.array([0.0, 1.0]))

    def test_density_fixture_is_finite_and_centered(self) -> None:
        t_vals = np.linspace(2, 6, 16)
        sigma, rgb = nerf.density_fixture(t_vals)
        self.assertEqual(sigma.shape, (16,))
        self.assertEqual(rgb.shape, (16, 3))
        self.assertTrue(np.isfinite(sigma).all())
        self.assertGreater(float(sigma.max()), float(sigma[0]))

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("weight_sum", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
