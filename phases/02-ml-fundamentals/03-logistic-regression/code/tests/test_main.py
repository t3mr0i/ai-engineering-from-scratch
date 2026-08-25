import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from logistic_regression import (  # noqa: E402
    ClassificationMetrics,
    LogisticRegression,
    SoftmaxRegression,
    sigmoid,
)


class LogisticRegressionTests(unittest.TestCase):
    def test_sigmoid_is_stable_and_centered(self):
        self.assertAlmostEqual(sigmoid(0), 0.5)
        self.assertGreater(sigmoid(500), 0.999)
        self.assertLess(sigmoid(-500), 0.001)

    def test_binary_loss_decreases_on_separable_fixture(self):
        X = [[0], [1], [2], [3], [4], [5]]
        y = [0, 0, 0, 1, 1, 1]
        model = LogisticRegression(1, learning_rate=0.2).fit(X, y, epochs=300)
        self.assertLess(model.loss_history[-1], model.loss_history[0])
        self.assertGreaterEqual(model.accuracy(X, y), 5 / 6)

    def test_threshold_changes_classification(self):
        model = LogisticRegression(1)
        model.weights = [1.0]
        self.assertEqual(model.predict([0.2], threshold=0.6), 0)
        self.assertEqual(model.predict([0.2], threshold=0.5), 1)

    def test_metrics_calculate_confusion_rates(self):
        metrics = ClassificationMetrics([1, 1, 0, 0], [1, 0, 1, 0])
        self.assertEqual((metrics.tp, metrics.tn, metrics.fp, metrics.fn), (1, 1, 1, 1))
        self.assertAlmostEqual(metrics.precision(), 0.5)
        self.assertAlmostEqual(metrics.recall(), 0.5)
        self.assertAlmostEqual(metrics.f1(), 0.5)

    def test_softmax_probabilities_sum_to_one(self):
        model = SoftmaxRegression(2, 3)
        probabilities = model.predict_proba([2, -1])
        self.assertAlmostEqual(sum(probabilities), 1.0)
        self.assertTrue(all(0 <= value <= 1 for value in probabilities))

    def test_softmax_learns_three_small_clusters(self):
        X = [[0, 0], [3, 0], [0, 3]] * 4
        y = [0, 1, 2] * 4
        model = SoftmaxRegression(2, 3, learning_rate=0.1).fit(X, y, epochs=500)
        self.assertGreaterEqual(model.accuracy(X, y), 0.9)

    def test_invalid_labels_and_thresholds_are_rejected(self):
        with self.assertRaises(ValueError):
            LogisticRegression(1).fit([[0]], [2])
        with self.assertRaises(ValueError):
            LogisticRegression(1).fit([[0]], [0.5])
        with self.assertRaises(ValueError):
            LogisticRegression(1).fit([[0]], ["0"])
        with self.assertRaises(ValueError):
            LogisticRegression(1).predict([0], threshold=1.2)
        with self.assertRaises(ValueError):
            ClassificationMetrics([], [])
        with self.assertRaises(ValueError):
            ClassificationMetrics([2], [2])
        with self.assertRaises(ValueError):
            SoftmaxRegression(1, 2).fit([[0]], [1.9])


if __name__ == "__main__":
    unittest.main()
