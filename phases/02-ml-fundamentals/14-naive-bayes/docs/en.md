# Naive Bayes

> A strong conditional-independence assumption can be a useful bias when the evidence is sparse and high-dimensional.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02 Lessons 01–08 (probability, classification, and feature encoding)
**Time:** ~75 minutes

## Learning Objectives

- Fit `MultinomialNB` from non-negative count features with additive smoothing.
- Explain why class rankings can be useful even when the independence assumption miscalibrates probabilities.
- Fit `GaussianNB` from per-class means, variances, and priors for continuous features.
- Use log-probabilities for stable prediction and normalize them when probabilities are requested.
- Match a Naive Bayes variant to count-like text features versus continuous measurements.

## The local models

`code/naive_bayes.py` uses NumPy only. `MultinomialNB.fit` adds `alpha` to every class/feature count, then stores log feature probabilities and class log priors. It requires finite, non-negative, non-empty 2-D counts and strictly positive `alpha`. `GaussianNB.fit` stores one mean and variance per class/feature and adds strictly positive `var_smoothing` to avoid zero variance. Both models validate feature width, finite numeric labels when labels are numeric, and reject prediction before fitting; probability methods reject non-finite normalization rather than returning NaNs.

## Build It

Run `python3 main.py` for generated 200-feature text and four-feature continuous fixtures. The text fixture has two classes with different word-rate blocks; the continuous fixture has three Gaussian-like classes and preserves the requested `n_samples`, distributing any remainder across the first classes. `predict_log_proba` is an unnormalized class score, while `predict_proba` subtracts each row’s maximum before exponentiating and dividing, so each row is finite and sums to one.

For a hand check, fit `MultinomialNB` on `[[4, 0], [3, 0], [0, 4], [0, 3]]` with labels `[0, 0, 1, 1]`; the first feature favors class 0 and the second favors class 1. The `alpha=1` count offset ensures an unseen feature still has a finite log probability.

## Use It

Use MultinomialNB for non-negative counts or frequencies and GaussianNB for real-valued measurements whose within-class distributions are reasonably summarized by means and variances. A probability row is normalized only for the supplied candidate classes; it is not automatically calibrated. `train_test_split` requires a ratio that leaves both partitions non-empty, and `accuracy` requires equal-length one-dimensional vectors. Compare `score` with a held-out split using the same seed when reproducing a report.

## Ship It

`outputs/skill-naive-bayes-chooser.md` is the handoff artifact. It asks the operator to record feature domain, `alpha`/`var_smoothing`, class priors, split seed, and probability-sum checks. It makes no claim that the generated fixtures represent a real corpus.

## Exercises

1. Fit the two-feature count fixture above and inspect `feature_log_prob_`. Explain where additive smoothing appears in the numerator and denominator.
2. Train on `make_text_data(80, n_features=20, seed=3)` and assert that five `predict_proba` rows each sum to one.
3. Train `GaussianNB` on `make_continuous_data(90, seed=4)`. Record the shape of `means_` and `vars_` and check finite normalized probabilities.
4. Pass a negative count to `MultinomialNB.fit`. Capture the `ValueError` and explain why silently shifting counts would change the feature semantics.

## Reference Solution

A correct solution includes the smoothed count calculation, finite normalized probability rows, the Gaussian parameter shapes, and the explicit negative-count error. It identifies the model variant from the feature domain and reports accuracy only for the stated generated split.
