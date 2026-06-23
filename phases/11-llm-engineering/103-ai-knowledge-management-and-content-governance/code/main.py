"""Source quality scorer and governance policy enforcer — stdlib Python.

Part 1: Source quality scorer.
  Takes a candidate source record and evaluates it on four independently
  scored quality dimensions: Authority, Currency, Consistency, and Scope Fit.
  Returns a disposition: ADMIT, REJECT, or DEFER (human review required).
  The AND-gate rule is explicit: a single failing dimension rejects the source.

Part 2: Governance policy enforcer.
  Runs the scorer against a synthetic corpus candidate list and prints the
  full governance log — the same structured record a real pipeline would write.
  The summary counts demonstrate that the AND-gate is stricter than a weighted
  average would be.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------- Enums and constants ----------

class Tier(Enum):
    T1 = "T1-Authoritative"
    T2 = "T2-Reference"
    T3 = "T3-Informal"


class Disposition(Enum):
    ADMIT = "ADMIT"
    REJECT = "REJECT"
    DEFER = "DEFER"    # human review required before admission


# Domain recency windows: maximum age in months before currency fails.
RECENCY_WINDOWS: dict[str, int] = {
    "compliance":    6,
    "hr_policy":    12,
    "architecture": 24,
    "methodology":  36,
    "case_study":   9999,   # historical; no expiry
}


# ---------- Source candidate ----------

@dataclass
class SourceCandidate:
    name: str
    tier: Tier
    domain: str                     # must be a key in RECENCY_WINDOWS
    last_modified_months_ago: int
    has_named_owner: bool           # for authority dimension
    contradicts_corpus: bool        # for consistency dimension
    in_scope: bool                  # for scope fit dimension
    note: str = ""


# ---------- Quality scorer ----------

@dataclass
class QualityScore:
    authority: bool
    currency: bool
    consistency: bool
    scope_fit: bool
    disposition: Disposition
    reject_reasons: list[str]


def score_source(s: SourceCandidate) -> QualityScore:
    """Score a candidate source on all four quality dimensions.

    Each dimension is a pass/fail. The AND-gate means any False dimension
    triggers a REJECT (or DEFER for T3 sources that otherwise pass).
    """
    reject_reasons: list[str] = []

    # --- Dimension 1: Authority ---
    # T1: pass if named owner. T2: pass if named owner. T3: always fails
    # authority independently (requires human sign-off -> DEFER, not REJECT).
    if s.tier is Tier.T3:
        authority_ok = False
        # T3 sources are DEFER'd to human review, not outright rejected,
        # when they pass the other three dimensions.
    elif not s.has_named_owner:
        authority_ok = False
        reject_reasons.append("no named owner (T1/T2 require documented ownership)")
    else:
        authority_ok = True

    # --- Dimension 2: Currency ---
    window = RECENCY_WINDOWS.get(s.domain, 24)
    if s.last_modified_months_ago > window:
        currency_ok = False
        reject_reasons.append(
            f"stale: {s.last_modified_months_ago}m ago exceeds "
            f"{window}m window for domain '{s.domain}'"
        )
    else:
        currency_ok = True

    # --- Dimension 3: Consistency ---
    if s.contradicts_corpus:
        consistency_ok = False
        reject_reasons.append("contradicts a higher-authority source already in corpus")
    else:
        consistency_ok = True

    # --- Dimension 4: Scope fit ---
    if not s.in_scope:
        scope_ok = False
        reject_reasons.append("outside declared task domain scope")
    else:
        scope_ok = True

    # --- Final disposition (AND-gate) ---
    if s.tier is Tier.T3:
        # T3 sources: DEFER unconditionally — human sign-off required.
        # We still report which other dimensions failed so the reviewer
        # knows what they are being asked to accept.
        if not currency_ok:
            reject_reasons.append("currency failure noted for reviewer")
        if not consistency_ok:
            reject_reasons.append("consistency failure noted for reviewer")
        if not scope_ok:
            reject_reasons.append("scope failure noted for reviewer")
        disposition = Disposition.DEFER
    elif currency_ok and consistency_ok and scope_ok and authority_ok:
        disposition = Disposition.ADMIT
    else:
        disposition = Disposition.REJECT

    return QualityScore(
        authority=authority_ok,
        currency=currency_ok,
        consistency=consistency_ok,
        scope_fit=scope_ok,
        disposition=disposition,
        reject_reasons=reject_reasons,
    )


# ---------- Governance log printer ----------

def run_governance_check(candidates: list[SourceCandidate]) -> None:
    counts = {d: 0 for d in Disposition}
    print(f"  {'SOURCE':<42} {'TIER':<18} {'AUTH':>4} {'CURR':>4} {'CONS':>4} {'SCOP':>4}  DISPOSITION")
    print("  " + "-" * 100)

    for s in candidates:
        sc = score_source(s)
        counts[sc.disposition] += 1
        auth = "OK" if sc.authority else "FAIL"
        curr = "OK" if sc.currency else "FAIL"
        cons = "OK" if sc.consistency else "FAIL"
        scop = "OK" if sc.scope_fit else "FAIL"
        print(
            f"  {s.name:<42} {s.tier.value:<18} "
            f"{auth:>4} {curr:>4} {cons:>4} {scop:>4}  "
            f"{sc.disposition.value}"
        )
        for reason in sc.reject_reasons:
            print(f"    -> {reason}")

    print()
    admit = counts[Disposition.ADMIT]
    reject = counts[Disposition.REJECT]
    defer  = counts[Disposition.DEFER]
    total  = len(candidates)
    print(f"  Governance log summary: {total} evaluated | "
          f"{admit} ADMIT | {reject} REJECT | {defer} DEFER")
    return counts


# ---------- Driver ----------

def main() -> None:
    print("=" * 80)
    print("SOURCE QUALITY GATE AND GOVERNANCE LOG (Phase 11, Lesson 103)")
    print("=" * 80)
    print()
    print("Corpus candidate evaluation — four-dimension AND-gate policy")
    print()

    candidates: list[SourceCandidate] = [
        SourceCandidate(
            name="LHIND Internal AI Policy v2.4",
            tier=Tier.T1,
            domain="hr_policy",
            last_modified_months_ago=3,
            has_named_owner=True,
            contradicts_corpus=False,
            in_scope=True,
            note="Current policy document; owner: Legal & Compliance team",
        ),
        SourceCandidate(
            name="EU AI Act Compliance Checklist 2022",
            tier=Tier.T1,
            domain="compliance",
            last_modified_months_ago=28,   # FAILS currency (window=6m)
            has_named_owner=True,
            contradicts_corpus=False,
            in_scope=True,
            note="Pre-dates current Act text; superseded",
        ),
        SourceCandidate(
            name="Consulting Methodology Framework v3",
            tier=Tier.T2,
            domain="methodology",
            last_modified_months_ago=18,
            has_named_owner=True,
            contradicts_corpus=False,
            in_scope=True,
            note="Actively maintained reference",
        ),
        SourceCandidate(
            name="Team Wiki: RAG Architecture Notes",
            tier=Tier.T2,
            domain="architecture",
            last_modified_months_ago=30,   # FAILS currency (window=24m)
            has_named_owner=True,
            contradicts_corpus=False,
            in_scope=True,
            note="Not updated since team reorganization",
        ),
        SourceCandidate(
            name="Client Project Alpha Final Report 2019",
            tier=Tier.T2,
            domain="case_study",
            last_modified_months_ago=72,   # case_study has no expiry -> OK
            has_named_owner=True,
            contradicts_corpus=False,
            in_scope=True,
            note="Historical reference; no currency restriction for case studies",
        ),
        SourceCandidate(
            name="GPT-generated FAQ Export (March 2025)",
            tier=Tier.T3,
            domain="methodology",
            last_modified_months_ago=15,
            has_named_owner=False,
            contradicts_corpus=False,
            in_scope=True,
            note="AI-generated; no named author; requires human sign-off",
        ),
        SourceCandidate(
            name="Competitor Product Teardown Notes",
            tier=Tier.T2,
            domain="architecture",
            last_modified_months_ago=6,
            has_named_owner=True,
            contradicts_corpus=False,
            in_scope=False,             # FAILS scope fit
            note="Out of declared domain scope for internal assistant",
        ),
        SourceCandidate(
            name="HR Process Guide (contradicts v2.4)",
            tier=Tier.T1,
            domain="hr_policy",
            last_modified_months_ago=5,
            has_named_owner=True,
            contradicts_corpus=True,    # FAILS consistency
            in_scope=True,
            note="Conflicts with v2.4 already admitted above",
        ),
    ]

    run_governance_check(candidates)

    print()
    print("=" * 80)
    print("HEADLINE: AND-gate is stricter than weighted average")
    print("-" * 80)
    print("  'EU AI Act Compliance Checklist 2022' is T1-Authoritative and in scope,")
    print("  but 28 months old in a 6-month compliance domain -> REJECT on currency.")
    print("  A weighted-average scorer would have passed it; the AND-gate does not.")
    print("  'GPT-generated FAQ Export' is DEFER'd: T3 requires human sign-off")
    print("  regardless of other scores. No automated policy can admit a T3 source.")
    print("  Governance log should be written to disk as a pipeline artifact,")
    print("  not printed to stdout alone. Drift detection requires re-running")
    print("  this scorer on all indexed sources on a scheduled cadence.")


if __name__ == "__main__":
    main()
