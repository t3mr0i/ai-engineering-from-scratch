---
name: prompt-depth-evaluation-plan
description: Choose raw versus aligned depth checks for a local prediction fixture
phase: 4
lesson: 26
---

# Depth Evaluation Plan

Declare whether absolute scale matters. Always record positive target depth, the validity mask,
AbsRel, and strict delta threshold. If scale is ambiguous, additionally record the fitted affine
parameters from `align_scale_shift`, but label aligned scores separately from raw scores. Include
camera intrinsics before exporting any point cloud; model selection is outside this offline artifact.
