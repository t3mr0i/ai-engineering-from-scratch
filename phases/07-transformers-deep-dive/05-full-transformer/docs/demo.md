# Guided demo: The Full Transformer — Encoder + Decoder

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can derive the mechanism behind The Full Transformer — Encoder + Decoder from tensor operations?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Derive the mechanism behind The Full Transformer — Encoder + Decoder from tensor operations.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/07-transformers-deep-dive/05-full-transformer/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Derive the mechanism behind The Full Transformer — Encoder + Decoder from tensor operations**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Implement the core component without relying on a transformer framework**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Trace tensor shapes and information flow through the implementation**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **evaluate the computational and modeling trade-offs introduced by The Full Transformer — Encoder + Decoder**. If the evidence is ambiguous, name the next measurement rather than claiming success.

