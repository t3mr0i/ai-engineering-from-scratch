# Guided demo: Convolutions from Scratch

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can implement 2D convolution from scratch using only NumPy, including the nested-loop version and a vectorised `im2col` version?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Implement 2D convolution from scratch using only NumPy, including the nested-loop version and a vectorised `im2col` version.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/04-computer-vision/02-convolutions-from-scratch/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Implement 2D convolution from scratch using only NumPy, including the nested-loop version and a vectorised `im2col` version**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Compute output spatial size for any combination of input size, kernel size, padding, and stride, and justify the `(H - K + 2P) / S + 1` formula**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Hand-design kernels (edge, blur, sharpen, Sobel) and explain why each one produces the pattern of activations it does**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **stack convolutions into a feature extractor and connect the depth-of-the-stack to the size of the receptive field**. If the evidence is ambiguous, name the next measurement rather than claiming success.

