# Linear Systems

> Solve `Ax=b` reliably, then reuse the factorization when the right-hand side changes.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 01–03 (vectors, matrices, and transformations)
**Time:** ~120 minutes

## Learning Objectives

- Solve a square system with Gaussian elimination and partial pivoting.
- Reuse `P`, `L`, and `U` from an LU factorization for several right-hand sides.
- Explain why Cholesky requires a symmetric positive-definite matrix.
- Fit an overdetermined design with normal equations and ridge regularization.
- Use condition numbers and residuals to judge whether a numerical answer is trustworthy.
- Recognize the symmetric positive-definite contract required by conjugate gradient.

## Build It

The implementation in `code/linear_systems.py` is a NumPy-backed collection of small solvers. The canonical command is:

```bash
cd phases/01-math-foundations/17-linear-systems/code
python3 main.py
```

The first fixture is:

```python
import numpy as np
from linear_systems import gaussian_elimination

A = np.array([[2., 1., 1.], [4., 3., 3.], [2., 3., 1.]])
b = np.array([8., 20., 12.])
assert np.allclose(gaussian_elimination(A, b), [2., 2., 2.])
```

`gaussian_elimination` swaps the largest available pivot in each column before eliminating and then back-substitutes. `lu_decompose` returns `P, L, U` with `P @ A = L @ U`; `lu_solve` applies that factorization to a new `b`. `cholesky` and `cholesky_solve` implement the `A=L@L.T` path for positive-definite matrices.

## Use It

For an overdetermined matrix `X`, `least_squares_normal` solves `X.T @ X @ w = X.T @ y`. The demo uses 100 samples, three random features, and a prepended intercept column, so `X.shape == (100, 4)`. `ridge_regression(X, y, lam)` adds `lam * I` before a Cholesky solve; compare `lam=0.1`, `1.0`, and `10.0` by recording residual norm and weight norm.

`condition_number` is the ratio of the largest to smallest singular value. A near-collinear feature makes `X.T @ X` much more sensitive than `X`; ridge regularization makes that system better conditioned. `conjugate_gradient` is appropriate for the demo's `M.T @ M + 0.1 I` matrix, not an arbitrary nonsymmetric matrix.

## Ship It

The handoff artifact is [the linear-solver prompt](../../17-linear-systems/outputs/prompt-linear-solver.md). Record the matrix shape, solver, pivot/factorization choice, residual norm, condition number, and regularization value. A small residual does not by itself prove that an ill-conditioned model will generalize.

## Exercises

1. Run the three-by-three fixture above and verify `max(abs(A @ x - b)) < 1e-10`.
2. Factor the same `A` once with `lu_decompose`, solve for `b=[1,0,0]` and `b=[0,1,0]`, and check `P @ A` against `L @ U`.
3. Build `X` with the seeded regression fixture, compare `least_squares_normal` with `np.linalg.lstsq`, then record how `lam=10` changes `||w||` and the residual.
4. Pass `[[1., 2.], [2., 4.]]` to `cholesky`; explain why the non-positive pivot is a valid rejection.

## Reference Solution

The three-by-three system returns `[2, 2, 2]` with a near-zero residual. LU reconstruction should satisfy `max(abs(P @ A - L @ U)) < 1e-10`, and each reused right-hand side should match `np.linalg.solve`. The regression solution should be close to the seeded NumPy least-squares result; increasing `lam` generally shrinks the weight norm while changing the fit. The singular Cholesky fixture raises `ValueError` because it is not positive definite.

## Tests

```bash
python3 -m unittest discover tests -v
```

The tests cover pivoted elimination, LU reconstruction/reuse, Cholesky success and rejection, least-squares and ridge behavior, condition numbers, conjugate-gradient residuals, and the canonical entrypoint.
