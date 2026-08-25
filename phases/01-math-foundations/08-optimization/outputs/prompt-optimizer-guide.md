---
name: prompt-optimizer-guide
description: Compare the three stateful optimizers in the local Rosenbrock and saddle fixtures
phase: 1
lesson: 8
---

# Optimizer handoff

Begin with an explicit objective, parameter vector, gradient, learning rate, and step budget. The canonical Julia fixture minimizes `rosenbrock([-1,1])` for at most `5000` steps with `GradientDescent`, `SGDMomentum`, and `Adam`. Record the final parameters, loss, trajectory length, and whether the guard stopped on a non-finite or oversized value.

For a single update, apply `p - lr*g`. Momentum stores `v = beta*v + g`; Adam stores exponential averages of `g` and `g^2` and bias-corrects them with the current step `t`. Do not infer a universal winner from one local function or rate sweep.

Use the saddle fixture `f(x,y)=x^2-y^2` to show why a zero gradient at the origin is not enough to declare a minimum. Its Hessian has eigenvalues `2` and `-2`. The artifact covers fixed learning rates and bounded text summaries; it does not implement schedules, plotting, or framework training loops.
