# Gaussian Processes from Scratch

> A Gaussian process is a distribution over functions: it predicts a value and exposes how uncertain that prediction is.

**Type:** Build
**Languages:** Python
**Prerequisites:** Probability and Distributions, Matrix Transformations and Eigenvalues, Numerical Stability
**Time:** ~90 minutes

## Learning Objectives

- Interpret a Gaussian process as a prior over functions rather than a fixed parametric curve.
- Build an RBF covariance matrix and explain the roles of length scale, signal variance, and observation noise.
- Derive posterior mean and variance with a numerically stable Cholesky solve.
- Use log marginal likelihood to compare kernel hyperparameters.
- Diagnose extrapolation, duplicate inputs, and uncertainty-calibration failures.

## The Core Idea

Instead of choosing a fixed function shape and fitting a small parameter vector, a Gaussian process (GP) declares that any finite collection of function values follows a multivariate Gaussian distribution. A mean function supplies the prior center. A kernel supplies covariance: it says which inputs should have similar outputs and how strongly.

For training inputs `X`, observations `y`, and test inputs `X*`, define three covariance matrices: `K(X, X)`, `K(X, X*)`, and `K(X*, X*)`. Observation noise adds a diagonal term to the training covariance. Conditioning the joint Gaussian produces a posterior distribution at every test point.

The posterior mean is a data-adapted prediction. The posterior variance is not a generic confidence score: it follows from the kernel assumptions, input locations, and noise model. It usually shrinks near observations and returns toward prior uncertainty far away.

## Build It: the RBF Kernel

The radial basis function kernel is

`k(x, x') = signal_variance × exp(-||x - x'||² / (2 × length_scale²))`.

A short length scale permits rapid changes and weakens correlation between nearby-but-distinct inputs. A long length scale prefers smooth functions. Signal variance controls vertical scale. Observation noise says how closely the latent function should track measurements.

A valid covariance matrix must be symmetric and positive semidefinite. Floating-point roundoff or repeated inputs can make direct inversion fragile. The implementation therefore solves triangular systems from a Cholesky factor and adds a small, reported jitter only when necessary.

## Build It: conditioning

Let `L Lᵀ = K(X, X) + noise × I`. Solve `L Lᵀ α = y`. The posterior mean is `K(X*, X) α`. For the covariance, solve `L v = K(X, X*)`, then subtract `vᵀv` from the prior test covariance. No explicit matrix inverse is required.

The log marginal likelihood combines data fit with a complexity penalty derived from the covariance determinant. It is useful for comparing kernel settings, but it does not prove that the kernel family matches reality. Time splits, out-of-domain tests, and calibration checks remain necessary.

## Use It: tensor-library parity

The canonical program computes the posterior with NumPy. If PyTorch is installed, it repeats the kernel computation with production tensor operations and reports the maximum difference. The comparison verifies the operation while keeping the first-principles implementation visible.

Run:

```bash
python3 main.py
```

The demo prints the selected length scale, posterior values at representative points, uncertainty near and far from observations, and optional NumPy/PyTorch parity.

## Failure Modes

- **Duplicate or nearly duplicate inputs:** the covariance becomes ill-conditioned; model explicit noise and use bounded jitter.
- **Kernel mismatch:** an RBF prior assumes smoothness and can hide discontinuities or periodic structure.
- **Extrapolation:** a confident-looking plot does not make distant predictions evidence-based; inspect variance and prior mean.
- **Hyperparameter leakage:** selecting settings on the final test region makes uncertainty claims optimistic.
- **Scale mismatch:** standardize inputs or give dimensions separate length scales when their units differ.

## Build It

Reconstruct **Gaussian Processes from Scratch** by following `as_column` on an 8x8 synthetic image. Run `python3 main.py` and verify that the reported height/width or feature-map shape changes predictably, without inventing pixels.

## Use It

Call `as_column` from a small caller with an 8x8 synthetic image. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/gp-experiment-card.md` with the command `python3 main.py`, the accepted input shape (an 8x8 synthetic image), the expected observable result, and a failure note for malformed inputs.

## Exercises

1. Fit the demo with length scales `0.15`, `0.6`, and `2.0`. Explain the change in mean and variance using covariance, not plot aesthetics.
2. Add a duplicate input with a conflicting target. Predict the Cholesky behavior, then compare zero noise with explicit observation noise.
3. Replace the RBF kernel with a periodic kernel or a sum of kernels. State which prior assumption changed and design an out-of-range test.

## Reference Solution

The canonical [main.py](../code/main.py) constructs all covariance blocks, solves the posterior through Cholesky factors, clips only tiny negative diagonal variance caused by roundoff, and compares length scales by log marginal likelihood. A complete response reports both prediction and variance, identifies the kernel assumption being tested, and keeps the final extrapolation region out of hyperparameter selection.

## Further Reading

- [Gaussian Processes for Machine Learning](https://gaussianprocess.org/gpml/)
- [A Tutorial on Gaussian Process Regression](https://arxiv.org/abs/2009.10862)
