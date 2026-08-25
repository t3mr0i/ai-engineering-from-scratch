# Dimensionality-reduction primitives for phases/01-math-foundations/10-dimensionality-reduction/docs/en.md.
# Implements linear PCA and a small kernel-PCA projection with NumPy, from the covariance algebra.
# The fixtures are synthetic and deterministic; no dataset download or plotting package is used.
# Canonical execution is `python3 main.py` from this code directory.
# Tests import the same PCA and kernel_pca functions used by the demo.

from __future__ import annotations

import numpy as np


class PCA:
    """A small covariance-eigendecomposition PCA implementation."""

    def __init__(self, n_components: int):
        if not isinstance(n_components, int) or n_components <= 0:
            raise ValueError("n_components must be a positive integer")
        self.n_components = n_components
        self.components: np.ndarray | None = None
        self.mean: np.ndarray | None = None
        self.eigenvalues: np.ndarray | None = None
        self.explained_variance_ratio_: np.ndarray | None = None

    def fit(self, X: np.ndarray) -> "PCA":
        X = np.asarray(X, dtype=float)
        if X.ndim != 2 or X.shape[0] < 2:
            raise ValueError("PCA.fit expects a 2D array with at least two samples")
        if self.n_components > min(X.shape):
            raise ValueError("n_components cannot exceed the sample or feature count")
        self.mean = np.mean(X, axis=0)
        centered = X - self.mean
        covariance = centered.T @ centered / (X.shape[0] - 1)
        eigenvalues, eigenvectors = np.linalg.eigh(covariance)
        order = np.argsort(eigenvalues)[::-1]
        eigenvalues = np.maximum(eigenvalues[order], 0.0)
        eigenvectors = eigenvectors[:, order]
        self.components = eigenvectors[:, : self.n_components].T
        self.eigenvalues = eigenvalues[: self.n_components]
        total_variance = float(np.sum(eigenvalues))
        if total_variance == 0.0:
            self.explained_variance_ratio_ = np.zeros(self.n_components)
        else:
            self.explained_variance_ratio_ = self.eigenvalues / total_variance
        return self

    def _require_fitted(self) -> None:
        if self.components is None or self.mean is None:
            raise RuntimeError("fit must be called before transform")

    def transform(self, X: np.ndarray) -> np.ndarray:
        self._require_fitted()
        X = np.asarray(X, dtype=float)
        if X.ndim != 2 or X.shape[1] != len(self.mean):
            raise ValueError("X must be 2D with the fitted feature count")
        return (X - self.mean) @ self.components.T

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)

    def inverse_transform(self, X_reduced: np.ndarray) -> np.ndarray:
        self._require_fitted()
        X_reduced = np.asarray(X_reduced, dtype=float)
        if X_reduced.ndim != 2 or X_reduced.shape[1] != self.n_components:
            raise ValueError("X_reduced must have one column per retained component")
        return X_reduced @ self.components + self.mean


def make_synthetic_data(seed: int = 42, n_samples: int = 240) -> np.ndarray:
    """Create a noisy 3D ellipse with a correlated third feature."""
    rng = np.random.default_rng(seed)
    theta = rng.uniform(0.0, 2.0 * np.pi, n_samples)
    x = 3.0 * np.cos(theta) + rng.normal(0.0, 0.12, n_samples)
    y = 1.2 * np.sin(theta) + rng.normal(0.0, 0.12, n_samples)
    z = 0.5 * x - 0.25 * y + rng.normal(0.0, 0.06, n_samples)
    return np.column_stack((x, y, z))


def make_concentric_circles(seed: int = 42, n_per_ring: int = 80) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    angles = rng.uniform(0.0, 2.0 * np.pi, 2 * n_per_ring)
    radii = np.concatenate((
        1.0 + rng.normal(0.0, 0.04, n_per_ring),
        3.0 + rng.normal(0.0, 0.04, n_per_ring),
    ))
    points = np.column_stack((radii * np.cos(angles), radii * np.sin(angles)))
    labels = np.repeat([0, 1], n_per_ring)
    return points, labels


