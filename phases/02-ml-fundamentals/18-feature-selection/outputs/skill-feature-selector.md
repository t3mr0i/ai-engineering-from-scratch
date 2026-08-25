---
name: skill-feature-selector
description: Select and validate features without leaking held-out labels
phase: 2
lesson: 18
tags: [feature-selection, mutual-information, rfe, lasso, tree-importance]
---

# Feature-Selection Review Card

Fit every selector on training rows only. The lesson contract is a numeric binary
target with labels exactly 0 and 1; reject strings, fractional labels, and values
such as 2 before fitting. Start with variance_threshold for
constant columns, then compare discretized mutual information, RFE, L1, and tree
importance according to the model and compute budget.

Record the selector, parameters, selected names, mask width, and held-out metric.
MI depends on bin count; RFE repeats model fits; L1 can zero coefficients; tree
gain can be shared or biased among correlated/high-cardinality columns. None is a
causal-importance certificate.

Run python3 main.py from code/ and reproduce the 20-column fixture before writing
the card. Keep a separate final holdout and state whether the result comes from a
single split or cross-validation. Monitor feature drift after shipping.
