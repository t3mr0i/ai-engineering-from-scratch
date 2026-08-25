---
name: skill-anchor-designer
description: Check positive anchor widths and heights against the local encode/decode target contract
version: 1.0.0
phase: 4
lesson: 6
tags: [computer-vision, detection, anchors]
---

# Anchor contract inspector

For each anchor `(w,h)`, require finite positive values and the same pixel units as the boxes and stride. For a selected cell, run `encode` followed by `decode`; report the maximum coordinate error and the half-open center-cell condition (`0 <= offset < 1`). Run `assign_targets` and record which anchor wins width/height IoU. Treat a second box choosing an occupied cell/anchor slot as an explicit collision error, not a silent class merge.

This artifact reviews a deterministic local target assignment. It does not run k-means, choose a universal anchor set, or infer detector quality from one fixture.
