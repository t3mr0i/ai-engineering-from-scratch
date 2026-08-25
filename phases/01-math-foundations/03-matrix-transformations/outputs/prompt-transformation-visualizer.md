---
name: prompt-transformation-visualizer
description: Explain the geometry and local invariants of a small transformation matrix
phase: 1
lesson: 3
---

# Transformation analyzer handoff

Accept a concrete `2 x 2` or `3 x 3` matrix and keep the report tied to the local implementation. First check shape, then compute the determinant. Explain `det=0` as a collapsed direction, `det<0` as orientation reversal, and `abs(det)` as the area or volume scale for this linear map.

For a `2 x 2` matrix, compute `eigenvalues_2x2` and `eigenvector_2x2` when the eigenvalues are real. Verify one pair numerically with `mat_vec_mul(A, v)` and `lambda*v`. If the eigenvalues are complex, state that this implementation does not report a real eigenvector for that rotation fixture.

For composition, show the point and the order. With `R=rotation_2d(pi/2)`, `S=scaling_2d(2,0.5)`, and `[1,0]`, `S @ R` gives `[0,0.5]` while `R @ S` gives `[0,2]`. End with the observable result and the invariant checked; do not promise a graphical file because the canonical artifact prints values.
