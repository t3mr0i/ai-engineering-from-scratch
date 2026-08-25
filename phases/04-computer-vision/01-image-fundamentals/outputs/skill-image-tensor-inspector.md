---
name: skill-image-tensor-inspector
description: Inspect a NumPy image array without mutating it
version: 1.0.0
phase: 4
lesson: 1
tags: [computer-vision, preprocessing, tensors]
---

# Image tensor inspector

Given an array and an expected layout (`HWC` or `CHW`), report shape, dtype, finite range, and per-channel means. For a raw RGB array, compare the result with `inspect_image`; for a model input, verify that the channel axis is first and that `preprocess_imagenet` was applied exactly once.

## Acceptance checks

- HWC input has shape `(H,W,3)` and values in `[0,255]`.
- CHW input has shape `(3,H,W)` and finite values.
- A layout conversion round-trips with `np.array_equal`.
- A resize target is recorded separately from color and normalization transforms.
- Any ambiguity is reported as an error instead of guessed from a small dimension.

The local inspector is deliberately NumPy-only; it does not infer a backend, decode a file, or identify a model checkpoint from statistics.
