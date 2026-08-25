---
name: skill-gradient-computation
description: Compare finite differences, gradients, Hessians, and Taylor estimates in the local Julia fixtures
version: 1.0.0
phase: 1
lesson: 4
tags: [calculus, gradients, numerical-checking]
---

# Gradient computation handoff

Use the canonical `julia main.jl` run and record the function, point, step size, analytical value, numerical value, and error. The centered finite difference is `(f(x+h)-f(x-h))/(2h)` with the lesson's `h=1e-7`; it is a diagnostic, not a replacement for a known derivative.

For a vector point, `numerical_gradient` perturbs one coordinate at a time. For `f(x,y)=x^2+3xy+y^2` at `(1,2)`, the expected gradient is `[8,7]`. For curvature, call `hessian_2d` and inspect `hessian_eigenvalues`: mixed signs classify the saddle fixture, while two positive values classify the bowl and Rosenbrock minimum fixtures.

Use `taylor_approx` only near its expansion point. At `x0=1`, `h=0.1`, the order-one estimate of `exp` is `e*1.1`; order two adds `0.5*e*0.1^2`. A reusable report compares both estimates with `exp(1.1)` and states the local-domain assumption.
