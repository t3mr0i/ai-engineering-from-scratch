"""Synthetic test-data governance simulator — stdlib Python.

Part 1: Synthetic record generator.
  - Produces a deterministic fake customer dataset from a schema.
  - Applies k-anonymity masking to quasi-identifiers.
  - Computes coverage statistics: label balance, token-length distribution,
    adversarial-example fraction.

Part 2: Leakage classifier.
  - Takes a candidate evaluation set and a simulated training corpus.
  - Runs exact-match (hash) and 13-gram overlap checks per record.
  - Emits per-record verdicts (CLEAN / EXACT_MATCH / NGRAM_FLAG) and an
    aggregate contamination score.

No network. No pip. No real user data. The point is to make the three-lever
governance policy (origin control, anonymisation, leakage detection) explicit
and executable.
"""

from __future__ import annotations

import hashlib
import math
import random
from dataclasses import dataclass, field
from enum import Enum


# ---------- Constants ----------

K_ANONYMITY = 3          # minimum group size for quasi-identifier masking
NGRAM_N = 13             # shingle size for leakage detection
NGRAM_THRESHOLD = 0.30   # contamination score above which a record is flagged
ADVERSARIAL_TARGET = 0.05  # minimum fraction of adversarial examples required

SEED = 42
rng = random.Random(SEED)


# ---------- Data shapes ----------

