# Convex Optimization

> Convexity gives a global statement about local search; the code makes that statement testable on small fixtures.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 04 and 08 (calculus and first-order optimization)
**Time:** ~90 minutes

## Learning Objectives

- Apply the convexity inequality to sampled one- and two-dimensional functions.
- Read eigenvalues of a two-by-two Hessian as local curvature evidence.
- Compare gradient descent and Newton updates on the same quadratic objective.
- Solve a simple equality-constrained problem with the local Lagrange loop.
- Explain why convexity removes spurious local minima without promising fast convergence.

## Build It

The standard-library implementation is in `code/convex.py`. Run the deterministic demonstration with:

```bash
cd phases/01-math-foundations/18-convex-optimization/code
python3 main.py
```

`check_convexity(f, dim, bounds, samples)` samples `x`, `y`, and `t`, then counts violations of `f(tx+(1-t)y) <= t f(x)+(1-t) f(y)`. It is a numerical probe, not a proof. The seeded run classifies `x^2`, `|x|`, `exp(x)`, a two-dimensional bowl, and ReLU as convex fixtures, while `sin(x)`, `x^3`, `-x^2`, and saddle-shaped functions produce violations.

For the Hessian fixture `[[10, 0], [0, 2]]`, `hessian_eigenvalues_2d` returns eigenvalues `10` and `2`, so `is_positive_semidefinite_2d` is true. The saddle Hessian `[[2, 0], [0, -2]]` has mixed signs and is not positive semidefinite.

## Use It

`optimize_gd` stores every accepted point in its history. On `f(x,y)=x^2+3y^2`, pass gradient `[2x,6y]` and a small learning rate; the history should approach `[0,0]`. `newtons_method` uses `H^{-1}g` and reaches the minimizer of a well-conditioned quadratic in far fewer steps, but only the two-by-two inverse path is implemented.

`lagrange_solve` updates both `x` and the multiplier. For `f=x^2+y^2` and equality `x+y-1=0`, use `f_grad=[2x,2y]`, `g_grad=[1,1]`, and start at `[0,0]`; the final point should be near `[0.5,0.5]`. The local function is a teaching loop, not a general KKT solver: its step sizes and iteration count are explicit inputs.

Convexity means every local minimum is global on a convex domain, but it does not imply uniqueness, good conditioning, or that a finite-step implementation has converged. Non-convex neural-network losses can still be useful even though the guarantee does not apply.

## Ship It

The reusable artifact is [the convexity checker](../../18-convex-optimization/outputs/skill-convexity-checker.md). A useful handoff records the function, domain/bounds, Hessian evidence or sampled violation count, optimizer, step size, stopping criterion, and final constraint residual.

## Exercises

1. Run `check_convexity(lambda x: x[0]**2, 1, samples=500)` and then the same call for `sin(x[0])`; record violations rather than treating a pass as a formal proof.
2. Evaluate the eigenvalues and PSD result for `[[10,0],[0,2]]` and `[[2,0],[0,-2]]`.
3. Compare the lengths and final points from `optimize_gd` and `newtons_method` on `x^2+3y^2`.
4. Use `lagrange_solve` for `x+y=1` and report the final constraint value `g_val(x)` alongside the point.

## Reference Solution

The bowl has no sampled convexity violations; the sine fixture does. The positive Hessian has eigenvalues `10` and `2`, whereas the saddle has one negative eigenvalue. Newton's history is shorter on the quadratic because the Hessian supplies curvature. The Lagrange run should end close to equal coordinates with a small `x+y-1` residual; changing `lr` or `lr_lambda` changes the numerical path, so record them.

## Tests

```bash
python3 -m unittest discover tests -v
```

Tests cover the convexity inequality on known functions, Hessian eigenvalues/PSD decisions, gradient and Newton convergence, the equality constraint, singular Hessian handling, and the canonical output path.
