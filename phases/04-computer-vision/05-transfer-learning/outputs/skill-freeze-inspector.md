---
name: skill-freeze-inspector
description: Report frozen versus trainable parameter counts and the local head update boundary
version: 1.0.0
phase: 4
lesson: 5
tags: [computer-vision, transfer-learning, parameters]
---

# Freeze inspector

Use `parameter_counts` with the declared backbone and head counts. With `freeze_backbone=True`, the expected trainable count is exactly the head count. Use `freeze_mask` when a flat parameter index list is available, and record the stage rates from `discriminative_lrs`.

The inspector should fail on zero/negative counts, out-of-range indices, nonfinite rates, or a non-boolean freeze flag. A successful report describes ownership; it does not claim a checkpoint was loaded or that a fine-tuned model will outperform a frozen head.
