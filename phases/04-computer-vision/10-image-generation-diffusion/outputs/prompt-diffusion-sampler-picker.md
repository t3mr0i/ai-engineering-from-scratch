---
name: prompt-diffusion-sampler-picker
description: Choose a reverse-step policy from determinism and schedule requirements
phase: 4
lesson: 10
---

# Sampler choice

Ask whether the caller needs stochastic diversity or a repeatable regression. For the local equation fixture, use `ddim_step(..., eta=0)` for deterministic stepping and record `t > t_prev`. A DDPM-style reverse mean may add posterior variance noise at intermediate timesteps. In both cases report the schedule, prediction target, shape, and finite-value checks; do not infer visual quality from one trace.
