"""Numerical and parameter-contract tests for the self-supervised fixture."""
from __future__ import annotations

import importlib.util
import math
import os
from pathlib import Path
import subprocess
import sys
import unittest
import warnings

import numpy as np
try:
    import torch
except ModuleNotFoundError:
    torch = None

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
SPEC = importlib.util.spec_from_file_location("lesson_ssl", MAIN)
SSL = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(SSL)


class NumpyBuildTests(unittest.TestCase):
    def test_numpy_normalize_produces_unit_rows(self) -> None:
        normalized = SSL.numpy_normalize(np.array([[3.0, 4.0], [0.0, 2.0]]))
        self.assertTrue(np.allclose(np.linalg.norm(normalized, axis=1), 1.0))

    def test_numpy_normalize_scales_huge_finite_rows_without_zeroing_them(self) -> None:
        normalized = SSL.numpy_normalize(np.array([[1e308, 1e308], [-1e308, 1e308]]))
        self.assertTrue(np.allclose(np.linalg.norm(normalized, axis=1), 1.0))
        self.assertTrue(np.all(normalized != 0))

    def test_numpy_info_nce_is_finite_and_aligned_pairs_are_better(self) -> None:
        z = np.eye(4)
        self.assertTrue(np.isfinite(SSL.numpy_info_nce(z, z)))
        self.assertLess(SSL.numpy_info_nce(z, z), SSL.numpy_info_nce(z, np.roll(z, 1, axis=0)))

    def test_numpy_mask_partition_is_reproducible_and_complete(self) -> None:
        visible, masked = SSL.numpy_mask_indices(16, 0.75, seed=4)
        self.assertEqual(len(visible), 4)
        self.assertEqual(set(visible) | set(masked), set(range(16)))
        self.assertEqual(set(visible) & set(masked), set())
        self.assertTrue(np.array_equal(visible, SSL.numpy_mask_indices(16, 0.75, seed=4)[0]))

    def test_numpy_dino_teacher_is_a_probability_distribution(self) -> None:
        probabilities = SSL.numpy_dino_teacher(np.zeros((3, 5)))
        self.assertTrue(np.allclose(probabilities.sum(axis=1), 1.0))
        updated = SSL.numpy_update_centre(np.zeros(5), np.ones((2, 5)), momentum=0.5)
        self.assertTrue(np.allclose(updated, 0.5))

    def test_numpy_seams_reject_zero_nonfinite_and_bad_controls(self) -> None:
        with self.assertRaises(ValueError):
            SSL.numpy_normalize(np.zeros((2, 3)))
        with self.assertRaises(ValueError):
            SSL.numpy_info_nce(np.ones((2, 3)), np.ones((2, 3)), tau=0)
        with self.assertRaises(ValueError):
            SSL.numpy_mask_indices(16, mask_ratio=1.0)

    def test_numpy_scaled_extremes_fail_explicitly_without_warnings(self) -> None:
        with warnings.catch_warnings():
            warnings.simplefilter("error", RuntimeWarning)
            stable_centre = SSL.numpy_update_centre(np.zeros(2), np.full((2, 2), 1e308), momentum=0.0)
            self.assertTrue(np.all(np.isfinite(stable_centre)))
            self.assertTrue(np.allclose(stable_centre, 1e308))
            with self.assertRaises(ValueError):
                SSL.numpy_info_nce(np.array([[1e308, -1e308], [1.0, 0.0]]), np.array([[1e308, -1e308], [1.0, 0.0]]), tau=1e-320)
            with self.assertRaises(ValueError):
                SSL.numpy_info_nce(np.array([[1.0, 0.0], [-1.0, 0.0]]), np.array([[-1.0, 0.0], [1.0, 0.0]]), tau=1e-308)
            with self.assertRaises(ValueError):
                SSL.numpy_dino_teacher(np.array([[1e308, -1e308]]), temp=0.04)


