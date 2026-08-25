---
name: prompt-diffusion-sampler-picker
description: Choose a reverse-step policy from determinism and schedule requirements
phase: 4
lesson: 10
---

# Sampler choice

Ask whether the caller needs stochastic diversity or a repeatable regression. The local equation fixture accepts only `ddim_step(..., eta=0)` for deterministic stepping and requires `t > t_prev`; positive, boolean, or non-finite `eta` is rejected because there is no noise argument. A separate DDPM-style reverse implementation may add posterior variance noise at intermediate timesteps. In both cases report the schedule, prediction target, shape, and finite-value checks; do not infer visual quality from one trace.
