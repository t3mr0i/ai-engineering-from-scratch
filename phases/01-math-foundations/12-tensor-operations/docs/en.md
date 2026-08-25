# Tensor Operations

> Make shape, stride, contraction, and attention invariants visible before a framework hides them.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 01–03 (vectors, matrices, transformations)
**Time:** ~55 minutes

## Learning Objectives

- Represent a nested tensor as flat row-major data with explicit shape and strides.
- Apply reshape, squeeze, unsqueeze, transpose, permute, and flatten without changing element order.
- Distinguish element-wise operations from broadcasting and matrix contraction.
- Read common `einsum` subscripts and predict the output shape.
- Trace multi-head attention from `(B,T,E)` through `(B,H,T,D)` scores and values.

## Two layers of the lesson

`code/tensors.py` contains a small `Tensor` class. A `(2,3)` value stores six elements and has strides `(3,1)`: moving along axis 0 skips three flat entries and moving along axis 1 skips one. The class intentionally rejects partial indexing and mismatched element-wise shapes instead of silently broadcasting.

The same file uses NumPy for production-shaped examples. NumPy broadcasting aligns trailing axes: a bias of shape `(hidden,)` can be added to `(batch,sequence,hidden)`. `einsum` makes contractions explicit: `ij,jk->ik` contracts `j`, while `bhts,bhsd->bhtd` contracts the key-token axis.

## Build It

Run the bounded demo:

```bash
cd phases/01-math-foundations/12-tensor-operations/code
python3 main.py
```

The first sections print custom-tensor indexing and strides, reshape/permute results, broadcasting shapes, and common `einsum` patterns. The attention fixture uses `B=2`, `H=4`, `T=8`, `D=16`, so `E=64`; scores have shape `(2,4,8,8)` and the value contraction returns `(2,4,8,16)`.

Inspect the custom storage directly:

```python
from tensors import Tensor

t = Tensor([[1, 2, 3], [4, 5, 6]])
assert t.shape == (2, 3)
assert t.strides == (3, 1)
assert t.transpose(0, 1).to_list() == [[1, 4], [2, 5], [3, 6]]
```

## Use It

Use `reshape((-1,3))` only when the element count is divisible by three; the implementation infers the missing dimension. `squeeze` removes singleton axes and `unsqueeze` inserts one, which is often the clearest way to make a broadcast contract explicit.

For attention, split `(B,T,E)` into `(B,T,H,D)`, transpose to `(B,H,T,D)`, compute scores with `einsum('bhtd,bhsd->bhts')`, normalize over the final token axis, then contract with `V`. The two token axes in the score matrix are query and key positions; the feature axis `D` is gone after the dot product.

## Ship It

The reusable artifacts are [the tensor debugger prompt](../../12-tensor-operations/outputs/prompt-tensor-debugger.md) and [the shape prompt](../../12-tensor-operations/outputs/prompt-tensor-shapes.md). Use them to require a shape table at every reshape, transpose, broadcast, and contraction boundary. A shape table is evidence; “the model should broadcast” is not.

## Exercises

1. Construct `Tensor(list(range(24)), shape=(2,3,4))`, permute `(1,0,2)`, and verify that `permuted[2,1,3] == tensor[1,2,3]`.
2. Add a `(4,)` bias to a `(2,3,4)` NumPy array and record the result shape. Then try a `(3,)` bias and explain the mismatch.
3. Predict and run the score shape when `T=5` and `Q,K` have shape `(2,4,5,16)`. Record the output shape after multiplying by `V` with the same shape.

## Reference Solution

The permuted tensor has shape `(3,2,4)` and keeps the indexed value because only axis order changes. The `(4,)` bias broadcasts over the first two axes; `(3,)` aligns to the last axis and is rejected for hidden size four. With `T=5`, scores are `(2,4,5,5)` and attention output is `(2,4,5,16)`. The acceptance evidence is the exact shape and index checks, not a visual inspection.

## Tests

```bash
python3 -m unittest discover tests -v
```

Seven tests cover storage/strides, indexing and assignment, inferred reshape, permutations, reductions and element-wise operations, invalid shapes, and attention einsum output shapes.
