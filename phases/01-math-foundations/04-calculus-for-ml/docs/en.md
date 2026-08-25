# Calculus for Machine Learning

> Derivatives turn a loss value into a direction an optimizer can use.

**Type:** Build
**Languages:** Julia
**Prerequisites:** Phase 1, Lesson 03 (Matrix Transformations)
**Time:** ~70 minutes

## Learning Objectives

- Compare centered finite differences with analytical derivatives on small scalar functions.
- Compute a multivariate gradient and use it for one-dimensional and two-dimensional descent.
- Read Hessian eigenvalues to distinguish a bowl, a saddle, and a locally curved minimum.
- Use a second-order Taylor approximation and state when a local approximation is trustworthy.
- Relate these numerical tools to the derivative flow used by a training loop.

## Build It

The canonical implementation is `code/main.jl`; `derivatives.py` is a parallel standard-library reference with the same finite-difference formulas. Run the canonical program with:

```bash
julia main.jl
```

At `x=2`, the numerical derivative table compares `x^2`, `x^3`, `sin(x)`, `e^x`, and `1/x` with their analytical derivatives using `h=1e-7`. For `f(x,y)=x^2+3xy+y^2` at `(1,2)`, `numerical_gradient` should be close to `[8,7]`. The one-dimensional descent fixture starts at `x=5`, uses `lr=0.1`, and applies `x <- x - 0.1(2x)` for 20 steps, ending near `0.057646`.

`hessian_2d` estimates the second derivatives with `h=1e-5`. At `(0,0)`, `x^2-y^2` has eigenvalues `2` and `-2`, so the point is a saddle. `x^2+y^2` has two positive eigenvalues and is a local minimum. The Rosenbrock Hessian at `(1,1)` is positive in both principal directions but strongly curved, which explains why its narrow valley is a useful optimization fixture.

## Use It

Use `numerical_derivative(f, x; h=...)` when the function is a black box, and use the analytical expression as a check when it is available. A centered difference evaluates both sides of `x`; it is not the same as a one-sided slope. `numerical_gradient` copies the point and perturbs one coordinate at a time, so its output length equals the number of coordinates.

`taylor_approx` evaluates `f(x0)`, optionally adds `f'(x0)h`, and optionally adds `0.5f''(x0)h^2`. For `e^x` around `x0=1`, the first-order estimate at `h=0.1` is `e(1.1)`, close to but below `e^1.1`; the error grows as the step leaves the local neighborhood.

## Ship It

`outputs/skill-gradient-computation.md` is a compact gradient-checking reference. A correct handoff records the function, point, step size, analytical value, numerical value, and absolute error. It should keep symbolic tooling and framework autograd out of the canonical run: the lesson's executable contract is the Julia standard-library implementation.

## Exercises

1. Run `julia main.jl` and compare the `x^2` numerical derivative at `x=2` with `4`. Record the error printed by the table.
2. Recompute the gradient of `x^2+3xy+y^2` at `(1,2)` by hand, then verify both coordinates of the demo output.
3. Use `taylor_approx(exp, exp, exp, 1.0, 0.1; order=1)` and `order=2`. Compare both with `exp(1.1)` and state which term improves the estimate.
4. Replace the saddle function with `x^2+y^2` in a small caller and use `hessian_eigenvalues` to justify the changed classification.

## Reference Solution

The centered derivative of `x^2` at `2` is approximately `4`; the multivariate gradient is `[8,7]`; and the one-step descent sequence contracts `x` by `0.8` each step. The saddle Hessian has mixed signs, while the bowl Hessian has two positive eigenvalues. Adding the second-order Taylor term reduces the local error for `exp(1.1)` relative to the first-order estimate.
