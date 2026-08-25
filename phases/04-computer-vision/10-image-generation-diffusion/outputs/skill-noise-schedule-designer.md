---
name: skill-noise-schedule-designer
description: Record a diffusion schedule and its forward/reverse numerical contract
version: 1.0.0
phase: 4
lesson: 10
tags: [diffusion, schedules, sampling]
---

# Schedule handoff

Record `T`, beta endpoints, the first and last `alpha_bar`, and the accepted timestep interval `[0,T)`. Verify that `q_sample` follows the closed form and that a known noise vector reconstructs `x0`. Include the chosen model target (`epsilon`, `x0`, or velocity) before a training loss is interpreted.

For this lesson's reverse fixture, record `eta=0` explicitly. `ddim_step`
rejects positive, boolean, and non-finite `eta`; it does not invent a stochastic
noise term. Use a separate implementation when posterior variance noise is part
of the experiment.

This artifact covers the local NumPy equations. It does not select a U-Net, scheduler library, checkpoint, or image-quality metric.
