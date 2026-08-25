# Guided demo: Calculus for Machine Learning

> **Time:** 10–15 minutes · **Question:** How closely do the finite-difference and curvature measurements match the hand calculation?

## Run the baseline

From the repository root:

```bash
julia phases/01-math-foundations/04-calculus-for-ml/code/main.jl
```

In the derivative table, locate `x^2` at `x=2` and compare the numerical value with `4`. Then locate the gradient fixture at `(1,2)` and record both coordinates near `[8,7]`. These are direct checks of the finite-difference step and partial-derivative formulas.

## Change a local approximation

Call `taylor_approx(exp, exp, exp, 1.0, 0.1; order=1)` and `order=2` in a temporary Julia snippet. Compare both values with `exp(1.1)`. Keep `x0` and `h` fixed so the difference isolates the added second-order term.

## Probe curvature

Use `hessian_2d((x,y) -> x^2-y^2, 0.0, 0.0)` and pass the matrix to `hessian_eigenvalues`. The mixed signs classify the origin as a saddle. Repeat with `x^2+y^2` and explain why two positive eigenvalues change the classification.

## Exit ticket

Report the derivative error, the two Taylor errors, and the Hessian eigenvalue signs. If a finite-difference result changes after changing `h`, record that sensitivity instead of calling the analytical derivative wrong.
