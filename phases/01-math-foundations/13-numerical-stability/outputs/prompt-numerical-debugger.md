# Numerical Debugger Prompt

Use this prompt when a loss, gradient, or activation becomes non-finite.

```text
fixture: <exact values, dtype simulation, and seed>
first_bad_operation: <softmax | log | variance | gradient | normalization>
naive_result: <value or exception>
stable_result: <value>
stabilization: <shift, epsilon, Welford, clipping, or branch>
acceptance_check: <isfinite/isclose/norm assertion>
```

Ask specifically:

- Could `exp` overflow or underflow before normalization?
- Are two large, nearly equal quantities being subtracted?
- Is the finite-difference step small enough to trigger roundoff?
- Does clipping preserve the intended direction or only component bounds?
- Is the denominator protected for a constant vector?

Keep the input and exact formula with the diagnosis; “numerical instability” alone is not a reproducible finding.
