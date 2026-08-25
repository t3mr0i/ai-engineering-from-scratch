# Statistical contract tests for phases/01-math-foundations/15-statistics-for-ml/docs/en.md.
# They use deterministic small fixtures to check estimator definitions and decision summaries.
# The lesson's approximate special-function routines are tested for direction and structure.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.
# No SciPy, pandas, or plotting package is involved.

from __future__ import annotations

from pathlib import Path
import random
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from statistics import (  # noqa: E402
    bonferroni_correction,
    bootstrap_statistic,
    cohens_d,
    covariance_matrix,
    iqr,
    mean,
    median,
    one_sample_ttest,
    pearson_correlation,
    percentile,
    spearman_correlation,
    variance,
)


class StatisticsTests(unittest.TestCase):
    def test_descriptive_estimators_match_fixture(self) -> None:
        data = [1, 2, 3, 4]
        self.assertAlmostEqual(mean(data), 2.5)
        self.assertAlmostEqual(median(data), 2.5)
        self.assertAlmostEqual(variance(data), 5 / 3)

    def test_percentiles_and_iqr_use_interpolation(self) -> None:
        data = [1, 2, 3, 4, 5]
        self.assertAlmostEqual(percentile(data, 25), 2.0)
        self.assertAlmostEqual(percentile(data, 75), 4.0)
        self.assertAlmostEqual(iqr(data), 2.0)

    def test_correlations_capture_linear_and_monotonic_order(self) -> None:
        x = [1, 2, 3, 4]
        self.assertAlmostEqual(pearson_correlation(x, [2, 4, 6, 8]), 1.0)
        self.assertAlmostEqual(spearman_correlation(x, [1, 4, 9, 16]), 1.0)

    def test_covariance_matrix_is_symmetric(self) -> None:
        matrix = covariance_matrix([[1, 2, 3], [2, 4, 6]])
        self.assertEqual(len(matrix), 2)
        self.assertAlmostEqual(matrix[0][1], matrix[1][0])
        self.assertAlmostEqual(matrix[0][0], 1.0)

    def test_one_sample_ttest_detects_a_large_fixture_shift(self) -> None:
        result = one_sample_ttest([10, 11, 12, 13, 14], mu_0=0)
        self.assertGreater(result["t_statistic"], 0.0)
        self.assertEqual(result["df"], 4)
        self.assertLess(result["p_value"], 0.05)

    def test_bootstrap_interval_contains_the_observed_mean(self) -> None:
        random.seed(3)
        data = [1, 2, 3, 4, 5]
        result = bootstrap_statistic(data, mean, n_bootstrap=250, ci=90)
        self.assertAlmostEqual(result["estimate"], 3.0)
        self.assertLessEqual(result["ci_lower"], result["estimate"])
        self.assertGreaterEqual(result["ci_upper"], result["estimate"])

    def test_effect_size_and_bonferroni_are_distinct_from_p_value(self) -> None:
        d = cohens_d([0, 1, 2], [2, 3, 4])
        self.assertGreater(d, 0.0)
        corrected = bonferroni_correction([0.01, 0.04], alpha=0.05)
        self.assertEqual(corrected[0]["adjusted_alpha"], 0.025)
        self.assertTrue(corrected[0]["significant"])
        self.assertFalse(corrected[1]["significant"])


if __name__ == "__main__":
    unittest.main()
