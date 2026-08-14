# Synthetic and Masked Test Data: Coverage, Leakage, and Governance (2026)

> The EU AI Act (Articles 10 and 11) and the GDPR (Art. 5(2) accountability principle and Art. 30 records of processing) require organisations to document the provenance and representativeness of every dataset used to develop or evaluate a conformance-listed AI system. At the same time, the most common reason AI test suites miss production bugs is not bad logic — it is training-data leakage: the model has already seen the test cases during pre-training or fine-tuning. By 2026 the standard engineering response is a two-layer strategy: replace or mask any personally-identifiable test data with synthetic equivalents, then run explicit leakage checks before publishing evaluation results. Both layers have known failure modes that a practitioner must handle deliberately.

**Type:** Learn
**Languages:** Python (stdlib — synthetic data generator + leakage classifier)
**Prerequisites:** Phase 11 · 10 (LLM evaluation), Phase 18 · 27 (Data provenance and training governance)
**Time:** ~45 minutes

## The Problem

Most AI evaluation pipelines inherit their test data from two sources: production samples with real users' data (convenient but legally problematic) and benchmarks pulled from the open internet (fast but likely contaminated). Neither is safe by default. Using real user data in a test harness that uploads results to a shared dashboard, stores logs unencrypted, or is accessible to contractors violates GDPR Article 5(1)(b) — purpose limitation — even when the intent is purely technical. Using public benchmarks without a contamination check conflates "the model has memorised this answer" with "the model can reason about this problem."

The engineering question is operational: given a test set I need to build today, how do I generate or transform data so it is representative enough to catch real regressions, private enough to meet data minimisation obligations, and uncontaminated enough that my evaluation numbers mean something? The answer is not one technique; it is a policy with three levers — data origin controls, anonymisation or synthesis, and leakage detection — each with a known blast radius when skipped.

## The Concept

### The three-lever policy

| Lever | What it controls | Failure mode when skipped |
|---|---|---|
| **Data origin control** | Where test records come from and under what legal basis | GDPR Art. 5 breach; model trained on purpose-limited data |
| **Anonymisation / synthesis** | PII removed or replaced before records reach test infrastructure | Data subject rights cannot be honoured; breach notification triggered |
| **Leakage detection** | Checks whether model training set overlaps with evaluation set | Inflated benchmark scores; model comparisons that do not generalise |

The levers are independent. You can have clean synthetic data that still leaks into training (if synthesis uses a model trained on the benchmark). You can have a leakage-free benchmark composed of real PII. Address each lever separately.

### Data origin controls

Before any data touches a test pipeline:

1. **Identify the legal basis.** GDPR Art. 6(1) lists six legal bases (a-f): consent, contract, legal obligation, vital interests, public task, and legitimate interests. For AI evaluation work, the ones that typically apply are consent, legitimate interest, or necessity for a public task. Evaluating a language model is not a legitimate interest that overrides data subject rights; it requires either consent or genuine anonymisation first.
2. **Classify sensitivity.** The ENISA "Data Pseudonymisation" guidelines (2022, updated 2025) define three tiers: direct identifiers (name, email, ID), quasi-identifiers (zip code + age + occupation), and sensitive attributes (health, political opinion). Each tier requires a different treatment before the data is usable for model evaluation.
3. **Record the provenance chain.** The EU AI Act Annex IV (technical documentation) requires a description of training and evaluation datasets, their origin, and the measures taken to ensure representativeness. The same record satisfies ISO/IEC 42001:2023 clause 8.4.

### Anonymisation, pseudonymisation, and synthesis — what each achieves

Practitioners collapse all three into "anonymised" and then discover the distinction in an audit.

| Technique | What changes | What remains | Risk |
|---|---|---|---|
| **Pseudonymisation** | Direct identifiers replaced by tokens | Quasi-identifiers intact; re-linkage possible with aux data | Not anonymous under GDPR; records still count as personal data |
| **k-anonymity masking** | Quasi-identifiers generalised so each record matches ≥ k others | Statistical relationships preserved | k < 10 is re-identifiable with 2–3 auxiliary attributes (Sweeney 2002) |
| **Differential privacy (DP) noise** | Calibrated noise added during synthesis; ε-budget controls linkage risk | Aggregate statistics accurate within ε bounds | High accuracy at low ε requires large n; small test sets lose utility |
| **LLM-based synthesis** | Model generates statistically plausible rows from a schema | No original records involved | Memorisation: model may reproduce training samples verbatim; must check |
| **Rule-based Faker generation** | Deterministic Faker / random generators from schema definitions | Full control over distribution | Distribution may not match production; explicit coverage check needed |

