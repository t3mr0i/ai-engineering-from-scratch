---
name: prompt-optimizer-selector
description: Inspect a first-order update and its state before tuning a learning rate
phase: 3
lesson: 6
---

# Optimizer handoff

Start with the one-parameter quadratic `(x-3)**2`. Record the learning rate, gradient sign, and parameter width. SGD is the transparent baseline; momentum adds a velocity; Adam adds bias-corrected first and second moments; AdamW uses `p_new = p_old - lr*adam_direction - lr*weight_decay*p_old`, keeping the decay term decoupled from the adaptive direction.

Every run must state whether optimizer state is new or resumed. Call `reset_state()` before reusing an optimizer for a different parameter width. The lesson's ten-step losses only demonstrate update mechanics; they are not a universal optimizer ranking.
