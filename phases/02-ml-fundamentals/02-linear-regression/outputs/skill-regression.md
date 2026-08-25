---
name: skill-regression
description: Choose and record a transparent regression baseline
phase: 2
lesson: 2
tags: [regression, least-squares, ridge, scaling]
---

# Regression baseline handoff

Record the target units, feature matrix shape, split seed, and whether each feature was standardized using training-only statistics.

## Selection

- Start with LinearRegression for an approximately straight relationship.
- Use LinearRegressionNormal for a small static scalar feature with nonzero variance.
- Use MultipleLinearRegression after checking row width and scaling.
- Add RidgeRegression when large correlated weights are a concern. The local alpha term is L2 and does not penalize the bias.
- Use PolynomialRegression only when validation evidence supports curvature; its feature builder emits x through x to the requested degree.

## Required evidence

Include the first and final values of cost_history, held-out MSE or R-squared, learned weights, bias, and the means/stds returned by standardize. Keep the seed beside the numbers. The lesson's noiseless fixture should recover w=3 and b=7; do not generalize that exact fit to noisy data.

## Failure checks

Reject empty or ragged matrices, mismatched X/y lengths, non-positive learning rates, and a constant x for the normal equation. These checks are part of the artifact contract.
