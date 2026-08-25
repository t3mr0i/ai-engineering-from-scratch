from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rectified_flow_lesson", CODE / "main.py")
assert SPEC and SPEC.loader
main = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = main
SPEC.loader.exec_module(main)


class RectifiedFlowTests(unittest.TestCase):
    def test_patch_roundtrip(self):
        image = np.arange(2 * 3 * 4 * 4, dtype=float).reshape(2, 3, 4, 4)
        tokens = main.patchify(image, 2)
        self.assertEqual(tokens.shape, (2, 4, 12))
        np.testing.assert_allclose(main.unpatchify(tokens, image.shape, 2), image)

    def test_patch_rejects_nondivisible_image(self):
        with self.assertRaises(ValueError):
            main.patchify(np.zeros((1, 1, 3, 4)), 2)

    def test_timestep_embedding_shape_and_finiteness(self):
        embedding = main.timestep_embedding([0.0, 0.5], 8)
        self.assertEqual(embedding.shape, (2, 8))
        self.assertTrue(np.all(np.isfinite(embedding)))

    def test_flow_endpoints_and_velocity(self):
        x0 = np.zeros((2, 3))
        noise = np.ones((2, 3))
        at_zero, velocity = main.rectified_flow_path(x0, noise, [0.0, 1.0])
        np.testing.assert_allclose(at_zero[0], x0[0])
        np.testing.assert_allclose(at_zero[1], noise[1])
        np.testing.assert_allclose(velocity, 1.0)

    def test_flow_rejects_out_of_range_time(self):
        with self.assertRaises(ValueError):
            main.rectified_flow_path(np.zeros((1, 2)), np.ones((1, 2)), [1.1])

    def test_reverse_euler_constant_velocity(self):
        result = main.euler_reverse_sample(np.ones((2,)), lambda _t, state: np.ones_like(state), steps=4)
        np.testing.assert_allclose(result, 0.0)

    def test_reverse_euler_rejects_bad_velocity_shape(self):
        with self.assertRaises(ValueError):
            main.euler_reverse_sample(np.ones((2,)), lambda _t, _state: np.ones((3,)), steps=2)

    def test_blob_fixture_is_deterministic(self):
        first = main.synthetic_blobs(num=2, size=16, seed=3)
        second = main.synthetic_blobs(num=2, size=16, seed=3)
        np.testing.assert_array_equal(first, second)

    def test_demo_exits(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("roundtrip_max", result.stdout)


if __name__ == "__main__":
    unittest.main()
