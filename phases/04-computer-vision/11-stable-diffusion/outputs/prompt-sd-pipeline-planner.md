---
name: prompt-sd-pipeline-planner
description: Record component ownership and latent contracts before a diffusion integration
phase: 4
lesson: 11
---

# Offline pipeline plan

Record the image `(N,C,H,W)`, downsampling factor, latent channels, conditioning source, scheduler sequence, and safety decision owner. Mark each item as a local fixture, an external checkpoint contract, or not implemented. For this lesson, the accepted smoke test is a finite latent shape, a guidance tensor with matching shape, and a reproducible manifest—not an image file.
