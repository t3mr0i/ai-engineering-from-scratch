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

    def test_stratified_folds_cover_rows_with_balanced_sizes(self):
        folds = evaluation.stratified_kfold_split([0] * 6 + [1] * 6, k=4, seed=2)
        self.assertEqual(sorted(len(val) for _, val in folds), [3, 3, 3, 3])
        self.assertEqual(sorted(index for _, val in folds for index in val), list(range(12)))
        for train, val in folds:
            self.assertEqual(set(train) & set(val), set())

    def test_split_and_metric_boundaries_are_explicit(self):
        with self.assertRaises(ValueError):
            evaluation.kfold_split(2, k=5)
        with self.assertRaises(ValueError):
            evaluation.train_val_test_split([[1], [2]], [0, 1], train_ratio=0.5, val_ratio=0.0)
        with self.assertRaises(ValueError):
            evaluation.train_val_test_split([[1]], [1], train_ratio=0.9, val_ratio=0.5)
        with self.assertRaises(ValueError):
            evaluation.confusion_matrix([1, 0], [1])
        with self.assertRaises(ValueError):
            evaluation.confusion_matrix([2], [1])
        with self.assertRaises(ValueError):
            evaluation.mse([1.0], [])
        with self.assertRaises(ValueError):
            evaluation.mae([1.0, 2.0], [1.0])
        with self.assertRaises(ValueError):
            evaluation.roc_curve([1, 1], [0.2, 0.3])


if __name__ == "__main__":
    unittest.main()
