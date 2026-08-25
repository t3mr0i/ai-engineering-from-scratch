---
name: skill-classification-baseline
description: Establish a transparent binary classification baseline
phase: 2
lesson: 3
tags: [classification, logistic-regression, threshold, metrics]
---

# Classification baseline handoff

Record the label convention (0/1), feature shape, split seed, training epochs, final BCE, and decision threshold. Keep threshold selection separate from fitting.

## Selection and measurement

Use LogisticRegression for a linear binary boundary and retain loss_history to show whether optimization moved in the expected direction. Report TP, TN, FP, FN, precision, recall, F1, and accuracy rather than accuracy alone. Lowering the threshold can increase recall while increasing false positives; select it on validation data with the domain cost in mind.

Use SoftmaxRegression when labels are integers from 0 through n_classes-1. Confirm each probability vector sums to one and record the feature width.

## Guardrails

Reject anything other than integer labels 0/1 for the binary class, including fractional values and strings; also reject wrong feature widths, thresholds outside [0,1], empty data, and ragged rows. Extreme logits are clipped before exponentiation and probabilities are clamped before logarithms. The local scores are fixture evidence, not a guarantee for a new population.
