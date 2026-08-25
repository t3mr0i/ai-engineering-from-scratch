# Decision Trees and Random Forests

> A split is useful only when its weighted child impurity is lower than the parent impurity.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 01 information theory and probability
**Time:** ~60 minutes

## Learning Objectives

- Compute Gini impurity, entropy, variance reduction, and information gain.
- Trace a numeric threshold split in the nested tree dictionary.
- Use max_depth and minimum-sample controls as pre-pruning boundaries.
- Explain bootstrap rows and random feature subsets as variance reduction.
- Treat feature importance as split evidence, not as a causal explanation.

## The split contract

DecisionTree enumerates midpoints between distinct values in each candidate feature. For classification it selects the largest information_gain; for regression it selects the largest variance_reduction. It stops at a pure node, the configured depth, too few samples, or a non-positive gain. A leaf stores a majority label or a numeric mean. tree, predict, and feature_importances_ expose the result without hiding the decisions behind a library.

RandomForest draws a bootstrap sample for each tree and defaults to a random subset of features (max_features="sqrt"). Its classifier votes across trees and its regressor averages. The local forest is intentionally small and deterministic when seed is set.

## Build It

Run python3 main.py. The seeded two-feature fixture uses the sign of x1+x2 as its local target, trains on 90 rows, and prints held-out tree accuracy, forest accuracy, and two feature-importance values. For the hand calculation, labels [0,0,1,1] have Gini 0.5; the split [0,0] | [1,1] has child impurity zero and therefore gain 0.5.

A depth-two tree fitted to X=[[0],[1],[2],[3]], y=[0,0,1,1] predicts class 0 for 0.5 and class 1 for 2.5. Inspect tree.tree to see the threshold.

## Use It

Use max_depth or min_samples_leaf when a tree is fitting noise. Inspect a held-out score instead of choosing the deepest tree because its training score is largest. Treat feature_importances_ as accumulated impurity reduction: a high-cardinality feature can receive many opportunities to split and the score is not a causal claim.

## Ship It

outputs/prompt-tree-interpreter.md is the handoff. Include the feature order, task type, pruning settings, seed, held-out score, and a serialized tree snapshot. A consumer should reject rows whose feature width differs from the fitted tree.

## Exercises

1. Calculate Gini and entropy for a pure node and for [0,1]; compare the result with the helper functions.
2. Fit max_depth=0 and max_depth=2 on the four-row fixture. Record the constant majority prediction versus the thresholded predictions.
3. Train a nine-tree forest with seed=3; verify that importances sum to one when the forest made at least one split.

## Reference Solution

The impurity calculations are 0 for a pure node and Gini 0.5 for [0,1]. A depth-zero tree emits the majority label for every row; depth two learns the threshold between the two classes. The forest returns a bounded accuracy and normalized importances. A correct handoff preserves feature order and does not present impurity importance as proof of causation.
