"""Behavioral tests for Multinomial and Gaussian Naive Bayes."""

from pathlib import Path
import sys
import unittest
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import naive_bayes


class NaiveBayesTests(unittest.TestCase):
    def test_multinomial_rejects_negative_counts(self):
        with self.assertRaises(ValueError):
            naive_bayes.MultinomialNB().fit(np.array([[1.0, -1.0]]), np.array([0]))

    def test_multinomial_predicts_word_profile(self):
        X = np.array([[4, 0], [3, 0], [0, 4], [0, 3]], dtype=float)
        y = np.array([0, 0, 1, 1])
        model = naive_bayes.MultinomialNB(alpha=1.0)
        model.fit(X, y)
        np.testing.assert_array_equal(model.predict(X), y)

    def test_multinomial_probabilities_sum_to_one(self):
        X, y = naive_bayes.make_text_data(80, n_features=200, seed=3)
        model = naive_bayes.MultinomialNB().fit(X, y)
        np.testing.assert_allclose(model.predict_proba(X[:5]).sum(axis=1), np.ones(5))

    def test_gaussian_learns_separated_means(self):
        X = np.array([[-2.0], [-1.0], [1.0], [2.0]])
        y = np.array([0, 0, 1, 1])
        model = naive_bayes.GaussianNB().fit(X, y)
        np.testing.assert_array_equal(model.predict(X), y)

    def test_gaussian_probabilities_sum_to_one(self):
        X, y = naive_bayes.make_continuous_data(90, seed=4)
        model = naive_bayes.GaussianNB().fit(X, y)
        probabilities = model.predict_proba(X[:8])
        np.testing.assert_allclose(probabilities.sum(axis=1), np.ones(8))
        self.assertTrue(np.isfinite(probabilities).all())

    def test_train_test_split_is_reproducible(self):
        X, y = naive_bayes.make_text_data(40, n_features=200, seed=5)
        first = naive_bayes.train_test_split(X, y, seed=7)
        second = naive_bayes.train_test_split(X, y, seed=7)
        for left, right in zip(first, second):
            np.testing.assert_array_equal(left, right)

    def test_accuracy_matches_predictions(self):
        X, y = naive_bayes.make_text_data(60, n_features=200, seed=9)
        model = naive_bayes.MultinomialNB().fit(X, y)
        self.assertAlmostEqual(model.score(X, y), naive_bayes.accuracy(y, model.predict(X)))

    def test_probability_hyperparameters_must_be_positive(self):
        for value in (0, -1, float("nan"), float("inf")):
            with self.assertRaises(ValueError):
                naive_bayes.MultinomialNB(alpha=value)
            with self.assertRaises(ValueError):
                naive_bayes.GaussianNB(var_smoothing=value)

    def test_fit_and_predict_shapes_and_fitted_guards(self):
        model = naive_bayes.GaussianNB()
        with self.assertRaises(RuntimeError):
            model.predict(np.zeros((1, 2)))
        with self.assertRaises(ValueError):
            model.fit(np.zeros((2, 2)), np.array([0]))
        model.fit(np.zeros((2, 2)), np.array([0, 1]))
        with self.assertRaises(ValueError):
            model.predict(np.zeros((1, 3)))

    def test_continuous_fixture_preserves_requested_sample_count(self):
        X, y = naive_bayes.make_continuous_data(91, seed=4)
        self.assertEqual(len(X), 91)
        self.assertEqual(len(y), 91)
        self.assertEqual(sorted(np.bincount(y).tolist()), [30, 30, 31])

    def test_split_and_accuracy_boundaries(self):
        X, y = naive_bayes.make_continuous_data(9, seed=2)
        with self.assertRaises(ValueError):
            naive_bayes.train_test_split(X, y, test_ratio=1)
        with self.assertRaises(ValueError):
            naive_bayes.accuracy([1, 0], [1])


if __name__ == "__main__":
    unittest.main()
