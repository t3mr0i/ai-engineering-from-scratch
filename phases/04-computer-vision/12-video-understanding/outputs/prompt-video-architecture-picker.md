---
name: prompt-video-architecture-picker
description: Choose temporal pooling, factorized convolution, or attention from the interaction requirement
phase: 4
lesson: 12
---

# Temporal architecture note

State whether the task needs only a summary of frame features, local temporal neighborhoods, or long-range ordering. Use `temporal_pool` for order-insensitive aggregation, a 2D-plus-1D factorization when local motion is enough, and a temporal attention design only when distant events must interact. Include the sampler, axes, parameter count, and leakage-safe split in the handoff.
