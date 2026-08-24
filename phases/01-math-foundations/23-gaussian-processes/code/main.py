# Gaussian processes for phases/01-math-foundations/23-gaussian-processes/docs/en.md.
# Builds RBF covariance, stable posterior conditioning, and marginal likelihood.
# Canonical references: https://gaussianprocess.org/gpml/ and
# https://arxiv.org/abs/2009.10862.
# NumPy is the only required dependency; PyTorch parity is optional.

from __future__ import annotations

import math
from typing import Iterable

import numpy as np


def as_column(values: Iterable[float] | np.ndarray) -> np.ndarray:
    array = np.asarray(values, dtype=float)
    return array.reshape(-1, 1) if array.ndim == 1 else array


def rbf_kernel(
    left: Iterable[float] | np.ndarray,
    right: Iterable[float] | np.ndarray,
    *,
    length_scale: float = 1.0,
    signal_variance: float = 1.0,
) -> np.ndarray:
    if length_scale <= 0 or signal_variance <= 0:
        raise ValueError("length_scale and signal_variance must be positive")
    x_left = as_column(left)
    x_right = as_column(right)
    squared = np.sum((x_left[:, None, :] - x_right[None, :, :]) ** 2, axis=2)
    return signal_variance * np.exp(-0.5 * squared / (length_scale**2))


def stable_cholesky(matrix: np.ndarray, *, initial_jitter: float = 1e-10) -> tuple[np.ndarray, float]:
    if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1]:
        raise ValueError("matrix must be square")
    identity = np.eye(matrix.shape[0])
    jitter = 0.0
    for _ in range(9):
        try:
            return np.linalg.cholesky(matrix + jitter * identity), jitter
        except np.linalg.LinAlgError:
            jitter = initial_jitter if jitter == 0.0 else jitter * 10.0
    raise np.linalg.LinAlgError("covariance is not positive definite after bounded jitter")


def gp_posterior(
    x_train: Iterable[float] | np.ndarray,
    y_train: Iterable[float] | np.ndarray,
    x_test: Iterable[float] | np.ndarray,
    *,
    length_scale: float = 1.0,
    signal_variance: float = 1.0,
    noise_variance: float = 1e-4,
) -> tuple[np.ndarray, np.ndarray, float]:
    if noise_variance < 0:
        raise ValueError("noise_variance must be non-negative")
    train = as_column(x_train)
    test = as_column(x_test)
    targets = np.asarray(y_train, dtype=float).reshape(-1)
    if train.shape[0] != targets.shape[0]:
        raise ValueError("x_train and y_train lengths must match")
    kernel_args = {"length_scale": length_scale, "signal_variance": signal_variance}
    k_train = rbf_kernel(train, train, **kernel_args) + noise_variance * np.eye(len(train))
    k_cross = rbf_kernel(train, test, **kernel_args)
    k_test = rbf_kernel(test, test, **kernel_args)
    factor, jitter = stable_cholesky(k_train)
    alpha = np.linalg.solve(factor.T, np.linalg.solve(factor, targets))
    mean = k_cross.T @ alpha
    projected = np.linalg.solve(factor, k_cross)
    covariance = k_test - projected.T @ projected
    variance = np.maximum(np.diag(covariance), 0.0)
    return mean, variance, jitter


def log_marginal_likelihood(
    x_train: Iterable[float] | np.ndarray,
    y_train: Iterable[float] | np.ndarray,
    *,
    length_scale: float,
    signal_variance: float = 1.0,
    noise_variance: float = 1e-4,
) -> float:
    train = as_column(x_train)
    targets = np.asarray(y_train, dtype=float).reshape(-1)
    covariance = rbf_kernel(
        train, train, length_scale=length_scale, signal_variance=signal_variance
    ) + noise_variance * np.eye(len(train))
    factor, _ = stable_cholesky(covariance)
    alpha = np.linalg.solve(factor.T, np.linalg.solve(factor, targets))
    return float(
        -0.5 * targets @ alpha
        - np.log(np.diag(factor)).sum()
        - 0.5 * len(train) * math.log(2.0 * math.pi)
    )


def select_length_scale(x_train: np.ndarray, y_train: np.ndarray, candidates: Iterable[float]) -> tuple[float, dict[float, float]]:
    scores = {
        float(scale): log_marginal_likelihood(x_train, y_train, length_scale=float(scale), noise_variance=0.01)
        for scale in candidates
    }
    return max(scores, key=scores.get), scores


def torch_kernel_difference(x: np.ndarray, *, length_scale: float) -> float | None:
    try:
        import torch
    except ImportError:
        return None
    tensor = torch.as_tensor(as_column(x), dtype=torch.float64)
    squared = ((tensor[:, None, :] - tensor[None, :, :]) ** 2).sum(dim=2)
    torch_result = torch.exp(-0.5 * squared / (length_scale**2)).numpy()
    numpy_result = rbf_kernel(x, x, length_scale=length_scale)
    return float(np.max(np.abs(torch_result - numpy_result)))


def main() -> None:
    x_train = np.array([-2.0, -1.3, -0.4, 0.2, 1.0, 1.8])
    y_train = np.sin(x_train) + np.array([0.02, -0.04, 0.03, -0.01, 0.04, -0.02])
    x_test = np.linspace(-3.0, 3.0, 61)
    chosen, scores = select_length_scale(x_train, y_train, [0.25, 0.6, 1.2, 2.0])
    mean, variance, jitter = gp_posterior(
        x_train, y_train, x_test, length_scale=chosen, noise_variance=0.01
    )
    near_index = int(np.argmin(np.abs(x_test - x_train[2])))
    far_index = 0
    print("Gaussian process demo")
    print("  marginal likelihoods:", {scale: round(value, 3) for scale, value in scores.items()})
    print(f"  selected length scale: {chosen}")
    print(f"  near observation: mean={mean[near_index]:.3f}, variance={variance[near_index]:.4f}")
    print(f"  far from data:    mean={mean[far_index]:.3f}, variance={variance[far_index]:.4f}")
    print(f"  numerical jitter used: {jitter:.1e}")
    difference = torch_kernel_difference(x_train, length_scale=chosen)
    print("  PyTorch parity:", "skipped (torch unavailable)" if difference is None else f"max diff={difference:.2e}")


if __name__ == "__main__":
    main()
