---
name: prompt-tracker-contract-review
description: Compare tracker lifecycle choices against a declared IoU and dropout contract
phase: 4
lesson: 27
---

# Tracker Contract Review

Record box format `xyxy`, IoU threshold, maximum missing-frame age, and whether a motion or
appearance model exists. For this lesson, require monotonic frame IDs, deterministic one-to-one
association, explicit new IDs, and a stale-track rule. Do not infer occlusion robustness from an
IoU-only fixture.
