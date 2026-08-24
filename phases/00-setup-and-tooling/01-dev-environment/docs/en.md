# Dev Environment

> Your tools shape your thinking. Set them up once, set them up right.

**Type:** Build
**Languages:** Rust
**Prerequisites:** None
**Time:** ~45 minutes

## Learning Objectives

- Set up Python 3.11+, Node.js 20+, and Rust toolchains from scratch
- Configure virtual environments and package managers for reproducible builds
- Verify GPU access with CUDA/MPS and run a test tensor operation
- Understand the four-layer stack: system, packages, runtimes, AI libraries

## The Problem

You're about to learn AI engineering across 200+ lessons using Python, TypeScript, Rust, and Julia. If your environment is broken, every single lesson becomes a fight against tooling instead of learning.

Most people skip environment setup. Then they spend hours debugging import errors, version conflicts, and missing CUDA drivers. We're going to do this once, properly.

## The Concept

An AI engineering environment has four layers:

```mermaid
graph TD
    A["4. AI/ML Libraries\nPyTorch, JAX, transformers, etc."] --> B["3. Language Runtimes\nPython 3.11+, Node 20+, Rust, Julia"]
    B --> C["2. Package Managers\nuv, pnpm, cargo, juliaup"]
    C --> D["1. System Foundation\nOS, shell, git, editor, GPU drivers"]
```

We install bottom-up. Each layer depends on the one below it.

### Verify Your Python Setup

Once `uv` has installed Python and NumPy, confirm both are on the path and working:

```python editable
import sys
print(f"Python {sys.version}")

import numpy as np
print(f"NumPy {np.__version__}")
a = np.array([1, 2, 3])
print(f"Vector: {a}, dot product with itself: {np.dot(a, a)}")
```

## Ship It

This lesson produces a verification script that anyone can run to check their setup.

See `outputs/prompt-env-check.md` for a prompt that helps AI assistants diagnose environment issues.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Set up Python 3.11+, Node.js 20+, and Rust toolchains from scratch.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Configure virtual environments and package managers for reproducible builds.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Verify GPU access with CUDA/MPS and run a test tensor operation.

## Reference Solution

Use the canonical [main.rs](../code/main.rs) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Set up Python 3.11+, Node.js 20+, and Rust toolchains from scratch,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Verify GPU access with CUDA/MPS and run a test tensor operation,” and cite a repeatable check rather than relying on visual inspection alone.

