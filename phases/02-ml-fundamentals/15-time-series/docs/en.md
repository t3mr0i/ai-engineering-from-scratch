# Time Series Fundamentals

> Time order is part of the data: a useful forecast only uses information available at its timestamp.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02, Lessons 01–09
**Time:** ~75 minutes

## Learning Objectives

- Separate trend, seasonality, and residual variation with reproducible NumPy fixtures.
- Create lag features whose rows contain only observations from the past.
- Build expanding-window walk-forward folds without future rows in a training slice.
- Fit and forecast with the lesson's SimpleAR model and inspect its failure contracts.
- Choose MAE, MSE, or non-zero-target MAPE for a stated forecasting decision.

## Why the timestamp matters

For a row at time t, a feature computed from t+1 is not a feature; it is leaked
knowledge of the future. Randomly shuffling lagged rows can therefore produce an
optimistic score even when the model cannot reproduce it after deployment. This lesson
uses an expanding training window: each test slice begins exactly where its training
slice ends.

The demo uses two local fixtures. Calling make_synthetic_series(n=60, seed=7)
returns a one-dimensional array with shape (60,). Calling make_lag_features with
n_lags=3 returns X with shape (57, 3) and y with shape (57,); y[0] is series[3].
Column zero is series[t-1], column one is series[t-2], and so on.
make_seasonal_series(84, period=7, seed=7) adds a visible weekly component for
autocorrelation experiments.

## The core ideas

difference(series, order=1) returns consecutive changes and can be applied twice
to remove a quadratic trend. check_stationarity returns rolling means, rolling
standard deviations, and a deliberately simple boolean heuristic comparing the two
halves. It is a diagnostic, not an Augmented Dickey–Fuller test.

autocorrelation(series, max_lag=6) returns seven values, including lag zero. A
constant series has zero covariance in this implementation, so its returned scores
are zero rather than a fabricated correlation.

walk_forward_split(n_samples=57, n_splits=3, min_train=30) yields train/test
slices (0:30,30:39), (0:39,39:48), and (0:48,48:57). Every test slice is
non-empty and occurs after its training rows. SimpleAR(n_lags=3) solves a least
squares intercept plus three lag weights. It must be fitted before predict;
forecast appends each prediction to its rolling history.

MAE is in the target's units. MSE weights large misses more heavily. MAPE skips
zero targets and rejects an evaluation set containing only zeros, because a
percentage error has no denominator there.

## Build It

From code/, run python3 main.py. The output prints a stationarity comparison,
lag-10 matrix shape (390, 10) for the 400-point fixture, five walk-forward
folds, and a 20-step forecast. To trace the smallest useful path, import
make_synthetic_series, make_lag_features, and SimpleAR; fit on the first 30 rows
of the 60-point fixture and request a two-step forecast.

## Use It

Use the walk-forward slices for model selection, keeping a final chronological
holdout untouched. Select n_lags from domain seasonality and an ACF inspection,
then report fold-level MAE/MSE rather than only a pooled random score. If target
values can be zero, report MAE or MSE alongside MAPE and state how zero rows were
handled.

## Ship It

outputs/prompt-time-series-advisor.md is the handoff checklist. A shipped report
must name the timestamp, forecast horizon, lag columns, split boundaries, baseline,
metric, and whether each feature is known before prediction. It is a planning aid;
it does not prove that an AR model will outperform a seasonal-naive baseline.

## Exercises

1. Generate make_synthetic_series(60, seed=7), create three lags, and write down
   the first feature row and target. Check that no value from index 3 or later is
   present in that row's features.
2. Compare walk_forward_split(57, 3, 30) with a random permutation. Report the
   train/test index ranges and explain which random rows would be unavailable at
   the first forecast timestamp.
3. Fit SimpleAR(3) on the first 30 lag rows and forecast two steps. Repeat after
   changing only the seed to 8; explain why the learned coefficients and forecast
   need not match.
4. Evaluate mae, mse, and mape on y_true=[0, 2] and y_pred=[99, 1]. The zero
   target is skipped, so MAPE is 50 percent from the second row. Then evaluate
   an all-zero target vector and record the explicit ValueError rather than
   silently reporting NaN.

## Reference Solution

A correct submission records X.shape == (57, 3), uses the three expanding folds
with no overlap between a training suffix and an earlier test row, and shows that
SimpleAR.predict is called only after fit. The metric table includes units and
the MAPE policy: mixed zero/non-zero targets skip the zero rows, while an all-zero
target vector raises ValueError. The advisor handoff contains a chronological split and
an acceptance check against a seasonal-naive baseline; it does not claim that the
local synthetic fixture represents production demand.
