---
name: skill-gaussian-raster-handoff
description: Package projected Gaussian raster output with the conventions needed for review
version: 1.0.0
phase: 4
lesson: 22
tags: [gaussian, projection, alpha-compositing, camera]
---

# Gaussian Raster Handoff

Before sharing a raster from the lesson, attach:

- camera intrinsics `(fx, fy, cx, cy)` and image shape;
- projected means/covariances and the depth sort direction;
- colors/opacities, with opacity values in `[0,1]`;
- RGB image and residual transmittance arrays with their shapes.

The handoff describes this NumPy fixture. It does not claim a compressed scene format or a trained
renderer, so downstream users can choose storage after checking these invariants.
