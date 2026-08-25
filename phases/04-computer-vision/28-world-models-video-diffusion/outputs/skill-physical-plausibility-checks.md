---
name: skill-video-consistency-checks
description: Check video shape, temporal continuity, and declared rollout state before review
version: 1.0.0
phase: 4
lesson: 28
tags: [video, world-model, temporal, consistency]
---

# Video Consistency Checks

1. Verify predicted and target clips have equal finite five-dimensional shapes.
2. Verify temporal patching reconstructs every frame; reject an indivisible remainder.
3. Record per-step states and actions for a dynamics rollout.
4. Report MSE with the patch convention and transition matrices attached.

These checks identify representation or handoff errors. They are not a physics simulator and do not
certify generated content as realistic.
