"""Data readiness assessment engine — stdlib Python.

Part 1: DataSource dataclass + score_source() function.
  Maps five dimensions (quality, freshness, sensitivity, provenance,
  evaluation coverage) onto a 0-1-2 score each, sums to a total out of 10,
  and returns a verdict: STOP (<6), CONDITIONAL (6-7), or PROCEED (8-10).
  The scoring rules encode the decision policy described in the lesson.

Part 2: main() driver.
  Runs three representative data sources through the gate and prints a
  structured report: per-dimension score, blocking dimension if any, total
  score, and verdict. Ends with a HEADLINE summary.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------- Enums for dimension values ----------

class LabelAccuracy(Enum):
    """Fraction of records correct for the task (from a manual sample audit)."""
    HIGH = "high (>=95%)"
    MEDIUM = "medium (80-94%)"
    LOW = "low (<80%)"


class FreshnessLag(Enum):
    """Combined ingestion lag + TTL vs. the query-lag budget."""
    WITHIN_BUDGET = "within_budget"
    MARGINAL = "marginal (TTL near budget)"
    OVER_BUDGET = "over_budget"


class SensitivityLevel(Enum):
    """PII / confidentiality exposure."""
    NONE_DETECTED = "none detected"
    INDIRECT_RISK = "indirect risk (pseudonymised or re-identifiable)"
    PII_PRESENT = "pii present"


class ProvenanceStatus(Enum):
    """Origin, chain of custody, and license known and cleared."""
    CLEAN = "clean (documented, license cleared)"
    PARTIAL = "partial (origin known, license unconfirmed)"
    UNKNOWN = "unknown or prohibited"


class EvalCoverage(Enum):
    """Held-out eval set represents production query distribution."""
    REPRESENTATIVE = "representative (production-sampled or validated synthetic)"
    WEAK = "weak (expert-authored, not from production logs)"
    MISSING_OR_CONTAMINATED = "missing or contaminated (overlaps training corpus)"


# ---------- DataSource ----------

@dataclass
class DataSource:
    name: str
    label_accuracy: LabelAccuracy
    freshness_lag: FreshnessLag
    sensitivity: SensitivityLevel
    provenance: ProvenanceStatus
    eval_coverage: EvalCoverage
    notes: str = ""


# ---------- Scoring ----------

VERDICT_THRESHOLDS = {
    "PROCEED":     (8, 10),
    "CONDITIONAL": (6,  7),
    "STOP":        (0,  5),
}


def _score_label_accuracy(v: LabelAccuracy) -> int:
    return {
        LabelAccuracy.HIGH:   2,
        LabelAccuracy.MEDIUM: 1,
        LabelAccuracy.LOW:    0,
    }[v]


def _score_freshness(v: FreshnessLag) -> int:
    return {
        FreshnessLag.WITHIN_BUDGET: 2,
        FreshnessLag.MARGINAL:      1,
        FreshnessLag.OVER_BUDGET:   0,
    }[v]


def _score_sensitivity(v: SensitivityLevel) -> int:
    return {
        SensitivityLevel.NONE_DETECTED:  2,
        SensitivityLevel.INDIRECT_RISK:  1,
        SensitivityLevel.PII_PRESENT:    0,
    }[v]


def _score_provenance(v: ProvenanceStatus) -> int:
    return {
        ProvenanceStatus.CLEAN:             2,
        ProvenanceStatus.PARTIAL:           1,
        ProvenanceStatus.UNKNOWN:           0,
    }[v]


def _score_eval_coverage(v: EvalCoverage) -> int:
    return {
        EvalCoverage.REPRESENTATIVE:           2,
        EvalCoverage.WEAK:                     1,
        EvalCoverage.MISSING_OR_CONTAMINATED:  0,
    }[v]


@dataclass
class Assessment:
    source_name: str
    scores: dict[str, int]
    total: int
    verdict: str
    blocking_dimension: str | None


def score_source(ds: DataSource) -> Assessment:
    """Score a DataSource across all five dimensions and return an Assessment."""
    scores = {
        "quality":      _score_label_accuracy(ds.label_accuracy),
        "freshness":    _score_freshness(ds.freshness_lag),
        "sensitivity":  _score_sensitivity(ds.sensitivity),
        "provenance":   _score_provenance(ds.provenance),
        "eval_coverage": _score_eval_coverage(ds.eval_coverage),
    }
    total = sum(scores.values())

    # Verdict
    if total >= 8:
        verdict = "PROCEED"
    elif total >= 6:
        verdict = "CONDITIONAL"
    else:
        verdict = "STOP"

    # The first zero-scored dimension is the blocking one (most urgent)
    blocking = next(
        (dim for dim, s in scores.items() if s == 0), None
    )

    return Assessment(
        source_name=ds.name,
        scores=scores,
        total=total,
        verdict=verdict,
        blocking_dimension=blocking,
    )


# ---------- Report printer ----------

DIM_LABELS = {
    "quality":       "Quality      ",
    "freshness":     "Freshness    ",
    "sensitivity":   "Sensitivity  ",
    "provenance":    "Provenance   ",
    "eval_coverage": "Eval Coverage",
}

SCORE_ICONS = {0: "FAIL  [0]", 1: "CAVEAT[1]", 2: "PASS  [2]"}


def print_assessment(ds: DataSource, a: Assessment) -> None:
    width = 72
    print("=" * width)
    print(f"  DATA SOURCE: {a.source_name}")
    if ds.notes:
        print(f"  Note: {ds.notes}")
    print("-" * width)
    for dim, score in a.scores.items():
        label = DIM_LABELS[dim]
        icon = SCORE_ICONS[score]
        marker = " <-- BLOCKS" if dim == a.blocking_dimension else ""
        print(f"  {label}  {icon}{marker}")
    print("-" * width)
    print(f"  Total: {a.total}/10    Verdict: {a.verdict}")
    if a.verdict == "STOP" and a.blocking_dimension:
        print(f"  Blocking dimension: {a.blocking_dimension.upper()}")
    elif a.verdict == "CONDITIONAL" and a.blocking_dimension:
        print(f"  Weakest dimension: {a.blocking_dimension.upper()} — remediate before sprint start")
    print()


# ---------- Sample data sources ----------

SOURCES: list[DataSource] = [
    DataSource(
        name="Internal Knowledge Base (validated HR policies)",
        label_accuracy=LabelAccuracy.HIGH,
        freshness_lag=FreshnessLag.WITHIN_BUDGET,
        sensitivity=SensitivityLevel.NONE_DETECTED,
        provenance=ProvenanceStatus.CLEAN,
        eval_coverage=EvalCoverage.REPRESENTATIVE,
        notes="Quarterly review cycle; production query sample used for eval",
    ),
    DataSource(
        name="Web-Scraped Industry Reports (unlicensed)",
        label_accuracy=LabelAccuracy.MEDIUM,
        freshness_lag=FreshnessLag.MARGINAL,
        sensitivity=SensitivityLevel.NONE_DETECTED,
        provenance=ProvenanceStatus.UNKNOWN,
        eval_coverage=EvalCoverage.WEAK,
        notes="ToS prohibits ML training; robots.txt partially disallowed",
    ),
    DataSource(
        name="CRM Export — Customer Interaction Logs",
        label_accuracy=LabelAccuracy.HIGH,
        freshness_lag=FreshnessLag.WITHIN_BUDGET,
        sensitivity=SensitivityLevel.PII_PRESENT,
        provenance=ProvenanceStatus.PARTIAL,
        eval_coverage=EvalCoverage.MISSING_OR_CONTAMINATED,
        notes="Raw export includes names, emails, phone numbers; no DPA for training use",
    ),
]


# ---------- Main ----------

def main() -> None:
    width = 72
    print("=" * width)
    print("DATA READINESS ASSESSMENT ENGINE (Phase 11, Lesson 92)")
    print("=" * width)
    print()
    print("  Scoring: 0=FAIL  1=PASS WITH CAVEATS  2=PASS  (max 10 total)")
    print("  Verdict: STOP (<6)  |  CONDITIONAL (6-7)  |  PROCEED (8-10)")
    print()

    assessments: list[tuple[DataSource, Assessment]] = []
    for ds in SOURCES:
        a = score_source(ds)
        assessments.append((ds, a))
        print_assessment(ds, a)

    # Summary table
    print("=" * width)
    print("  SUMMARY")
    print("-" * width)
    print(f"  {'Source':<42} {'Score':>5}  Verdict")
    print(f"  {'-'*42}  -----  -------")
    for ds, a in assessments:
        name_trunc = ds.name[:42]
        print(f"  {name_trunc:<42} {a.total:>5}  {a.verdict}")
    print()
    print("=" * width)
    print("HEADLINE: data readiness gates are independent — one failing")
    print("dimension blocks regardless of the other four.")
    print("-" * width)
    print("  Source 1 (Internal KB): all five dimensions pass -> PROCEED.")
    print("  Source 2 (Web-scraped): provenance is UNKNOWN (ToS prohibits ML)")
    print("    -> STOP, even though quality and sensitivity are acceptable.")
    print("  Source 3 (CRM export):  PII present + no DPA for training,")
    print("    eval set contaminated -> STOP. Sensitivity and eval_coverage")
    print("    are both zero-scored; sensitivity is the first blocking dim.")
    print()
    print("  Resolution path for Source 2: obtain written licensor clearance")
    print("    or replace with a licensed data provider. Do not prototype.")
    print("  Resolution path for Source 3: anonymise + DPA update + rebuild")
    print("    eval set from production query logs before any training run.")


if __name__ == "__main__":
    main()
