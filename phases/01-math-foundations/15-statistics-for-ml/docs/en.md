# Statistics for Machine Learning

> Separate uncertainty, evidence, and practical impact before changing a model.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 06, 09, and 14 (probability, information, distances)
**Time:** ~55 minutes

## Learning Objectives

- Compute robust descriptive statistics, percentiles, variance, and covariance from lists.
- Distinguish Pearson linear association from Spearman rank association.
- Interpret a p-value as a tail probability conditional on the null and test model.
- Form one- and two-sample t-test summaries with the local numerical approximation.
- Use bootstrap intervals, Cohen's d, and Bonferroni correction to report uncertainty and practical magnitude.

## What the implementation promises

`code/statistics.py` is intentionally stdlib-only. `variance(data)` and `covariance(x,y)` use the sample denominator `n-1` by default; `covariance_matrix` stores variables as rows and observations as columns. `percentile` linearly interpolates the sorted list, so its result is reproducible without a data-frame library.

The t-test helpers compute a statistic, degrees of freedom, and a two-sided p-value using a transparent numerical approximation to the beta/gamma functions. The result is an educational fixture, not a replacement for a validated production statistics package.

`bootstrap_statistic` resamples the observed list with replacement and returns percentile bounds, the original estimate, the requested confidence level, and a bootstrap standard error. `cohens_d` describes standardized effect magnitude; `bonferroni_correction` compares each p-value with `alpha / number_of_tests`.

## Build It

Run the local report:

```bash
cd phases/01-math-foundations/15-statistics-for-ml/code
python3 main.py
```

The canonical output reports a 15-value descriptive fixture, an outlier-sensitive comparison, correlations, a covariance matrix, t-tests, bootstrap/A-B results, multiple-testing correction, and a small-versus-large-sample practical-significance comparison.

Start with a four-value check:

```python
from statistics import mean, median, variance, percentile

data = [1, 2, 3, 4]
assert mean(data) == 2.5
assert variance(data) == 5 / 3
assert percentile(data, 75) == 3.25
```

## Use It

Use the median and IQR when an outlier should not dominate the summary. Use Pearson when a linear relationship is the question; use Spearman when ranks or monotonic order are more trustworthy. Neither correlation function proves causation.

Read `one_sample_ttest([10,11,12,13,14], mu_0=0)` as a local evidence statement: the positive statistic and small p-value are calculated under the null that the mean is zero. They are not a probability that the null is true.

For an experiment, report the effect estimate, interval, sample size, p-value, and a domain threshold. A huge sample can make a tiny lift statistically detectable while Cohen's d remains negligible. If twenty null tests are run, Bonferroni's per-test threshold is `0.05/20 = 0.0025`.

## Ship It

The reusable artifact is [the statistical-testing skill](../../15-statistics-for-ml/outputs/skill-statistical-testing.md). It forces a report to label the estimand, pairing, null, correction, interval method, effect size, and practical decision threshold. Keep the random seed and bootstrap count beside the result.

## Exercises

1. Compute mean, median, sample variance, P25, P50, P75, and IQR for `[1,2,3,4,5]` and `[1,2,3,4,100]`.
2. Run `one_sample_ttest([10,11,12,13,14], mu_0=0)` and explain the statistic, degrees of freedom, and conditional p-value.
3. Seed `random` to `3`, bootstrap the mean of `[1,2,3,4,5]` with `n_bootstrap=250, ci=90`, and compare the interval with `cohens_d([0,1,2],[2,3,4])`.

## Reference Solution

The four-value sample variance is `5/3`; P25 and P75 for `[1,2,3,4,5]` are `2` and `4`. The shifted sample produces a positive t-statistic with four degrees of freedom and a small p-value under the stated null. The seeded bootstrap interval contains the observed mean near `3`, while Cohen's d reports a standardized difference independent of whether a p-value crosses a threshold. A complete handoff states both statistical evidence and practical impact.

## Tests

```bash
python3 -m unittest discover tests -v
```

Seven tests cover descriptive estimators, percentile interpolation, Pearson/Spearman behavior, covariance symmetry, a shifted t-test, bootstrap interval structure, effect size, and Bonferroni thresholds.
