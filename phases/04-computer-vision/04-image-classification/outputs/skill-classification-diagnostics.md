---
name: skill-classification-diagnostics
description: Turn a confusion matrix into class-specific precision, recall, and F1 evidence
version: 1.0.0
phase: 4
lesson: 4
tags: [computer-vision, classification, metrics]
---

# Classification diagnostics

Input a finite, non-negative, square integer-count confusion matrix from `confusion_matrix`. `per_class_report` rejects empty, fractional, boolean, object, or non-finite matrices instead of coercing them. Report precision, recall, and F1 for every class. Preserve zero-support classes as zero-valued metrics in this local helper and state their support explicitly.

Pair the report with the transform seed, image feature shape, first/last training loss, and label range. A high score on the deterministic fixture only shows that the local linear head fits that fixture; it does not establish generalization, calibration, or data quality outside the inspected split.
