# Dimensionality Reduction

> Compress a structured matrix while keeping the variance and geometry you can defend.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 01–03 and 06 (linear algebra, eigenvectors, probability)
**Time:** ~55 minutes

## Learning Objectives

- Center a feature matrix and derive PCA from its sample covariance matrix.
- Interpret eigenvalues, component directions, explained variance, and reconstruction error.
- Validate `transform` and `inverse_transform` shapes on a local NumPy fixture.
- Center an RBF Gram matrix and obtain nonlinear kernel-PCA coordinates.
- Choose a dimensionality-reduction method without treating a visualization as a metric-preserving map.

## The local problem

The code uses two deterministic fixtures instead of downloading MNIST. `make_synthetic_data(seed=42, n_samples=240)` returns a noisy 3D ellipse with a correlated third coordinate. `make_concentric_circles` returns two rings; a single linear axis cannot separate their radial structure.

PCA subtracts the column mean, forms

```text
C = X_centered.T @ X_centered / (n_samples - 1)
```

and eigendecomposes `C`. The implementation sorts eigenvalues in descending order, stores components as `(n_components, n_features)`, projects with `centered @ components.T`, and reconstructs with `projected @ components + mean`. `explained_variance_ratio_` is the selected eigenvalue divided by total covariance variance.

Kernel PCA follows the same idea on a centered Gram matrix. For the RBF kernel, `K[i,j] = exp(-gamma * ||x_i-x_j||²)`. The function returns one coordinate row per training input; it does not claim to implement an out-of-sample transform.

## Build It

Run the offline demo:

```bash
cd phases/01-math-foundations/10-dimensionality-reduction/code
python3 main.py
```

The demo reports `(240,3) -> (240,2)`, the two local explained-variance ratios, reconstruction MSE, and the `(160,2)` RBF projection for 80 points per ring. It then prints a short method-choice reminder. No dataset downloader, plotting package, t-SNE package, or UMAP package is imported by the canonical path.

The core PCA trace is:

```python
from dim_reduction import PCA, make_synthetic_data, reconstruction_error

X = make_synthetic_data(seed=7, n_samples=60)
pca = PCA(2)
Z = pca.fit_transform(X)
X_hat = pca.inverse_transform(Z)
print(X.shape, Z.shape, pca.explained_variance_ratio_)
print(reconstruction_error(X, X_hat))
```

## Use It

Use PCA when a centered linear subspace is an appropriate compression or preprocessing contract. The component signs are arbitrary, so compare directions with absolute values or a sign-invariant reconstruction check. Adding a retained component cannot increase the least-squares reconstruction error for the same fitted data.

Use `kernel_pca(X, n_components=2, kernel="rbf", gamma=0.5)` for the ring fixture. The output is centered in coordinate space and has shape `(len(X),2)`. `gamma` controls the RBF length scale; it is a fixture parameter, not a universal setting.

t-SNE and UMAP are useful conceptual contrasts: t-SNE emphasizes local neighborhoods and is stochastic; graph-based UMAP exposes a `n_neighbors` trade-off between local and broader structure. They are not dependencies of this lesson, and distances between visibly separated clusters should not be treated as calibrated distances without a separate evaluation.

## Ship It

The reusable artifact is [the dimensionality-reduction guide](../../10-dimensionality-reduction/outputs/skill-dimensionality-reduction.md). It records the fitted mean, retained component count, variance captured, reconstruction error, and whether a nonlinear projection is only an exploratory visualization. That makes a compression choice auditable without pretending that a 2D plot preserves every relationship.

## Exercises

1. Fit `PCA(1)` and `PCA(3)` to `make_synthetic_data(seed=7, n_samples=60)`. Record both reconstruction MSEs and the retained variance ratios.
2. Call `kernel_pca` on `make_concentric_circles(n_per_ring=20)` with `gamma=0.1` and `gamma=1.0`. Report the projection shapes and coordinate ranges; do not call the ranges an accuracy score.
3. Pass a two-feature array to a fitted three-feature PCA and record the `ValueError`. Then call `PCA(4).fit` on a `(3,3)` array and record the component-count guard.

## Reference Solution

The `PCA(3)` reconstruction is no worse than `PCA(1)` because it retains a superset of the fitted orthogonal directions. Both kernel runs return `(40,2)`; changing `gamma` changes coordinates but not the row count. The shape checks should fail before matrix multiplication, with explicit errors for a wrong feature count or too many components. A defensible report includes the seed, sample count, component count, ratios, and MSE.

## Tests

```bash
python3 -m unittest discover tests -v
```

Seven tests cover centering, projection shape, variance ordering, reconstruction monotonicity, fitted-state/feature guards, centered RBF coordinates, kernel parameter guards, and reconstruction shape checking.
