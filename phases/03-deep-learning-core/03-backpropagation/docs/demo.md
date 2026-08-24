# Guided demo: Backpropagation from Scratch

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can implement a Value-based autograd engine that builds a computational graph and computes gradients via topological sort?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Implement a Value-based autograd engine that builds a computational graph and computes gradients via topological sort.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/03-deep-learning-core/03-backpropagation/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Implement a Value-based autograd engine that builds a computational graph and computes gradients via topological sort**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Derive the backward pass for addition, multiplication, and sigmoid using the chain rule**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Train a multi-layer network on XOR and circle classification using only your from-scratch backpropagation engine**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **identify the vanishing gradient problem in deep sigmoid networks and explain why gradients shrink exponentially**. If the evidence is ambiguous, name the next measurement rather than claiming success.

