# Model Evaluation

> A score is useful only when the split, metric, and comparison match the decision you need to make.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 02 Lessons 01–08 (models, features, and validation basics)
**Time:** ~80 minutes

## Learning Objectives

- Produce deterministic train/validation/test partitions with `train_val_test_split` and check that no row is reused.
- Compare ordinary and stratified folds using `kfold_split` and `stratified_kfold_split`.
- Compute confusion-matrix metrics, ROC points, and trapezoidal AUC without a metrics library.
- Report MSE, RMSE, MAE, and R-squared with the correct regression baseline.
- Use `cross_validate` and `learning_curve` without touching the final test set during model selection.

## The evaluation contract

`code/evaluation.py` is a standard-library implementation; `code/main.py` runs the Python fixture and `code/main.jl` mirrors the split/metric ideas with Julia stdlib modules. `make_classification_data(120, seed=7)` feeds `SimpleLogistic`. The Python demo prints 72/24/24 row counts for the default 60/20/20 split, then reports test accuracy and ROC-AUC. Exact scores are fixture outputs, not universal benchmarks.

## Build It

Start with `train_val_test_split(X, y, seed=7)`. The returned order is `X_train, y_train, X_val, y_val, X_test, y_test`; with ten rows and ratios `0.6`/`0.2`, the groups contain 6, 2, and 2 rows. `kfold_split(11, k=4)` distributes every index to validation exactly once, with the final fold receiving the remainder. `stratified_kfold_split` does the same while assigning each class round-robin.

For classification, `confusion_matrix` returns `(tp, tn, fp, fn)`. On truth `[1, 1, 0, 0]` and prediction `[1, 0, 0, 0]`, that tuple is `(1, 2, 0, 1)`, so precision is `1.0`, recall `0.5`, and F1 is `2/3`. `roc_curve` sorts scores descending; `auc_roc([0, 1], [0.1, 0.9])` is `1.0`.

## Use It

Call `cross_validate` with a factory, not one already-fitted model, so every fold starts with fresh weights. Use `stratified=True` for class labels when fold prevalence matters. Select models using validation or fold scores, then fit once and call the test metrics exactly once. For regression, compare the learned model with `r_squared`'s mean-target baseline; a negative R-squared means the model is worse than that baseline.

## Ship It

`outputs/skill-evaluation.md` is the handoff artifact. It records split sizes, fold policy, metric definitions, and the rule that the test set is held out until the end. A consumer can reproduce the report with `python3 code/main.py` and substitute its own model factory; no package-specific scorer is assumed.

## Exercises

1. Run both entry points where the local runtime is available. Record the Python split sizes and the Julia function names that implement the same partition.
2. Build a four-row confusion matrix by hand and verify all four counts before calculating precision and recall. Explain why accuracy alone hides a missing positive class.
3. Pass scores `[0.1, 0.9]` for labels `[0, 1]`, then reverse the scores. Compare the AUC values and connect the change to ranking rather than a fixed threshold.
4. Run four-fold `cross_validate` twice with `lambda: SimpleLogistic(epochs=30)`. Confirm identical fold scores and explain why reusing a fitted model would invalidate the comparison.

## Reference Solution

The solution includes the observed Python split/metric output, the `(1, 2, 0, 1)` confusion tuple, AUC `1.0` for correctly ranked scores, and equal repeated cross-validation results. It names the untouched test set and reports regression metrics against a mean baseline. Julia is an equivalent stdlib path; if Julia is not installed, the source and test fixture can still be checked statically without claiming execution.
