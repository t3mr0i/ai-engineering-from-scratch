---
name: skill-linear-probe-runner
description: Evaluate frozen feature rows with a small linear classifier while keeping the encoder fixed
version: 1.1.0
phase: 4
lesson: 17
tags: [self-supervised, evaluation, linear-probe]
---

# Linear Probe Runner

Use a linear probe to ask whether a frozen representation contains information for a labelled task. The probe is an evaluation protocol, not a fine-tune.

## Inputs

- `features`: finite `(N,D)` tensor or array produced once by a frozen encoder.
- `labels`: length-`N` integer vector.
- `train_mask` and `validation_mask`: disjoint, non-empty masks created before training.
- `num_classes`: positive integer.

## Contract

1. Check finite feature rows, matching labels, and a non-empty split.
2. Freeze the encoder and cache features once; only a linear head may receive gradients.
3. Train the head on the training rows and report validation accuracy or the task's chosen metric.
4. Keep checkpoint name, split, seed, feature width, and number of updates beside the score.

```python
import torch

def validate_probe(features, labels, train_mask, validation_mask):
    if features.ndim != 2 or features.shape[0] == 0 or not torch.isfinite(features).all():
        raise ValueError("features must be a non-empty finite (N,D) tensor")
    if labels.ndim != 1 or labels.shape[0] != features.shape[0]:
        raise ValueError("labels must have one entry per feature row")
    if train_mask.sum() == 0 or validation_mask.sum() == 0 or torch.any(train_mask & validation_mask):
        raise ValueError("train and validation masks must be non-empty and disjoint")
```

## Report

```text
[linear probe]
  checkpoint:       <exact feature artifact>
  feature_shape:    (N,D)
  train_rows:       <count>
  validation_rows:  <count>
  metric:           <name=value>
  encoder_updated:  no
```

The phase-04 fixture demonstrates teacher centering and masking; it does not contain a labelled dataset or a pretrained checkpoint, so it cannot produce a transfer score by itself.
