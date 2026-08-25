# Feature Engineering

> Turn raw numbers, categories, and short documents into features a model can inspect without leaking the target.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02 Lessons 01–07 (basic models and validation)
**Time:** ~75 minutes

## Learning Objectives

- Apply `min_max_scale`, `standardize`, `log_transform`, and `bin_values` to a numeric column and state each output contract.
- Encode categorical values with `one_hot_encode` or `label_encode`, and explain why integer labels do not imply an order.
- Use smoothed `target_encode` only with training targets, keeping its category map for later rows.
- Build count and TF-IDF vectors and inspect the vocabulary and document-frequency effect.
- Select columns with `variance_threshold`, `correlation`, and `mutual_information` after missing values are handled.

## Why this matters

An estimator only sees the representation it receives. A house row from `make_housing_data` contains missing `sqft`/`age`, categories such as `neighborhood`, and a continuous `price`. The functions in `code/features.py` make each conversion explicit so a model does not silently mix units or learn from a future target.

## Build It

Run `python3 main.py` from `code/`. The fixture creates 200 housing rows, reports missing counts, imputes `sqft` with `impute_median` and `age` with `impute_mean`, then prints a standardized mean near `0`, a min–max range `[0, 1]`, five age bins, sorted neighborhood categories, and vocabulary sizes for five descriptions. The TF-IDF implementation uses `log(n_documents / document_frequency)`; a word present in both documents therefore receives zero IDF in the two-document check.

For a hand check, `min_max_scale([10, 20, 30])` returns `[0.0, 0.5, 1.0]`, while `standardize([1, 2, 3])` has zero mean and population standard deviation one. `polynomial_features([2, 3], degree=2)` returns `[2, 3, 4, 9, 6]`: originals, squares, then the cross term. Empty numeric vectors, mismatched supervised vectors, non-positive bin counts, ragged selection matrices, and negative or non-finite smoothing raise `ValueError`; `mutual_information` also requires a positive bin count. An empty document is represented by an all-zero TF-IDF row, while an empty document collection is rejected.

## Use It

Import `features` from `code/` and fit transformations on the training portion only. Save the `categories` returned by `one_hot_encode`, the `cat_to_int` map from `label_encode`, and the dictionary from `target_encode`; applying a separately learned map at inference changes columns. For text, save the vocabulary returned by `count_vectorize` or `tfidf`. `target_encode` is a supervised statistic, so calculating it on validation rows before the split is leakage even when smoothing is enabled.

## Ship It

The reusable handoff is `outputs/prompt-feature-engineer.md`. It specifies the canonical command, a small fixture, and acceptance checks for the range, category order, missing indicators, and TF-IDF vocabulary. It is a checklist for integrating these pure functions; it is not a claim that the toy housing data predicts real prices.

## Exercises

1. Run the canonical demo and record `sqft`'s missing count, its median fill, and the reported standardized mean. Explain which statistic came from the training-like fixture.
2. Evaluate `one_hot_encode(["suburbs", "downtown", "suburbs"])` and `label_encode` on the same input. State why the first preserves nominal semantics while the second is only a compact code.
3. Calculate `target_encode(["a", "a", "b"], [1, 1, 0], smoothing=1)`. Compare the smoothed value for `a` with its raw mean and identify the global mean used for shrinkage.
4. Add a document containing only a word already seen in every document. Check that its TF-IDF coordinate is zero and that the vocabulary remains deterministic.

## Reference Solution

A complete submission shows the canonical output and the hand checks above, keeps the training-only target map, and records the exact vocabulary/category order. The acceptance evidence is numerical: scaled values stay in `[0, 1]`, imputation removes `None`, the shared TF-IDF word has zero weight, and `variance_threshold`/`remove_correlated` return column indices. It does not infer model accuracy from feature construction alone.
