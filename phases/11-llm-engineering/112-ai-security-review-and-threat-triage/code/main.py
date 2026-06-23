"""AI use-case threat triage scorer — stdlib Python, no dependencies.

Two parts:

Part 1: Severity scorer. For each of the four canonical LLM risk categories
(sensitive data exposure, external tool access, identity ambiguity, untrusted
input injection), a keyword-based heuristic maps signals in a use-case
description to a severity rating: HIGH, MEDIUM, LOW, or NONE.

Part 2: Composite verdict engine. Given four severity ratings, applies the
deterministic rule set that produces PROCEED, PROCEED WITH CONDITIONS, or
HARD STOP — and generates a triage card with per-category justifications.

The driver runs three synthetic use cases that span the severity spectrum.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------


class Severity(Enum):
    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3

    def __str__(self) -> str:
        return self.name


class Verdict(Enum):
    PROCEED = "PROCEED"
    PROCEED_WITH_CONDITIONS = "PROCEED WITH CONDITIONS"
    HARD_STOP = "HARD STOP"


# ---------------------------------------------------------------------------
# Signal dictionaries — keyword signals per category and their severity
# ---------------------------------------------------------------------------

# Each entry: (keyword_fragment, Severity)
# Signals are matched case-insensitively. The highest-matching severity wins.

SIGNALS_SENSITIVE_DATA: list[tuple[str, Severity]] = [
    ("patient",       Severity.HIGH),
    ("medical",       Severity.HIGH),
    ("health record", Severity.HIGH),
    ("credit card",   Severity.HIGH),
    ("salary",        Severity.HIGH),
    ("password",      Severity.HIGH),
    ("credential",    Severity.HIGH),
    ("pii",           Severity.HIGH),
    ("personal data", Severity.HIGH),
    ("customer data", Severity.MEDIUM),
    ("employee",      Severity.MEDIUM),
    ("contract",      Severity.MEDIUM),
    ("financial",     Severity.MEDIUM),
    ("pricing",       Severity.MEDIUM),
    ("internal memo", Severity.MEDIUM),
    ("internal",      Severity.LOW),
    ("proprietary",   Severity.LOW),
]

SIGNALS_EXTERNAL_TOOLS: list[tuple[str, Severity]] = [
    ("send email",    Severity.HIGH),
    ("book ",         Severity.HIGH),
    ("purchases",     Severity.HIGH),
    ("payment",       Severity.HIGH),
    ("deploy",        Severity.HIGH),
    ("delete",        Severity.HIGH),
    ("agent",         Severity.MEDIUM),
    ("automates",     Severity.MEDIUM),
    ("triggers",      Severity.MEDIUM),
    ("writes back",   Severity.MEDIUM),
    ("updates crm",   Severity.HIGH),
    ("api",           Severity.MEDIUM),
    ("integration",   Severity.MEDIUM),
    ("webhook",       Severity.MEDIUM),
    ("calls external",Severity.HIGH),
    ("side effect",   Severity.MEDIUM),
    ("notify",        Severity.LOW),
]

SIGNALS_IDENTITY: list[tuple[str, Severity]] = [
    ("on behalf of",  Severity.HIGH),
    ("impersonat",    Severity.HIGH),
    ("replies for",   Severity.HIGH),
    ("acts as the",   Severity.HIGH),
    ("as the user",   Severity.HIGH),
    ("service account", Severity.MEDIUM),
    ("delegated",     Severity.MEDIUM),
    ("authorised to", Severity.MEDIUM),
    ("answers for",   Severity.MEDIUM),
    ("represents the",Severity.LOW),
]

SIGNALS_INJECTION: list[tuple[str, Severity]] = [
    ("upload",        Severity.HIGH),
    ("user provides", Severity.HIGH),
    ("paste",         Severity.HIGH),
    ("external content", Severity.HIGH),
    ("web search",    Severity.HIGH),
    ("retrieved document", Severity.HIGH),
    ("summarise web", Severity.HIGH),
    ("user feedback", Severity.MEDIUM),
    ("user input",    Severity.MEDIUM),
    ("user-supplied", Severity.HIGH),
    ("pdf",           Severity.MEDIUM),
    ("document",      Severity.MEDIUM),
    ("ticket",        Severity.LOW),
    ("form",          Severity.LOW),
]


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------


@dataclass
class CategoryResult:
    name: str
    severity: Severity
    matched_signal: str  # the signal that drove the severity, or "—"


@dataclass
class TriageCard:
    use_case: str
    sensitive_data: CategoryResult
    external_tools: CategoryResult
    identity: CategoryResult
    injection: CategoryResult
    verdict: Verdict
    conditions: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Part 1: Severity scorer
# ---------------------------------------------------------------------------


def score_category(
    description: str,
    signals: list[tuple[str, Severity]],
    category_name: str,
) -> CategoryResult:
    """Return the highest severity found by scanning description for signals."""
    desc_lower = description.lower()
    best = Severity.NONE
    best_signal = "—"
    for fragment, sev in signals:
        if fragment in desc_lower and sev.value > best.value:
            best = sev
            best_signal = fragment
    return CategoryResult(name=category_name, severity=best, matched_signal=best_signal)


# ---------------------------------------------------------------------------
# Part 2: Composite verdict engine
# ---------------------------------------------------------------------------


def compute_verdict(results: list[CategoryResult]) -> tuple[Verdict, list[str]]:
    """Apply the deterministic triage logic and return (verdict, conditions)."""
    high_hits = [r for r in results if r.severity is Severity.HIGH]
    medium_hits = [r for r in results if r.severity is Severity.MEDIUM]

    if high_hits:
        conditions = [
            f"Security architect sign-off required for HIGH: {r.name} (signal: '{r.matched_signal}')"
            for r in high_hits
        ]
        return Verdict.HARD_STOP, conditions

    if len(medium_hits) >= 2:
        conditions = [
            f"Document mitigation plan for MEDIUM: {r.name} (signal: '{r.matched_signal}')"
            for r in medium_hits
        ]
        return Verdict.HARD_STOP, conditions

    if len(medium_hits) == 1:
        r = medium_hits[0]
        conditions = [
            f"Include security review milestone before MVP for MEDIUM: {r.name}",
            f"Document risk '{r.matched_signal}' in architecture decision record",
        ]
        return Verdict.PROCEED_WITH_CONDITIONS, conditions

    return Verdict.PROCEED, []


def triage(description: str) -> TriageCard:
    """Run all four category scorers and derive the composite verdict."""
    sd = score_category(description, SIGNALS_SENSITIVE_DATA, "Sensitive data exposure")
    et = score_category(description, SIGNALS_EXTERNAL_TOOLS, "External tool access")
    id_ = score_category(description, SIGNALS_IDENTITY,      "Identity ambiguity")
    inj = score_category(description, SIGNALS_INJECTION,     "Untrusted input injection")

    verdict, conditions = compute_verdict([sd, et, id_, inj])
    return TriageCard(
        use_case=description,
        sensitive_data=sd,
        external_tools=et,
        identity=id_,
        injection=inj,
        verdict=verdict,
        conditions=conditions,
    )


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------


def print_card(card: TriageCard, index: int) -> None:
    w = 76
    print("=" * w)
    print(f"USE CASE {index}")
    print("-" * w)
    # Wrap long description at 70 chars
    desc = card.use_case
    while len(desc) > 70:
        cut = desc[:70].rfind(" ")
        if cut == -1:
            cut = 70
        print(f"  {desc[:cut]}")
        desc = desc[cut:].lstrip()
    print(f"  {desc}")
    print()
    print(f"  {'Category':<30} {'Severity':<8} Matched signal")
    print(f"  {'-'*30} {'-'*8} {'-'*24}")
    for r in [card.sensitive_data, card.external_tools, card.identity, card.injection]:
        print(f"  {r.name:<30} {str(r.severity):<8} {r.matched_signal}")
    print()
    print(f"  VERDICT: {card.verdict.value}")
    if card.conditions:
        print("  CONDITIONS:")
        for c in card.conditions:
            print(f"    - {c}")
    print()


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------


def main() -> None:
    print("=" * 76)
    print("AI USE-CASE THREAT TRIAGE SCORER (Phase 11, Lesson 112)")
    print("=" * 76)
    print()

    use_cases = [
        (
            "Internal analytics dashboard: Summarise weekly sprint metrics from "
            "Jira and display team velocity trends. No external data; read-only "
            "access to project management tool via internal API.",
        ),
        (
            "Document assistant: Employees upload PDF contracts for automatic "
            "summarisation. The model extracts key clauses and saves a summary "
            "to an internal SharePoint folder.",
        ),
        (
            "CRM agent: Acting on behalf of the account manager, the AI reads "
            "customer data from Salesforce and sends email follow-ups, updates "
            "CRM records, and books calendar slots without human review.",
        ),
    ]

    for i, (desc,) in enumerate(use_cases, 1):
        card = triage(desc)
        print_card(card, i)

    print("=" * 76)
    print("HEADLINE: triage is the gate before scoping, not after prototyping")
    print("-" * 76)
    print("  Use case 1: LOW sensitive data + MEDIUM external tool (api) →")
    print("    PROCEED WITH CONDITIONS. Document the API risk in the ADR;")
    print("    include a security review milestone before MVP.")
    print("  Use case 2: MEDIUM sensitive data (employee/contract) + HIGH")
    print("    injection (upload) → HARD STOP. A security architect must")
    print("    sign off before any further scoping or prototyping.")
    print("  Use case 3: HIGH external tool (updates crm) + HIGH identity")
    print("    (on behalf of) → HARD STOP. Two HIGH categories; no scoping")
    print("    continues until authorisation model is reviewed.")
    print()
    print("  Verdict logic: any HIGH → HARD STOP; two+ MEDIUM → HARD STOP;")
    print("  one MEDIUM → PROCEED WITH CONDITIONS; rest → PROCEED.")


if __name__ == "__main__":
    main()
