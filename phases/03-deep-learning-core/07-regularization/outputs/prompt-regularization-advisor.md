---
name: prompt-regularization-advisor
description: Check regularization mode and normalization invariants on a controlled network
phase: 3
lesson: 7
---

# Regularization handoff

Record the input width, dropout probability, mode, and seed. In training, retained Dropout values are divided by `1-p`; in evaluation the vector is unchanged. Check that the backward mask matches the forward call. For weights `[3,-4]` and `lambda=0.1`, L2 returns `1.25` and gradient `[0.3,-0.4]` up to floating-point rounding.

Use BatchNorm for feature statistics across a nonempty batch, LayerNorm for features within one sample, and RMSNorm for scale-only normalization. Report the observed invariant (mean near zero for LayerNorm, RMS near one for RMSNorm) and keep the circle evaluation explicitly local.
