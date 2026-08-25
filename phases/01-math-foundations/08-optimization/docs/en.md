# Optimization

> An optimizer is a stateful rule for turning a gradient into the next parameter vector.

**Type:** Build
**Languages:** Julia
**Prerequisites:** Phase 1, Lessons 04-05 (Calculus; Chain Rule & Automatic Differentiation)
**Time:** ~75 minutes

## Learning Objectives

- Implement vanilla gradient descent, momentum, and Adam with explicit optimizer state.
- Derive the Rosenbrock gradient and compare optimizer trajectories on its narrow valley.
- Explain why learning-rate size can produce slow progress, convergence, or divergence.
- Use Hessian shape and a saddle fixture to distinguish a stationary saddle from a minimum.
- Inspect finite, bounded trajectories instead of treating a missing update as convergence.

## Build It

`code/main.jl` is the canonical implementation. `optimizers.py` is a matching Python reference for reading and small experiments. Run:

```bash
julia main.jl
```

`GradientDescent` stores `lr`; `SGDMomentum` stores `lr`, `momentum`, and a velocity vector; `Adam` stores first and second moments, `beta1`, `beta2`, `epsilon`, and step `t`. All three expose `step!`. The optimizer loop starts Rosenbrock at `[-1,1]`, runs at most `5000` steps, and stops early if a gradient or parameter becomes non-finite or exceeds `1e15`.

Rosenbrock is `f(x,y)=(1-x)^2+100(y-x^2)^2`; its minimum is the local fixture `[1,1]` with loss `0`. The learning-rate sweep compares `0.0001`, `0.0005`, `0.001`, and `0.005`. Status is derived from the observed final loss: `DIVERGED` for non-finite or loss above `1e10`, `converged` below `0.01`, otherwise `slow`. These labels describe this run, not a universal ranking of optimizers.

## Use It

For one step, calculate `p - lr*g` before calling `step!`. Momentum accumulates `v <- beta*v + g`, so its first step with an empty velocity uses the raw gradient. Adam forms exponential averages of `g` and `g^2`, then bias-corrects both with `1-beta^t`; this prevents the zero initialization from shrinking the first effective update.

The saddle fixture is `f(x,y)=x^2-y^2`, started at `[0.01,0.01]` for `200` steps with `lr=0.01`. Its gradient is `[2x,-2y]`; descending in `y` increases `|y|`, so the demo can report escape even though the origin has zero gradient. The trajectory guard makes overflow a visible stop condition rather than a long-running loop.

## Ship It

`outputs/prompt-optimizer-guide.md` is a decision aid for selecting and checking these three local optimizers. It should ask for the objective, starting vector, gradient, learning rate, number of steps, final loss, and stop reason. It must not promise cosine schedules or a particular optimizer winner: this code implements fixed learning rates and the local Rosenbrock/saddle fixtures only.

## Exercises

1. Apply `GradientDescent(lr=0.1)` to `params=[3.0]` with gradient `[6.0]`. Verify the next parameter is `2.4`.
2. Run the Rosenbrock sweep and record which of the four local rates is labeled `converged`, `slow`, or `DIVERGED` in your environment.
3. For the first `SGDMomentum` step with gradient `[2,-1]`, `momentum=0.9`, and an empty velocity, calculate the velocity and update by hand.
4. Compare the saddle gradient at `[0.01,0.01]` with the gradient at `[0,0]`. Explain why a zero gradient at the exact saddle is not evidence of a minimum.

## Reference Solution

The scalar update is `3 - 0.1*6 = 2.4`. On the first momentum step, the velocity is exactly the gradient because the initial velocity is zero. At the origin of the saddle, the gradient is `[0,0]`, but the Hessian has eigenvalues `2` and `-2`, so curvature—not the gradient alone—identifies the stationary point. Any sweep label must be copied from the actual bounded run; the code deliberately avoids a universal optimizer claim.
