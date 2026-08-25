# Imbalanced Classification

> A 99% accuracy score can hide every positive error when the event of interest is rare.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02, Lessons 01–14
**Time:** ~85 minutes

## Learning Objectives

- Quantify class prevalence and compare accuracy with precision, recall, F1, and MCC.
- Generate SMOTE points only from minority training rows and inspect the interpolation.
- Balance a training set with random over/under-sampling or per-row class weights.
- Tune a probability threshold on validation data while keeping the test labels hidden.
- Validate binary labels, probability ranges, and shape contracts before fitting.

## The data contract

make_imbalanced_data(950, 50, seed=42) returns 1,000 two-dimensional rows,
with 950 label-0 points near the origin and 50 label-1 points near (2.5, 2.5).
The fixture is intentionally simple so the effect of resampling can be inspected.
The shuffled output is deterministic for a given seed; its first 80% is only a
demo split, not a claim of stratification.

All learning helpers use binary labels 0 and 1, a non-empty finite X matrix, and
matching row counts. A probability must be in [0, 1]. Invalid input raises
ValueError before a NumPy broadcasting error can obscure the contract.

## What each intervention changes

The always-negative baseline can achieve high accuracy while recall is zero.
Precision asks how many predicted positives are correct; recall asks how many
actual positives were found. F1 balances those two. MCC uses all four confusion
matrix cells and remains informative when the class counts differ.

random_oversample duplicates minority training rows until class counts match.
random_undersample discards majority rows to the minority count. Neither should
touch validation or test rows, and both require at least one row from each binary
class. A one-class sample cannot be made meaningfully balanced and is rejected.

SMOTE chooses a minority row, one of its k nearest minority neighbors, and a
uniform interpolation factor t. The synthetic point is x + t(neighbor-x).
With three minority points and k=2, every generated point lies on one of the
segments between those points. It is not a copy of a majority example and it
does not use test labels.

compute_class_weights gives each class weight n/(number_of_classes * class_count).
logistic_regression_weighted applies those row weights to its gradient. Threshold
tuning changes the decision rule after training; it does not change the fitted
weights. find_optimal_threshold sweeps 0.05 through 0.95 for F1, recall, or
precision and rejects unknown metric names.

Per-row weights may be zero when a caller intentionally masks a row, but their
finite total must be positive. A zero total would make both the gradient and the
reported weighted loss look valid while learning from no evidence.

## Build It

From code/, run python3 main.py. The output compares the majority baseline,
plain logistic updates, over/under-sampling, SMOTE, class weights, and a
validation-selected threshold. Read the test metrics against the original
unbalanced test rows. A compact SMOTE trace uses minority rows
[[2.0, 2.0], [3.0, 2.0], [2.0, 3.0]] and k=2; each synthetic coordinate must
remain within the corresponding minority range.

## Use It

Split before resampling. Fit the model and resampler on training folds only,
select a threshold on a validation fold, then report metrics on untouched test
rows. Choose recall when missed positives are expensive, precision when review
capacity is scarce, and MCC when one summary must include all confusion cells.
Record class prevalence beside every score; an AUPRC baseline is roughly the
positive prevalence for random ranking.

## Ship It

outputs/skill-imbalanced-data.md is the handoff checklist. A production note
must identify the positive class, prevalence, resampling location, threshold
selection split, primary metric, and the false-positive/false-negative action.
The local demo is a teaching fixture, not evidence for a medical or fraud
threshold.

## Exercises

1. Calculate accuracy for an all-negative predictor on 990 negatives and 10
   positives. Compare it with recall and MCC from compute_metrics.
2. Generate 12 SMOTE points from the three minority rows above. Verify shape,
   coordinate bounds, and deterministic output for seed=4.
3. Fit weighted logistic updates twice, once with uniform weights and once with
   compute_class_weights. Compare validation recall at threshold 0.5.
4. Sweep thresholds on validation probabilities for F1 and recall. Explain why
   using the test labels to choose the threshold would leak the evaluation.
5. Pass mismatched rows, label 2, a probability of 1.2, and metric='accuracy'.
   Record the explicit validation errors.

## Reference Solution

A correct submission keeps all resampling inside the training partition, shows
that SMOTE points interpolate minority neighbors, and reports prevalence plus
precision/recall/F1/MCC on untouched rows. The threshold is selected from a
validation vector and then frozen for the test report. The shipped checklist
states the operating cost and makes no accuracy-only claim.
