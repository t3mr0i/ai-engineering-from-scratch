# Bias-Variance Tradeoff

> Repeated fits reveal whether error comes from a rigid model, an unstable model, or the data itself.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 02 Lessons 01–09 (polynomial models and evaluation)
**Time:** ~65 minutes

## Learning Objectives

- Generate repeated noisy samples from `true_function(x) = sin(1.5x) + 0.5x` with a fixed seed.
- Fit and evaluate polynomial bases with `fit_polynomial` and `predict_polynomial`.
- Separate squared bias, prediction variance, noise variance, and total error in a repeated experiment.
- Diagnose high bias versus high variance from train/test behavior without treating one fixture as a benchmark.
- Explain how the ridge parameter `lam` constrains coefficients and changes the error balance.

## The local experiment

`code/bias_variance.py` uses NumPy and no plotting package. `generate_data` samples `x` uniformly in `(-3, 3)`, adds Gaussian noise with default standard deviation `0.5`, and `bias_variance_decomposition` evaluates predictions on 100 points in `[-2.5, 2.5]`. It uses a seeded sequence of bootstrap training sets, so the same arguments reproduce the same table.

## Build It

Run `python3 main.py`. The compact entry point compares polynomial degrees 1, 3, and 8 over 24 bootstrap fits and prints `bias_sq`, `variance`, and `total_error` for each degree. For a hand check, fitting `y = 2x + 1` at `x = [-1, 0, 1]` with degree 1 gives two weights and predictions equal to the observations. `fit_polynomial(..., lam=10)` leaves the intercept unpenalized but shrinks the other coefficients relative to the unregularized fit.

The decomposition is empirical: `bias_sq` is the mean squared gap between the mean prediction and `true_function`, `variance` is the mean variance across bootstrap predictions, and `noise` is `0.5² = 0.25`. Their sum is a diagnostic comparison to `total_error`; finite bootstrap size and numerical solves mean the values need not match to the last digit.

## Use It

Use `find_optimal(results)` only to choose the lowest local `total_error` among the keys you supplied. A degree-1 model can have high bias even with more data; a high-degree model can have a large train/test gap. Increasing `lam` often lowers variance while increasing bias, but the useful value depends on the fixture and should be selected with held-out evaluation.

## Ship It

`outputs/prompt-model-diagnostics.md` turns the table into a review checklist: record degrees, bootstrap count, noise setting, and the three terms, then label the conclusion as a local diagnostic rather than a production guarantee. The shipped artifact is the experiment definition, not a chart or a claim about every polynomial model.

## Exercises

1. Run the canonical demo twice and compare the three rows. Which values remain identical, and which argument controls that reproducibility?
2. Fit degree 1 and degree 5 on one generated training set. Record train MSE and test MSE on a separate seeded sample; use the gap to justify a bias or variance diagnosis.
3. Compare `lam=0` and `lam=10` for degree 5. Inspect the non-intercept coefficient norm and state why the penalty does not apply to the intercept.
4. Change `noise_std` from `0.5` to `0.0`. Predict which reported term changes directly and which model-complexity comparison remains a separate question.

## Reference Solution

A complete solution contains two identical demo runs, a hand-verified degree-1 fit, coefficient-norm evidence for ridge shrinkage, and a table labelled with `n_bootstrap`, `n_train`, `n_test`, and `noise_std`. The diagnosis cites train/test measurements and does not call the lowest degree or one fixture’s optimum universal.
