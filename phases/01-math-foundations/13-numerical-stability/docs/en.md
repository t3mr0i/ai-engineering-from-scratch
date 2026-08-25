# Numerical Stability

> Treat overflow, cancellation, and finite precision as explicit failure modes in the training loop.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 04–05 (calculus and autodiff)
**Time:** ~55 minutes

## Learning Objectives

- Stabilize softmax, log-sum-exp, sigmoid, and cross-entropy with algebraically equivalent formulas.
- Diagnose cancellation in variance and finite differences rather than tuning blindly.
- Compare value clipping with norm clipping and state which invariant each preserves.
- Explain the range/precision trade-off of simulated float16 and bfloat16 values.
- Use Welford variance, layer normalization, and finite checks as local debugging tools.

## Failure modes in the code

The naive softmax evaluates `exp(z)` directly. For logits near `1000`, it can overflow; for all very negative logits it can produce `0/0`. `softmax_stable` subtracts the maximum. `logsumexp_stable` uses the same shift, and `log_softmax_stable` feeds stable cross-entropy without materializing fragile probabilities.

Binary cross-entropy is implemented from logits with

```text
max(0, logit) - y_true*logit + log(exp(-max(0,logit)) + exp(logit-max(0,logit)))
```

The implementation also includes stable sigmoid branches, centered finite differences, norm/value clipping, `simulate_float16`, `simulate_bfloat16`, Welford variance, and epsilon-protected layer normalization.
`binary_cross_entropy_stable` requires `y_true` to be exactly `0` or `1`; it is not a soft-label or probability-target helper.

## Build It

Run the local diagnostic sequence:

```bash
cd phases/01-math-foundations/13-numerical-stability/code
python3 main.py
```

The output deliberately shows both a safe and an unsafe path: `softmax_naive([1000,1001,1002])` is not called as an assertion because the failure is expected, while the stable result is printed and checked. Later sections print a cancellation fixture around `1e8`, gradient checks, clipping, precision conversion, layer normalization, and common training-loop bugs.

Inspect the stable path directly:

```python
from numerical import cross_entropy_stable, logsumexp_stable, softmax_stable

logits = [1000.0, 1001.0, 1002.0]
assert sum(softmax_stable(logits)) == 1.0
print(logsumexp_stable(logits))
print(cross_entropy_stable(2, logits))
```

## Use It

Use Welford's online update when values have a large common offset and small spread. The local implementation returns population variance (dividing by `n`), while the statistics lesson separately exposes sample variance. Keep that denominator in an experiment record.

Use `clip_by_value` when component bounds are the contract; it can change direction. Use `clip_by_norm` when the direction should remain unchanged and only the total magnitude is capped. `layer_norm(values, epsilon=1e-5)` keeps a constant vector finite instead of dividing by zero.

The float-format helpers are simulations, not hardware measurements: float16 has a smaller exponent range, while bfloat16 preserves a wider range with fewer fraction bits. Report the input value and conversion function when discussing the result.

## Ship It

The reusable artifact is [the numerical-debugger prompt](../../13-numerical-stability/outputs/prompt-numerical-debugger.md). It requires a reproduction input, the first non-finite operation, the stabilized formula, and a finite-value assertion. That turns “training exploded” into a falsifiable diagnosis.

## Exercises

1. Compare stable softmax and stable log-sum-exp for `[800,801]` and `[800,801,802]`; record finite outputs and probability sums.
2. Compute a centered finite-difference derivative with `h=1e-5` and `h=1e-12` for `f(x)=x^2` at `x=2`. Explain the cancellation introduced by the smaller step.
3. Apply `clip_by_value([3,4],2)` and `clip_by_norm([3,4],2)`. Record each norm and explain which operation preserves direction.

## Reference Solution

Subtracting the maximum keeps the relative logits unchanged and returns a finite probability vector summing to one. The `h=1e-12` finite difference can lose significant digits because `f(x+h)` and `f(x-h)` round to nearly the same number. Value clipping returns `[2,2]` and changes direction; norm clipping returns `[1.2,1.6]` with norm 2 and preserves the 3:4 ratio. Acceptance checks use `math.isfinite`, `math.isclose`, and the explicit norm calculation.

## Tests

```bash
python3 -m unittest discover tests -v
```

Twelve tests cover stable softmax/log-sum-exp, logits cross-entropy, binary cross-entropy at both overflow directions and moderate logits, target validation, sigmoid branches, Welford cancellation, clipping, layer normalization, finite differences, and simulated format range.