class SelfSupervisedTests(unittest.TestCase):
    def setUp(self) -> None:
        if torch is None:
            self.skipTest("optional PyTorch dependency is unavailable")

    def test_info_nce_pairs_two_views_and_returns_scalar(self) -> None:
        torch.manual_seed(0)
        z = torch.randn(4, 8)
        loss = SSL.info_nce(z, z)
        self.assertEqual(loss.ndim, 0)
        self.assertTrue(torch.isfinite(loss))

    def test_info_nce_rejects_mismatched_zero_or_nonfinite_inputs(self) -> None:
        with self.assertRaises(ValueError):
            SSL.info_nce(torch.ones(2, 4), torch.ones(3, 4))
        with self.assertRaises(ValueError):
            SSL.info_nce(torch.ones(1, 4), torch.ones(1, 4))
        with self.assertRaises(ValueError):
            SSL.info_nce(torch.tensor([[float("nan")]]).repeat(2, 1), torch.ones(2, 1))

    def test_info_nce_temperature_is_strictly_positive_and_non_boolean(self) -> None:
        z = torch.ones(2, 4)
        for tau in (0.0, -1.0, True, float("nan")):
            with self.subTest(tau=tau), self.assertRaises(ValueError):
                SSL.info_nce(z, z, tau=tau)

    def test_mask_indices_are_partitioned_and_reproducible(self) -> None:
        visible, masked = SSL.random_mask_indices(16, 0.75, seed=4)
        self.assertEqual(len(visible), 4)
        self.assertEqual(set(visible.tolist()) | set(masked.tolist()), set(range(16)))
        self.assertEqual(set(visible.tolist()) & set(masked.tolist()), set())
        self.assertTrue(torch.equal(visible, SSL.random_mask_indices(16, 0.75, seed=4)[0]))

    def test_mask_indices_reject_invalid_ratio_and_patch_count(self) -> None:
        for args in ((1, 0.5), (16, -0.1), (16, 1.0), (16, True)):
            with self.subTest(args=args), self.assertRaises(ValueError):
                SSL.random_mask_indices(*args)

    def test_dino_teacher_is_probability_and_student_is_log_probability(self) -> None:
        head = SSL.DinoHead(in_dim=4, out_dim=6)
        x = torch.randn(3, 4)
        teacher = head.teacher(x)
        student = head.student(x)
        self.assertTrue(torch.allclose(teacher.sum(dim=1), torch.ones(3)))
        self.assertTrue(torch.allclose(student.exp().sum(dim=1), torch.ones(3)))
        self.assertFalse(teacher.requires_grad)

    def test_dino_centre_update_has_expected_shape_and_changes_state(self) -> None:
        head = SSL.DinoHead(in_dim=4, out_dim=3, momentum=0.5)
        before = head.centre.clone()
        head.update_centre(torch.ones(5, 3))
        self.assertFalse(torch.equal(before, head.centre))
        self.assertEqual(tuple(head.centre.shape), (3,))
        with self.assertRaises(ValueError):
            head.update_centre(torch.ones(5, 2))

    def test_dino_rejects_invalid_temperatures_and_momentum(self) -> None:
        for kwargs in ({"momentum": 1.0}, {"momentum": True}):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                SSL.DinoHead(**kwargs)
        head = SSL.DinoHead(in_dim=4, out_dim=3)
        with self.assertRaises(ValueError):
            head.teacher(torch.ones(2, 4), temp=0.0)

    def test_demo_exits_without_traceback(self) -> None:
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=45, env=os.environ.copy())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        self.assertIn("[MAE mask]", result.stdout)


class SelfSupervisedFallbackTests(unittest.TestCase):
    def test_source_compiles_without_importing_torch(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_module_exposes_dependency_state(self) -> None:
        self.assertIn(SSL.TORCH_AVAILABLE, (True, False))

    def test_canonical_command_is_bounded_when_torch_is_missing(self) -> None:
        if torch is not None:
            self.skipTest("fallback branch is only exercised without PyTorch")
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("skipped cleanly", result.stdout)


if __name__ == "__main__":
    unittest.main()
