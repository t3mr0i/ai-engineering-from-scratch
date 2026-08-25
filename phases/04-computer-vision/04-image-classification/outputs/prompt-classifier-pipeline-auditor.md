---
name: prompt-classifier-pipeline-auditor
description: Audit a local image classifier's shape, loss, seed, and class-report evidence
phase: 4
lesson: 4
---

# Classifier pipeline audit

Ask for the output of `synthetic_cifar`, `image_features`, `train_linear_classifier`, and `confusion_matrix`. Check:

1. NHWC images are finite and labels are integer IDs in `[0, C)`.
2. Mean/std have three entries and positive standard deviations.
3. Extreme-logit softmax and cross-entropy are finite.
4. The seeded training history has a lower final loss than its first value.
5. The confusion matrix is square and its per-class report is interpreted separately from fixture accuracy.

The canonical command is `python3 main.py`. A local fixture result is not a CIFAR benchmark or a deployment calibration certificate.
