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

    def test_transformers_and_models_reject_use_before_fit(self):
        X = np.array([[1.0], [2.0]])
        for transformer in (pipeline.MedianImputer(), pipeline.StandardScaler(), pipeline.OneHotEncoder()):
            with self.assertRaises(RuntimeError):
                transformer.transform(X)
        with self.assertRaises(RuntimeError):
            pipeline.TransformerPipeline([('impute', pipeline.MedianImputer())]).transform(X)
        with self.assertRaises(RuntimeError):
            pipeline.ColumnTransformerScratch([('age', pipeline.MedianImputer(), ['age'])]).transform(
                pipeline.make_mixed_data(2)
            )
        with self.assertRaises(RuntimeError):
            pipeline.LogisticRegressionSimple().predict(X)
        with self.assertRaises(RuntimeError):
            pipeline.DecisionTreeSimple().predict(X)
        with self.assertRaises(RuntimeError):
            pipeline.FullPipeline(pipeline.DecisionTreeSimple(), ["age"], ["city"]).predict(pipeline.make_mixed_data(2))

    def test_unknown_error_mode_and_all_nan_column_are_explicit(self):
        with self.assertRaises(ValueError):
            pipeline.OneHotEncoder(handle_unknown="wat")
        encoder = pipeline.OneHotEncoder(handle_unknown="error")
        encoder.fit(np.array([["red"], ["blue"]], dtype=object))
        with self.assertRaises(ValueError):
            encoder.transform(np.array([["green"]], dtype=object))
        with self.assertRaises(ValueError):
            pipeline.MedianImputer().fit(np.array([[np.nan], [np.nan]]))
        with self.assertRaises(ValueError):
            pipeline.StandardScaler().fit(np.array([[np.nan], [np.nan]]))

    def test_split_and_cross_validation_boundaries(self):
        data = pipeline.make_mixed_data(4, seed=3)
        with self.assertRaises(ValueError):
            pipeline.train_test_split_dict(data, test_ratio=0)
        with self.assertRaises(ValueError):
            pipeline.cross_validate_pipeline(lambda: None, data, n_folds=5)
        malformed = dict(data)
        malformed["city"] = malformed["city"][:-1]
        with self.assertRaises(ValueError):
            pipeline.train_test_split_dict(malformed)
        malformed = dict(data)
        malformed["age"] = malformed["age"][:, None]
        with self.assertRaises(ValueError):
            pipeline.train_test_split_dict(malformed)
        with self.assertRaises(ValueError):
            pipeline.LogisticRegressionSimple().fit(np.ones((2, 1)), np.array([0, 2]))


if __name__ == "__main__":
    unittest.main()
