---
name: prompt-init-strategy
description: Choose and sanity-check a weight initializer from fan-in, fan-out, activation, and a seeded first pass
phase: 3
lesson: 8
---

# Initialization review card

Before training, record:

- fan-in and fan-out for every affine layer;
- activation after the layer (`sigmoid`/`tanh`, ReLU-like, or unknown);
- initializer and local seed;
- observed weight variance and the first few activation magnitudes.

Use Xavier's `2/(fan_in + fan_out)` variance for the sigmoid/tanh fixture and Kaiming's `2/fan_in` variance for the ReLU fixture. Keep zero initialization as a symmetry control, not a default. If a matrix is ragged, a dimension is not a positive integer, or a value is non-finite, stop before training and fix the contract. Treat the seeded trace as a diagnostic for this architecture, not as a universal ranking of initializers.
