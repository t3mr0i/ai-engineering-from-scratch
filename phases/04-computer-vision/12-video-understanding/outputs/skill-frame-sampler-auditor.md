---
name: skill-frame-sampler-auditor
description: Check temporal indices, repetition, seed, and leakage boundaries
version: 1.0.0
phase: 4
lesson: 12
tags: [computer-vision, video, sampling]
---

# Frame-sampling audit

Record `num_frames_total`, requested `T`, sampler type, seed, and the complete index vector. Check `0 <= index < total`, whether a dense clip is contiguous, and whether short sequences repeat only the last valid frame. For evaluation, record the video/scene/time split and verify that train and test index sets are disjoint.
