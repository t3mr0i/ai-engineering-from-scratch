# Gaussian Processes from Scratch

> A Gaussian process predicts a value and exposes how much the kernel assumptions still leave uncertain.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 06, 11, and 13 (probability, matrix decompositions, and numerical stability)
**Time:** ~90 minutes

## Learning Objectives

- Construct an RBF covariance matrix from length scale and signal variance.
- Condition a GP posterior with Cholesky solves rather than an explicit inverse.
- Interpret posterior mean, variance, noise variance, and bounded jitter.
- Compare candidate length scales with log marginal likelihood.
- Distinguish interpolation uncertainty from extrapolation uncertainty and test leakage.

## Build It

Run the NumPy implementation:

```bash
cd phases/01-math-foundations/23-gaussian-processes/code
python3 main.py
```

The canonical fixture trains on six points `[-2.0,-1.3,-0.4,0.2,1.0,1.8]` with noisy sine targets and evaluates 61 points from `-3` to `3`. `select_length_scale` compares `[0.25,0.6,1.2,2.0]` using log marginal likelihood, then `gp_posterior` returns mean and variance arrays of shape `(61,)`.

`rbf_kernel` computes `signal_variance * exp(-||x-x'||²/(2*length_scale²))`; its diagonal equals the signal variance. `stable_cholesky` tries the covariance once and then increases jitter by powers of ten for at most eight repairs. `gp_posterior` solves `K alpha=y` and `K v=K_*` with triangular solves, clips tiny negative variance values to zero, and reports the jitter used.

## Use It

A short length scale makes correlations decay quickly; a long scale produces smoother posterior means. Near a training point, the posterior variance usually shrinks; far from the training interval, the RBF cross-covariance fades and variance returns toward the prior signal variance. Observation noise changes the training covariance, so duplicate or nearly duplicate inputs are not silently treated as exact observations.

`torch_kernel_difference` is an optional parity check. The canonical run remains NumPy-only and prints `skipped (torch unavailable)` when PyTorch is not installed. A parity difference tests this kernel fixture; it does not establish model quality.

## Ship It

The reusable artifact is [the GP experiment card](../../23-gaussian-processes/outputs/gp-experiment-card.md). Record training/test ranges, kernel parameters, noise variance, jitter, selected score, near/far variance, and whether the evaluation region was held out before tuning.

## Exercises

1. Evaluate `rbf_kernel([0.0],[0.0],signal_variance=2.5)` and verify the one-by-one result is `2.5`.
2. Run the canonical fixture and compare the posterior variance at the test point nearest `x_train[2]` with the variance at `x_test[0]`.
3. Call `select_length_scale` on the four candidate scales and record the score dictionary and selected key.
4. Set `x_train=[0.0,0.0]`, use a small positive noise variance, and report whether jitter was needed.
5. Tune a length scale only on the six training points; explain why selecting it on the 61-point evaluation grid would leak test information.

## Reference Solution

The unit diagonal for signal variance `2.5` is exactly `2.5`. The near-training variance is lower than the far-left variance in the canonical run. The selected scale is the key with the largest returned log marginal likelihood. Repeated inputs are handled by the bounded jitter mechanism when necessary. A final evaluation grid must remain untouched while selecting hyperparameters.

## Tests

```bash
python3 -m unittest discover tests -v
```

Tests cover kernel symmetry and diagonal values, posterior shapes and near/far variance, finite marginal likelihood, invalid hyperparameters, and the optional parity helper's local contract.
