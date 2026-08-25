import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from trees import (  # noqa: E402
    DecisionTree,
    RandomForest,
    accuracy,
    entropy,
    gini_impurity,
    information_gain,
    variance_reduction,
)


class DecisionTreeTests(unittest.TestCase):
    def setUp(self):
        self.X = [[0], [1], [2], [3], [4], [5]]
        self.y = [0, 0, 0, 1, 1, 1]

    def test_impurity_extremes(self):
        self.assertAlmostEqual(gini_impurity([0, 0]), 0.0)
        self.assertAlmostEqual(gini_impurity([0, 1]), 0.5)
        self.assertAlmostEqual(entropy([0, 0]), 0.0)
        self.assertAlmostEqual(entropy([0, 1]), 1.0)

    def test_information_gain_prefers_pure_split(self):
        gain = information_gain(self.y, self.y[:3], self.y[3:])
        self.assertGreater(gain, 0.4)

    def test_variance_reduction_is_positive_for_separated_values(self):
        self.assertGreater(variance_reduction([1, 2, 9, 10], [1, 2], [9, 10]), 15)

    def test_tree_learns_threshold_and_predicts(self):
        tree = DecisionTree(max_depth=2).fit(self.X, self.y)
        self.assertEqual(tree.predict([[0], [5]]), [0, 1])
        self.assertAlmostEqual(sum(tree.feature_importances_), 1.0)

    def test_tree_pruning_changes_leaf_complexity(self):
        shallow = DecisionTree(max_depth=0).fit(self.X, self.y)
        self.assertEqual(shallow.predict([[0], [5]]), [0, 0])

    def test_forest_votes_and_reports_importances(self):
        forest = RandomForest(n_trees=9, max_depth=2, seed=3).fit(self.X, self.y)
        self.assertGreaterEqual(accuracy(self.y, forest.predict(self.X)), 0.8)
        self.assertAlmostEqual(sum(forest.feature_importances()), 1.0)

    def test_regression_tree_returns_numeric_leaf_means(self):
        model = DecisionTree(max_depth=1, task="regression").fit(self.X, [0, 0, 0, 10, 10, 10])
        prediction = model.predict([[0], [5]])
        self.assertEqual(prediction, [0.0, 10.0])

    def test_contract_rejects_bad_shapes_and_unfitted_prediction(self):
        with self.assertRaises(ValueError):
            DecisionTree().fit([], [])
        with self.assertRaises(ValueError):
            DecisionTree().fit([[1], [2, 3]], [0, 1])
        with self.assertRaises(RuntimeError):
            DecisionTree().predict([[1]])


if __name__ == "__main__":
    unittest.main()