class Label(Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class LeakageVerdict(Enum):
    CLEAN = "CLEAN"
    EXACT_MATCH = "EXACT_MATCH"
    NGRAM_FLAG = "NGRAM_FLAG"


@dataclass
class SyntheticRecord:
    record_id: str
    text: str
    label: Label
    age_band: str       # quasi-identifier (generalised)
    region: str         # quasi-identifier (generalised)
    is_adversarial: bool = False

    def tokens(self) -> list[str]:
        return self.text.lower().split()

    def fingerprint(self) -> str:
        return hashlib.sha256(self.text.encode()).hexdigest()


@dataclass
class LeakageResult:
    record_id: str
    verdict: LeakageVerdict
    contamination_score: float
    reason: str


# ---------- Part 1: Synthetic record generator ----------

_POSITIVE_TEMPLATES = [
    "The system correctly identified the anomaly in the transaction log.",
    "Response latency dropped by 40 percent after the cache was enabled.",
    "The classifier achieved 94 percent precision on the hold-out set.",
    "All integration tests passed within the expected two-second window.",
    "Synthetic records matched the production length distribution closely.",
]

_NEGATIVE_TEMPLATES = [
    "The model failed to detect the injected adversarial suffix.",
    "Retrieval recall dropped sharply when the query contained negation.",
    "The pipeline timed out on inputs longer than 512 tokens.",
    "Label noise in the training set caused a 12-point F1 regression.",
    "No matching context was found in the knowledge base.",
]

_NEUTRAL_TEMPLATES = [
    "The batch job ran for 3 hours and 22 minutes.",
    "Configuration file was loaded from the default path.",
    "The index contains 1.4 million documents across 16 shards.",
    "Log rotation is set to a 7-day retention window.",
    "Dataset schema version 2.1 is backward-compatible with 2.0.",
]

_ADVERSARIAL_TEMPLATES = [
    # negation
    "The model did NOT fail — however, coverage was never verified.",
    # code-switching (English/German technical mix)
    "Die Pipeline war erfolgreich, but the Genauigkeit metric is misleading.",
    # long dependency
    "Although the evaluation harness, which was rebuilt last quarter after a "
    "compliance audit flagged the use of raw production logs, now produces "
    "clean reports, the underlying contamination issue was never resolved.",
]

_AGE_BANDS = ["18-34", "35-54", "55+"]
_REGIONS = ["DE-North", "DE-South", "AT", "CH"]


def _generalise_age(age_band: str) -> str:
    """k-anonymity: collapse 18-34 and 35-54 into a wider band when k < K."""
    # Simple illustration: widen the youngest band.
    if age_band == "18-34":
        return "Under 55"
    if age_band == "35-54":
        return "Under 55"
    return "55+"


def generate_synthetic_records(n: int = 18) -> list[SyntheticRecord]:
    """Generate n deterministic synthetic records with quasi-identifier masking."""
    records: list[SyntheticRecord] = []
    templates = (
        [(t, Label.POSITIVE, False) for t in _POSITIVE_TEMPLATES]
        + [(t, Label.NEGATIVE, False) for t in _NEGATIVE_TEMPLATES]
        + [(t, Label.NEUTRAL, False) for t in _NEUTRAL_TEMPLATES]
        + [(t, Label.NEGATIVE, True) for t in _ADVERSARIAL_TEMPLATES]
    )
    chosen = [templates[i % len(templates)] for i in range(n)]

    for i, (text, label, is_adv) in enumerate(chosen):
        age_raw = rng.choice(_AGE_BANDS)
        age_masked = _generalise_age(age_raw)
        region = rng.choice(_REGIONS)
        records.append(SyntheticRecord(
            record_id=f"R{i:03d}",
            text=text,
            label=label,
            age_band=age_masked,
            region=region,
            is_adversarial=is_adv,
        ))
    return records


def k_anonymity_report(records: list[SyntheticRecord]) -> dict[tuple, int]:
    """Return counts for each (age_band, region) quasi-identifier combination."""
    counts: dict[tuple, int] = {}
    for r in records:
        key = (r.age_band, r.region)
        counts[key] = counts.get(key, 0) + 1
    return counts


def coverage_report(records: list[SyntheticRecord]) -> dict[str, object]:
    lengths = [len(r.tokens()) for r in records]
    label_counts = {lbl: 0 for lbl in Label}
    for r in records:
        label_counts[r.label] += 1
    n = len(records)
    adv_fraction = sum(1 for r in records if r.is_adversarial) / n if n else 0.0
    majority_fraction = max(label_counts.values()) / n if n else 0.0
    lengths_sorted = sorted(lengths)
    p50_idx = int(0.50 * n)
    p90_idx = int(0.90 * n)
    return {
        "n": n,
        "label_counts": {k.value: v for k, v in label_counts.items()},
        "majority_class_fraction": majority_fraction,
        "adversarial_fraction": adv_fraction,
        "length_p50_tokens": lengths_sorted[min(p50_idx, n - 1)],
        "length_p90_tokens": lengths_sorted[min(p90_idx, n - 1)],
        "adversarial_coverage_ok": adv_fraction >= ADVERSARIAL_TARGET,
        "label_balance_ok": majority_fraction <= 0.80,
    }


# ---------- Part 2: Leakage classifier ----------

def ngrams(tokens: list[str], n: int) -> set[tuple]:
    return {tuple(tokens[i: i + n]) for i in range(len(tokens) - n + 1)}


def contamination_score(record_tokens: list[str], corpus_ngrams: set[tuple]) -> float:
    """Fraction of n-grams in the record that appear in the training corpus."""
    record_ng = ngrams(record_tokens, NGRAM_N)
    if not record_ng:
        return 0.0
    overlap = record_ng & corpus_ngrams
    return len(overlap) / len(record_ng)


def build_corpus_ngrams(corpus_texts: list[str]) -> set[tuple]:
    all_ng: set[tuple] = set()
    for text in corpus_texts:
        all_ng |= ngrams(text.lower().split(), NGRAM_N)
    return all_ng


# Simulated training corpus — contains some of our synthetic texts verbatim
# and some partial overlaps, mimicking real contamination patterns.
TRAINING_CORPUS = [
    # Exact copies of two evaluation records (contamination)
    "The system correctly identified the anomaly in the transaction log.",
    "The model failed to detect the injected adversarial suffix.",
    # High n-gram overlap with a third record
    "Response latency dropped by 40 percent after cache was enabled in prod.",
    # Unrelated text
    "Kubernetes orchestrates containerised workloads across cluster nodes.",
    "Feature flags allow incremental rollout to a subset of users.",
    "Observability requires metrics, logs, and distributed traces.",
    "A/B tests must be powered correctly to detect meaningful effect sizes.",
]


def classify_leakage(
    records: list[SyntheticRecord],
    corpus_ngrams: set[tuple],
    corpus_fingerprints: set[str],
) -> list[LeakageResult]:
    results: list[LeakageResult] = []
    for r in records:
        fp = r.fingerprint()
        if fp in corpus_fingerprints:
            results.append(LeakageResult(
                record_id=r.record_id,
                verdict=LeakageVerdict.EXACT_MATCH,
                contamination_score=1.0,
                reason="hash match — record found verbatim in training corpus",
            ))
            continue
        score = contamination_score(r.tokens(), corpus_ngrams)
        if score >= NGRAM_THRESHOLD:
            results.append(LeakageResult(
                record_id=r.record_id,
                verdict=LeakageVerdict.NGRAM_FLAG,
                contamination_score=score,
                reason=f"{score:.0%} of {NGRAM_N}-grams overlap training corpus",
            ))
        else:
            results.append(LeakageResult(
                record_id=r.record_id,
                verdict=LeakageVerdict.CLEAN,
                contamination_score=score,
                reason=f"{score:.0%} overlap — below {NGRAM_THRESHOLD:.0%} threshold",
            ))
    return results


# ---------- Driver ----------

def main() -> None:
    sep = "=" * 80
    print(sep)
    print("SYNTHETIC TEST-DATA GOVERNANCE SIMULATOR (Phase 11, Lesson 106)")
    print(sep)

    # ---- Part 1: Generate and report ----
    print()
    print("PART 1 — Synthetic record generation and coverage checks")
    print("-" * 60)
    records = generate_synthetic_records(n=18)

    print(f"  Generated {len(records)} synthetic records.")
    print()

    # k-anonymity
    qi_counts = k_anonymity_report(records)
    print(f"  k-anonymity check  (K = {K_ANONYMITY}):")
    any_below_k = False
    for (age, region), count in sorted(qi_counts.items()):
        status = "OK" if count >= K_ANONYMITY else "FAIL"
        if count < K_ANONYMITY:
            any_below_k = True
        print(f"    age={age:<9}  region={region:<10}  n={count}  [{status}]")
    print(f"  Result: {'FAIL — at least one group below K' if any_below_k else 'PASS — all groups >= K'}")

    # Coverage
    print()
    cov = coverage_report(records)
    print("  Coverage report:")
    print(f"    Total records         : {cov['n']}")
    print(f"    Label counts          : {cov['label_counts']}")
    print(f"    Majority-class frac   : {cov['majority_class_fraction']:.0%}  "
          f"[{'OK' if cov['label_balance_ok'] else 'FAIL — >80%'}]")
    print(f"    Adversarial fraction  : {cov['adversarial_fraction']:.0%}  "
          f"[{'OK' if cov['adversarial_coverage_ok'] else f'FAIL — below {ADVERSARIAL_TARGET:.0%} target'}]")
    print(f"    Length P50 / P90      : {cov['length_p50_tokens']} / {cov['length_p90_tokens']} tokens")

    # ---- Part 2: Leakage detection ----
    print()
    print("PART 2 — Leakage detection (exact-match + 13-gram overlap)")
    print("-" * 60)

    corpus_fingerprints = {
        hashlib.sha256(t.encode()).hexdigest() for t in TRAINING_CORPUS
    }
    corpus_ngrams = build_corpus_ngrams(TRAINING_CORPUS)
    leak_results = classify_leakage(records, corpus_ngrams, corpus_fingerprints)

    for lr in leak_results:
        flag = "*" if lr.verdict is not LeakageVerdict.CLEAN else " "
        print(f"  {flag} {lr.record_id}  {lr.verdict.value:<14}  score={lr.contamination_score:.2f}  "
              f"{lr.reason[:55]}")

    n_clean = sum(1 for r in leak_results if r.verdict is LeakageVerdict.CLEAN)
    n_exact = sum(1 for r in leak_results if r.verdict is LeakageVerdict.EXACT_MATCH)
    n_ngram = sum(1 for r in leak_results if r.verdict is LeakageVerdict.NGRAM_FLAG)
    clean_frac = n_clean / len(leak_results) if leak_results else 0.0
    max_score = max(lr.contamination_score for lr in leak_results)
    highest = next(lr for lr in leak_results if lr.contamination_score == max_score)

    print()
    print(f"  Summary: {n_clean} CLEAN / {n_exact} EXACT_MATCH / {n_ngram} NGRAM_FLAG")
    print(f"  Leakage-free fraction : {clean_frac:.0%}  "
          f"[{'OK' if clean_frac >= 0.95 else 'FAIL — below 95% target'}]")
    print(f"  Highest contamination : {highest.record_id}  score={max_score:.2f}  "
          f"({highest.verdict.value})")

    # ---- Headline ----
    print()
    print(sep)
    print("HEADLINE: three levers, each with an independent failure mode")
    print("-" * 80)
    print("  Lever 1 (origin control): all records are synthetic — no real PII.")
    print(f"  Lever 2 (k-anonymity):    {'PASS' if not any_below_k else 'FAIL'} at K={K_ANONYMITY}. "
          "Generalised age_band removes the most")
    print("                            common re-identification vector.")
    print(f"  Lever 3 (leakage):        {clean_frac:.0%} clean. {n_exact} exact-match "
          f"and {n_ngram} n-gram-flagged records")
    print("                            must be quarantined before publishing results.")
    print("  Coverage gate:            adversarial fraction "
          f"{'passes' if cov['adversarial_coverage_ok'] else 'FAILS — add adversarial examples'}.")


if __name__ == "__main__":
    main()
