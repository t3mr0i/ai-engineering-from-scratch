# Skill: Synthetic and Masked Test Data Governance

**One-page decision aid — paste into a project wiki or data-governance review.**
Phase 11 · 106 | Course: AI Test Data and Synthetic Data Governance (AI-45)

---

## 1. Origin control — do this before touching any data

| Question | Action if YES | Action if NO |
|---|---|---|
| Does the dataset contain direct identifiers (name, email, national ID)? | Remove or hash before any further step | Proceed |
| Does it contain quasi-identifiers (zip + age + occupation)? | Apply k-anonymity masking (K ≥ 5 for public release, K ≥ 3 for internal) | Proceed |
| Is the legal basis for use `legitimate interest` only? | Stop — legitimate interest does not cover model evaluation; get consent or anonymise | Proceed |
| Will the data leave the organisation's control (cloud bucket, contractor)? | Classify under GDPR Art. 5; document in the Annex IV technical record | Proceed |

---

## 2. Anonymisation technique selection

Choose the right technique for the sensitivity tier:

| Tier | Examples | Recommended technique | Limitation to document |
|---|---|---|---|
| Direct identifiers | Name, email, IBAN | Remove or replace with Faker | Faker values must be flagged as synthetic in the record |
| Quasi-identifiers | Age + zip + occupation | k-anonymity masking (K ≥ 3) | k < 5 is re-identifiable with 2–3 auxiliary attributes |
| Sensitive attributes | Health, political opinion | Synthetic generation only; no original values | LLM synthesis requires memorisation check (see §4) |
| No personal data at all | Code snippets, system logs | Use as-is; document provenance | Still requires leakage check (see §3) |

**Default recommendation:** Rule-based Faker generation for structured fields. LLM-based synthesis for natural-language edge cases — always run a memorisation check.

---

## 3. Leakage detection checklist

Run in this order (stop early if a check catches everything needed):

- [ ] **Step 1 — Exact-match hash check.** SHA-256 every evaluation record; compare against hashes of your training corpus. Flag any match. Fast; run on every dataset update.
- [ ] **Step 2 — 13-gram overlap score.** For each flagged and a random 10% sample of unflagged records, compute the fraction of 13-token shingles that appear in the training corpus. Flag records with score ≥ 0.30.
- [ ] **Step 3 — Membership inference (MIA).** For records you plan to headline in a published evaluation, prompt the model with the first half of the record and check whether it completes the second half verbatim. Threshold: ≥ 70% token accuracy is a positive signal. Use this step for models without log-probability access.
- [ ] **Quarantine rule.** Move any EXACT_MATCH or NGRAM_FLAG record to a separate stratum. Report it separately as "potentially contaminated" — do not silently discard it.
- [ ] **CI gate.** Leakage-free fraction must be ≥ 95% for the evaluation set to be used in a public benchmark or model comparison.

---

## 4. Coverage gate — minimum thresholds

| Dimension | Measurement | Pass threshold | Failure action |
|---|---|---|---|
| Size | n records | ≥ 200 for publication; ≥ 50 for internal CI | Expand synthetic generation |
| Label balance | Majority-class fraction | ≤ 80% | Oversample minority class |
| Length distribution | P90 token length | ≥ production P50 | Add longer synthetic examples |
| Adversarial examples | Fraction with negation / code-switching / long dependencies | ≥ 5% | Add targeted adversarial templates |
| Leakage-free fraction | From §3 | ≥ 95% | Quarantine flagged records |

Run coverage checks as a CI assertion on every dataset commit, not as a one-time review.

---

## 5. Documentation obligations (EU AI Act + ISO 42001)

For any AI system in the Act's conformance scope, the technical file must include:

- [ ] Dataset name, version, and origin (provenance chain).
- [ ] Sensitivity classification and legal basis for use.
- [ ] Anonymisation or synthesis technique applied, with parameters (K value, ε budget, seed).
- [ ] Leakage check results: method used, contamination scores, quarantine decisions.
- [ ] Coverage statistics at the time the dataset was locked for evaluation.
- [ ] Name of the responsible data steward and review date.

**Template record header:**

```
Dataset: eval-customer-sentiment-v2.1
Origin: synthetic (Faker + rule-based templates, seed 42)
Sensitivity: quasi-identifiers masked (k=5, age_band + region)
Legal basis: N/A — no personal data after masking
Leakage check: exact-match + 13-gram, 2026-06-22, clean fraction 97%
Coverage: n=500, majority 44%, adversarial 8%, length P90=22 tokens
Steward: <name> | Next review: 2026-12-22
```

---

## 6. Quick-reference: what each lever catches and misses

| Lever | Catches | Misses |
|---|---|---|
| Origin control | Purpose-limitation violations; missing legal basis | Leakage from downstream fine-tuning |
| k-anonymity masking | Re-identification via known quasi-identifier combinations | Inference attacks using external auxiliary data |
| Exact-match leakage check | Verbatim training-set copies | Paraphrases; near-duplicates; high-overlap reformulations |
| 13-gram overlap check | Near-duplicate and paraphrase contamination | Semantic similarity without token overlap |
| MIA | Memorised examples even without log-probability access | Low-confidence memorisation; model-specific failure modes |

No single check is sufficient. Run all three leakage steps for any dataset used in a published evaluation.