def kernel_pca(X: np.ndarray, n_components: int, kernel: str = "rbf", gamma: float = 1.0) -> np.ndarray:
    """Return centered kernel-PCA coordinates for the training rows in X."""
    X = np.asarray(X, dtype=float)
    if X.ndim != 2 or len(X) < 2:
        raise ValueError("kernel_pca expects a 2D array with at least two rows")
    if not isinstance(n_components, int) or n_components <= 0 or n_components > len(X):
        raise ValueError("n_components must be between 1 and the sample count")
    if gamma <= 0:
        raise ValueError("gamma must be positive")
    gram = X @ X.T
    if kernel == "rbf":
        squared_distances = np.maximum(
            np.sum(X * X, axis=1, keepdims=True)
            + np.sum(X * X, axis=1, keepdims=True).T
            - 2.0 * gram,
            0.0,
        )
        K = np.exp(-gamma * squared_distances)
    elif kernel == "poly":
        K = (gram + 1.0) ** gamma
    elif kernel == "linear":
        K = gram
    else:
        raise ValueError(f"unknown kernel: {kernel}")
    one = np.ones((len(X), len(X))) / len(X)
    centered = K - one @ K - K @ one + one @ K @ one
    eigenvalues, eigenvectors = np.linalg.eigh(centered)
    order = np.argsort(eigenvalues)[::-1]
    eigenvalues = np.maximum(eigenvalues[order][:n_components], 0.0)
    eigenvectors = eigenvectors[:, order][:, :n_components]
    return eigenvectors * np.sqrt(eigenvalues)


def reconstruction_error(X: np.ndarray, X_reconstructed: np.ndarray) -> float:
    X = np.asarray(X, dtype=float)
    X_reconstructed = np.asarray(X_reconstructed, dtype=float)
    if X.shape != X_reconstructed.shape:
        raise ValueError("arrays must have the same shape")
    return float(np.mean((X - X_reconstructed) ** 2))


def demo_synthetic() -> None:
    X = make_synthetic_data()
    pca = PCA(n_components=2)
    reduced = pca.fit_transform(X)
    reconstructed = pca.inverse_transform(reduced)
    print("PCA from scratch on a deterministic 3D fixture")
    print(f"  input shape: {X.shape}")
    print(f"  projected shape: {reduced.shape}")
    print(f"  explained ratios: {np.round(pca.explained_variance_ratio_, 4)}")
    print(f"  reconstruction MSE: {reconstruction_error(X, reconstructed):.6f}")


def demo_kernel() -> None:
    X, labels = make_concentric_circles()
    linear = PCA(n_components=1).fit_transform(X)
    nonlinear = kernel_pca(X, n_components=2, gamma=0.5)
    print("Kernel PCA on concentric-circle fixture")
    print(f"  rows per class: {int(np.sum(labels == 0))}, {int(np.sum(labels == 1))}")
    print(f"  linear projection shape: {linear.shape}")
    print(f"  RBF projection shape: {nonlinear.shape}")
    print(f"  RBF coordinate ranges: {np.round(nonlinear.min(axis=0), 3)} .. {np.round(nonlinear.max(axis=0), 3)}")


def demo_method_choice() -> None:
    print("Method choice is a modeling decision, not a hidden dependency")
    print("  PCA: linear variance-preserving projection; this lesson implements it.")
    print("  t-SNE: stochastic local-neighborhood visualization; compare seeds before interpretation.")
    print("  UMAP: graph-based visualization; n_neighbors trades local detail for broader structure.")
    print("  Kernel PCA: nonlinear similarity geometry; the local RBF fixture above is implemented here.")


if __name__ == "__main__":
    demo_synthetic()
    demo_kernel()
    demo_method_choice()
