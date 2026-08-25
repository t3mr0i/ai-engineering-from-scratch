from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("vlm_lesson", CODE / "main.py")
assert SPEC and SPEC.loader
main = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = main
SPEC.loader.exec_module(main)


class VisionLanguageTests(unittest.TestCase):
    def test_projection_shape_and_seed(self):
        tokens = np.ones((2, 4, 3))
        first = main.project_visual_tokens(tokens, 5, seed=4)
        second = main.project_visual_tokens(tokens, 5, seed=4)
        self.assertEqual(first.shape, (2, 4, 5))
        np.testing.assert_array_equal(first, second)

    def test_pooling_averages_patch_axis(self):
        pooled = main.mean_pool_tokens(np.array([[[1.0, 3.0], [3.0, 5.0]]]))
        np.testing.assert_allclose(pooled, [[2.0, 4.0]])

    def test_deepstack_concatenates_width(self):
        result = main.deepstack_features([np.zeros((2, 3, 4)), np.ones((2, 3, 5))])
        self.assertEqual(result.shape, (2, 3, 9))

    def test_cross_entropy_matches_two_class_fixture(self):
        loss = main.cross_entropy_loss([[0.0, 0.0], [2.0, 0.0]], [0, 1])
        expected = (np.log(2.0) + (np.log(np.exp(2.0) + 1.0) - 0.0)) / 2.0
        self.assertAlmostEqual(loss, expected)

    def test_cross_entropy_is_stable_for_large_logits(self):
        self.assertTrue(np.isfinite(main.cross_entropy_loss([[1000.0, 0.0]], [0])))

    def test_cross_entropy_rejects_bad_target(self):
        with self.assertRaises(ValueError):
            main.cross_entropy_loss([[0.0, 1.0]], [2])
        with self.assertRaises(ValueError):
            main.cross_entropy_loss([[0.0, 1.0]], [True])

    def test_cmer_flags_high_confidence_low_similarity(self):
        image = np.eye(4)
        text = np.array(((1.0, 0.0, 0.0, 0.0), (0.0, 1.0, 0.0, 0.0), (-1.0, 0.0, 0.0, 0.0), (0.0, -1.0, 0.0, 0.0)))
        self.assertEqual(main.cross_modal_error_rate(image, text, np.full(4, 0.9)), 0.5)

    def test_cmer_rejects_zero_embedding(self):
        with self.assertRaises(ValueError):
            main.cross_modal_error_rate([[0.0, 0.0]], [[1.0, 0.0]], [0.9])

    def test_demo_exits_and_prints_cmer(self):
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("CMER=", result.stdout)


if __name__ == "__main__":
    unittest.main()
