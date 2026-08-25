---
name: prompt-dit-shape-review
description: Review patch, time, and Euler-step choices for a local DiT-style experiment
phase: 4
lesson: 23
---

# DiT Shape Review

Given `image_shape=(N,C,H,W)`, `patch_size`, and `steps`, report:

1. whether both spatial axes divide evenly;
2. token shape `(N,(H/p)*(W/p),C*p*p)`;
3. the time embedding width (positive and even);
4. the reverse integration step `dt=1/steps` and its endpoint convention.

Keep model quality and framework choice separate from these executable shape/equation checks.
