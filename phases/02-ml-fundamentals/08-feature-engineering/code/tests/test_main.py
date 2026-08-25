"""Behavioral tests for the feature transformations used in the lesson."""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import features


class FeatureEngineeringTests(unittest.TestCase):
    def test_min_max_constant_and_range(self):
        self.assertEqual(features.min_max_scale([2, 4, 6]), [0.0, 0.5, 1.0])
        self.assertEqual(features.min_max_scale([3, 3]), [0.0, 0.0])

    def test_standardize_has_zero_mean(self):
        values = features.standardize([1.0, 2.0, 3.0])
        self.assertAlmostEqual(sum(values), 0.0)
        self.assertAlmostEqual(sum(v * v for v in values) / 3, 1.0)

    def test_polynomial_interaction_order(self):
        self.assertEqual(features.polynomial_features([2, 3]), [2, 3, 4, 9, 6])

    def test_categorical_encoders_are_deterministic(self):
        encoded, cats = features.one_hot_encode(["b", "a", "b"])
        self.assertEqual(cats, ["a", "b"])
        self.assertEqual(encoded, [[0, 1], [1, 0], [0, 1]])
        labels, mapping = features.label_encode(["b", "a", "b"])
        self.assertEqual(labels, [1, 0, 1])
        self.assertEqual(mapping, {"a": 0, "b": 1})

    def test_target_encoding_uses_smoothing(self):
        values, mapping = features.target_encode(["a", "a", "b"], [1.0, 1.0, 0.0], smoothing=1)
        self.assertAlmostEqual(mapping["a"], 0.75)
        self.assertEqual(values[0], values[1])

    def test_tfidf_downweights_shared_word(self):
        vectors, vocab = features.tfidf(["shared rare", "shared common"])
        self.assertEqual(len(vectors), 2)
        self.assertEqual(vectors[0][vocab["shared"]], 0.0)
        self.assertGreater(vectors[0][vocab["rare"]], 0.0)

    def test_imputation_and_missing_indicator(self):
        filled, median = features.impute_median([1.0, None, 5.0])
        self.assertEqual(filled, [1.0, 3.0, 5.0])
        self.assertEqual(median, 3.0)
        self.assertEqual(features.add_missing_indicator([1, None]), [0, 1])

    def test_filter_selection_keeps_variable_column(self):
        rows = [[1.0, 4.0], [1.0, 5.0], [1.0, 6.0]]
        self.assertEqual(features.variance_threshold(rows, threshold=0.1), [1])
        self.assertEqual(features.remove_correlated([[1, 2], [2, 4], [3, 6]], threshold=0.9), [0])


if __name__ == "__main__":
    unittest.main()
