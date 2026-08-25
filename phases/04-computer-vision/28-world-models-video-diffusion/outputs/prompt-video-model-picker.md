---
name: prompt-video-world-model-review
description: Review temporal patch, action, and consistency contracts before evaluating a video model
phase: 4
lesson: 28
---

# Video World-Model Review

Record `(N,C,T,H,W)`, all three patch sizes, token grid, and whether axes divide exactly. For an
action-conditioned rollout, record `A`, `B`, action order, initial state, and number of predicted
steps. Compare generated clips with a declared consistency metric; do not turn a shape fixture into
a claim of physical plausibility or model quality.
