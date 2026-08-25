---
name: prompt-segmentation-task-picker
description: Choose and document a semantic-mask metric path from explicit tensor contracts
phase: 4
lesson: 7
---

# Segmentation task handoff

If each pixel receives only a category, use the semantic path in this lesson: logits `(N,C,H,W)`, integer masks `(N,H,W)`, pixel cross-entropy, Dice, and per-class IoU. If individual object IDs are required, stop and choose an instance-specific artifact; this local code does not create instance masks.

Record `num_classes`, image/mask alignment after resize, the `lam` used by `combined_loss`, and whether `iou_per_class` returned `NaN` for absent classes. A metric gate must state how undefined classes are excluded. The canonical local evidence is `python3 main.py` and the seeded shape fixture, not a deployment threshold.
