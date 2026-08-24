# Guided demo: Build Your Own Mini Framework

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can build a complete deep learning framework (~500 lines) with Module, Linear, ReLU, Sigmoid, Dropout, BatchNorm, Sequential, loss functions, optimizers, and DataLoader?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Build a complete deep learning framework (~500 lines) with Module, Linear, ReLU, Sigmoid, Dropout, BatchNorm, Sequential, loss functions, optimizers, and DataLoader.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/03-deep-learning-core/10-mini-framework/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Build a complete deep learning framework (~500 lines) with Module, Linear, ReLU, Sigmoid, Dropout, BatchNorm, Sequential, loss functions, optimizers, and DataLoader**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Explain the Module abstraction (forward, backward, parameters) and why train/eval mode toggling is necessary**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Wire all components into a working training loop that trains a 4-layer network on circle classification**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **map each component of your framework to its PyTorch equivalent (nn.Module, nn.Sequential, optim.Adam, DataLoader)**. If the evidence is ambiguous, name the next measurement rather than claiming success.

