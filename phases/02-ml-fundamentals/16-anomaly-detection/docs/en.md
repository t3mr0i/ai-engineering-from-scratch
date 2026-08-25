# Anomaly Detection

> An anomaly score is a screening signal; the response policy still needs context and review.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02, Lessons 01–09
**Time:** ~75 minutes

## Learning Objectives

- Compute point-wise Z-score and IQR flags from a multivariate NumPy matrix.
- Explain why a collective or contextual anomaly needs a different feature window.
- Trace an isolation tree's path length and reproduce its seeded forest score.
- Evaluate a detector with precision, recall, F1, and Precision@k instead of accuracy alone.
- Separate a clean normal-training period from the later rows used to assess alerts.

## The problem

An alert can mean a single impossible sensor value, a normal value in the wrong
context, or a suspicious sequence. The local implementation demonstrates point
and multivariate screening. It does not infer intent, assign a probability of
fraud, or replace an operator's response decision.

make_anomaly_data(n_normal=60, n_anomaly=6, n_features=2, seed=7) returns a
(66, 2) matrix and binary labels. make_multimodal_data(8, 2, seed=7) returns
(26, 2): three compact normal clusters plus two unusual rows. Both fixtures are
synthetic and reproducible; their thresholds are not production defaults.

## Three detectors

zscore_detect standardizes each feature with its training mean and standard
deviation, then uses the largest absolute coordinate as the row score. A
constant column contributes zero after its standard deviation is replaced with
one. threshold=3.0 means a coordinate must exceed three standard deviations.

iqr_detect computes Q1 and Q3 per feature. The usual upper fence is
Q3 + factor times (Q3-Q1), and the lower fence is analogous. A row is flagged
when any feature falls outside its fence. factor must be non-negative.

IsolationForest samples rows without replacement, grows seeded random partition
trees, and averages path lengths. A short path usually means the row was easy to
separate. anomaly_score maps that average to a screening score using the
isolation-forest c(n) correction. Scores are comparable within one fitted forest,
not calibrated across arbitrary datasets.

The implementation requires a non-empty finite two-dimensional matrix. Forest
parameters n_estimators and max_samples are positive, max_samples is at least
two, and anomaly_score/predict require fit first. Fitting a second time resets
the tree list and reuses the configured seed.

## Build It

From code/, run python3 main.py. It compares Z-score, IQR, and a 100-tree
IsolationForest on the 525-row fixture, then repeats the comparison on three
clusters. Inspect the printed Precision@25 table and do not treat it as a
threshold recommendation. A compact small run uses X, y = make_anomaly_data(60,
6, seed=7), then fits IsolationForest(n_estimators=8, max_samples=16, seed=7).
The resulting score vector has one finite value per row.

## Use It

Reserve a time window believed to be normal for fitting. Choose a threshold with
a validation set and document the expected alert volume, false-alarm cost, and
the operator action. For a ranked queue, choose k from the review capacity and
report Precision@k. For a contextual anomaly, add the relevant time or peer-group
features before calling one of these detectors.

## Ship It

outputs/skill-anomaly-detector.md is a method-selection checklist. A handoff must
state the training window, detector parameters, score threshold or k, labels used
for evaluation, and drift-monitoring plan. It must not claim that the synthetic
fixture proves recall on a real incident population.

## Exercises

1. Run the 60-normal/6-anomaly fixture. Compare threshold 2.0 and 3.0 for
   Z-score and record precision, recall, and the number of flagged rows.
2. Construct a five-row one-column matrix with one value above the IQR upper
   fence. Compute Q1, Q3, and the fence by hand, then compare the flag.
3. Fit two forests with the same seed and assert identical score vectors. Fit a
   third forest with another seed and describe why its partitions can differ.
4. Pass a matrix with a NaN, a one-dimensional list, and a pre-fit forest to the
   API. Record each ValueError or RuntimeError and explain why silent coercion
   would make an alert pipeline hard to audit.

## Reference Solution

The solution reports the exact fixture shapes, computes the IQR fence, and shows
that two seeded forests agree. It evaluates alerts with precision/recall/F1 and
Precision@k on labels that were not used as detector inputs. The shipped checklist
names a normal baseline, parameter values, review capacity, and a retraining
trigger; it does not call score 0.6 a universal anomaly probability.
