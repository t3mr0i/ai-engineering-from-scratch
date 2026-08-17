"""
AI Use-Case Intake Simulator
============================

Two deterministic, stdlib-only parts:

Part 1 — Risk Classifier
  Given a structured description of an AI use case, maps it to an EU AI Act
  Article 6 risk tier (Prohibited / High-Risk / Minimal-Risk) and returns the
  obligation list for that tier. GPAI (Chapter V) is a separate axis that
  classifies the *model*, not the use case — deploying a third-party
  foundation model adds a provider-obligation note, it does not change the
  deployer's own tier.

Part 2 — Approval Gate Checker
  Given the classifier output plus three control booleans (DPA signed, data
  classification cleared, logging designed), returns one of three decisions:
  APPROVED, CONDITIONAL, or BLOCKED, with a printed justification.

No network calls, no third-party packages. Run with:
    python3 main.py
"""

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List, Optional


# ---------------------------------------------------------------------------
# Domain types
# ---------------------------------------------------------------------------

class DataType(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    PERSONAL = "personal"             # any personal data under GDPR
    SPECIAL_CATEGORY = "special"      # Art.9 GDPR: health, biometric, ethnicity …
    CONFIDENTIAL = "confidential"     # enterprise classification


class DecisionEffect(Enum):
    NONE = "no decision"
    INFORMATIONAL = "informational recommendation"
    SIGNIFICANT = "significantly affects a person"  # Art.22 GDPR territory
    LEGAL = "legal or quasi-legal effect"


class Sector(Enum):
    GENERIC = "generic"
    EMPLOYMENT = "employment or HR"
    CREDIT = "credit or insurance"
    HEALTH = "health or medical"
    EDUCATION = "education or assessment"
    CRITICAL_INFRA = "critical infrastructure"
    LAW_ENFORCEMENT = "law enforcement"
    MIGRATION = "migration or asylum"


class AIActTier(Enum):
    PROHIBITED = "Prohibited"
    HIGH_RISK = "High-Risk"
    MINIMAL = "Minimal-Risk"


@dataclass
class UseCase:
    name: str
    description: str
    data_types: List[DataType]
    decision_effect: DecisionEffect
    sector: Sector
    is_biometric_public_space: bool = False
    is_social_scoring: bool = False
    deploys_third_party_foundation_model: bool = False  # e.g., calling Claude/GPT API
    # Control states for Part 2
    dpa_signed: Optional[bool] = None          # None = not yet assessed
    data_classification_cleared: Optional[bool] = None
    logging_designed: Optional[bool] = None


@dataclass
class ClassificationResult:
    use_case_name: str
    tier: AIActTier
    obligations: List[str]
    gdpr_triggers: List[str]
    reasoning: str


@dataclass
class ApprovalDecision:
    use_case_name: str
    decision: str  # "APPROVED" | "CONDITIONAL" | "BLOCKED"
    gaps: List[str] = field(default_factory=list)
    justification: str = ""


# ---------------------------------------------------------------------------
# Part 1: Risk Classifier
# ---------------------------------------------------------------------------

HIGH_RISK_SECTORS = {
    Sector.EMPLOYMENT,
    Sector.CREDIT,
    Sector.HEALTH,
    Sector.EDUCATION,
    Sector.CRITICAL_INFRA,
    Sector.LAW_ENFORCEMENT,
    Sector.MIGRATION,
}

OBLIGATIONS_BY_TIER = {
    AIActTier.PROHIBITED: [
        "Do not build or deploy — this use case is prohibited under EU AI Act Article 5.",
    ],
    AIActTier.HIGH_RISK: [
        "Conformity assessment before deployment (Annex VI or VII procedure).",
        "Register in the EU AI Act public database before going live.",
        "Implement mandatory human oversight mechanism.",
        "Maintain detailed technical documentation and logs for 10 years.",
        "Provide clear explanations to affected persons (explainability obligation).",
        "Conduct a Fundamental Rights Impact Assessment (FRIA) if public-sector deployer.",
    ],
    AIActTier.MINIMAL: [
        "Self-declaration of conformity recommended.",
        "Voluntary adherence to EU AI Act Code of Practice.",
        "Maintain internal documentation for incident response.",
    ],
}

# GPAI (Chapter V) obligations attach to the *model provider*, not the
# deployer's Article 6 risk tier — appended as a note when a use case
# deploys a third-party foundation model, regardless of tier.
GPAI_PROVIDER_NOTE = (
    "Deploys a third-party foundation model: GPAI obligations (Chapter V) apply to "
    "the model provider, not this use case's own tier — publishing a capability "
    "evaluation, a copyright training-data summary (Art. 53), and, for systemic-risk "
    "models (>10^25 FLOP), adversarial testing, incident reporting, and cybersecurity "
    "measures. The deployer must verify the provider's compliance documentation and "
    "supplement it with use-case-specific controls."
)


def classify_use_case(uc: UseCase) -> ClassificationResult:
    """Map a use case to an EU AI Act tier and return obligations + GDPR triggers."""

    # --- EU AI Act tier ---
    if uc.is_social_scoring or uc.is_biometric_public_space:
        tier = AIActTier.PROHIBITED
        reasoning = (
            "The use case involves social scoring or real-time biometric identification "
            "in publicly accessible spaces — prohibited under EU AI Act Article 5."
        )
    elif uc.sector in HIGH_RISK_SECTORS:
        tier = AIActTier.HIGH_RISK
        reasoning = (
            f"Sector '{uc.sector.value}' is listed in EU AI Act Annex III as a high-risk "
            f"category. The decision effect is '{uc.decision_effect.value}', which reinforces "
            "the high-risk classification."
        )
    elif uc.deploys_third_party_foundation_model:
        tier = AIActTier.GPAI
        reasoning = (
            "The use case deploys a third-party foundation model (general-purpose AI). "
            "GPAI obligations apply to the model provider; the deployer must verify the "
            "provider's compliance documentation and supplement it with use-case-specific controls."
        )
    else:
        tier = AIActTier.MINIMAL
        reasoning = (
            f"Sector '{uc.sector.value}' is not in EU AI Act Annex III high-risk categories, "
            "no prohibited features detected. Minimal-risk tier applies."
        )

    # --- GDPR triggers ---
    gdpr_triggers: List[str] = []

    if DataType.PERSONAL in uc.data_types or DataType.SPECIAL_CATEGORY in uc.data_types:
        gdpr_triggers.append(
            "GDPR applies: AI processes personal data. Lawful basis, privacy notice, and "
            "data minimisation obligations are active."
        )
        if uc.deploys_third_party_foundation_model:
            gdpr_triggers.append(
                "Data Processing Agreement (Art. 28) required with the model vendor before "
                "the first API call containing personal data."
            )
        gdpr_triggers.append(
            "Cross-border transfer check required: confirm EU SCC or adequacy decision "
            "covers the model's hosting region."
        )

    if DataType.SPECIAL_CATEGORY in uc.data_types:
        gdpr_triggers.append(
            "Special-category data (Art. 9): explicit consent or Art. 9(2) exception needed. "
            "Data Protection Impact Assessment (DPIA) is mandatory."
        )

    if uc.decision_effect in (DecisionEffect.SIGNIFICANT, DecisionEffect.LEGAL):
        gdpr_triggers.append(
            f"Automated decision-making (Art. 22): decision effect is '{uc.decision_effect.value}'. "
            "Human oversight, right to explanation, and right to contest must be implemented."
        )

    if not gdpr_triggers:
        gdpr_triggers.append(
            "No personal data detected and no significant automated decision effect — "
            "no immediate GDPR triggers identified. Verify data types are exhaustive."
        )

    return ClassificationResult(
        use_case_name=uc.name,
        tier=tier,
        obligations=OBLIGATIONS_BY_TIER[tier],
        gdpr_triggers=gdpr_triggers,
        reasoning=reasoning,
    )


# ---------------------------------------------------------------------------
# Part 2: Approval Gate Checker
# ---------------------------------------------------------------------------

def check_approval_gate(uc: UseCase, result: ClassificationResult) -> ApprovalDecision:
    """
    Evaluate the three internal control gates and produce an approval decision.

    Gates:
      1. DPA signed (required if personal/special-category data and third-party model)
      2. Data classification cleared (required for Confidential data)
      3. Logging designed (required for all tiers above Minimal; strongly recommended for Minimal)
    """
    gaps: List[str] = []

    # Gate 1: DPA
    needs_dpa = (
        uc.deploys_third_party_foundation_model
        and (DataType.PERSONAL in uc.data_types or DataType.SPECIAL_CATEGORY in uc.data_types)
    )
    if needs_dpa and uc.dpa_signed is False:
        gaps.append(
            "DPA not signed with model vendor. No personal data may be sent to the API "
            "until a valid Data Processing Agreement is in place (GDPR Art. 28)."
        )
    elif needs_dpa and uc.dpa_signed is None:
        gaps.append(
            "DPA status not confirmed. Verify the signed DPA with the model vendor "
            "before proceeding."
        )

    # Gate 2: Data classification
    if DataType.CONFIDENTIAL in uc.data_types and uc.data_classification_cleared is False:
        gaps.append(
            "Confidential data involved but data classification gate not cleared. "
            "CISO approval and a private/isolated model endpoint are required."
        )
    elif DataType.CONFIDENTIAL in uc.data_types and uc.data_classification_cleared is None:
        gaps.append(
            "Confidential data detected but classification gate not yet assessed. "
            "Route to InfoSec before architecture decisions are made."
        )

    # Gate 3: Logging
    if result.tier in (AIActTier.HIGH_RISK, AIActTier.PROHIBITED):
        if uc.logging_designed is False:
            gaps.append(
                "High-risk tier requires mandatory logging (prompt, response, model version, "
                "timestamp, user identity). Logging design is missing."
            )
        elif uc.logging_designed is None:
            gaps.append(
                "High-risk tier requires mandatory logging. Logging design not yet confirmed."
            )
    elif uc.logging_designed is False:
        gaps.append(
            "Logging not designed. Recommended for all AI systems for incident response."
        )

    # Determine decision
    if result.tier == AIActTier.PROHIBITED:
        decision = "BLOCKED"
        justification = (
            f"Use case '{uc.name}' is BLOCKED. The risk classifier returned tier "
            f"'{result.tier.value}': {result.reasoning} Prohibited-use cases cannot be "
            "approved under any control configuration."
        )
    elif gaps:
        # Check severity: any hard gap (DPA missing, Confidential not cleared) is BLOCKED
        # at classification time; otherwise CONDITIONAL
        hard_block = any(
            "not signed" in g or "not cleared" in g
            for g in gaps
        )
        if hard_block and result.tier == AIActTier.HIGH_RISK:
            decision = "BLOCKED"
            justification = (
                f"Use case '{uc.name}' is BLOCKED. Tier is '{result.tier.value}' and "
                f"{len(gaps)} required control(s) are not in place. Resolve all gaps before "
                "any architecture or procurement work begins."
            )
        else:
            decision = "CONDITIONAL"
            justification = (
                f"Use case '{uc.name}' is CONDITIONAL. Tier is '{result.tier.value}'. "
                f"{len(gaps)} gap(s) must be closed before the use case can progress to "
                "design or development. See gap list."
            )
    else:
        decision = "APPROVED"
        justification = (
            f"Use case '{uc.name}' is APPROVED for the next phase. Tier is "
            f"'{result.tier.value}'. All three control gates are confirmed: DPA (where "
            "required), data classification, and logging design. Compliance obligations "
            "remain active throughout the build and must be validated before go-live."
        )

    return ApprovalDecision(
        use_case_name=uc.name,
        decision=decision,
        gaps=gaps,
        justification=justification,
    )


# ---------------------------------------------------------------------------
# Helpers: formatted printing
# ---------------------------------------------------------------------------

SEPARATOR = "-" * 68


def print_classification(result: ClassificationResult) -> None:
    print(f"\n{SEPARATOR}")
    print(f"Use case : {result.use_case_name}")
    print(f"AI Act tier : {result.tier.value}")
    print(f"Reasoning : {result.reasoning}")
    print("Obligations:")
    for ob in result.obligations:
        print(f"  - {ob}")
    print("GDPR triggers:")
    for trig in result.gdpr_triggers:
        print(f"  * {trig}")


def print_approval(decision: ApprovalDecision) -> None:
    print(f"\nApproval gate : {decision.decision}")
    if decision.gaps:
        print("Gaps to close:")
        for gap in decision.gaps:
            print(f"  ! {gap}")
    print(f"Justification : {decision.justification}")


# ---------------------------------------------------------------------------
# Sample use cases
# ---------------------------------------------------------------------------

SAMPLE_CASES: List[UseCase] = [
    UseCase(
        name="Internal FAQ Chatbot",
        description=(
            "RAG-based chatbot answering questions about internal IT policies. "
            "Data source is a public-facing policy wiki. No personal data in context."
        ),
        data_types=[DataType.INTERNAL],
        decision_effect=DecisionEffect.INFORMATIONAL,
        sector=Sector.GENERIC,
        deploys_third_party_foundation_model=True,
        dpa_signed=True,
        data_classification_cleared=True,
        logging_designed=True,
    ),
    UseCase(
        name="Customer Complaint Escalation AI",
        description=(
            "Summarises customer complaints, flags escalation candidates, drafts responses. "
            "Inputs include customer names, complaint text, and account IDs."
        ),
        data_types=[DataType.PERSONAL, DataType.CONFIDENTIAL],
        decision_effect=DecisionEffect.SIGNIFICANT,
        sector=Sector.GENERIC,
        deploys_third_party_foundation_model=True,
        dpa_signed=False,       # Not yet signed
        data_classification_cleared=None,  # Not yet assessed
        logging_designed=True,
    ),
    UseCase(
        name="CV Screening and Candidate Ranking",
        description=(
            "AI system scores and ranks job applicants based on CV content. "
            "HR manager reviews top-10 shortlist generated by the model."
        ),
        data_types=[DataType.PERSONAL],
        decision_effect=DecisionEffect.LEGAL,
        sector=Sector.EMPLOYMENT,
        deploys_third_party_foundation_model=True,
        dpa_signed=True,
        data_classification_cleared=True,
        logging_designed=False,  # Not yet designed
    ),
    UseCase(
        name="Public CCTV Biometric Identification",
        description=(
            "Real-time face recognition in a shopping mall to identify known shoplifters. "
            "Matches against a law-enforcement watchlist."
        ),
        data_types=[DataType.SPECIAL_CATEGORY],
        decision_effect=DecisionEffect.LEGAL,
        sector=Sector.LAW_ENFORCEMENT,
        is_biometric_public_space=True,
        dpa_signed=True,
        data_classification_cleared=True,
        logging_designed=True,
    ),
]


# ---------------------------------------------------------------------------
# Main driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 68)
    print("AI Use-Case Intake Simulator")
    print("Part 1: EU AI Act Risk Classifier | Part 2: Approval Gate Check")
    print("=" * 68)

    results = []
    for uc in SAMPLE_CASES:
        classification = classify_use_case(uc)
        approval = check_approval_gate(uc, classification)
        results.append((uc, classification, approval))
        print_classification(classification)
        print_approval(approval)

    print(f"\n{'=' * 68}")
    print("HEADLINE: Intake summary across 4 sample use cases")
    print(f"{'=' * 68}")

    tier_counts: dict = {}
    decision_counts: dict = {}
    for _, clf, appr in results:
        tier_counts[clf.tier.value] = tier_counts.get(clf.tier.value, 0) + 1
        decision_counts[appr.decision] = decision_counts.get(appr.decision, 0) + 1

    print("Tier distribution:")
    for tier, count in tier_counts.items():
        print(f"  {tier}: {count}")

    print("Approval gate outcomes:")
    for dec, count in decision_counts.items():
        print(f"  {dec}: {count}")

    print()
    print(
        "Key finding: The GPAI-tier chatbot (all controls confirmed) is the only APPROVED "
        "case. The complaint AI is CONDITIONAL: DPA not signed and Confidential data "
        "classification uncleared — both must be resolved before any personal data can be "
        "sent to the model API. The CV screener is also CONDITIONAL: it is High-Risk under "
        "the AI Act and logging — a mandatory High-Risk obligation — has not been designed. "
        "The biometric surveillance system is BLOCKED regardless of controls: it is a "
        "prohibited use under EU AI Act Article 5."
    )


if __name__ == "__main__":
    main()
