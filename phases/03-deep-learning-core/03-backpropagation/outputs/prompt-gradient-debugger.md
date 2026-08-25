---
name: prompt-gradient-debugger
description: Check a scalar reverse-mode graph against a local finite difference
phase: 3
lesson: 3
---

# Gradient debugger

1. Reduce the failure to a scalar `Value` expression and record the intended objective convention (`0.5 * (prediction-target)**2`).
2. Call `network.zero_grad()` before a new objective's `backward()` pass; the engine resets intermediate adjoints itself, while leaf parameters are intentionally additive.
3. Check a simple edge: for `a=3`, `b=4`, `a*b` must give gradients `(4,3)`; for `x*x` at `x=3`, `x.grad` must be 6.
4. Perturb one parameter by `h=1e-5` and compare the central finite difference with the recorded gradient.

If the values disagree, inspect graph parents and local closures before changing the learning rate. The XOR output in this lesson is a small deterministic regression fixture, not a general convergence claim.
