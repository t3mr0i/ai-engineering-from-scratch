# Ensemble Methods

> Combine intentionally different mistakes: boosting changes the data emphasis, bagging averages resampled trees, and stacking learns a second-stage vote.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02 Lessons 02–10 (trees, regression, and bias/variance)
**Time:** ~95 minutes

## Learning Objectives

- Train a signed `DecisionStump` and use its weighted error to compute an AdaBoost coefficient.
- Explain why AdaBoost updates difficult examples instead of averaging independent fits.
- Build `SimpleRegressionTree` and `GradientBoostingScratch` for residual regression.
- Use `BaggingClassifier` to average bootstrap trees and distinguish variance reduction from bias reduction.
- Fit `StackingClassifier` with out-of-fold meta-features and inspect its final signed predictions.

## The local implementations

`code/ensembles.py` is a NumPy implementation. `make_classification_data` returns labels `-1` and `1`; `make_regression_data` returns a nonlinear continuous target. `DecisionStump.fit` scans each feature’s unique thresholds under a weight vector. `AdaBoostScratch` stores one stump and alpha per round, while `SimpleRegressionTree` recursively chooses the largest variance reduction.

## Build It

Run `python3 main.py` for a bounded 160-row AdaBoost fixture. The full source demos are available by running `python3 ensembles.py`, but the canonical path intentionally reports only a quick train/test comparison. For a hand check, a uniform weight vector sums to one before the stump fit; after a round, the AdaBoost weights are renormalized and `alpha = 0.5 * log((1-error)/error)`.

`GradientBoostingScratch` starts at the mean target, fits each tree to `y - current_pred`, and adds `learning_rate * tree_prediction`. `BaggingClassifier` draws bootstrap rows with a seeded `RandomState(42)` and predicts by the sign of the average tree outputs. Stacking first creates out-of-fold base predictions, trains a small tanh meta-learner, and then refits base models on all training rows.

## Use It

Keep the label convention consistent: the stump and AdaBoost code compare predictions to `-1/1`, not `0/1`. Compare a single tree’s MSE or signed accuracy with its ensemble counterpart on the same split. The toy fixture demonstrates algorithm mechanics; it does not establish a deployment benchmark or a universal ranking between bagging and boosting.

## Ship It

`outputs/prompt-ensemble-selector.md` chooses an ensemble from the observed error pattern, while `outputs/skill-ensemble-builder.md` records the fit/predict contract. Both artifacts name the seed, label convention, number of estimators, and metric. They deliberately point to the scratch classes rather than to a hidden estimator dependency.

## Exercises

1. Fit one `DecisionStump` and a five-round `AdaBoostScratch` on the same split. Record weighted stump error, the final alpha, and signed test accuracy.
2. Fit a depth-2 `SimpleRegressionTree` and a 12-tree gradient booster on `make_regression_data(80, n_features=3, seed=4)`. Compare training MSE against the mean-target baseline.
3. Set `n_estimators=4` in `BaggingClassifier` and verify that four trees are stored. Explain why the bootstrap rows need not be unique.
4. Build two small tree wrappers and pass them to `StackingClassifier(n_folds=4)`. Check that the meta-feature matrix has one column per base model and predictions remain in `{-1, 1}`.

## Reference Solution

The solution records the exact fixture seed and split, confirms one alpha per stump, shows lower training MSE than the mean baseline for the booster, and verifies four stored bagging trees. For stacking it identifies out-of-fold predictions as the training input for the meta-learner. No comparison to an external library is required or implied.
