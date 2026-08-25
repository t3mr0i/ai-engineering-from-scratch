---
name: prompt-bayesian-reasoning
description: Walk through an auditable Bayes update using the local Python fixtures
phase: 1
lesson: 7
---

# Bayesian reasoning handoff

Ask for four named quantities before doing arithmetic: the prior `P(H)`, the likelihood `P(E|H)`, the false-positive path `P(E|not H)`, and the normalizer `P(E)`. Then evaluate `P(H|E) = P(E|H)P(H)/P(E)` and interpret the posterior in the original units.

Use the canonical medical fixture as a worked check: prior `0.0001`, sensitivity `0.99`, false-positive rate `0.01`, and posterior approximately `0.0098`. State that these are local illustrative values. For multiple tests, feed the previous posterior back as the next prior rather than multiplying posterior probabilities directly.

For text classification, use `NaiveBayes(smoothing=1.0)`. Explain that log priors and smoothed log likelihoods are added per class, then normalized only when probabilities are requested. Add-one smoothing gives an unseen word a positive probability; an untrained model or mismatched training arrays must be reported as a `ValueError`.

For Beta updates, add successes to alpha and failures to beta. Starting with `Beta(1,1)`, three successes and one failure produce `Beta(4,2)` with mean `4/6`. Sequential and batch updates should agree on the final parameters.
