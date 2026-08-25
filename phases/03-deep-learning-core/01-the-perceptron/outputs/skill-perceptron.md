---
name: skill-perceptron
description: Trace and validate a binary perceptron before choosing a multi-layer model
version: 2.0.0
phase: 3
lesson: 1
---

# Perceptron handoff

Use `python3 code/main.py` for the Python path or `julia code/main.jl` when Julia is available. The canonical fixture is a finite vector of width two and a binary target. The AND run prints `[0, 0, 0, 1]`; the composed OR/NAND/AND circuit prints `[0, 1, 1, 0]` for XOR.

Acceptance checks:

- `Perceptron.predict` rejects a wrong-width vector and a non-finite value.
- `Perceptron.train` rejects an empty dataset and labels other than integer 0/1.
- `TwoLayerNetwork(seed=0)` produces the four XOR classes after the documented 5,000 updates.

The loss and predictions are local teaching fixtures. They do not establish performance on a new dataset.
