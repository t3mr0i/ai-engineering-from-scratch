"""Executable Python checks for splitters, metrics, and local estimators."""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import evaluation


class EvaluationTests(unittest.TestCase):
    def test_split_sizes_are_disjoint(self):
        X = [[i] for i in range(10)]
        y = list(range(10))
        parts = evaluation.train_val_test_split(X, y, train_ratio=0.6, val_ratio=0.2, seed=4)
        self.assertEqual([len(part) for part in parts[::2]], [6, 2, 2])
        self.assertEqual(len({tuple(row) for group in parts[::2] for row in group}), 10)

    def test_kfold_covers_each_index_once_as_validation(self):
        folds = evaluation.kfold_split(11, k=4, seed=3)
        validation = [index for _, val in folds for index in val]
        self.assertEqual(sorted(validation), list(range(11)))
        self.assertEqual(len(folds), 4)

    def test_classification_metrics_and_confusion_matrix(self):
        truth = [1, 1, 0, 0]
        pred = [1, 0, 0, 0]
        self.assertEqual(evaluation.confusion_matrix(truth, pred), (1, 2, 0, 1))
        self.assertAlmostEqual(evaluation.accuracy(truth, pred), 0.75)
        self.assertAlmostEqual(evaluation.precision(truth, pred), 1.0)
        self.assertAlmostEqual(evaluation.recall(truth, pred), 0.5)
        self.assertAlmostEqual(evaluation.f1_score(truth, pred), 2 / 3)

    def test_roc_curve_and_auc_rank_positive_scores(self):
        fpr, tpr, thresholds = evaluation.roc_curve([0, 1], [0.1, 0.9])
        self.assertEqual((fpr[0], tpr[0]), (0.0, 0.0))
        self.assertEqual((fpr[-1], tpr[-1]), (1.0, 1.0))
        self.assertAlmostEqual(evaluation.auc_roc([0, 1], [0.1, 0.9]), 1.0)
        self.assertEqual(len(thresholds), len(fpr))

    def test_regression_metrics_have_expected_baseline(self):
        truth = [1.0, 2.0, 3.0]
        pred = [1.0, 3.0, 2.0]
        self.assertAlmostEqual(evaluation.mse(truth, pred), 2 / 3)
        self.assertAlmostEqual(evaluation.rmse(truth, pred), (2 / 3) ** 0.5)
        self.assertAlmostEqual(evaluation.mae(truth, pred), 2 / 3)

    def test_logistic_and_cross_validation_are_reproducible(self):
        X, y = evaluation.make_classification_data(80, seed=8)
        model = evaluation.SimpleLogistic(epochs=80)
        model.fit(X[:60], y[:60])
        self.assertIn(model.predict(X[60]), (0, 1))
        one = evaluation.cross_validate(X, y, lambda: evaluation.SimpleLogistic(epochs=30), k=4)
        two = evaluation.cross_validate(X, y, lambda: evaluation.SimpleLogistic(epochs=30), k=4)
        self.assertEqual(one, two)


if __name__ == "__main__":
    unittest.main()
