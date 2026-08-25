# Vectors, Matrices & Operations

> Shape rules turn `W @ x + b` from a mysterious line into a checkable forward pass.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01 (Linear Algebra Intuition)
**Time:** ~60 minutes

## Learning Objectives

- Implement shape-aware addition, subtraction, scalar multiplication, and matrix multiplication.
- Distinguish element-wise multiplication from a matrix product using the same numeric inputs.
- Compute transposes, determinants, and a `2 x 2` inverse and verify the identity result.
- Trace `relu(W @ x + b)` through the shapes of a small dense network.
- Explain row and column broadcasting for a bias matrix without silently accepting invalid shapes.

## The core contract

`code/matrices.py` contains the Python `Vector` and `Matrix` classes; `matrices.jl` provides the same operations with Julia arrays. The Python wrapper `main.py` and Julia wrapper `main.jl` are the canonical entry points. Both are offline and use only their language standard libraries (`LinearAlgebra` is Julia stdlib).

## Build It

Run:

```bash
python3 main.py
julia main.jl
```

The first fixture uses `A=[[1,2],[3,4]]` and `B=[[5,6],[7,8]]`. The element-wise product is `[[5,12],[21,32]]`; the matrix product is `[[19,22],[43,50]]`. The distinction is both numeric and structural: element-wise multiplication requires equal shapes, while `(m,n) @ (n,p)` produces `(m,p)`.

For `A=[[4,7],[2,6]]`, `det(A)` is `10` and the inverse is `[[0.6,-0.7],[-0.2,0.4]]`. Multiplying them prints the identity up to floating-point formatting. A `2 x 3` output plus a `1 x 3` bias uses row broadcasting and returns `[[11,22,33],[14,25,36]]`; a `2 x 1` bias exercises column broadcasting.

The dense-layer fixture has `x` shape `(3,1)`, `W1` shape `(4,3)`, `b1` shape `(4,1)`, `W2` shape `(2,4)`, and `b2` shape `(2,1)`. Therefore `W1 @ x + b1` and its ReLU have shape `(4,1)`, and the second affine transform has shape `(2,1)`.

## Use It

Before every operation, write down its shape rule. Use `Matrix.matmul` or `@` for a learned transformation; use `element_wise_multiply` only when corresponding entries should interact. `Matrix.__add__` accepts equal shapes plus a row bias `(1,n)` or a column bias `(m,1)`. `__sub__` and element-wise multiplication reject mismatched shapes with a `ValueError`, making a bad batch visible instead of producing a truncated result.

The `Matrix` representation prints a small aligned table. Treat it as an inspection aid, not a serialization format. The reusable result is the shape and numeric invariant, such as `A @ A.inverse_2x2()` being identity.

## Ship It

`outputs/prompt-matrix-operations.md` is a tutor prompt for the exact operations in this lesson. A handoff should include the `python3 main.py` command, the two products for `A` and `B`, the determinant `10`, and the dense-layer shape chain. It should state that `inverse_2x2` is intentionally limited to square `2 x 2` inputs and that singular matrices raise `ValueError`.

## Exercises

1. Run the canonical Python demo and calculate both products of `A` and `B` by hand. Label which product is a matrix product and predict its shape before reading the output.
2. Change only `bias` from `[[10,20,30]]` to `[[10],[20]]`. Explain why the column bias is compatible with a `(2,3)` output and record the resulting two rows.
3. Try `Matrix([[1,2],[2,4]]).inverse_2x2()`. Record the exception and connect it to the determinant rather than treating it as a formatting problem.
4. Change the dense-layer input to shape `(4,1)` without changing `W1`. Predict the inner-dimension error, then restore `(3,1)` and verify the `(2,1)` output.

## Reference Solution

The element-wise and matrix products are `[[5,12],[21,32]]` and `[[19,22],[43,50]]`. A column bias `[[10],[20]]` broadcasts to rows, producing `[[11,12,13],[24,25,26]]` for `[[1,2,3],[4,5,6]]`. The rank-one matrix has determinant zero and raises `ValueError("Matrix is singular, no inverse exists")`. A `(4,1)` input cannot multiply `(4,3)` because `3 != 4`; restoring `(3,1)` yields the documented `(2,1)` output.
