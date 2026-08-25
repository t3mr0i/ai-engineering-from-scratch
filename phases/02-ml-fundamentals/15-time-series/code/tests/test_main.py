import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import time_series as ts


class TimeSeriesContracts(unittest.TestCase):
    def test_generators_are_reproducible_and_sized(self):
        first = ts.make_synthetic_series(24, seed=7)
        np.testing.assert_array_equal(first, ts.make_synthetic_series(24, seed=7))
        self.assertEqual(ts.make_seasonal_series(18, period=6).shape, (18,))

    def test_difference_order_and_boundaries(self):
        np.testing.assert_array_equal(ts.difference([1, 3, 6], 1), [2, 3])
        np.testing.assert_array_equal(ts.difference([1, 3, 6], 0), [1, 3, 6])
        with self.assertRaises(ValueError):
            ts.difference([1, 2], 2)
        with self.assertRaises(ValueError):
            ts.difference([1, 2], -1)

    def test_lag_features_have_past_only_alignment(self):
        X, y = ts.make_lag_features([10, 12, 14, 13], 2)
        np.testing.assert_array_equal(X, [[12, 10], [14, 12]])
        np.testing.assert_array_equal(y, [14, 13])
        with self.assertRaises(ValueError):
            ts.make_lag_features([1, 2], 2)

    def test_walk_forward_folds_are_ordered_and_nonempty(self):
        folds = list(ts.walk_forward_split(12, n_splits=3, min_train=3))
        self.assertEqual(len(folds), 3)
        for train, test in folds:
            self.assertGreater(train.stop, train.start)
            self.assertGreater(test.stop, test.start)
            self.assertEqual(train.stop, test.start)
        with self.assertRaises(ValueError):
            list(ts.walk_forward_split(4, n_splits=4, min_train=2))

    def test_simple_ar_requires_fit_and_resets_on_refit(self):
        model = ts.SimpleAR(2)
        with self.assertRaises(RuntimeError):
            model.predict([[1, 2]])
        X, y = ts.make_lag_features([1, 2, 3, 4, 5], 2)
        model.fit(X, y)
        first = model.predict(X)
        model.fit(X, y)
        np.testing.assert_allclose(first, model.predict(X))
        self.assertEqual(model.forecast([3, 4], 2).shape, (2,))
        with self.assertRaises(ValueError):
            model.forecast([1], 1)

    def test_metrics_validate_pairs_and_mape_zero_case(self):
        self.assertAlmostEqual(ts.mse([1, 2], [1, 4]), 2.0)
        self.assertAlmostEqual(ts.mae([1, 2], [1, 4]), 1.0)
        self.assertAlmostEqual(ts.mape([0, 2], [99, 1]), 50.0)
        self.assertAlmostEqual(ts.mape([2, 4], [1, 2]), 50.0)
        with self.assertRaises(ValueError):
            ts.mae([1], [1, 2])
        with self.assertRaises(ValueError):
            ts.mape([0, 0], [0, 0])

    def test_diagnostics_reject_invalid_inputs(self):
        mean, std, _ = ts.check_stationarity([1, 2, 3], window=2)
        self.assertEqual((len(mean), len(std)), (3, 3))
        self.assertEqual(len(ts.autocorrelation([1, 2, 3], 2)), 3)
        with self.assertRaises(ValueError):
            ts.autocorrelation([1, 2, 3], 3)
        with self.assertRaises(ValueError):
            ts.make_synthetic_series(0)


if __name__ == "__main__":
    unittest.main()
