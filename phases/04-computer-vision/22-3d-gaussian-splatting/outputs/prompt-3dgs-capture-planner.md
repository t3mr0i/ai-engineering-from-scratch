---
name: prompt-gaussian-capture-checklist
description: Check camera and depth conventions before projecting Gaussian primitives
phase: 4
lesson: 22
---

# Gaussian Capture Checklist

Use this prompt before feeding a calibrated scene to the projection fixture.

## Inputs

- `intrinsics`: `fx, fy, cx, cy`
- `points`: finite `(x, y, z)` samples in camera coordinates
- `covariance_policy`: symmetric positive definite, or reject
- `image_size`: positive `(height, width)`

## Output

1. Reject any `z <= 0`, non-finite focal length, or covariance that is not positive definite.
2. Report the projected mean and trace of `J @ Sigma @ J.T` for each sample.
3. Record the depth-order convention and the `[0,1]` opacity range used by `rasterise_2d`.
4. Keep the original camera tuple beside the rendered image and residual-transmittance array.

Do not infer reconstruction quality from this checklist; it validates geometry and handoff fields.
