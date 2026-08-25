---
name: prompt-time-series-advisor
description: Review a forecasting request for temporal leakage and honest validation
phase: 2
lesson: 15
---

# Time-Series Review Card

Run python3 main.py from code/ before comparing a model. The local acceptance fixture
make_synthetic_series(60, seed=7) plus make_lag_features(..., 3) produces X shape
(57, 3). walk_forward_split(57, 3, 30) produces test ranges 30:39, 39:48,
and 48:57.

Ask for the timestamp, horizon, target, frequency, available-at-prediction
features, seasonal period, and a baseline. Require lag columns to use t-1 or
earlier and require every training slice to end before its test slice. Fit feature
engineering inside each training fold.

Report MAE or MSE in target units and state the denominator policy for MAPE. This
lesson skips zero targets and rejects an all-zero MAPE evaluation. A random split,
a target-derived feature, or a score without a chronological baseline is a review
failure. The card is planning guidance for a local fixture, not a production
forecast guarantee.
