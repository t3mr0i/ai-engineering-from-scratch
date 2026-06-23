"""AI Risk Management — consequence classifier, control gap analyzer, and
silent-reclassification audit.

Three deterministic decision policies, made runnable:

1. classify_output(): route an OutputType to L0-L3 using the attributes
   (external_facing, financial_impact, irreversible, regulatory_exposure,
   human_decision_required). Shows the trigger. This is a design-time
   decision, not a per-inference one.

2. analyze_gaps(): given a UseCase with the four required control elements
   (owner, control, evidence_type, exceptions), return a list of gaps.
   Detects: missing owner, missing control, missing evidence, open-ended
   exceptions (no expiry), and expired exceptions.

3. detect_silent_reclassification(): take a use case as it was originally
   registered, a current use case, and ask: did the consequence level
   change without a corresponding update? This is the failure shape we
   see most often in 2026 — the CRM RAG that moved from "informational
   hint" to "auto-populated pricing tier" with no re-classification.

No model, no network. The point is to make the governance decision policy
explicit and inspectable.
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
    """Return (level, trigger_reason). First matching rule wins.

    Rules are ordered from highest consequence to lowest. L3 is set
    first; we never 'downgrade' an irreversible or regulatory output
    just because a human reviews it.
    """
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
    expiry: date | None   # None = open-ended exception (silent permanent control removal)
    owner: str


@dataclass
class UseCase:
    name: str
    owner: str            # empty string = gap
    control: str          # empty string = gap
    evidence_type: str    # empty string = gap
    exceptions: list[PolicyException] = field(default_factory=list)
    level: Level = Level.L0  # current registered consequence level


TODAY = date(2026, 6, 22)


def analyze_gaps(uc: UseCase) -> list[str]:
    """Return a list of gap descriptions for this use case.

    Encodes the four required control elements (NIST AI RMF GOVERN 1.1
    and ISO 42001 clause 6.1.2) and the two most common exception
    findings: open-ended (no expiry) and expired exceptions.
    """
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
            days = (TODAY - exc.expiry).days
            gaps.append(
                f"EXCEPTION '{exc.description[:40]}' expired {exc.expiry} "
                f"({days} days ago) — review required, otherwise it operates "
                "as a permanent control removal"
            )
    return gaps


# ---------------------------------------------------------------------------
# Part 3: Silent-reclassification detector
# ---------------------------------------------------------------------------

def detect_silent_reclassification(
    original: UseCase,
    current: UseCase,
    original_output: OutputType,
    current_output: OutputType,
) -> list[str]:
    """Return a list of findings if the consequence level changed without
    an update to the governance record.

    The failure shape: same code (or nearly same code), new downstream
    effect on a decision, no re-classification, no new exception, no new
    owner. The original L0 risk register entry is what the auditor reads.
    """
    findings: list[str] = []
    original_level, _ = classify_output(original_output)
    current_level, _ = classify_output(current_output)

    if current_level.value == original_level.value:
        return findings  # no change; nothing to flag

    # Level went UP but the governance record was not updated.
    if current_level.value > original_level.value:
        findings.append(
            f"LEVEL ESCALATION: registered as {original_level.value} but "
            f"current behavior classifies as {current_level.value}. "
            f"Downstream effect changed; re-classification required."
        )
        if original.owner == current.owner and current.owner != "":
            findings.append(
                f"OWNER UNCHANGED across L-escalation: '{current.owner}' — "
                "L-escalation typically requires a higher-authority owner "
                "(see Exception authority column in consequence-level table)."
            )
        # The original exception set is unlikely to still cover the new level.
        if not current.exceptions:
            findings.append(
                "NO NEW EXCEPTION recorded for the L-escalation — original "
                "controls may not match the new level's minimum review gate."
            )
    else:
        # Level went DOWN. Less dangerous, but still requires a documented
        # decision; auditors want to know *who* decided and *why*.
        findings.append(
            f"LEVEL DOWNGRADE: registered as {original_level.value}, "
            f"now {current_level.value}. Document the rationale and the "
            "owner who approved it."
        )

    return findings


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
        level=Level.L0,
    ),
    UseCase(
        name="Draft client email generator",
        owner="",                   # GAP: no owner named
        control="Analyst reviews before send.",
        evidence_type="Email send-log with reviewer ID",
        exceptions=[],
        level=Level.L1,
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
        level=Level.L2,
    ),
    UseCase(
        name="AML transaction risk flag",
        owner="Risk & Compliance Officer",
        control="Certified analyst reviews every flag before case creation.",
        evidence_type="Case-management system entry with analyst ID and timestamp",
        exceptions=[
            PolicyException(
                description="Batch-process low-score flags overnight without sync review",
                expiry=date(2026, 3, 1),   # GAP: expired (~3 months ago)
                owner="Risk & Compliance Officer",
            )
        ],
        level=Level.L3,
    ),
]

# ---------------------------------------------------------------------------
# Part 3 sample: the CRM RAG at a logistics firm (silent reclassification)
# ---------------------------------------------------------------------------
# 18 months ago: a RAG suggests next-best-action prompts to a sales team.
# Classified L0 (informational, no financial impact, humans always act).
# Today: same code path, now wired into the quote-creation workflow and
# auto-populating pricing tier suggestions. Same owner, same control,
# same L0 risk register entry. The downstream effect changed; the
# governance record did not.

CRM_RAG_ORIGINAL_OUTPUT = OutputType(
    name="Next-best-action prompt suggester (original)",
    external_facing=False,
    financial_impact=False,
    irreversible=False,
    regulatory_exposure=False,
    human_decision_required=True,
)

CRM_RAG_CURRENT_OUTPUT = OutputType(
    name="Next-best-action prompt suggester (now auto-populates pricing tier)",
    external_facing=False,            # still internal
    financial_impact=True,            # <-- changed: now drives pricing
    irreversible=False,
    regulatory_exposure=False,
    human_decision_required=False,    # <-- changed: auto-populated, no human gate
)

CRM_RAG_ORIGINAL_CASE = UseCase(
    name="CRM RAG (as registered 2024-Q4)",
    owner="M. Hoffmann (Sales Ops)",
    control="Sales rep always reviews before sending; spot-check 5% weekly.",
    evidence_type="Spot-check log in CRM admin console",
    exceptions=[],
    level=Level.L0,
)

CRM_RAG_CURRENT_CASE = UseCase(
    name="CRM RAG (current behavior, unchanged register)",
    owner="M. Hoffmann (Sales Ops)",   # same owner — flagged
    control="Sales rep always reviews before sending; spot-check 5% weekly.",
    evidence_type="Spot-check log in CRM admin console",
    exceptions=[],                    # no new exception — flagged
    level=Level.L0,                   # L0 still in register — flagged
)


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 78)
    print("PART 1 — Consequence classification (design-time, per output type)")
    print("=" * 78)
    for ot in SAMPLE_OUTPUT_TYPES:
        level, trigger = classify_output(ot)
        print(f"  {ot.name}")
        print(f"    -> {level.value}  [trigger: {trigger}]")
        print()

    print("=" * 78)
    print("PART 2 — Control gap analysis (the four required elements)")
    print("=" * 78)
    total_gaps = 0
    gap_counts: dict[str, int] = {
        "MISSING named risk owner": 0,
        "MISSING stated control description": 0,
        "MISSING evidence artifact type": 0,
        "open-ended exception (no expiry)": 0,
        "expired exception (not re-justified)": 0,
    }

    for uc in SAMPLE_CASES:
        gaps = analyze_gaps(uc)
        status = "OK" if not gaps else f"{len(gaps)} gap(s)"
        print(f"  [{uc.level.value.split(' ')[0]}] {uc.name}  [{status}]")
        for g in gaps:
            print(f"    ! {g}")
            total_gaps += 1
            if "NO expiry" in g:
                gap_counts["open-ended exception (no expiry)"] += 1
            elif "expired" in g:
                gap_counts["expired exception (not re-justified)"] += 1
            elif "owner" in g:
                gap_counts["MISSING named risk owner"] += 1
            elif "control" in g:
                gap_counts["MISSING stated control description"] += 1
            elif "evidence" in g:
                gap_counts["MISSING evidence artifact type"] += 1
        print()

    print("=" * 78)
    print("PART 3 — Silent-reclassification audit (the failure shape)")
    print("=" * 78)
    findings = detect_silent_reclassification(
        CRM_RAG_ORIGINAL_CASE,
        CRM_RAG_CURRENT_CASE,
        CRM_RAG_ORIGINAL_OUTPUT,
        CRM_RAG_CURRENT_OUTPUT,
    )
    orig_level, _ = classify_output(CRM_RAG_ORIGINAL_OUTPUT)
    cur_level, cur_trigger = classify_output(CRM_RAG_CURRENT_OUTPUT)
    print(f"  Original registration: {orig_level.value}")
    print(f"  Current actual effect: {cur_level.value}  [trigger: {cur_trigger}]")
    print(f"  Findings:")
    if not findings:
        print("    (none)")
    for f in findings:
        print(f"    ! {f}")
    print()

    print("=" * 78)
    print("HEADLINE: this run demonstrated the SILENT RECLASSIFICATION")
    print("-" * 78)
    print("  The CRM RAG moved from L0 (informational hint) to L2")
    print("  (financial-impacting, no human gate) without a single field")
    print("  in the risk register changing. The owner, the control,")
    print("  the evidence type, and the registered level are all")
    print("  unchanged. The downstream effect on a financial decision is")
    print("  what changed. This is the failure shape auditors flag")
    print("  most often in 2026 — the same code, the new consequence.")
    print()
    print(f"  Part 2 totals: {total_gaps} gap(s) across {len(SAMPLE_CASES)} use cases.")
    for category, count in gap_counts.items():
        if count:
            print(f"    {count}x  {category}")
    print()
    print("  Fix path: name an owner, describe the control precisely,")
    print("  attach an evidence artifact, and date every exception.")
    print("  Re-classify at the moment the downstream effect changes,")
    print("  not at the moment the model changes.")
    print("=" * 78)


if __name__ == "__main__":
    main()
