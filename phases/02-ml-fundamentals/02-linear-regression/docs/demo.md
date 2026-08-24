# Guided demo: Linear Regression

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can derive the gradient descent update rules for mean squared error and implement linear regression from scratch?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Derive the gradient descent update rules for mean squared error and implement linear regression from scratch.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
julia phases/02-ml-fundamentals/02-linear-regression/code/main.jl
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Derive the gradient descent update rules for mean squared error and implement linear regression from scratch**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Compare gradient descent and the normal equation in terms of computational complexity and when to use each**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Build a multiple linear regression model with feature standardization and interpret the learned weights**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **explain how Ridge regression (L2 regularization) prevents overfitting by penalizing large weights**. If the evidence is ambiguous, name the next measurement rather than claiming success.

