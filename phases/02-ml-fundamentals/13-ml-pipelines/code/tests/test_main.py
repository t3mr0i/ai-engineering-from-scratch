"""Behavioral tests for fit/transform boundaries in the scratch pipeline."""

from pathlib import Path
import sys
import unittest
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pipeline


class PipelineTests(unittest.TestCase):
    def test_median_imputer_replaces_nan_and_remembers_training_stat(self):
        imputer = pipeline.MedianImputer()
        imputer.fit(np.array([[1.0], [np.nan], [5.0]]))
        self.assertEqual(imputer.medians.tolist(), [3.0])
        self.assertEqual(imputer.transform(np.array([[np.nan]])).tolist(), [[3.0]])

    def test_standard_scaler_centers_training_data(self):
        scaler = pipeline.StandardScaler()
        transformed = scaler.fit_transform(np.array([[1.0, 10.0], [3.0, 14.0]]))
        np.testing.assert_allclose(transformed.mean(axis=0), [0.0, 0.0])
        np.testing.assert_allclose(scaler.transform(np.array([[1.0, 10.0]])), [[-1.0, -1.0]])

    def test_one_hot_encoder_ignores_unseen_category(self):
        encoder = pipeline.OneHotEncoder()
        encoder.fit(np.array([["red"], ["blue"]], dtype=object))
        encoded = encoder.transform(np.array([["green"]], dtype=object))
        self.assertEqual(encoded.shape, (1, 2))
        np.testing.assert_array_equal(encoded, [[0.0, 0.0]])

    def test_logistic_regression_learns_separable_fixture(self):
        X = np.array([[-2.0], [-1.0], [1.0], [2.0]])
        y = np.array([0, 0, 1, 1])
        model = pipeline.LogisticRegressionSimple(lr=0.2, n_iter=500)
        model.fit(X, y)
        np.testing.assert_array_equal(model.predict(X), y)

    def test_full_pipeline_handles_missing_and_categories(self):
        data = pipeline.make_mixed_data(40, seed=2)
        train, test = pipeline.train_test_split_dict(data, test_ratio=0.25, seed=2)
        model = pipeline.FullPipeline(pipeline.LogisticRegressionSimple(lr=0.05, n_iter=120), ["age", "income", "score"], ["city", "plan"])
        model.fit(train)
        predictions = model.predict(test)
        self.assertEqual(predictions.shape, test["target"].shape)
        self.assertTrue(set(predictions).issubset({0, 1}))

    def test_cross_validation_is_reproducible(self):
        data = pipeline.make_mixed_data(60, seed=7)

        def factory():
            return pipeline.FullPipeline(pipeline.DecisionTreeSimple(max_depth=2), ["age", "income", "score"], ["city", "plan"])

        first = pipeline.cross_validate_pipeline(factory, data, n_folds=3, seed=9)
        second = pipeline.cross_validate_pipeline(factory, data, n_folds=3, seed=9)
        self.assertEqual(first, second)

    def test_pipeline_score_is_fraction(self):
        data = pipeline.make_mixed_data(50, seed=4)
        model = pipeline.FullPipeline(pipeline.DecisionTreeSimple(max_depth=2), ["age", "income", "score"], ["city", "plan"])
        model.fit(data)
        self.assertTrue(0.0 <= model.score(data) <= 1.0)


if __name__ == "__main__":
    unittest.main()
