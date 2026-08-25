---
name: skill-imbalanced-data
description: Review a binary classification pipeline when positives are rare
phase: 2
lesson: 17
tags: [imbalanced-data, smote, class-weights, threshold-tuning, evaluation]
---

# Imbalanced-Data Review Card

Record class prevalence before selecting a metric. Compare the majority baseline
with precision, recall, F1, and MCC; accuracy alone can hide zero recall.

Split before resampling. Apply random over/under-sampling and SMOTE only inside
training folds; over/under-sampling require both binary classes to be present.
The lesson's SMOTE interpolates a minority row with one of its minority neighbors
and never reads validation/test targets. Use compute_class_weights when retaining
all majority rows is important.

Choose a threshold from validation probabilities for a stated objective such as
recall or precision, then freeze it for the untouched test report. Record the
positive class, review capacity, false-positive action, and false-negative action.
If row weights are supplied, zero weights are allowed only when the finite total
remains positive; a zero total is rejected rather than reported as zero loss.
The synthetic fixture and its thresholds are educational examples, not medical,
financial, or fraud policy.
