from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("vit_lesson", CODE / "main.py")
main = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(main)


class ViTContractTests(unittest.TestCase):
    def test_patchify_keeps_patch_order_and_shape(self) -> None:
        image = np.arange(16.0).reshape(1, 1, 4, 4)
        patches = main.patchify(image, 2)
        self.assertEqual(patches.shape, (1, 4, 4))
        np.testing.assert_array_equal(patches[0], [[0, 1, 4, 5], [2, 3, 6, 7], [8, 9, 12, 13], [10, 11, 14, 15]])

    def test_patchify_rejects_bad_geometry_and_nonfinite_values(self) -> None:
        with self.assertRaises(ValueError):
            main.patchify(np.zeros((1, 3, 5, 4)), 2)
        with self.assertRaises(ValueError):
            main.patchify(np.full((1, 1, 2, 2), np.nan), 1)

    def test_projection_and_layer_norm(self) -> None:
        tokens = np.array([[[1.0, 2.0], [3.0, 5.0]]])
        projected = main.linear_projection(tokens, [[2.0, 0.0], [0.0, 3.0]], [1.0, -1.0])
        np.testing.assert_allclose(projected, [[[3.0, 5.0], [7.0, 14.0]]])
        normalized = main.layer_norm(projected)
        np.testing.assert_allclose(normalized.mean(axis=-1), 0.0, atol=1e-12)
        np.testing.assert_allclose(normalized.var(axis=-1), 1.0, atol=1e-4)

    def test_softmax_is_stable_and_normalized(self) -> None:
        probabilities = main.softmax(np.array([[1000.0, 1001.0], [-1000.0, -999.0]]))
        self.assertTrue(np.isfinite(probabilities).all())
        np.testing.assert_allclose(probabilities.sum(axis=-1), [1.0, 1.0])

    def test_attention_shapes_rows_and_mask(self) -> None:
        q = np.array([[[[1.0, 0.0], [0.0, 1.0]]]])
        v = np.array([[[[10.0, 0.0], [0.0, 20.0]]]])
        mask = np.array([[[[True, False], [True, True]]]])
        output, weights = main.scaled_dot_product_attention(q, q, v, mask)
        self.assertEqual(output.shape, (1, 1, 2, 2))
        self.assertEqual(weights.shape, (1, 1, 2, 2))
        np.testing.assert_allclose(weights.sum(axis=-1), 1.0)
        self.assertEqual(weights[0, 0, 0, 1], 0.0)
        with self.assertRaises(ValueError):
            main.scaled_dot_product_attention(q, q, v, np.zeros((1, 1, 2, 2), dtype=bool))

    def test_cls_token_and_positions(self) -> None:
        patches = np.zeros((2, 4, 6))
        tokens = main.add_cls_token(patches, np.ones(6))
        self.assertEqual(tokens.shape, (2, 5, 6))
        np.testing.assert_array_equal(tokens[:, 0], 1.0)
        self.assertEqual(main.sinusoidal_positions(5, 6).shape, (5, 6))
        with self.assertRaises(ValueError):
            main.sinusoidal_positions(5, 5)

    def test_vit_forward_is_deterministic_and_has_expected_shapes(self) -> None:
        images = np.arange(2 * 3 * 32 * 32, dtype=float).reshape(2, 3, 32, 32) / 1000.0
        first = main.vit_forward(images, patch_size=8, dim=24, num_heads=3, num_classes=4, seed=5)
        second = main.vit_forward(images, patch_size=8, dim=24, num_heads=3, num_classes=4, seed=5)
        self.assertEqual(first["patches"].shape, (2, 16, 3 * 8 * 8))
        self.assertEqual(first["tokens"].shape, (2, 17, 24))
        self.assertEqual(first["attention"].shape, (2, 3, 17, 17))
        self.assertEqual(first["logits"].shape, (2, 4))
        np.testing.assert_array_equal(first["logits"], second["logits"])
        np.testing.assert_allclose(first["attention"].sum(axis=-1), 1.0)

    def test_vit_rejects_head_mismatch(self) -> None:
        with self.assertRaises(ValueError):
            main.vit_forward(np.zeros((1, 3, 8, 8)), patch_size=4, dim=10, num_heads=3)

    def test_canonical_demo_is_bounded_and_successful(self) -> None:
        result = subprocess.run(
            [sys.executable, "main.py"], cwd=CODE, text=True, capture_output=True, timeout=20
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("(2, 3, 17, 17)", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
