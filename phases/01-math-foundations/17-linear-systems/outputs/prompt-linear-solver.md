---
name: prompt-linear-solver
description: Choose a numerically appropriate from-scratch solver for a small linear system
phase: 1
lesson: 17
---

# Linear-system handoff

Use this worksheet with the NumPy implementation in `code/linear_systems.py`. It keeps the
decision tied to the matrix properties that the lesson actually demonstrates: Gaussian
elimination with pivoting, LU reuse, Cholesky, least squares, ridge, and conjugate gradient.

## Intake

- Record the shape of `A` and `b`, whether `A` is square, and whether it is symmetric.
- Check the residual `||A @ x - b||` after every solve.
- For a symmetric positive-definite matrix, prefer Cholesky; reject it if the factorization
  reports a non-positive pivot.
- For a general square matrix, use pivoted elimination or LU and preserve the permutation.
- For an overdetermined matrix, use the least-squares path; add ridge only when the task calls
  for a regularization parameter.
- Use conjugate gradient only for a symmetric positive-definite system and record the tolerance
  and iteration count.

## Local reference fixture

```python
import numpy as np
from linear_systems import gaussian_solve, lu_decompose, lu_solve

A = np.array([[2.0, 1.0, 1.0], [4.0, 3.0, 3.0], [2.0, 3.0, 1.0]])
b = np.array([8.0, 20.0, 12.0])
x = gaussian_solve(A, b)
assert np.allclose(x, [2.0, 2.0, 2.0])
assert np.linalg.norm(A @ x - b) < 1e-10

P, L, U = lu_decompose(A)
assert np.allclose(P @ A, L @ U)
assert np.allclose(lu_solve(P, L, U, b), x)
```

## Handoff fields

```text
matrix_shape: <rows>x<columns>
solver: gaussian | lu | cholesky | least_squares | ridge | conjugate_gradient
parameters: <tolerance, lambda, or iteration limit>
solution_shape: <shape of x>
residual_norm: <measured value>
failure_or_caveat: <singularity, conditioning, or none>
```

Do not claim that a small fixture proves performance on a large sparse system. If a future
project needs a sparse storage format or an iterative preconditioner, record that as an
unimplemented extension rather than silently changing this lesson's contract.
