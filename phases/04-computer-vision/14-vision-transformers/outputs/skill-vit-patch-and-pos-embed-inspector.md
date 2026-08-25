---
name: skill-vit-patch-and-pos-embed-inspector
description: Audit a ViT input boundary, token geometry, and attention normalization
version: 1.0.0
phase: 4
lesson: 14
tags: [vision-transformer, patches, attention, numpy]
---

# ViT shape inspector

Use this skill before wiring a vision-transformer block to a new image source.
It checks tensor geometry and attention rows; it does not claim model quality.

## Checks

- Require finite NCHW images with non-empty axes.
- Require `patch_size` to be a positive integer dividing both `H` and `W`.
- Calculate `T = (H/P) * (W/P)` and record raw width `C*P*P`.
- After projection, require `tokens.shape == (N, T+1, D)` when a `[CLS]` token
  is used.
- Require `D % num_heads == 0` and record `head_dim = D / num_heads`.
- Check every attention row sums to one and every masked query retains a key.

## Example record

```text
input:       (2, 3, 32, 32)
patch_size:  8
patches:     (2, 16, 192)
tokens:      (2, 17, 24)
heads:       3
head_dim:    8
row_check:   max(abs(row_sum - 1)) <= 1e-12
```

If a check fails, preserve the exact shape and error message in the handoff.
That evidence distinguishes a data-layout bug from a later attention or model
training issue.
