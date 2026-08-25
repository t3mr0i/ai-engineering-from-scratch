---
name: skill-functional-parameter-patterns
description: Standard-library patterns that make JAX-style data flow explicit
version: 1.0.0
phase: 03
lesson: 12
tags: [functional, gradients, batching, reproducibility]
---

## Explicit state

Represent a scalar model as data and return a new mapping from every update:

```python
params = {"w": (0.0, 0.0), "b": 0.0}
gradients = {"w": (0.25, -0.5), "b": 0.1}
next_params = update_params(params, gradients, learning_rate=0.1)
```

The old mapping remains unchanged. Validate finite values and matching widths before applying arithmetic.

## Batch transformation

```python
predict = shape_checked(lambda row: linear(params, row), width=2)
predictions = vmap(predict, ((1.0, 2.0), (2.0, 3.0)))
```

`vmap` here is a small, executable map over a non-empty tuple. It illustrates the data-flow idea; it is not an implementation of an external array library.

## Finite-difference probe

```python
derivative = finite_difference_gradient(lambda value: value**2, 3.0)
```

The centered estimate should be close to `6`. Keep `epsilon` positive and finite, and interpret the result as an approximation rather than automatic differentiation.

## Reproducible randomness

```python
first_seed, second_seed = split_seed(42)
weights = random_vector(first_seed, size=2)
```

Passing seeds explicitly makes repeated fixture runs comparable. This lesson does not claim device-independent randomness or compilation semantics.

## Review checklist

- Does every parameter update return new state?
- Are batch rows non-empty, finite, and width-compatible?
- Is the loss trace finite and lower at the end of the bounded fixture?
- Are malformed steps, rates, widths, and epsilon values rejected early?
- Is any external JAX execution described as an optional boundary rather than a local result?
