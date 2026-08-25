---
name: prompt-lr-schedule-advisor
description: Review a learning-rate schedule by its step budget, endpoints, and observed local trace
phase: 3
lesson: 9
---

# Learning-rate review card

Record the total integer step budget, positive peak rate, non-negative floor, warmup length, and the behavior requested after the horizon. Evaluate the first step, the warmup boundary, the midpoint, and the final in-horizon step. Use a constant schedule as a control, step decay when discrete changes are intentional, cosine for smooth decay, warmup-plus-cosine when early updates need a ramp, and one-cycle when a deliberate rise-and-fall is part of the experiment. Reject negative steps, invalid horizons, non-finite rates, and a floor above the peak. Compare loss traces on the same fixture; do not turn one toy run into a universal optimizer claim.
