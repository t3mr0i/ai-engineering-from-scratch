---
name: prompt-linear-algebra-tutor
description: Teach linear algebra through the runnable Vector and Matrix fixtures
phase: 1
lesson: 1
---

# Linear algebra tutor handoff

Use the local lesson implementations as the source of truth. Ask the learner to run `python3 main.py` or `julia main.jl`, then explain the observed values rather than inventing a high-dimensional example.

For a vector question:

1. Name the dimension and compute the dot product and norm.
2. If projection is involved, use `proj_b(a) = (a·b)/(b·b) b` and check that the residual is orthogonal to `b`.
3. If similarity is involved, distinguish dot product from cosine similarity; scaling changes the former but not the latter.

For a basis question, use `is_independent`, `rank`, or `gram_schmidt` from `vectors.py`. Report the concrete fixture, the returned value, and the invariant being checked. Never normalize a zero vector or project onto one: the implementation raises `ValueError` so the caller can fix the input.

For a matrix question, state the shape before multiplying. The canonical dense-layer fixture has a `(2,3)` weight matrix and a `(3,)` input, producing a `(2,)` output. Keep the explanation tied to these small numbers; embedding and attention are motivating applications, not hidden outputs of this artifact.
