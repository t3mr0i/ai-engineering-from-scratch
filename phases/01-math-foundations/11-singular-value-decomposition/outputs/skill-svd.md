# SVD Review Skill

Use this skill when a matrix factorization is proposed for compression, least squares, denoising, or PCA.

## Required evidence

- Record `A.shape` and whether factors are full, compact, or truncated.
- State whether the implementation returns `V` or `V.T`.
- Report retained rank, singular values, reconstruction error, and storage estimate.
- For a pseudoinverse, record the tolerance and the residual or minimum-norm check.

## Checks

1. Verify `A ≈ U @ diag(S) @ Vt` with the correct factor orientation.
2. Confirm singular values are non-increasing and nonnegative.
3. Compare rank `k` reconstruction error with a smaller rank on the same matrix.
4. For least squares, check `A.T @ (A @ x - b) ≈ 0` when the system is tall.
5. For centered data, compare covariance eigenvalues with `S**2/(n-1)` and directions up to sign.

## Handoff format

```text
matrix_shape: <m, n>
factor_contract: <U shape, S shape, V/Vt shape>
rank: <k>
reconstruction_error: <norm and value>
cutoff: <tolerance if pseudoinverse>
decision: <compression | least squares | denoising | PCA link>
```

The local lesson uses NumPy for reference decompositions and a power-iteration scratch path; no external data or package comparison is required.
