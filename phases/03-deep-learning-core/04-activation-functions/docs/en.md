# Activation Functions

> The activation decides both the signal a layer emits and the local derivative backpropagation sees.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Lesson 03.03 Backpropagation
**Time:** ~75 minutes

## Learning Objectives

- Implement sigmoid, tanh, ReLU, leaky ReLU, GELU, and Swish from scalar formulas.
- Derive and test each local derivative at representative pre-activations.
- Explain saturation and the dead-ReLU branch in terms of derivative values.
- Compute a stable softmax using a max shift.
- Compare activation choices on a deterministic circle fixture without claiming a benchmark.

## Functions and derivatives

The Python entry point uses `math.erf` for the exact GELU (x\Phi(x)). `sigmoid_derivative(x)` computes (sigma(x)(1-\sigma(x))), so it is `0.25` at zero and close to zero for large magnitudes. ReLU returns `max(0,x)` and uses derivative 0 at and below zero; leaky ReLU uses `alpha=0.01` on the negative branch. The derivative functions take the pre-activation, not the already transformed value.

`softmax((1000,999,998))` first subtracts 1000. The resulting exponentials are finite and their probabilities sum to 1. This max shift changes no probability because the same constant is removed from every logit.

```mermaid
flowchart LR
    Z[pre-activation z] --> F[activation f(z)]
    F --> Y[forward signal]
    Z --> D[local derivative f'(z)]
    D --> B[backward chain rule]
```

`gradient_scan` counts derivative values whose absolute magnitude is below `0.01`; that is a diagnostic threshold used by this fixture, not a universal definition of a dead neuron. `dead_neuron_detector` counts units that never fire over its generated sample set.

## Build It

Run `python3 main.py` from `code/`. It prints values at `-2,0,2`, the normalized `softmax([2,1,0])`, a seeded dead-neuron summary, and the first/last MSE for a 30-epoch ReLU circle run. `julia main.jl` provides the parallel standard-library experiment. The network accepts exactly two finite features and binary targets.

The implementation rejects empty/non-finite logits, invalid leaky-ReLU `alpha`, non-positive scan sizes, malformed network inputs, and empty training data. A seeded `ActivationNetwork` uses a local RNG, so constructing one does not alter the caller's random stream.

## Use It

1. Evaluate `relu(-2)`, `relu_derivative(-2)`, `leaky_relu(-2)`, and `leaky_relu_derivative(-2)`; record `0`, `0`, `-0.02`, and `0.01`.
2. Compare `sigmoid_derivative(0)` with `sigmoid_derivative(10)`. Explain the smaller second value as saturation, not as a failed forward computation.
3. Run `softmax((1000,999,998))` and check both finiteness and a sum of 1.
4. Train the seeded ReLU network on `make_circle_data(80)` for 30 epochs and report only the local MSE change; do not compare it to an unstated external run.

## Ship It

`outputs/prompt-activation-selector.md` records a selection procedure: use the stable output range and derivative behavior needed by the layer, then test a local fixture. It exposes no external model recommendation and treats the circle result as an illustration.

## Exercises

1. Use a central difference with `h=1e-5` to check `gelu_derivative(0.7)` against `gelu`; report the absolute error.
2. Feed logits `(1000,999,998)` to an unshifted softmax in a scratch function and observe overflow. Restore the max shift and explain why the result is unchanged mathematically.
3. Set every detector bias to a large negative value in a copy and predict the `dead` count before running `dead_neuron_detector`.
4. Add negative tests for `softmax(())`, `leaky_relu(1, alpha=0)`, and `ActivationNetwork(...).forward((1,))`.

## Reference Solution

At `x=-2`, ReLU has value and derivative zero, whereas leaky ReLU returns `-0.02` with derivative `0.01`. Softmax on `(1000,999,998)` remains finite and normalized because of the max shift. A central-difference check should agree with the analytical GELU derivative within numerical error. The seeded circle comparison reports a local MSE trajectory only; it does not establish a best activation globally.
