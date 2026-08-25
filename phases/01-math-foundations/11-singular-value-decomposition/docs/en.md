# Singular Value Decomposition

> Factor a matrix into input rotation, scaling, and output rotation—and know what the factors buy you.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lessons 01–03 and 10 (matrix products, eigenvectors, PCA)
**Time:** ~60 minutes

## Learning Objectives

- Explain the shapes and order of `U`, `Sigma`, and `V^T` in a full SVD.
- Recover dominant singular triplets with power iteration on `A.T @ A`.
- Use truncated factors for reconstruction and storage estimates.
- Form a tolerance-aware pseudoinverse for least-squares and rank-deficient systems.
- Connect the right singular vectors of centered data to PCA directions.

## Factor contract

For `A` with shape `(m,n)`, a full factorization has `U` `(m,m)`, `Sigma` `(m,n)`, and `V^T` `(n,n)`. The compact functions in `code/svd.py` return `U` `(m,k)`, `S` `(k,)`, and `Vt` `(k,n)` from `truncated_svd`; `svd_from_scratch` returns `U`, `S`, and `V`, so reconstruction is `U @ diag(S) @ V.T`.

Power iteration estimates the largest eigenvector of the residual `A.T @ A`. After each singular triplet, the residual subtracts `sigma * outer(u,v)`. NumPy's `linalg.svd` is retained as a local reference for truncation and pseudoinverse operations; no external ML package is needed.

## Build It

Run either canonical entry point:

```bash
cd phases/01-math-foundations/11-singular-value-decomposition/code
python3 main.py
```

```bash
julia main.jl
```

Julia is not installed in the current validation environment, so the Julia path is checked statically there. The Python demo uses fixed seeds and prints reconstruction, geometry, low-rank, pseudoinverse, condition-number, LSA, noise, and PCA/SVD fixtures.

Inspect the scratch factorization on a concrete matrix:

```python
import numpy as np
from svd import reconstruct, svd_from_scratch

np.random.seed(11)
A = np.array([[3.0, 1.0], [1.0, 3.0], [2.0, -1.0]])
U, S, V = svd_from_scratch(A)
assert np.allclose(reconstruct(U, S, V.T), A, atol=1e-6)
```

## Use It

Use `truncated_svd(A, k)` when the leading singular directions are enough for a low-rank approximation. The storage estimate in `compression_ratio(m,n,k)` is `k*(m+n+1)` values divided by `m*n`; it is a local accounting model, not a file-format benchmark.

For an overdetermined system, `pseudoinverse_via_svd(A) @ b` minimizes the residual when the relevant rank conditions hold. Singular values below `tol` receive reciprocal zero, so a rank-deficient matrix produces a minimum-norm-compatible solution rather than an unstable inverse.

After centering a data matrix `X`, its covariance is proportional to `X.T @ X`. Therefore PCA eigenvalues equal `S**2/(n-1)` and PCA directions match rows of `Vt` up to sign.

## Ship It

The reusable artifact is [the SVD guide](../../11-singular-value-decomposition/outputs/skill-svd.md). It asks for matrix shape, retained rank, reconstruction error, singular-value cutoff, and whether a pseudoinverse is being used for least squares. Those fields prevent a low-rank demo from being mistaken for a lossless compression guarantee.

## Exercises

1. Compare rank 1 and rank 2 reconstructions of `np.diag([5.0,2.0,1.0])`; record Frobenius errors and `compression_ratio(3,3,k)`.
2. For `A=[[1,1],[2,1],[3,1]]` and `b=[3,5,6]`, compute `x = pseudoinverse_via_svd(A) @ b` and verify `A.T @ (A@x-b)` is near zero.
3. Build the rank-deficient matrix `[[1,2],[2,4]]`, compute its pseudoinverse solution for `[3,6]`, and report the singular value that is treated as zero under the tolerance.

## Reference Solution

Rank 2 retains more energy than rank 1, so its reconstruction error is no larger. The least-squares residual is orthogonal to the columns of `A`, which is exactly the `A.T @ residual ≈ 0` check. For the rank-one matrix, the second singular value is approximately zero; the tolerance guard prevents division by it. Sign flips in `U`/`V` are valid if their product reconstructs `A`.

## Tests

```bash
python3 -m unittest discover tests -v
```

Seven Python tests check scratch reconstruction and shapes, singular-value ordering, rank truncation, least-squares orthogonality, rank deficiency, storage accounting, and factor-shape errors.
