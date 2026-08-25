"""Loss, mining, recall, and shape-contract tests for the retrieval fixture."""
from __future__ import annotations

import importlib.util
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
SPEC = importlib.util.spec_from_file_location("lesson_retrieval", MAIN)
RETRIEVAL = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(RETRIEVAL)


class NumpyBuildTests(unittest.TestCase):
    def test_numpy_triplet_hinge_matches_hand_calculation(self) -> None:
        self.assertEqual(RETRIEVAL.numpy_triplet_loss(np.array([[0.0, 0.0]]), np.array([[0.4, 0.0]]), np.array([[0.7, 0.0]]), 0.2), 0.0)
        self.assertAlmostEqual(RETRIEVAL.numpy_triplet_loss(np.array([[0.0, 0.0]]), np.array([[1.0, 0.0]]), np.array([[0.0, 0.0]]), 0.2), 1.2)

    def test_numpy_miner_preserves_positive_and_negative_labels(self) -> None:
        emb = np.array([[0.0, 0.0], [0.1, 0.0], [1.0, 0.0], [1.1, 0.0]])
        labels = np.array([0, 0, 1, 1])
        positive, negative = RETRIEVAL.numpy_semi_hard_negatives(emb, labels, margin=1.0)
        self.assertTrue(np.all(labels[positive] == labels))
        self.assertTrue(np.all(labels[negative] != labels))

    def test_numpy_miner_chooses_nearest_same_class_positive(self) -> None:
        emb = np.array([[0.0, 0.0], [0.1, 0.0], [1.0, 0.0], [1.1, 0.0]])
        positive, _ = RETRIEVAL.numpy_semi_hard_negatives(emb, np.array([0, 0, 1, 1]), margin=1.0)
        self.assertEqual(positive.tolist(), [1, 0, 3, 2])

    def test_numpy_recall_normalizes_and_finds_top_one(self) -> None:
        query = np.array([[10.0, 0.0], [0.0, 10.0]])
        gallery = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, 0.0]])
        self.assertEqual(RETRIEVAL.numpy_recall_at_k(query, gallery, np.array([0, 1]), np.array([0, 1, 2])), 1.0)

    def test_numpy_recall_scales_huge_rows_and_triplet_rejects_unrepresentable_distance(self) -> None:
        huge = np.array([[1e308, 1e308], [-1e308, -1e308]])
        self.assertEqual(RETRIEVAL.numpy_recall_at_k(huge, huge, np.array([0, 1]), np.array([0, 1]), k=1), 1.0)
        with warnings.catch_warnings():
            warnings.simplefilter("error", RuntimeWarning)
            with self.assertRaises(ValueError):
                RETRIEVAL.numpy_triplet_loss(np.array([[1e308, 1e308]]), np.array([[1e308, 1e308]]), np.array([[-1e308, -1e308]]))

    def test_numpy_triplet_and_miner_are_overflow_safe_for_large_margin(self) -> None:
        with warnings.catch_warnings():
            warnings.simplefilter("error", RuntimeWarning)
            with self.assertRaises(ValueError):
                RETRIEVAL.numpy_triplet_loss(np.array([[1e308, 0.0]]), np.array([[0.0, 0.0]]), np.array([[1e308, 0.0]]), margin=1e308)
            positive, negative = RETRIEVAL.numpy_semi_hard_negatives(
                np.array([[0.0, 0.0], [0.1, 0.0], [1.0, 0.0], [1.1, 0.0]]),
                np.array([0, 0, 1, 1]),
                margin=1e308,
            )
            self.assertEqual(positive.tolist(), [1, 0, 3, 2])
            self.assertTrue(np.all(np.array([0, 0, 1, 1])[negative] != np.array([0, 0, 1, 1])))

    def test_numpy_miner_uses_fallback_and_rejects_missing_classes(self) -> None:
        positive, negative = RETRIEVAL.numpy_semi_hard_negatives(np.array([[0.0], [0.1], [1.0], [1.1]]), np.array([0, 0, 1, 1]), margin=0.0)
        self.assertTrue(np.all(np.array([0, 0, 1, 1])[positive] == np.array([0, 0, 1, 1])))
        self.assertTrue(np.all(np.array([0, 0, 1, 1])[negative] != np.array([0, 0, 1, 1])))
        with self.assertRaises(ValueError):
            RETRIEVAL.numpy_semi_hard_negatives(np.ones((3, 2)), np.array([0, 0, 0]))

    def test_numpy_retrieval_rejects_zero_rows_bad_k_and_widths(self) -> None:
        with self.assertRaises(ValueError):
            RETRIEVAL.numpy_recall_at_k(np.zeros((1, 2)), np.ones((2, 2)), np.array([0]), np.array([0, 1]))
        with self.assertRaises(ValueError):
            RETRIEVAL.numpy_recall_at_k(np.ones((1, 2)), np.ones((2, 2)), np.array([0]), np.array([0, 1]), k=0)
        with self.assertRaises(ValueError):
            RETRIEVAL.numpy_recall_at_k(np.ones((1, 2)), np.ones((2, 3)), np.array([0]), np.array([0, 1]))


