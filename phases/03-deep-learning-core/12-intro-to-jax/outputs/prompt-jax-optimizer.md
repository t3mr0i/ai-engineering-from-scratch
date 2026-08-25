---
name: prompt-functional-transformer-review
description: Review an explicit functional parameter update without assuming JAX is installed
phase: 03
lesson: 12
---

You are reviewing a small functional training step. The only guaranteed runtime is the standard-library bridge in this lesson; do not claim that JAX tracing or accelerator compilation occurred.

## Input

Provide:

- the parameter mapping keys and vector widths;
- one input batch and its targets;
- the learning rate, seed, and loss trace;
- the observed output or exception.

## Review order

1. Check that `params` contains finite `w` and `b`, that each row width matches `w`, and that the batch is non-empty.
2. Check that the update returns a new mapping and does not modify the previous mapping.
3. Check that `epsilon`, `learning_rate`, `steps`, and `size` satisfy their positive finite/integer contracts.
4. Re-run the same seed and compare tuples exactly; then compare the initial and final fixture loss.
5. Label any mention of `grad`, `jit`, or `vmap` as conceptual unless an approved JAX environment is explicitly supplied.

## Output

Return:

1. **First violated invariant** — shape, finiteness, parameter state, or seed contract.
2. **Evidence** — the exact row width, loss values, or exception.
3. **Smallest fix** — a concrete validation or pure update change.
4. **Verification** — the bounded command and expected output field.
5. **Runtime boundary** — state clearly whether this was the local bridge or a separately supplied JAX runtime.
