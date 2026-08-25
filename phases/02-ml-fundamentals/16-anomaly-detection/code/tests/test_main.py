import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import anomaly_detection as ad


class AnomalyContracts(unittest.TestCase):
    def test_zscore_flags_a_known_point(self):
        X = np.array([[0.0], [0.0], [0.0], [10.0]])
        labels, scores = ad.zscore_detect(X, threshold=1.5)
        self.assertTrue(labels[-1])
        self.assertGreater(scores[-1], scores[0])

    def test_iqr_uses_factor_and_rejects_negative_factor(self):
        labels, _ = ad.iqr_detect(np.array([[1.0], [2.0], [2.0], [3.0], [20.0]]), factor=1.5)
        self.assertTrue(labels[-1])
        with self.assertRaises(ValueError):
            ad.iqr_detect([[1.0], [2.0]], factor=-1)

    def test_isolation_forest_is_seeded_and_refit_resets(self):
        X, _ = ad.make_anomaly_data(30, 4, seed=4)
        first = ad.IsolationForest(n_estimators=8, max_samples=16, seed=9).fit(X)
        second = ad.IsolationForest(n_estimators=8, max_samples=16, seed=9).fit(X)
        np.testing.assert_allclose(first.anomaly_score(X), second.anomaly_score(X))
        first.fit(X)
        self.assertEqual(len(first.trees), 8)

    def test_isolation_requires_fit_and_valid_dimensions(self):
        forest = ad.IsolationForest(n_estimators=3, max_samples=4)
        with self.assertRaises(RuntimeError):
            forest.anomaly_score([[0.0, 0.0]])
        X = np.zeros((4, 2))
        forest.fit(X)
        with self.assertRaises(ValueError):
            forest.anomaly_score([[0.0]])
        with self.assertRaises(ValueError):
            forest.predict(X, threshold=1.1)

    def test_data_fixtures_and_metrics_have_expected_shapes(self):
        X, y = ad.make_multimodal_data(5, 2, seed=3)
        self.assertEqual(X.shape, (17, 2))
        self.assertEqual(y.shape, (17,))
        self.assertEqual(len(ad.precision_recall(y, y)), 3)
        self.assertAlmostEqual(ad.precision_at_k(y, y.astype(float), 2), 1.0)

    def test_metric_and_parameter_contracts(self):
        with self.assertRaises(ValueError):
            ad.zscore_detect([[1.0]], threshold=-1)
        with self.assertRaises(ValueError):
            ad.precision_recall([0, 1], [0])
        with self.assertRaises(ValueError):
            ad.precision_at_k([0, 1], [0.1, 0.2], 3)
        with self.assertRaises(ValueError):
            ad.IsolationForest(n_estimators=0)
        with self.assertRaises(ValueError):
            ad.make_anomaly_data(0, 2)


if __name__ == "__main__":
    unittest.main()