class RetrievalTests(unittest.TestCase):
    def setUp(self) -> None:
        if torch is None:
            self.skipTest("optional PyTorch dependency is unavailable")

    def test_triplet_hinge_is_zero_when_margin_is_satisfied(self) -> None:
        anchor = torch.tensor([[0.0, 0.0]])
        positive = torch.tensor([[0.4, 0.0]])
        negative = torch.tensor([[0.7, 0.0]])
        self.assertEqual(float(RETRIEVAL.triplet_loss(anchor, positive, negative, margin=0.2)), 0.0)

    def test_triplet_hinge_is_positive_for_a_violation(self) -> None:
        value = RETRIEVAL.triplet_loss(torch.zeros(1, 2), torch.ones(1, 2), torch.zeros(1, 2), margin=0.2)
        self.assertGreater(float(value), 0.0)
        with self.assertRaises(ValueError):
            RETRIEVAL.triplet_loss(torch.zeros(1, 2), torch.zeros(1, 3), torch.zeros(1, 2))

    def test_miner_returns_positive_and_negative_class_indices(self) -> None:
        emb = torch.tensor([[0.0, 0.0], [0.1, 0.0], [1.0, 0.0], [1.1, 0.0]])
        labels = torch.tensor([0, 0, 1, 1])
        positive, negative = RETRIEVAL.semi_hard_negatives(emb, labels, margin=1.0)
        self.assertTrue(torch.all(labels[positive] == labels))
        self.assertTrue(torch.all(labels[negative] != labels))
        self.assertTrue(torch.all(positive != torch.arange(4)))
        self.assertEqual(positive.tolist(), [1, 0, 3, 2])

    def test_miner_rejects_missing_positive_or_negative_examples(self) -> None:
        with self.assertRaises(ValueError):
            RETRIEVAL.semi_hard_negatives(torch.randn(3, 2), torch.tensor([0, 1, 2]))
        with self.assertRaises(ValueError):
            RETRIEVAL.semi_hard_negatives(torch.randn(3, 2), torch.tensor([0, 0, 0]))

    def test_recall_normalizes_vectors_and_counts_any_top_k_match(self) -> None:
        query = torch.tensor([[10.0, 0.0], [0.0, 10.0]])
        gallery = torch.tensor([[1.0, 0.0], [0.0, 1.0], [-1.0, 0.0]])
        self.assertEqual(RETRIEVAL.recall_at_k(query, gallery, torch.tensor([0, 1]), torch.tensor([0, 1, 2]), k=1), 1.0)

    def test_recall_rejects_bad_k_shapes_and_empty_sets(self) -> None:
        query = torch.ones(2, 3)
        gallery = torch.ones(3, 3)
        labels_q, labels_g = torch.tensor([0, 1]), torch.tensor([0, 1, 2])
        for k in (0, 4, True):
            with self.subTest(k=k), self.assertRaises(ValueError):
                RETRIEVAL.recall_at_k(query, gallery, labels_q, labels_g, k=k)
        with self.assertRaises(ValueError):
            RETRIEVAL.recall_at_k(torch.empty(0, 3), gallery, torch.empty(0, dtype=torch.long), labels_g)

    def test_encoder_returns_unit_embeddings_and_checks_width(self) -> None:
        encoder = RETRIEVAL.Encoder(in_dim=3, emb_dim=4)
        output = encoder(torch.randn(5, 3))
        self.assertTrue(torch.allclose(output.norm(dim=1), torch.ones(5), atol=1e-5))
        with self.assertRaises(ValueError):
            encoder(torch.randn(5, 2))

    def test_demo_exits_without_traceback(self) -> None:
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=45, env=os.environ.copy())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        self.assertIn("recall@1", result.stdout)


class RetrievalFallbackTests(unittest.TestCase):
    def test_source_compiles_without_importing_torch(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_module_exposes_dependency_state(self) -> None:
        self.assertIn(RETRIEVAL.TORCH_AVAILABLE, (True, False))

    def test_canonical_command_is_bounded_when_torch_is_missing(self) -> None:
        if torch is not None:
            self.skipTest("fallback branch is only exercised without PyTorch")
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("skipped cleanly", result.stdout)


if __name__ == "__main__":
    unittest.main()
