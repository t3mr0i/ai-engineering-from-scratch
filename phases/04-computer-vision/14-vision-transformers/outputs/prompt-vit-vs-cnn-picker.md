---
name: prompt-vit-vs-cnn-picker
description: Choose a token or convolutional image path from measurable input constraints
phase: 4
lesson: 14
---

# Vision-backbone choice prompt

Use this prompt for a small architecture discussion. It produces a hypothesis
to test, not a benchmark claim.

## Request

```text
image_shape: (N, C, H, W)
patch_size: positive integer or none
detail_priority: coarse | fine
latency_priority: low | moderate | high
```

## Procedure

1. If the image axes are not divisible by the proposed patch size, reject that
   proposal or define an explicit padding policy before comparing models.
2. Calculate `T = (H/P) * (W/P)` and the attention matrix cost proxy `T*T`.
3. Prefer the local ViT path when global token interactions are worth that
   sequence cost and the input geometry is stable.
4. Prefer a convolutional path when locality, small spatial inputs, or edge
   efficiency is the primary constraint. The lesson does not measure either
   choice's accuracy or throughput.

## Handoff

Record the input shape, candidate patch size, token count, `T*T`, and the reason
for the recommendation. The local artifact can verify the proposed shapes with
`python3 code/main.py`; it cannot validate a pretrained model or data regime.
