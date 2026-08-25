# ML Pipelines

> Fit preprocessing once on training rows, then carry the learned state unchanged into inference.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02 Lessons 08–12 (features, evaluation, ensembles, and tuning)
**Time:** ~100 minutes

## Learning Objectives

- Fit `MedianImputer`, `StandardScaler`, and `OneHotEncoder` only on training data.
- Chain fit/transform objects with `TransformerPipeline` and a model with `FullPipeline`.
- Route numeric and categorical columns through `ColumnTransformerScratch` without a dataframe dependency.
- Handle unseen categories as all-zero one-hot columns and preserve output column order.
- Detect leakage by comparing a train-only transformer with one fitted on train plus test rows.

## The local data contract

`make_mixed_data` returns one-dimensional NumPy arrays under keys `age`, `income`, `score`, `city`, `plan`, and `target`. Numeric columns contain occasional `NaN`; categories are strings; the target is `0/1`. `train_test_split_dict` returns two dictionaries with the same keys and non-empty partitions. The scratch pipeline uses NumPy only and deliberately does not imitate a dataframe or estimator framework.

## Build It

`MedianImputer.fit` stores one `nanmedian` per numeric column, `StandardScaler.fit` stores `nanmean` and `nanstd` (replacing a zero standard deviation with `1.0`), and `OneHotEncoder.fit` stores sorted categories per column. All three reject transform-before-fit, shape mismatches, and all-NaN training columns. `FullPipeline.fit` transforms numeric and categorical blocks, horizontally joins them, and fits the supplied model. `predict` reuses those stored values; it never refits.

Run `python3 main.py` for the local demos, including leakage, unknown-category, cross-validation, experiment-log, and reproducibility checks. A useful small check is training `LogisticRegressionSimple` on `[[-2], [-1], [1], [2]]` with labels `[0, 0, 1, 1]`; its predictions should match the labels after enough iterations.

## Use It

Create a new `FullPipeline` for each cross-validation fold. Fit it on the fold’s training dictionary, then call `score` on the validation dictionary. `cross_validate_pipeline` requires `2 <= n_folds <= n_rows`; data dictionaries must have all six required keys, one-dimensional columns, and equal non-empty lengths. If production contains a city unseen during fitting, `OneHotEncoder(handle_unknown="ignore")` emits zeros for that categorical block while retaining the learned width. `handle_unknown="error"` instead raises `ValueError`. This is a defined fallback, not evidence that the new category is semantically harmless.

## Ship It

`outputs/prompt-ml-pipeline.md` specifies the data keys, numeric/categorical column lists, fit/transform boundary, seed, and a reproducibility check. The artifact is a deployment handoff for this local NumPy contract; it does not serialize Python objects or promise compatibility with another framework.

## Exercises

1. Split `make_mixed_data(40, seed=2)`, fit a `FullPipeline` on the training dictionary, and verify that test predictions have the test target length.
2. Fit `MedianImputer` on `[[1], [NaN], [5]]` and confirm that the stored replacement is `3`. Transform a new `NaN` without calling `fit` again.
3. Fit `OneHotEncoder` on `red/blue`, transform `green`, and record the all-zero row and unchanged two-column width.
4. Run `cross_validate_pipeline` twice with the same seed and compare the fold score lists. Explain which randomness is controlled by the seed and which model state is reset per fold.

## Reference Solution

The solution shows the fit-only median and scaler statistics, the fixed category width for an unseen value, test-shaped predictions, and identical seeded fold scores. It names the exact dictionary keys and accepts only scores in `[0, 1]`; it does not call a leaky preprocessing result or an external package.
