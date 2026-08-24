# Guided demo: Calculus for Machine Learning

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can compute numerical and analytical derivatives for common ML functions (x^2, sigmoid, cross-entropy)?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Compute numerical and analytical derivatives for common ML functions (x^2, sigmoid, cross-entropy).** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
julia phases/01-math-foundations/04-calculus-for-ml/code/main.jl
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Compute numerical and analytical derivatives for common ML functions (x^2, sigmoid, cross-entropy)**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Implement gradient descent from scratch to minimize a loss function in 1D and 2D**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Derive the gradient of a linear regression model and train it via manual weight updates**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **explain the Hessian matrix, Taylor series approximations, and their connection to optimization methods**. If the evidence is ambiguous, name the next measurement rather than claiming success.

