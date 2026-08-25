# Feature Selection

> A selected feature is evidence from a training procedure, not a permission to inspect the test set.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02, Lessons 01–14
**Time:** ~90 minutes

## Learning Objectives

- Remove constant or near-constant columns with a variance filter.
- Estimate discretized mutual information and explain why it can see nonlinear dependence.
- Compare RFE, L1 sparsity, and tree impurity importance by their fitting cost and bias.
- Fit selection on training rows and apply the chosen mask to held-out rows.
- Validate feature widths, label counts, optimizer parameters, and selected-column masks.

## A controlled fixture

make_feature_selection_data(500, seed=42) returns 20 columns: five informative
columns, five correlated combinations, and ten noise columns. The binary target
depends on x1, x2, and x3 plus Gaussian perturbation. Use the first 80% for
selection and evaluation of the local demo; a real experiment should use folds.

The implementation accepts non-empty finite two-dimensional X and a matching
finite binary y whose numeric labels are exactly 0 and 1. Strings, fractional
labels, and values such as 2 are rejected before any logistic, MI, RFE, L1, or
tree calculation. Parameter checks also reject an empty bin count, a non-positive
learning rate, an impossible requested feature count, or a mask that selects no
columns.

## Methods

variance_threshold computes a column variance and retains values strictly
greater than threshold. A constant column therefore has variance zero and is
removed with any positive threshold.

mutual_information discretizes one feature into equal-width bins and sums
P(x,y) log(P(x,y)/(P(x)P(y))) over non-zero joint cells. Equal-width bins make
the estimate easy to inspect, but the value depends on n_bins and sample size.
It is a ranking aid, not a calibrated population quantity.

RFE repeatedly fits the small logistic scorer, removes the smallest absolute
weight, and returns a boolean mask plus integer ranks. L1 selection applies a
soft-threshold after each gradient step, so some weights can become exactly zero.
Both are model-dependent. tree_importance bootstraps rows and accumulates Gini
impurity gains; correlated or high-cardinality columns can share or attract gain.

## Build It

From code/, run python3 main.py. It prints the 500-by-20 fixture, variance and
mutual-information rankings, RFE/L1 masks, tree importances, and held-out
accuracy comparisons. To inspect a tiny path, call discretize on [0,1,2,3] with
n_bins=2; the result is [0,0,1,1]. Then call mutual_information on a finite
matrix with a matching binary target.

## Use It

Fit the selector inside each training fold. Reuse only its learned mask,
threshold, bins, or weights on validation rows. Compare an all-feature baseline
with the selected model using the same held-out rows. When correlated features
are interchangeable, record the selected name and the stability of that choice
rather than treating one arbitrary representative as causal.

## Ship It

outputs/skill-feature-selector.md is the decision card. A handoff lists the
training partition, method and parameters, selected names, held-out metric, and
the leakage boundary. It should state whether a mask is a filter, wrapper,
embedded, or tree-based result and should not claim generalization from one
synthetic split.

## Exercises

1. Build the 500-row fixture and identify constant columns in a modified copy
   where one column is set to 3.0. Check that variance_threshold removes it.
2. Compute mutual information with n_bins=2 and n_bins=10. Explain why the
   numerical rankings can change even though the rows did not.
3. Run RFE to five columns and L1 selection with alpha=0.05. Record masks,
   ranks, and the number of logistic fits.
4. Compare tree_importance with seeds 42 and 43. Report which correlated
   columns exchange gain and why this is not a proof of feature causality.
5. Attempt a mismatched y, n_features_to_select=0, and an all-false mask.
   Record each ValueError and keep held-out targets out of selection.

## Reference Solution

A complete solution reports the 20-column fixture, uses training-only selection,
and gives a mask plus parameters for every method it compares. It explains the
dependence of MI on discretization, RFE's repeated fits, L1's zero coefficients,
and tree gain bias. The output card names a held-out score and explicitly limits
the conclusion to the local split.
