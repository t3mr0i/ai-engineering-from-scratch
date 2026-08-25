from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("transfer_learning", CODE / "main.py")
transfer = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(transfer)


class TransferLearningTests(unittest.TestCase):
    def test_dataset_and_backbone_features_are_reproducible(self) -> None:
        images, labels = transfer.synthetic_dataset(3, 3, 8, seed=5)
        self.assertEqual(images.shape, (9, 8, 8, 3))
        self.assertEqual(labels.shape, (9,))
        np.testing.assert_array_equal(images, transfer.synthetic_dataset(3, 3, 8, seed=5)[0])
        features = transfer.backbone_features(images)
        self.assertEqual(features.shape, (9, 12))
        np.testing.assert_allclose(features, transfer.backbone_features(images))

    def test_head_shapes_and_logits(self) -> None:
        weights, bias = transfer.init_head(4, 3, seed=1)
        self.assertEqual(weights.shape, (3, 4))
        self.assertEqual(bias.shape, (3,))
        np.testing.assert_allclose(transfer.linear_logits(np.ones((2, 4)), weights, bias).shape, (2, 3))
        with self.assertRaises(ValueError):
            transfer.linear_logits(np.ones((2, 5)), weights, bias)

    def test_softmax_and_cross_entropy_are_stable(self) -> None:
        logits = np.array([[1000.0, 999.0], [999.0, 1000.0]])
        probabilities = transfer.softmax(logits)
        self.assertTrue(np.isfinite(probabilities).all())
        np.testing.assert_allclose(probabilities.sum(axis=1), 1.0)
        self.assertLess(transfer.cross_entropy(logits, np.array([0, 1])), 0.5)

    def test_frozen_parameter_count_and_mask(self) -> None:
        counts = transfer.parameter_counts(100, 12, freeze_backbone=True)
        self.assertEqual(counts["trainable"], 12)
        mask = transfer.freeze_mask(6, [1, 4])
        np.testing.assert_array_equal(mask, [False, True, False, False, True, False])
        with self.assertRaises(ValueError):
            transfer.freeze_mask(4, [4])

    def test_discriminative_learning_rates_increase_toward_head(self) -> None:
        rates = transfer.discriminative_lrs(["stem", "stage1", "head"], base_lr=1e-3, decay=0.1)
        self.assertLess(rates["stem"], rates["stage1"])
        self.assertLess(rates["stage1"], rates["head"])
        with self.assertRaises(ValueError):
            transfer.discriminative_lrs(["head"], decay=0)

    def test_head_training_reduces_loss(self) -> None:
        images, labels = transfer.synthetic_dataset(8, 3, 8, seed=0)
        features = transfer.backbone_features(images)
        weights, bias, history = transfer.train_head(features, labels, 3, epochs=30, lr=0.6, seed=2)
        self.assertLess(history[-1], history[0])
        predictions = np.argmax(transfer.linear_logits(features, weights, bias), axis=1)
        self.assertGreater(np.mean(predictions == labels), 0.8)

    def test_invalid_contracts_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            transfer.synthetic_dataset(0)
        with self.assertRaises(ValueError):
            transfer.synthetic_dataset(1, 3, 1)
        with self.assertRaises(ValueError):
            transfer.backbone_features(np.zeros((2, 4, 4)))
        with self.assertRaises(ValueError):
            transfer.backbone_features(np.zeros((1, 1, 4, 3)))
        with self.assertRaises(ValueError):
            transfer.backbone_features(np.zeros((1, 4, 1, 3)))
        with self.assertRaises(ValueError):
            transfer.train_head(np.ones((2, 3)), np.array([0, 2]), 2)
        with self.assertRaises(ValueError):
            transfer.parameter_counts(1, 0)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("frozen-backbone", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
