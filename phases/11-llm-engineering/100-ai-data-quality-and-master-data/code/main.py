"""Data quality scorer and go/no-go decision engine — stdlib Python.

Part 1: DomainProfile dataclass captures the three measurable dimensions
(completeness, uniqueness, timeliness) for a master data domain; a score()
method collapses them to a single 0-1 quality score.

Part 2: The go/no-go engine maps (domain scores, use case criticality) to
one of three verdicts: DEPLOY, CONDITIONAL, or BLOCK. Thresholds are
criticality-adjusted: a high-stakes use case (compliance, financial,
medical) demands higher scores before DEPLOY is issued.

The driver runs a synthetic three-domain assessment against two criticality
levels and prints each verdict with reasons, ending in a HEADLINE summary.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------- Enums ----------


class Criticality(Enum):
    STANDARD = "standard"   # internal productivity tool, user inconvenience if wrong
    HIGH = "high"           # compliance, financial, regulatory, medical


class Verdict(Enum):
    DEPLOY = "DEPLOY"
    CONDITIONAL = "CONDITIONAL"   # may proceed with a named inference-time mitigation
    BLOCK = "BLOCK"


# ---------- Thresholds ----------
# Each criticality level defines the minimum score required for DEPLOY.
# Below the threshold the verdict is CONDITIONAL; below the hard floor it is BLOCK.

THRESHOLDS = {
    Criticality.STANDARD: {"deploy": 0.75, "block": 0.50},
    Criticality.HIGH:     {"deploy": 0.90, "block": 0.65},
}

# Dimension weights: uniqueness is weighted highest for AI workloads because
# duplicate master records inject contradictory training/retrieval signal.
WEIGHTS = {
    "completeness": 0.30,
    "uniqueness":   0.45,
    "timeliness":   0.25,
}


# ---------- Domain profile ----------


@dataclass
class DomainProfile:
    """Measured quality profile for one master data domain.

    Attributes:
        name:            Human-readable domain label.
        null_rate:       Fraction of required fields that are null (0-1). Lower is better.
        duplicate_rate:  Fraction of records that are non-golden duplicates (0-1). Lower is better.
        stale_rate:      Fraction of records whose last-modified timestamp exceeds the
                         staleness threshold for this domain (0-1). Lower is better.
        notes:           Free-text context from the profiling run.
    """
    name: str
    null_rate: float       # 0.0 = no nulls, 1.0 = all null
    duplicate_rate: float  # 0.0 = fully deduplicated, 1.0 = all duplicates
    stale_rate: float      # 0.0 = all current, 1.0 = all stale
    notes: str = ""

    def completeness_score(self) -> float:
        """1 minus null_rate: proportion of records that are complete."""
        return round(1.0 - self.null_rate, 3)

    def uniqueness_score(self) -> float:
        """1 minus duplicate_rate: proportion of records that are golden."""
        return round(1.0 - self.duplicate_rate, 3)

    def timeliness_score(self) -> float:
        """1 minus stale_rate: proportion of records that are current."""
        return round(1.0 - self.stale_rate, 3)

    def weighted_score(self) -> float:
        """Weighted aggregate score across all three dimensions."""
        score = (
            WEIGHTS["completeness"] * self.completeness_score()
            + WEIGHTS["uniqueness"] * self.uniqueness_score()
            + WEIGHTS["timeliness"] * self.timeliness_score()
        )
        return round(score, 3)


# ---------- Go/no-go decision engine ----------


@dataclass
class AssessmentResult:
    domain: DomainProfile
    criticality: Criticality
    verdict: Verdict
    score: float
    reason: str
    mitigation: str = ""   # populated for CONDITIONAL verdicts


def assess(domain: DomainProfile, criticality: Criticality) -> AssessmentResult:
    """Apply the go/no-go policy and return a structured verdict."""
    score = domain.weighted_score()
    thresholds = THRESHOLDS[criticality]

    # Determine verdict
    if score >= thresholds["deploy"]:
        verdict = Verdict.DEPLOY
        reason = (
            f"score {score:.3f} >= deploy threshold {thresholds['deploy']:.2f}"
        )
        mitigation = ""
    elif score >= thresholds["block"]:
        verdict = Verdict.CONDITIONAL
        # Identify the weakest dimension to surface the required mitigation.
        scores = {
            "completeness": domain.completeness_score(),
            "uniqueness":   domain.uniqueness_score(),
            "timeliness":   domain.timeliness_score(),
        }
        weakest_dim = min(scores, key=lambda k: scores[k])
        weakest_val = scores[weakest_dim]
        reason = (
            f"score {score:.3f} between block floor {thresholds['block']:.2f} "
            f"and deploy threshold {thresholds['deploy']:.2f}; "
            f"weakest dimension: {weakest_dim} ({weakest_val:.3f})"
        )
        mitigation = _mitigation_advice(weakest_dim, weakest_val)
    else:
        verdict = Verdict.BLOCK
        reason = (
            f"score {score:.3f} < block floor {thresholds['block']:.2f}; "
            "data fix required before AI workflow deployment"
        )
        mitigation = ""

    return AssessmentResult(
        domain=domain,
        criticality=criticality,
        verdict=verdict,
        score=score,
        reason=reason,
        mitigation=mitigation,
    )


def _mitigation_advice(dimension: str, score: float) -> str:
    """Return a concise inference-time mitigation string for a weak dimension."""
    if dimension == "uniqueness":
        return (
            "run entity resolution pre-processing before indexing; "
            "filter retrieval results to golden-record IDs only"
        )
    if dimension == "completeness":
        return (
            "add null-field filter to retrieval query; "
            "surface confidence score to downstream users when key fields are absent"
        )
    if dimension == "timeliness":
        return (
            "apply recency filter at retrieval time (e.g. modified_at > 90 days); "
            "schedule daily reference data refresh from source system"
        )
    return "review data pipeline upstream of AI workflow"


# ---------- Driver ----------


DOMAINS = [
    DomainProfile(
        name="Customer / party",
        null_rate=0.04,        # 4% of required fields null — borderline
        duplicate_rate=0.18,   # 18% duplicate records — significant
        stale_rate=0.06,
        notes="CRM export; two legacy systems merged 14 months ago without full dedup run",
    ),
    DomainProfile(
        name="Product catalogue",
        null_rate=0.02,
        duplicate_rate=0.03,
        stale_rate=0.08,
        notes="PIM system; SKU rename project completed last quarter",
    ),
    DomainProfile(
        name="Supplier / vendor",
        null_rate=0.18,        # 18% null — procurement onboarding backlog
        duplicate_rate=0.38,   # 38% duplicates — multiple ERP instances never reconciled
        stale_rate=0.30,       # 30% stale — annual refresh cycle, long overdue
        notes="ERP extract from three regional instances; no MDM platform in place",
    ),
]


def print_separator(char: str = "-", width: int = 80) -> None:
    print(char * width)


def run_assessment(criticality: Criticality) -> list[AssessmentResult]:
    print()
    print(f"  Criticality level: {criticality.value.upper()}")
    print_separator()
    print(f"  {'Domain':<26} {'Score':>6}  {'Verdict':<13} {'Dimension breakdown'}")
    print_separator()

    results = []
    for domain in DOMAINS:
        result = assess(domain, criticality)
        breakdown = (
            f"C={domain.completeness_score():.2f} "
            f"U={domain.uniqueness_score():.2f} "
            f"T={domain.timeliness_score():.2f}"
        )
        print(f"  {domain.name:<26} {result.score:>6.3f}  {result.verdict.value:<13} {breakdown}")
        results.append(result)

    print()
    for result in results:
        print(f"  [{result.verdict.value}] {result.domain.name}")
        print(f"    Reason: {result.reason}")
        if result.mitigation:
            print(f"    Mitigation: {result.mitigation}")
        if result.domain.notes:
            print(f"    Notes: {result.domain.notes}")
        print()

    return results


def main() -> None:
    print("=" * 80)
    print("DATA QUALITY SCORER + GO/NO-GO DECISION ENGINE (Phase 11, Lesson 100)")
    print("=" * 80)
    print()
    print("  Dimension weights (AI-adjusted):")
    for dim, w in WEIGHTS.items():
        print(f"    {dim:<14} {w:.0%}")
    print()
    print("  Thresholds:")
    for crit, t in THRESHOLDS.items():
        print(f"    {crit.value:<10}  deploy >= {t['deploy']:.2f}  |  block < {t['block']:.2f}")

    all_results: dict[str, list[AssessmentResult]] = {}
    for criticality in Criticality:
        print()
        print_separator("=")
        results = run_assessment(criticality)
        all_results[criticality.value] = results

    print()
    print_separator("=")
    print("HEADLINE: upstream data quality determines whether the AI workflow ships")
    print_separator("-")
    blocked = [
        r.domain.name
        for r in all_results[Criticality.HIGH.value]
        if r.verdict is Verdict.BLOCK
    ]
    conditional = [
        r.domain.name
        for r in all_results[Criticality.STANDARD.value]
        if r.verdict is Verdict.CONDITIONAL
    ]
    deploy = [
        r.domain.name
        for r in all_results[Criticality.HIGH.value]
        if r.verdict is Verdict.DEPLOY
    ]
    print(f"  BLOCKED at HIGH criticality : {blocked}")
    print(f"  CONDITIONAL at STANDARD     : {conditional}")
    print(f"  DEPLOY at HIGH criticality  : {deploy}")
    print()
    print("  The Supplier domain is CONDITIONAL at both levels because its")
    print("  weighted score (driven by 38% duplicate rate and 30% stale rate)")
    print("  sits below DEPLOY thresholds at both criticality levels.")
    print("  Entity resolution + reference data refresh are required before")
    print("  the workflow proceeds to production without inference-time guards.")
    print("  The Customer domain is also CONDITIONAL at HIGH criticality due")
    print("  to its 18% duplicate rate; entity resolution pre-processing is")
    print("  the minimum gate. Only Product catalogue clears HIGH without remediation.")


if __name__ == "__main__":
    main()
