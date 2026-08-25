from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("video_world_model_lesson", CODE / "main.py")
assert SPEC and SPEC.loader
main = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = main
SPEC.loader.exec_module(main)


class VideoWorldModelTests(unittest.TestCase):
    def test_patch_roundtrip_and_grid(self):
        video = np.arange(1 * 2 * 4 * 4 * 4, dtype=float).reshape(1, 2, 4, 4, 4)
        tokens, grid = main.patchify_video(video, 2, 2, 2)
        self.assertEqual(grid, (2, 2, 2))
        self.assertEqual(tokens.shape, (1, 8, 16))
        np.testing.assert_allclose(main.unpatchify_video(tokens, video.shape, 2, 2, 2), video)

    def test_patch_rejects_nondivisible_temporal_axis(self):
        with self.assertRaises(ValueError):
            main.patchify_video(np.zeros((1, 1, 3, 4, 4)), 2, 2, 2)

    def test_token_count_and_attention_cost(self):
        tokens, joint, divided = main.divided_attention_cost(4, 4, 4, 2, 2, 2)
        self.assertEqual(tokens, 8)
        self.assertEqual(joint, 64)
        self.assertEqual(divided, 48)

    def test_token_count_requires_exact_divisibility(self):
        with self.assertRaises(ValueError):
            main.count_tokens(5, 4, 4, 2, 2, 2)

    def test_linear_rollout_uses_action(self):
        states = main.rollout_linear_world_model([0.0, 0.0], [[1.0, 0.0], [0.0, 2.0]])
        np.testing.assert_allclose(states, [[0.0, 0.0], [1.0, 0.0], [1.0, 2.0]])

    def test_rollout_rejects_empty_or_nonfinite_actions(self):
        with self.assertRaises(ValueError):
            main.rollout_linear_world_model([0.0], np.empty((0, 1)))
        with self.assertRaises(ValueError):
            main.rollout_linear_world_model([0.0], [[np.inf]])

    def test_video_error_is_zero_for_identical_videos(self):
        video = np.zeros((1, 1, 2, 2, 2))
        self.assertEqual(main.video_consistency_error(video, video), 0.0)

    def test_video_error_rejects_shape_mismatch(self):
        with self.assertRaises(ValueError):
            main.video_consistency_error(np.zeros((1, 1, 1, 1, 1)), np.zeros((1, 1, 2, 1, 1)))

    def test_demo_exits_and_reports_roundtrip(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("roundtrip=", result.stdout)


if __name__ == "__main__":
    unittest.main()
