"""Contract and numerical tests for the local two-tower CLIP fixture."""
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
SPEC = importlib.util.spec_from_file_location("lesson_clip", MAIN)
CLIP = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(CLIP)


class NumpyBuildTests(unittest.TestCase):
    def test_numpy_row_normalize_has_unit_norm(self) -> None:
        result = CLIP.numpy_row_normalize(np.array([[3.0, 4.0], [0.0, 2.0]]))
        self.assertTrue(np.allclose(np.linalg.norm(result, axis=1), 1.0))

    def test_numpy_row_normalize_scales_huge_finite_rows(self) -> None:
        result = CLIP.numpy_row_normalize(np.array([[1e308, 1e308], [-1e308, 1e308]]))
        self.assertTrue(np.allclose(np.linalg.norm(result, axis=1), 1.0))
        self.assertTrue(np.all(result != 0))

    def test_numpy_similarity_has_paired_diagonal(self) -> None:
        result = CLIP.numpy_similarity(np.eye(3), np.eye(3))
        self.assertEqual(result.shape, (3, 3))
        self.assertTrue(np.allclose(np.diag(result), 1.0))

    def test_numpy_clip_loss_prefers_aligned_pairs(self) -> None:
        image = np.eye(4)
        self.assertLess(CLIP.numpy_clip_loss(image, image, 2.0), CLIP.numpy_clip_loss(image, np.roll(image, 1, axis=0), 2.0))

    def test_numpy_zero_shot_uses_supplied_class_names(self) -> None:
        names = ["red", "blue"]
        self.assertEqual(CLIP.numpy_zero_shot_classify(np.eye(2), np.eye(2), names), names)

    def test_numpy_contracts_reject_zero_rows_bad_widths_and_scales(self) -> None:
        with self.assertRaises(ValueError):
            CLIP.numpy_row_normalize(np.zeros((2, 3)))
        with self.assertRaises(ValueError):
            CLIP.numpy_similarity(np.ones((2, 3)), np.ones((2, 2)))
        with self.assertRaises(ValueError):
            CLIP.numpy_clip_loss(np.eye(2), np.eye(2), 0)


class ClipFixtureTests(unittest.TestCase):
    def setUp(self) -> None:
        if torch is None:
            self.skipTest("optional PyTorch dependency is unavailable")

    def test_two_tower_encoders_return_unit_rows(self) -> None:
        model = CLIP.TwoTower(img_in=4, txt_in=3, emb=5)
        image, text, scale = model(torch.randn(4, 4), torch.randn(4, 3))
        self.assertEqual(tuple(image.shape), (4, 5))
        self.assertTrue(torch.allclose(image.norm(dim=1), torch.ones(4), atol=1e-5))
        self.assertTrue(torch.allclose(text.norm(dim=1), torch.ones(4), atol=1e-5))
        self.assertGreater(float(scale), 0)

    def test_two_tower_rejects_wrong_width_or_batch(self) -> None:
        model = CLIP.TwoTower(img_in=4, txt_in=3, emb=5)
        with self.assertRaises(ValueError):
            model(torch.randn(2, 5), torch.randn(2, 3))
        with self.assertRaises(ValueError):
            model(torch.randn(2, 4), torch.randn(3, 3))

    def test_clip_loss_matches_symmetric_pair_shape(self) -> None:
        image = torch.eye(4)
        text = torch.eye(4)
        loss = CLIP.clip_loss(image, text, 2.0)
        self.assertEqual(loss.ndim, 0)
        self.assertTrue(torch.isfinite(loss))
        self.assertLess(float(loss), CLIP.clip_loss(image, text.roll(1, 0), 2.0))

    def test_clip_loss_rejects_singleton_nonfinite_and_bad_scale(self) -> None:
        with self.assertRaises(ValueError):
            CLIP.clip_loss(torch.ones(1, 3), torch.ones(1, 3), 1.0)
        with self.assertRaises(ValueError):
            CLIP.clip_loss(torch.ones(2, 3), torch.full((2, 3), float("nan")), 1.0)
        with self.assertRaises(ValueError):
            CLIP.clip_loss(torch.ones(2, 3), torch.ones(2, 3), 0.0)

    def test_zero_shot_uses_one_text_row_per_class(self) -> None:
        model = CLIP.TwoTower(img_in=4, txt_in=3, emb=5)
        names = ["red", "blue", "green"]
        predictions = CLIP.zero_shot_classify(model, torch.randn(2, 4), torch.randn(3, 3), names)
        self.assertEqual(len(predictions), 2)
        self.assertTrue(set(predictions) <= set(names))

    def test_zero_shot_rejects_name_mismatch_and_empty_candidates(self) -> None:
        model = CLIP.TwoTower(img_in=4, txt_in=3, emb=5)
        with self.assertRaises(ValueError):
            CLIP.zero_shot_classify(model, torch.randn(2, 4), torch.randn(3, 3), ["one"])
        with self.assertRaises(ValueError):
            CLIP.zero_shot_classify(model, torch.randn(2, 4), torch.empty(0, 3), [])

    def test_logit_scale_parameter_is_trainable_but_positive(self) -> None:
        model = CLIP.TwoTower()
        self.assertTrue(model.logit_scale.requires_grad)
        self.assertGreater(float(model.logit_scale.exp()), 0)

    def test_demo_exits_without_traceback(self) -> None:
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=45, env=os.environ.copy())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        self.assertIn("synthetic zero-shot", result.stdout)


class ClipFallbackTests(unittest.TestCase):
    def test_source_compiles_without_importing_torch(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_module_exposes_dependency_state(self) -> None:
        self.assertIn(CLIP.TORCH_AVAILABLE, (True, False))

    def test_canonical_command_is_bounded_when_torch_is_missing(self) -> None:
        if torch is not None:
            self.skipTest("fallback branch is only exercised without PyTorch")
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("skipped cleanly", result.stdout)


if __name__ == "__main__":
    unittest.main()
