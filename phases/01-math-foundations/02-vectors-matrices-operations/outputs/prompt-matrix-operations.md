---
name: prompt-matrix-operations
description: Explain the exact Matrix operations and dense-layer shapes in this lesson
phase: 1
lesson: 2
---

# Matrix operations tutor handoff

Use `python3 main.py` as the reference run. Start with `A=[[1,2],[3,4]]` and `B=[[5,6],[7,8]]`, and ask the learner to distinguish the element-wise result `[[5,12],[21,32]]` from the matrix product `[[19,22],[43,50]]`.

For every proposed operation, require a shape check. A product `(m,n) @ (n,p)` returns `(m,p)`. A row bias `(1,n)` or column bias `(m,1)` may broadcast in the local `Matrix.__add__`; unrelated shapes must produce a `ValueError`.

Use `A=[[4,7],[2,6]]` to verify `det(A)=10` and `A @ A.inverse_2x2()` is identity. Keep `inverse_2x2` scoped to square two-by-two inputs and explain why the singular matrix `[[1,2],[2,4]]` has no inverse.

Close with the dense fixture: `(4,3) @ (3,1) + (4,1)` yields `(4,1)`, ReLU preserves that shape, and `(2,4) @ (4,1) + (2,1)` yields `(2,1)`. This shape chain is the reusable lesson artifact.
