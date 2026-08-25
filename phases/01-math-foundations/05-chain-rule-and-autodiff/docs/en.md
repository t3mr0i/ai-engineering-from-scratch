# Chain Rule & Automatic Differentiation

> Reverse-mode autodiff is the chain rule organized around one scalar output.

**Type:** Build
**Languages:** Julia
**Prerequisites:** Phase 1, Lesson 04 (Calculus for Machine Learning)
**Time:** ~75 minutes

## Learning Objectives

- Trace a scalar computation graph and identify each local derivative.
- Implement reverse-mode propagation with a topological ordering of `Value` nodes.
- Handle overloaded arithmetic, powers, division, ReLU, tanh, exp, and log.
- Compare autodiff gradients with centered finite differences using `gradient_check`.
- Reset parameter gradients before training a small XOR MLP with the same engine.

## Build It

The canonical implementation is `code/main.jl`; `autodiff.py` is a readable standard-library reference. Run:

```bash
julia main.jl
```

The first fixture builds `y = relu(x1*x2 + 1)` with `x1=2` and `x2=3`. Its forward value is `7`, and the backward pass prints `dy/dx1=3` and `dy/dx2=2`. `Value` stores `data`, `grad`, `children`, an operation label, and a closure assigned to `backward!`. The closure for multiplication sends `out.grad*b.data` to `a` and `out.grad*a.data` to `b`.

`backward!` recursively visits children once, appends nodes in topological order, seeds the root gradient with `1`, and then walks the order backwards. This is why a shared intermediate receives contributions from every downstream path. ReLU sends no gradient when its output is non-positive; the local implementation deliberately uses `0` at the boundary.

The demo also checks `x^3` at `x=2` (`y=8`, derivative `12`), a composite ReLU expression, a single neuron, exp/log, and five gradient-check fixtures. The MLP section seeds `Random` with `42` and trains a `[2,4,1]` network on XOR for 100 steps; the exact loss trajectory is a local fixture, while the invariant is that parameters are updated only after gradients are reset and backpropagated.

## Use It

Build a scalar with `Value` and call `backward!` once. To inspect a graph, print each node's `data`, `op`, and `grad`; do not infer a derivative from a value alone. For a second backward pass on reused parameters, reset `grad` explicitly, just as `demo_mlp_training` does for every parameter.

`gradient_check(build_expr, 0.5)` evaluates the same expression at `0.5+h` and `0.5-h` and compares the centered slope with the reverse-mode result. A small absolute difference supports the implementation for that fixture; it is not a proof for every operation or input domain. `log` still requires a positive input, and division by a zero-valued `Value` remains undefined.

## Ship It

`outputs/skill-autodiff.md` is a debugging reference. A useful handoff shows a Mermaid graph or a plain node table, names the local derivative at each edge, and includes one finite-difference check. It should describe the local engine rather than claim framework compatibility or silently skip zero-gradient resets.

## Exercises

1. Trace `relu(Value(2)*Value(3)+1)` and write the two multiplication derivatives before running the demo.
2. Add a second use of a shared `Value` to an expression and verify that its gradient is the sum of both paths after `backward!`.
3. Run the gradient-check section and identify the expression with the largest printed difference. Explain whether the difference is a finite-difference tolerance or a derivative bug.
4. Change only the ReLU preactivation in the composite fixture from `4` to `-1`. Predict which input gradients become zero and verify the output.

## Reference Solution

For the first graph, `y=7`, `dy/dx1=3`, and `dy/dx2=2`. A shared node accumulates both downstream contributions because its `grad` is incremented, not overwritten. The gradient checker should report differences below its `1e-5` acceptance threshold for the listed expressions. A negative ReLU output has zero local derivative, so all gradients crossing that ReLU input are zero.
