from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("image_classification", CODE / "main.py")
classifier = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(classifier)


class ClassificationTests(unittest.TestCase):
    def test_synthetic_fixture_shape_and_reproducibility(self) -> None:
        x, y = classifier.synthetic_cifar(3, 3, 8, seed=2)
        self.assertEqual(x.shape, (9, 8, 8, 3))
        self.assertEqual(y.shape, (9,))
        np.testing.assert_array_equal(x, classifier.synthetic_cifar(3, 3, 8, seed=2)[0])
        self.assertTrue(np.all((x >= 0) & (x <= 1)))

    def test_standardize_and_shape_contract(self) -> None:
        x = np.ones((2, 4, 4, 3), dtype=np.float32)
        result = classifier.standardize(x, [1, 1, 1], [2, 4, 5])
        np.testing.assert_allclose(result, 0)
        with self.assertRaises(ValueError):
            classifier.standardize(x, [0, 0], [1, 1])
        with self.assertRaises(ValueError):
            classifier.standardize(np.zeros((4, 4, 3)), [0, 0, 0], [1, 1, 1])

    def test_softmax_is_stable_and_normalized(self) -> None:
        probabilities = classifier.softmax(np.array([[1000.0, 1001.0, -1000.0]]))
        self.assertTrue(np.isfinite(probabilities).all())
        np.testing.assert_allclose(probabilities.sum(axis=1), 1.0)
        self.assertGreater(probabilities[0, 1], probabilities[0, 0])

    def test_cross_entropy_hard_and_soft_targets(self) -> None:
        logits = np.array([[4.0, 0.0], [0.0, 4.0]])
        self.assertLess(classifier.cross_entropy(logits, np.array([0, 1])), 0.05)
        soft = np.array([[1.0, 0.0], [0.0, 1.0]])
        self.assertAlmostEqual(classifier.cross_entropy(logits, soft), classifier.cross_entropy(logits, np.array([0, 1])))
        with self.assertRaises(ValueError):
            classifier.cross_entropy(logits, np.array([2, 0]))

    def test_transforms_are_seeded_and_preserve_shape(self) -> None:
        image = np.arange(48, dtype=np.float32).reshape(4, 4, 3)
        a = classifier.random_hflip(image, p=1, rng=np.random.default_rng(4))
        b = classifier.random_crop(image, pad=1, rng=np.random.default_rng(4))
        self.assertEqual(a.shape, image.shape)
        self.assertEqual(b.shape, image.shape)
        np.testing.assert_array_equal(a, image[:, ::-1])
        np.testing.assert_array_equal(b, classifier.random_crop(image, pad=1, rng=np.random.default_rng(4)))

    def test_mixup_returns_convex_samples_and_soft_labels(self) -> None:
        x = np.zeros((2, 2, 2, 3), dtype=np.float32)
        x[1] = 1
        mixed_x, mixed_y = classifier.mixup_batch(x, np.array([0, 1]), 2, alpha=0.5, rng=np.random.default_rng(3))
        self.assertEqual(mixed_x.shape, x.shape)
        self.assertEqual(mixed_y.shape, (2, 2))
        np.testing.assert_allclose(mixed_y.sum(axis=1), 1.0)
        self.assertTrue(np.all((mixed_x >= 0) & (mixed_x <= 1)))

    def test_training_reduces_fixture_loss(self) -> None:
        images, labels = classifier.synthetic_cifar(8, 3, 8, seed=0)
        weights, bias, history = classifier.train_linear_classifier(classifier.image_features(images), labels, 3, epochs=30, lr=0.6, seed=1)
        self.assertLess(history[-1], history[0])
        predictions = np.argmax(classifier.image_features(images) @ weights.T + bias, axis=1)
        self.assertGreater(np.mean(predictions == labels), 0.8)

    def test_confusion_report_and_invalid_inputs(self) -> None:
        cm = classifier.confusion_matrix(np.array([0, 1, 1]), np.array([0, 0, 1]), 2)
        np.testing.assert_array_equal(cm, [[1, 0], [1, 1]])
        report = classifier.per_class_report(cm)
        self.assertEqual(report["f1"].shape, (2,))
        with self.assertRaises(ValueError):
            classifier.confusion_matrix(np.array([0]), np.array([2]), 2)
        invalid_matrices = (
            np.array([[1, 0.5], [0, 1]]),
            np.array([[1, np.nan], [0, 1]]),
            np.array([[True, False], [False, True]]),
            np.array([[1, 0], [0, 1]], dtype=object),
        )
        for invalid in invalid_matrices:
            with self.assertRaises(ValueError):
                classifier.per_class_report(invalid)
        with self.assertRaises(ValueError):
            classifier.mixup_batch(np.zeros((1, 2)), np.array([0]), 1, alpha=0)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("linear loss", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
