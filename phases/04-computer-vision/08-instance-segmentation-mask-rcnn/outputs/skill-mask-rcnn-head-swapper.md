---
name: skill-mask-head-contract
description: Review the geometry and target contract of an instance-mask head
version: 1.0.0
phase: 4
lesson: 8
tags: [computer-vision, instance-segmentation, masks]
---

# Instance-mask handoff

Before replacing a mask head, record:

1. The detector's absolute `xyxy` box units and the feature-map `spatial_scale`.
2. The RoI tensor shape `(C, output_height, output_width)` produced by `roi_align`.
3. Whether mask logits are per-instance and how they are resized into the box.
4. The target shape, BCE-with-logits convention, threshold, and mask IoU convention.

This artifact describes the local NumPy implementation. It does not download a checkpoint or provide framework-specific head-swapping code.
