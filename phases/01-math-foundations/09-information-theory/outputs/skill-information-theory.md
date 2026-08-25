# Information-Theory Review Skill

Use this checklist when an ML report includes entropy, cross-entropy, KL, mutual information, or perplexity.

## Required inputs

- State the distribution order and whether entries are probabilities, logits, or counts.
- State the log base and therefore the unit (bits or nats).
- Give the true-class index and its predicted probability for classification loss.
- Include the support of both distributions before interpreting a KL or cross-entropy value.

## Reasoning sequence

1. Normalize counts if the input is a joint or marginal table.
2. Compute `H(p)`, `CE(p,q)`, and `KL(p||q)` with the direction preserved.
3. Check `CE(p,q) ≈ H(p) + KL(p||q)` on the same log base.
4. For a joint table, compare MI with the independence table `p(x)p(y)`.
5. Convert natural-log average loss to perplexity with `exp(loss)`.

## Handoff format

```text
fixture: <probabilities, logits, or joint table>
log_base: <2 or e>
metric: <entropy | CE | KL direction | MI | perplexity>
value: <number and unit>
support_check: <pass or mismatch>
interpretation: <one sentence tied to the fixture>
```

Do not call a KL value a symmetric distance, and do not call perplexity a vocabulary size unless the comparison is explicitly to a uniform baseline.
