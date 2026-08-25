# Bayes' Theorem

> Bayes' theorem turns a prior belief and observed evidence into a posterior you can audit.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lesson 06 (Probability and Distributions)
**Time:** ~75 minutes

## Learning Objectives

- Compute a posterior from a prior, a likelihood, and a false-positive rate.
- Implement sequential updates and explain why the previous posterior becomes the next prior.
- Build a smoothed log-space `NaiveBayes` classifier with class probabilities and top words.
- Compare MLE with Beta-prior MAP estimates and identify the effect of a stronger prior.
- Update a Beta-Binomial belief incrementally and check it against a batch update.

## Build It

The offline Python entry point is:

```bash
python3 main.py
```

The medical fixture uses prior `0.0001`, sensitivity `0.99`, and false-positive rate `0.01`. `bayes` computes `0.0098` (about `0.98%`) for `P(sick|positive)`, despite the strong test likelihood. This is the base-rate calculation, not a claim about a real diagnostic test. `sequential_bayes` applies the same likelihood twice, using the first posterior as the second prior.

The spam fixture trains `NaiveBayes(smoothing=1.0)` on six spam and six ham examples. It tokenizes with lowercase whitespace splitting, counts words, stores class totals, scores in log space, and normalizes with a max-shifted exponentiation in `predict_proba`. `top_words` reports smoothed class-conditional probabilities. The code has no network or model dependency.

The MLE/MAP fixture observes `7` heads in `10` flips. MLE is `0.7`; the `Beta(2,2)` MAP estimate is pulled toward `0.5`, and `Beta(10,10)` pulls more strongly. `beta_update` adds successes to alpha and failures to beta. The four batches in `sequential_update_demo` end at the same Beta parameters as one batch update.

## Use It

For any evidence, write the four quantities before calculating: `P(H)`, `P(E|H)`, `P(E|not H)`, and the normalizer `P(E)`. A posterior is not the same as a likelihood. With a rare prior, false positives from the much larger healthy population can dominate.

For `NaiveBayes`, add log priors and log smoothed likelihoods instead of multiplying many tiny probabilities. Add-one smoothing assigns an unseen word probability `(0+1)/(total_words+vocabulary_size)`; for `10` tokens and vocabulary size `5`, that is `1/15`. Empty or untrained inputs are explicit validation cases: mismatched training lengths, empty training data, and prediction before training raise `ValueError`.

## Ship It

`outputs/prompt-bayesian-reasoning.md` is a reusable calculation prompt. A good handoff asks for the hypothesis/evidence definitions, the prior, both likelihood paths, the normalizer, and the posterior. It should preserve the local fixture values and mark any population claim as an assumption rather than silently presenting it as a measured fact.

## Exercises

1. Recalculate the medical posterior from the three printed parameters and compare it with `bayes`.
2. Train the classifier on the bundled documents and compare `predict_proba("free money")` with `predict_proba("meeting tomorrow")`. Explain which word counts move the log score.
3. Compute the smoothed probability of an unseen word for the `10`-token, five-word vocabulary example and verify it is non-zero.
4. Start from `Beta(1,1)`, apply `beta_update(1,1,3,1)`, then compare its mean with `4/6`. Repeat the update in two batches and verify the parameters agree.

## Reference Solution

The medical posterior is approximately `0.0098`. Add-one smoothing gives `1/15` for the unseen word. `Beta(1,1)` plus three successes and one failure becomes `Beta(4,2)` with mean `4/6`; sequential and batch updates commute because both add the same counts. A trained classifier returns normalized probabilities from log scores, while an untrained classifier must raise the documented `ValueError`.
