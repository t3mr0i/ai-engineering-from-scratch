"""AI Risk Management — consequence classifier and control gap analyzer.

Part 1: Consequence classifier
  Takes an output-type description (a set of boolean attributes) and routes
  it to L0-L3 using deterministic rules. Shows which attribute triggered
  the classification. Models the governance decision made once per output
  type at design time, not per inference.

Part 2: Control gap analyzer
  Takes a use-case record with four required elements (owner, control,
  evidence type, exceptions) and reports which elements are missing or
  deficient. Detects open-ended exceptions with no expiry date, which is
  the most common AI governance audit finding.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from datetime import date


# ---------------------------------------------------------------------------
# Part 1: Consequence classifier
# ---------------------------------------------------------------------------

class Level(Enum):
    L0 = "L0 — Informational"
    L1 = "L1 — Operational"
    L2 = "L2 — Consequential"
    L3 = "L3 — High-stakes"


@dataclass
class OutputType:
    name: str
    external_facing: bool       # output leaves the system or reaches a client
    financial_impact: bool      # influences a monetary decision or document
    irreversible: bool          # cannot be corrected within 24 h at low cost
    regulatory_exposure: bool   # error creates legal, compliance, or safety risk
    human_decision_required: bool  # further human decision always precedes action


def classify_output(ot: OutputType) -> tuple[Level, str]:
    """Return (level, trigger_reason). Uses the first matching rule."""
    if ot.irreversible or ot.regulatory_exposure:
        reason = "irreversible=True" if ot.irreversible else "regulatory_exposure=True"
        return Level.L3, reason
    if ot.financial_impact or (ot.external_facing and not ot.human_decision_required):
        reason = "financial_impact=True" if ot.financial_impact else "external_facing + no human gate"
        return Level.L2, reason
    if ot.external_facing and ot.human_decision_required:
        return Level.L1, "external_facing + human_decision_required"
    return Level.L0, "no external, financial, irreversible, or regulatory attribute"


# ---------------------------------------------------------------------------
# Part 2: Control gap analyzer
# ---------------------------------------------------------------------------

@dataclass
class PolicyException:
    description: str
    expiry: date | None   # None means no expiry was set — a gap
    owner: str


@dataclass
class UseCase:
    name: str
    owner: str            # empty string = gap
    control: str          # empty string = gap
    evidence_type: str    # empty string = gap
    exceptions: list[PolicyException] = field(default_factory=list)


TODAY = date(2026, 6, 22)


def analyze_gaps(uc: UseCase) -> list[str]:
    """Return a list of gap descriptions for this use case."""
    gaps: list[str] = []
    if not uc.owner.strip():
        gaps.append("MISSING named risk owner")
    if not uc.control.strip():
        gaps.append("MISSING stated control description")
    if not uc.evidence_type.strip():
        gaps.append("MISSING evidence artifact type")
    for exc in uc.exceptions:
        if exc.expiry is None:
            gaps.append(
                f"EXCEPTION '{exc.description[:40]}' has NO expiry date — "
                "will silently become permanent"
            )
        elif exc.expiry < TODAY:
            gaps.append(
                f"EXCEPTION '{exc.description[:40]}' expired {exc.expiry} "
                f"({(TODAY - exc.expiry).days} days ago) — review required"
            )
    return gaps


# ---------------------------------------------------------------------------
# Sample data
# ---------------------------------------------------------------------------

SAMPLE_OUTPUT_TYPES = [
    OutputType(
        name="Meeting-transcript action-item extraction",
        external_facing=False,
        financial_impact=False,
        irreversible=False,
        regulatory_exposure=False,
        human_decision_required=True,
    ),
    OutputType(
        name="Client-facing project status summary",
        external_facing=True,
        financial_impact=False,
        irreversible=False,
        regulatory_exposure=False,
        human_decision_required=True,
    ),
    OutputType(
        name="Contract clause extraction for legal review",
        external_facing=True,
        financial_impact=True,
        irreversible=False,
        regulatory_exposure=False,
        human_decision_required=False,
    ),
    OutputType(
        name="AML transaction risk flag",
        external_facing=True,
        financial_impact=True,
        irreversible=False,
        regulatory_exposure=True,
        human_decision_required=False,
    ),
]

SAMPLE_CASES = [
    UseCase(
        name="Search-tag suggester",
        owner="Alice Meier",
        control="No review required; L0 output used only for UI hints.",
        evidence_type="None required at L0",
        exceptions=[],
    ),
    UseCase(
        name="Draft client email generator",
        owner="",                   # GAP: no owner named
        control="Analyst reviews before send.",
        evidence_type="Email send-log with reviewer ID",
        exceptions=[],
    ),
    UseCase(
        name="Contract clause extractor",
        owner="Dr. J. Richter (Legal)",
        control="",                  # GAP: control not described
        evidence_type="Legal review ticket with sign-off",
        exceptions=[
            PolicyException(
                description="Skip sync review for standard NDA clauses",
                expiry=None,         # GAP: no expiry
                owner="Dr. J. Richter",
            )
        ],
    ),
    UseCase(
        name="AML transaction risk flag",
        owner="Risk & Compliance Officer",
        control="Certified analyst reviews every flag before case creation.",
        evidence_type="Case-management system entry with analyst ID and timestamp",
        exceptions=[
            PolicyException(
                description="Batch-process low-score flags overnight without sync review",
                expiry=date(2026, 3, 1),   # GAP: expired
                owner="Risk & Compliance Officer",
            )
        ],
    ),
]


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 72)
    print("AI RISK MANAGEMENT — Classifier + Control Gap Analyzer")
    print("(Phase 11, Lesson 102)")
    print("=" * 72)

    # --- Part 1 ---
    print()
    print("PART 1: Consequence classification")
    print("-" * 72)
    for ot in SAMPLE_OUTPUT_TYPES:
        level, trigger = classify_output(ot)
        print(f"  {ot.name}")
        print(f"    -> {level.value}  [trigger: {trigger}]")
        print()

    # --- Part 2 ---
    print("PART 2: Control gap analysis")
    print("-" * 72)
    total_gaps = 0
    gap_counts: dict[str, int] = {
        "MISSING named risk owner": 0,
        "MISSING stated control description": 0,
        "MISSING evidence artifact type": 0,
        "open-ended exception": 0,
        "expired exception": 0,
    }

    for uc in SAMPLE_CASES:
        gaps = analyze_gaps(uc)
        status = "OK" if not gaps else f"{len(gaps)} gap(s)"
        print(f"  {uc.name}  [{status}]")
        for g in gaps:
            print(f"    ! {g}")
            total_gaps += 1
            if "NO expiry" in g:
                gap_counts["open-ended exception"] += 1
            elif "expired" in g:
                gap_counts["expired exception"] += 1
            elif "owner" in g:
                gap_counts["MISSING named risk owner"] += 1
            elif "control" in g:
                gap_counts["MISSING stated control description"] += 1
            elif "evidence" in g:
                gap_counts["MISSING evidence artifact type"] += 1
        print()

    print()
    print("=" * 72)
    print("HEADLINE: ownership gaps and undated exceptions are the #1 audit finding")
    print("-" * 72)
    print(f"  {total_gaps} total gap(s) across {len(SAMPLE_CASES)} use cases")
    for category, count in gap_counts.items():
        if count:
            print(f"  {count}x  {category}")
    print()
    print("  Every gap above is a control failure an auditor will flag.")
    print("  Fix path: name an owner, describe the control precisely,")
    print("  attach an evidence artifact, and date every exception.")
    print("=" * 72)


if __name__ == "__main__":
    main()
