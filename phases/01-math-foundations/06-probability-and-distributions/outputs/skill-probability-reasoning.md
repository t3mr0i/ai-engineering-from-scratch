---
name: skill-probability-reasoning
description: Choose and check probability calculations using the local PMF, PDF, sampling, and softmax fixtures
phase: 1
lesson: 6
tags: [probability, distributions, numerical-stability]
---

# Probability reasoning handoff

Start by identifying whether the outcome is discrete or continuous. Use PMF values for Bernoulli, categorical, and Poisson outcomes; use PDF values as densities for uniform and normal measurements. Record the support and parameters rather than treating a density at one point as a probability.

The canonical Julia run uses a seeded `MersenneTwister(42)`. Check `conditional_probability(4/52,12/52)=1/3`, the fair-die expectation `3.5`, and Poisson `P(X=0)=exp(-3)`. For a joint table, compute marginals with `joint_to_marginals` and compare each cell with the product of its marginals before calling `check_independence`.

For model outputs, subtract the maximum logit before exponentiating. `softmax([100,101,102])` must remain finite and sum to one; `cross_entropy_loss(logits, target_index)` is the negative log-softmax at the zero-based target. The artifact is intentionally a portable text report, not a plotting workflow or an external-package recommendation.
