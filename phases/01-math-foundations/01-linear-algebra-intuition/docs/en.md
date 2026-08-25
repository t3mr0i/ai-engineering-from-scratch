# Linear Algebra Intuition

> Read a vector as a direction, a matrix as a transformation, and a neural-network layer as their composition.

**Type:** Learn
**Languages:** Python, Julia
**Prerequisites:** Phase 0
**Time:** ~60 minutes

## Learning Objectives

- Compute vector arithmetic, dot products, norms, projections, and cosine similarity from scratch.
- Explain linear independence, rank, and the geometric purpose of Gram-Schmidt orthogonalization.
- Apply a small matrix to a vector and predict the input and output shapes of a dense layer.
- Use orthogonality and residual checks to decide whether a hand calculation is correct.

## Why this lesson matters

An embedding, a gradient, and a row of network weights are all vectors. A weight matrix turns one vector space into another. The names change across papers, but the operations in this lesson do not. The two runnable implementations keep the arithmetic visible: `vectors.py` uses Python lists and `vectors.jl` uses Julia arrays with `LinearAlgebra`.

## Build It

Run both canonical entry points from `code/`:

```bash
python3 main.py
julia main.jl
```

The Python run uses `Vector([1, 2, 3])` and `Vector([4, 5, 6])`; their dot product is `32` and the first magnitude is `sqrt(14)`. It then rotates `Vector([3, 1])` with `[[0, -1], [1, 0]]`, producing `Vector([-1, 3])`. The projection fixture is `a=[3,4]` onto `b=[1,0]`, so the projection is `[3,0]` and `(a-projection)·b` prints `0.000000`.

The rest of the demo makes three checks concrete:

1. `is_independent([e1,e2,e3])` is true, while `[e1,e2,2e1+e2]` is dependent.
2. `Matrix([[1,2],[2,4]]).rank()` is `1`; the rectangular `2 x 3` example has rank `2`.
3. `gram_schmidt` returns unit vectors whose pairwise dot products are close to zero.

The Julia entry point repeats the vector, rotation, and dense-layer shape fixtures. Its random weight matrix is seeded with `42`; the important contract is `(2,3) * (3,) -> (2,)`, not a particular floating-point sample.

## Use It

Use `Vector` as a small embedding diagnostic. For two non-zero vectors, compare `dot`, `magnitude`, and `cosine_similarity`: scaling one vector changes its magnitude and dot product but not its cosine similarity. For a least-squares intuition, project `[3,4]` onto `[1,0]`, retain the residual, and verify the residual is orthogonal to the target direction.

`gram_schmidt([Vector([1,1]), Vector([1,0])])` is a useful hand trace. The first output is `[1/sqrt(2),1/sqrt(2)]`; the second is the normalized remainder after subtracting its projection onto the first. A zero vector cannot be normalized or used as a projection target; the Python implementation raises `ValueError` instead of returning NaNs.

## Ship It

The reusable artifact is `outputs/prompt-linear-algebra-tutor.md`. Give it the same small fixtures used by the code and require the learner to report the numeric result, the shape, and an invariant. A useful handoff records the command, the projection residual dot product, and the rank of `[[1,2],[2,4]]`. It should not claim to implement embeddings or attention; those are applications of the primitives, not outputs of this lesson.

## Exercises

1. Run `python3 main.py`, then write the arithmetic for `Vector([3,4]).project_onto(Vector([1,0]))`. Check both the returned vector and the residual dot product.
2. Replace `Vector([2,1,0])` in the independence fixture with `Vector([0,0,1])`. Predict the boolean before running `is_independent` and explain the change in span.
3. Apply `Matrix([[1,0,0],[0,1,0]])` to `Vector([2,-1,7])`. Record the output shape and explain which input coordinate is discarded.
4. Feed `Vector([0,0])` to `normalize` and `project_onto`. Record both `ValueError` messages and explain why silently returning a vector would hide a numerical bug.

## Reference Solution

The first projection is `[3,0]`, the residual is `[0,4]`, and the residual dot product is zero. Replacing the dependent third vector with `[0,0,1]` makes the three standard basis vectors independent. The `2 x 3` matrix applied to `[2,-1,7]` returns `[2,-1]`, so its output shape is `(2,)`. Both zero-vector calls must raise `ValueError`; normalization has no unit direction for zero, and projection would divide by `other·other = 0`.
