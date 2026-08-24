# Guided demo: Tokenizers: BPE, WordPiece, SentencePiece

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can implement BPE, WordPiece, and Unigram tokenization algorithms from scratch and compare their merge strategies?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Implement BPE, WordPiece, and Unigram tokenization algorithms from scratch and compare their merge strategies.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/10-llms-from-scratch/01-tokenizers/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Implement BPE, WordPiece, and Unigram tokenization algorithms from scratch and compare their merge strategies**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Explain how vocabulary size affects model efficiency: too small creates long sequences, too large wastes embedding parameters**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Analyze tokenization artifacts across languages and code, identifying where specific tokenizers break down**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **use the tiktoken and sentencepiece libraries to tokenize text and inspect the resulting token IDs**. If the evidence is ambiguous, name the next measurement rather than claiming success.

