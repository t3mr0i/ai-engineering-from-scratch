# Guided demo: Vectors, Matrices & Operations

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can build a Matrix class with element-wise operations, matrix multiplication, transpose, determinant, and inverse?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Build a Matrix class with element-wise operations, matrix multiplication, transpose, determinant, and inverse.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/01-math-foundations/02-vectors-matrices-operations/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Build a Matrix class with element-wise operations, matrix multiplication, transpose, determinant, and inverse**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Distinguish element-wise multiplication from matrix multiplication and explain when each applies**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Implement a single dense neural network layer (`relu(W @ x + b)`) using only the from-scratch Matrix class**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **explain broadcasting rules and how bias addition works in neural network frameworks**. If the evidence is ambiguous, name the next measurement rather than claiming success.

