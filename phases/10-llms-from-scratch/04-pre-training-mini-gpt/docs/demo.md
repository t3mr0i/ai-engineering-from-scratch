# Guided demo: Pre-Training a Mini GPT (124M Parameters)

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can implement the full GPT-2 architecture (124M parameters) from scratch: token embeddings, positional embeddings, transformer blocks, and the language model head?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Implement the full GPT-2 architecture (124M parameters) from scratch: token embeddings, positional embeddings, transformer blocks, and the language model head.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/10-llms-from-scratch/04-pre-training-mini-gpt/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Implement the full GPT-2 architecture (124M parameters) from scratch: token embeddings, positional embeddings, transformer blocks, and the language model head**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Train a GPT model on a text corpus using next-token prediction with cross-entropy loss**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Implement autoregressive text generation with temperature sampling and top-k/top-p filtering**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **monitor training loss curves and validate that the model learns coherent language patterns**. If the evidence is ambiguous, name the next measurement rather than claiming success.

