# Matrix Transformations

> A transformation is a rule for moving every point; its matrix makes the rule executable.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 02 (Vectors, Matrices & Operations)
**Time:** ~70 minutes

## Learning Objectives

- Build 2D and 3D rotation, scaling, shearing, and reflection matrices.
- Predict how composition order changes a point and how determinants multiply.
- Compute `2 x 2` eigenvalues/eigenvectors and check `A @ v = lambda * v`.
- Interpret determinant sign and magnitude as orientation and area scaling.
- Connect the largest covariance eigenvalue to a principal direction without treating PCA as magic.

## Build It

The Python implementation is in `transformations.py`; `main.py` delegates to it, and `main.jl` runs the Julia counterpart. Start with:

```bash
python3 main.py
julia main.jl
```

`rotation_2d(pi/2)` sends `[1,0]` to `[0,1]` (up to round-off). `scaling_2d(2,3)` sends `[1,1]` to `[2,3]`. The lesson's shear is `[[1,kx],[ky,1]]`, so `shearing_2d(1,0)` sends `[1,1]` to `[2,1]`. `reflection_y()` sends `[2,1]` to `[-2,1]`.

The unit-square demo applies four matrices to each corner and prints each determinant. Rotation and shear have determinant `1` in their fixtures; `scaling_2d(2,0.5)` also has determinant `1`; reflection has determinant `-1`. The magnitude tells how area scales, while the sign records orientation reversal.

## Use It

Composition is read right to left. With `R=rotation_2d(pi/2)`, `S=scaling_2d(2,0.5)`, and `p=[1,0]`, `S @ R @ p` rotates first and then scales, while `R @ S @ p` scales first and then rotates. The two results differ because matrix multiplication is not commutative. The implementation checks rectangular shapes in `mat_vec_mul` and `mat_mul` and raises a clear `ValueError` for an invalid product.

For `A=[[2,1],[1,2]]`, the eigenvalues are `3` and `1`. The eigenvector for `3` points along `[1,1]`; the one for `1` points along `[1,-1]`. For the rotation matrix, the eigenvalues are complex and the demo deliberately reports that there are no real eigenvectors. For `A=[[3,1],[0,2]]`, the eigendecomposition demo reconstructs `A` from `V @ D @ V^-1`.

The final PCA preview uses covariance matrix `[[2,1],[1,3]]`. The eigenvector paired with the larger eigenvalue is the direction of greatest variance in this two-dimensional fixture. This is a local calculation, not a claim that every dataset is well described by one component.

## Ship It

`outputs/prompt-transformation-visualizer.md` turns a user-supplied `2 x 2` or `3 x 3` matrix into a determinant/eigenpair report. The handoff should require the matrix shape, transformed unit-square corners, determinant, and an eigenvector residual. If NumPy is installed, the Python demo prints a comparison; the from-scratch path remains the primary artifact and works without it.

## Exercises

1. Run the rotation and reflection fixtures and verify the Euclidean length of `[1,0]` is unchanged by each orthogonal transformation.
2. Compute both `S @ R @ [1,0]` and `R @ S @ [1,0]` for the matrices in the demo. Explain which operation is applied first in each expression.
3. For `A=[[2,1],[1,2]]`, normalize `[1,1]`, multiply it by `A`, and check that the result is `3` times the normalized vector.
4. Pass a `(2,2)` matrix and a length-three vector to `mat_vec_mul`. Record the exact error and explain which shape invariant it protects.

## Reference Solution

The 90-degree rotation maps `[1,0]` to `[0,1]`; `S @ R @ [1,0]` is `[0,0.5]`, whereas `R @ S @ [1,0]` is `[0,2]`. The normalized `[1,1]` direction is an eigenvector with eigenvalue `3`. An invalid length-three vector raises `ValueError("matrix columns must match vector length")`. The covariance preview's larger eigenvalue is paired with its first principal direction as printed by the local eigensolver.
