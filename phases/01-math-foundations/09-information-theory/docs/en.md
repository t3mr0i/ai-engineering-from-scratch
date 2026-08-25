# Information Theory

> Turn probability tables into measurable uncertainty, mismatch, and model loss.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1, Lesson 06 (Probability and Distributions)
**Time:** ~50 minutes

## Learning Objectives

- Calculate information content and entropy in bits or nats.
- Decompose cross-entropy into true entropy plus KL divergence.
- Explain why KL divergence is non-negative but directional.
- Compute classification loss with stable softmax and relate natural-log loss to perplexity.
- Use a joint probability table to distinguish independence from dependence with mutual information.

## Why this matters

An ML loss is only useful when its units and failure modes are visible. This lesson keeps the distributions tiny: a fair coin, `p=[0.7,0.2,0.1]`, and two binary joint tables. The implementation in `code/information_theory.py` uses only `math` and `random`; there is no framework loss function hidden behind the examples.

## Core relationships

For an event with probability `p`, information content is `-log(p)`. The log base chooses the unit: base 2 gives bits and `math.e` gives nats. Entropy is the expected information content.

For a true distribution `p` and model distribution `q`:

```text
cross_entropy(p, q) = entropy(p) + kl_divergence(p, q)
```

`kl_divergence(p, q)` is non-negative, but swapping its arguments changes the question. If a class receives zero probability from `q` while `p` assigns it positive mass, the cross-entropy implementation returns infinity.

For classification, `cross_entropy_loss(true_class, logits)` first calls the stable `softmax`, subtracting the largest logit before exponentiation. With natural-log loss, `perplexity(loss)` returns `exp(loss)`.

Mutual information uses a joint table. The independent fixture
`[[0.25,0.25],[0.25,0.25]]` has MI zero; the diagonal-heavy table
`[[0.45,0.05],[0.05,0.45]]` has positive MI because the row changes the conditional distribution of the column.

## Build It

Run the canonical demo from the lesson's code directory:

```bash
cd phases/01-math-foundations/09-information-theory/code
python3 main.py
```

The output prints surprise for four events, entropy for four distributions, the cross-entropy/KL decomposition, a stable three-class loss, the negative-log-likelihood identity, and the two MI tables. The final sections use fixed seeds for a 1,000-example loss fixture and a 200-row feature-selection table.

The smallest inspectable calculation is:

```python
from information_theory import cross_entropy, entropy, kl_divergence

p = [0.7, 0.2, 0.1]
q = [0.6, 0.25, 0.15]
assert abs(cross_entropy(p, q) - (entropy(p) + kl_divergence(p, q))) < 1e-12
```

## Use It

Use `cross_entropy_loss(0, [2.0, 1.0, 0.1])` when class index `0` is the observed label. Compare it with class index `2`; the selected logit changes the loss while the logits and normalization stay fixed. For large logits such as `[1000.0,1001.0]`, inspect that every probability is finite and their sum is one.

For a feature-selection check, build a `2 x 2` count table, divide each cell by the sample count, and pass the resulting table to `mutual_information`. A constant feature has zero MI; a feature that flips the target only ten percent of the time should outrank a feature that flips it thirty-five percent of the time in the seeded demo.

## Ship It

The reusable artifact is [the information-theory reasoning skill](../../09-information-theory/outputs/skill-information-theory.md). It asks a model or reviewer to report the log base, support mismatches, direction of KL, and the exact target probability behind a classification loss. Keep those fields with an evaluation report rather than reporting a bare “loss improved” claim.

## Exercises

1. Change the `true_class` in the three-logit fixture to `1` and `2`. Record the selected probability and the natural-log loss for each class.
2. Replace the independent joint table with `[[0.5,0.0],[0.0,0.5]]`. Compute MI and explain why a zero cell is not a problem when its joint mass is zero.
3. Call `cross_entropy([1.0,0.0], [1.0,0.0])` and then `cross_entropy([1.0,0.0], [0.0,1.0])`. Record the finite versus infinite result and identify the support mismatch.

## Reference Solution

For the three logits, class `0` has the largest softmax probability and therefore the smallest loss; class `2` has the smallest probability and the largest loss. The independent table has MI `0`, while the diagonal table has positive MI because observing the row changes which column is likely. A zero-probability term contributes nothing when its true mass is zero, but a positive true mass paired with `q=0` makes cross-entropy infinite. The acceptance check is the decomposition identity to floating-point tolerance plus finite, normalized softmax output for `[1000,1001]`.

## Tests

```bash
python3 -m unittest discover tests -v
```

The seven tests cover log bases, entropy, the CE/KL identity, KL direction, MI independence, stable softmax/classification loss, and the joint-entropy chain rule.