For evaluation datasets the practical recommendation is **Faker-style rule-based generation as the default**, with DP noise added when distributional fidelity matters. LLM-based synthesis is useful for generating natural-language edge cases (long inputs, code-switching, adversarial phrasing) but requires a memorisation check before use (see Phase 18 · 27).

### Leakage detection

Benchmark contamination is the 2026 equivalent of the train/test split error: it produces numbers that look good and do not transfer. Three detection strategies exist, each catching a different contamination shape:

**1. Exact-match overlap.** Hash every record in the evaluation set; check whether the same hash appears in the known training corpus. Cheap but misses paraphrases and near-duplicates.

**2. N-gram overlap (contamination score).** For each evaluation example, compute the fraction of its 13-grams that appear in a sample of the training text. Google's "Deduplication" paper (Lee et al., 2022) showed that removing 13-gram duplicates from C4 changed few-shot accuracy on downstream benchmarks by up to 9 points. A contamination score above 0.3 (30% of 13-grams shared) is a red flag.

**3. Membership inference attack (MIA).** Ask the model to complete the beginning of each evaluation example. If the model completes it verbatim at a rate clearly above what the same prompt produces on held-out examples of comparable difficulty (typically a 2–3x ratio in our experience), the example was likely in training. Shi et al. (2024) showed this works even for models that do not expose log probabilities, via token-by-token prediction confidence.

In practice: run exact-match first (fast), then 13-gram overlap on flagged cases, then MIA only on the cases you plan to headline. Flag any example above the threshold and remove it or quarantine it to a separate "potentially contaminated" stratum reported separately.

### Coverage checks

Synthetic data that does not cover the edge cases a production model will encounter is worse than no test data — it provides false confidence. Coverage checks are explicit assertions about the distribution of the test set, not just its size.

Minimum coverage dimensions for a language model evaluation set:

| Dimension | What to measure | Threshold (typical) |
|---|---|---|
| Length distribution | Token length deciles; flag if P90 < production P50 | Configurable |
| Language / script | Fraction of examples per BCP-47 tag | Match production locale distribution ± 10% |
| Label balance | Class frequency; flag majority-class > 80% | Task-dependent |
| Adversarial coverage | Presence of negation, code-switching, long dependencies | At least 5% of set |
| Leakage-free fraction | Fraction of examples passing leakage check | ≥ 95% |

The coverage check should run as a CI gate on every evaluation set update, not as a one-time review. The same tooling that generates synthetic data should generate coverage statistics as a side effect.

### Integration with the evaluation pipeline

This lesson is the entry point for the course; the downstream lessons handle the mechanics:

- **Phase 11 · 10** covers evaluation harnesses, metrics, and how to read benchmark numbers honestly.
- **Phase 18 · 27** covers training-data provenance and how the same leakage problem appears upstream (in fine-tuning data, not just in test sets).

The governance layer connects them: a test-data policy without a training-data policy produces contamination from the other direction (a clean test set evaluated against a model whose fine-tuning set overlaps the clean test set). Both policies must be maintained together.



## Further Reading

- [EU AI Act — Official text, Annex IV](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — Article 10 (data governance) and Annex IV (technical documentation requirements).
- [ENISA — Data Pseudonymisation: Advanced Techniques and Use Cases (2022)](https://www.enisa.europa.eu/publications/data-pseudonymisation-advanced-techniques-and-use-cases) — tiered sensitivity classification and re-identification risk analysis.
- [Lee et al. (2022) — Deduplicating Training Data Makes Language Models Better](https://arxiv.org/abs/2107.06499) — the 13-gram overlap study; contamination score methodology.
- [ISO/IEC 42001:2023 — AI Management System Standard](https://www.iso.org/standard/81230.html) — clause 8.4 on data management and documentation obligations.
- [Shi et al. (2024) — Detecting Pretraining Data from Large Language Models](https://arxiv.org/abs/2310.16789) — membership inference without log-probability access.
