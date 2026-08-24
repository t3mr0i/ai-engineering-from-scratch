# Guided demo: Self-Attention from Scratch

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can implement scaled dot-product self-attention from scratch using only NumPy, including query/key/value projections and the softmax-weighted sum?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Implement scaled dot-product self-attention from scratch using only NumPy, including query/key/value projections and the softmax-weighted sum.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
rustc --edition 2021 phases/07-transformers-deep-dive/02-self-attention-from-scratch/code/main.rs -o /tmp/guided-demo && /tmp/guided-demo
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Implement scaled dot-product self-attention from scratch using only NumPy, including query/key/value projections and the softmax-weighted sum**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Build a multi-head attention layer that splits heads, computes parallel attention, and concatenates results**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Trace how the attention matrix captures token relationships and explain why scaling by sqrt(d_k) prevents softmax saturation**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **apply causal masking to convert bidirectional attention into autoregressive (decoder-style) attention**. If the evidence is ambiguous, name the next measurement rather than claiming success.

