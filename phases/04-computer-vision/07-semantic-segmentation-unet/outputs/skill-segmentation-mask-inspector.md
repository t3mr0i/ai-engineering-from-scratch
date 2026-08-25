---
name: skill-segmentation-mask-inspector
description: Report mask shapes, class support, IoU, and undefined classes for a semantic batch
version: 1.0.0
phase: 4
lesson: 7
tags: [computer-vision, segmentation, metrics]
---

# Mask inspector

Input integer prediction and target masks with shape `(N,H,W)` and `num_classes`. Call `iou_per_class`; report each finite IoU and mark `NaN` as “no union in this batch”. If raw logits are available, pass them in NCHW and confirm that argmax is the only conversion used for IoU.

Also report the class histogram and the image/mask shapes. Do not smooth or interpolate integer masks during a spatial transform. The local inspector deliberately omits boundary-F1 and connected-component claims that are not implemented by this lesson.
