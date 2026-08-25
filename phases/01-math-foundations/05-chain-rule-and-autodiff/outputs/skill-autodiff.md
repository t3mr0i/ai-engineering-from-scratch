---
name: skill-autodiff
description: Trace and verify the local reverse-mode Value engine
phase: 1
lesson: 5
tags: [chain-rule, reverse-mode, gradient-checking]
---

# Autodiff debugging handoff

Use `julia main.jl` and name every node's `data`, `op`, and `grad`. For `y=relu(x1*x2+1)` with `x1=2` and `x2=3`, the forward result is `7`; the multiplication closure sends gradients `3` and `2` to the two leaves.

The local engine stores children and a backward closure in each `Value`. `backward!` builds a topological order, seeds the root with gradient `1`, and walks the order in reverse. If a node feeds two consumers, its gradient must accumulate both contributions. Reset parameter gradients before a second training pass; the XOR demo does this before `backward!(loss)`.

For verification, call `gradient_check` on the same expression at `x+h` and `x-h`. Treat a difference below `1e-5` as evidence for that fixture only. ReLU at a non-positive preactivation sends zero in this implementation, and `log` requires a positive value.
