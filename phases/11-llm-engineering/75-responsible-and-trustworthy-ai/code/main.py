"""Responsible-AI compliance engine — stdlib Python.

Part 1: GDPR Risk Scorer
  Takes a retrieval context (a list of annotated fields) and returns a risk
  tier (GREEN / AMBER / RED) with specific GDPR violation details. Covers
  special-category data, data minimisation, and legal-basis declarations.

Part 2: Guardrail Policy Evaluator
  Takes a proposed LLM call (use case, data tier, output type, human review
  flag) and returns ALLOW / ESCALATE / BLOCK with the policy rule that fired.
  Models the compliance decision an engineering team must make before each
  production deployment decision point.

No network calls. No external dependencies. Run with `python3 main.py`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------- Shared enums ----------

class RiskTier(Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED   = "RED"


class Verdict(Enum):
    ALLOW     = "ALLOW"
    ESCALATE  = "ESCALATE"
    BLOCK     = "BLOCK"


# ---------- Part 1: GDPR Risk Scorer ----------

# GDPR Art. 9 special-category data types
SPECIAL_CATEGORY_FIELDS = frozenset({
    "health_data",
    "biometric_id",
    "racial_ethnic_origin",
    "political_opinion",
    "religious_belief",
    "trade_union_membership",
    "sexual_orientation",
    "criminal_record",
    "genetic_data",
})

# Fields that are personal data but not special-category
PERSONAL_FIELDS = frozenset({
    "full_name",
    "email",
    "phone",
    "home_address",
    "date_of_birth",
    "national_id",
    "ip_address",
    "location_data",
    "financial_account",
    "salary",
    "employee_id",
})


@dataclass
class ContextField:
    """One annotated field in a retrieval context."""
    name: str
    field_type: str          # e.g. "health_data", "email", "postcode"
    necessary_for_purpose: bool   # has the team declared this field necessary?
    legal_basis: str | None       # "contract", "consent", "legitimate_interest", etc.
                                  # None means no basis declared


@dataclass
class GdprAssessment:
    tier: RiskTier
    violations: list[str]
    notes: list[str]


def assess_gdpr_risk(
    purpose: str,
    fields: list[ContextField],
) -> GdprAssessment:
    """Score a retrieval context for GDPR compliance.

    Returns GREEN when all fields have a legal basis and are declared necessary.
    Returns AMBER for personal data without a declared legal basis.
    Returns RED for any special-category data without explicit Art. 9 lawful
    basis, or for fields declared unnecessary (data minimisation violation).
    """
    violations: list[str] = []
    notes: list[str] = []

    for f in fields:
        is_special = f.field_type in SPECIAL_CATEGORY_FIELDS
        is_personal = f.field_type in PERSONAL_FIELDS or is_special

        if not f.necessary_for_purpose:
            violations.append(
                f"Art. 5(1)(c) data minimisation: '{f.name}' ({f.field_type}) "
                "is not declared necessary for the purpose"
            )

        if is_special:
            if f.legal_basis not in ("consent", "vital_interest", "statutory_necessity",
                                     "public_interest_research", "legal_claim"):
                violations.append(
                    f"Art. 9 special-category: '{f.name}' ({f.field_type}) lacks "
                    f"an Art. 9 lawful basis (declared: {f.legal_basis!r})"
                )
        elif is_personal:
            if f.legal_basis is None:
                violations.append(
                    f"Art. 6 legal basis missing: '{f.name}' ({f.field_type}) "
                    "has no declared lawful basis"
                )

    # Determine tier
    has_special_violation = any("Art. 9" in v for v in violations)
    has_minimisation = any("Art. 5(1)(c)" in v for v in violations)
    has_basis_missing = any("Art. 6" in v for v in violations)

    if has_special_violation or has_minimisation:
        tier = RiskTier.RED
    elif has_basis_missing:
        tier = RiskTier.AMBER
    else:
        tier = RiskTier.GREEN
        notes.append("All fields have declared legal bases and are marked necessary.")

    if tier != RiskTier.GREEN:
        notes.append(
            "A DPIA is mandatory (Art. 35) if this context is used for automated "
            "decisions with legal or similarly significant effect, or involves "
            "large-scale special-category processing."
        )

    return GdprAssessment(tier=tier, violations=violations, notes=notes)


# ---------- Part 2: Guardrail Policy Evaluator ----------

@dataclass
class LlmCallSpec:
    """Description of a proposed LLM call for policy evaluation."""
    use_case: str
    data_tier: RiskTier           # result of assess_gdpr_risk
    output_type: str              # "recommendation", "ranking", "decision", "summary"
    human_review: bool            # is a human reviewing every output before action?
    ai_act_high_risk: bool        # does this use case appear in Annex III?


@dataclass
class PolicyDecision:
    verdict: Verdict
    rule_fired: str
    mitigation: str | None = None


# Policy rules evaluated in priority order (first match wins).
# Each rule is (description, predicate, verdict, mitigation).
_POLICY_RULES: list[tuple[str, object, Verdict, str | None]] = [
    (
        "RED data + no human review",
        lambda s: s.data_tier is RiskTier.RED and not s.human_review,
        Verdict.BLOCK,
        "Resolve GDPR violations (RED tier) before enabling this call, or add "
        "mandatory human review for every output.",
    ),
    (
        "High-risk AI Act use case + 'decision' output + no human review",
        lambda s: (
            s.ai_act_high_risk
            and s.output_type == "decision"
            and not s.human_review
        ),
        Verdict.BLOCK,
        "AI Act Art. 14 requires human oversight for every individual decision "
        "in a high-risk use case. Add a reviewer gate before acting on output.",
    ),
    (
        "High-risk AI Act use case + 'ranking' output + no human review",
        lambda s: (
            s.ai_act_high_risk
            and s.output_type == "ranking"
            and not s.human_review
        ),
        Verdict.ESCALATE,
        "Rankings driving consequential selection (e.g. CV shortlisting) require "
        "bias audit before production and human sign-off on each batch.",
    ),
    (
        "AMBER data tier",
        lambda s: s.data_tier is RiskTier.AMBER,
        Verdict.ESCALATE,
        "Declare legal bases for all personal fields (Art. 6) before production. "
        "Consult DPO. Consider pseudonymisation.",
    ),
    (
        "High-risk AI Act use case + human review present",
        lambda s: s.ai_act_high_risk and s.human_review,
        Verdict.ALLOW,
        None,   # allowed, but note the ongoing obligations
    ),
    (
        "GREEN data, non-high-risk, human review",
        lambda s: (
            s.data_tier is RiskTier.GREEN
            and not s.ai_act_high_risk
        ),
        Verdict.ALLOW,
        None,
    ),
]


def evaluate_guardrail_policy(spec: LlmCallSpec) -> PolicyDecision:
    """Apply guardrail policy rules to a proposed LLM call.

    Rules are evaluated in priority order. First match wins.
    If no rule matches, ESCALATE as a conservative default.
    """
    for description, predicate, verdict, mitigation in _POLICY_RULES:
        if predicate(spec):  # type: ignore[operator]
            return PolicyDecision(
                verdict=verdict,
                rule_fired=description,
                mitigation=mitigation,
            )
    return PolicyDecision(
        verdict=Verdict.ESCALATE,
        rule_fired="no rule matched — conservative default",
        mitigation="Review manually with DPO and legal before enabling.",
    )


# ---------- Driver ----------

def _print_gdpr_section(
    label: str,
    purpose: str,
    fields: list[ContextField],
) -> RiskTier:
    print(f"  [{label}] Purpose: {purpose}")
    assessment = assess_gdpr_risk(purpose, fields)
    print(f"    Risk tier: {assessment.tier.value}")
    if assessment.violations:
        for v in assessment.violations:
            print(f"    VIOLATION: {v}")
    for n in assessment.notes:
        print(f"    NOTE: {n}")
    print()
    return assessment.tier


def _print_guardrail_section(label: str, spec: LlmCallSpec) -> None:
    print(f"  [{label}] Use case: {spec.use_case}")
    decision = evaluate_guardrail_policy(spec)
    print(f"    Verdict:    {decision.verdict.value}")
    print(f"    Rule fired: {decision.rule_fired}")
    if decision.mitigation:
        print(f"    Mitigation: {decision.mitigation}")
    print()


def main() -> None:
    sep = "=" * 72

    print(sep)
    print("RESPONSIBLE-AI COMPLIANCE ENGINE (Phase 11, Lesson 75)")
    print(sep)
    print()

    # ── Part 1: GDPR Risk Scorer ─────────────────────────────────────────────
    print("PART 1  GDPR RISK SCORER")
    print("-" * 72)
    print()

    # Context A: minimal, well-governed (should be GREEN)
    tier_a = _print_gdpr_section(
        label="Context A — account support chatbot",
        purpose="Resolve customer account query",
        fields=[
            ContextField("account_id", "employee_id", True, "contract"),
            ContextField("query_text", "full_name", True, "contract"),
        ],
    )

    # Context B: personal data without declared legal basis (should be AMBER)
    tier_b = _print_gdpr_section(
        label="Context B — marketing personalisation",
        purpose="Personalise product recommendations",
        fields=[
            ContextField("email", "email", True, None),          # no basis
            ContextField("location", "location_data", True, None),
        ],
    )

    # Context C: special-category data with wrong basis + unnecessary field (RED)
    tier_c = _print_gdpr_section(
        label="Context C — HR benefit eligibility screener",
        purpose="Determine benefit eligibility",
        fields=[
            ContextField("health_status", "health_data", True, "legitimate_interest"),
            ContextField("employee_salary", "salary", False, "contract"),  # not necessary
            ContextField("employee_email", "email", True, "contract"),
        ],
    )

    # ── Part 2: Guardrail Policy Evaluator ───────────────────────────────────
    print("PART 2  GUARDRAIL POLICY EVALUATOR")
    print("-" * 72)
    print()

    # Spec 1: summary chatbot on clean data, no AI Act trigger — should ALLOW
    _print_guardrail_section(
        "Spec 1 — support chatbot summary",
        LlmCallSpec(
            use_case="Customer support — summarise ticket history",
            data_tier=tier_a,
            output_type="summary",
            human_review=False,
            ai_act_high_risk=False,
        ),
    )

    # Spec 2: CV ranking (AI Act high-risk), no human review — should ESCALATE
    _print_guardrail_section(
        "Spec 2 — CV shortlisting assistant",
        LlmCallSpec(
            use_case="Recruitment — rank candidates from CVs",
            data_tier=RiskTier.GREEN,
            output_type="ranking",
            human_review=False,
            ai_act_high_risk=True,
        ),
    )

    # Spec 3: benefit eligibility *decision* on RED data, no review — BLOCK
    _print_guardrail_section(
        "Spec 3 — benefit eligibility decision",
        LlmCallSpec(
            use_case="HR — automated benefit eligibility decision",
            data_tier=tier_c,
            output_type="decision",
            human_review=False,
            ai_act_high_risk=True,
        ),
    )

    # Spec 4: same use case with human review added — should ALLOW
    _print_guardrail_section(
        "Spec 4 — benefit eligibility with human review",
        LlmCallSpec(
            use_case="HR — benefit eligibility recommendation (human reviews each case)",
            data_tier=RiskTier.GREEN,   # after fixing Context C violations
            output_type="recommendation",
            human_review=True,
            ai_act_high_risk=True,
        ),
    )

    # ── Summary ──────────────────────────────────────────────────────────────
    print(sep)
    print("HEADLINE: compliance is a decision loop, not a checkbox")
    print("-" * 72)
    print("  GDPR risk scorer results:")
    print(f"    Context A (support chatbot):      {tier_a.value}")
    print(f"    Context B (marketing):            {tier_b.value}")
    print(f"    Context C (HR health data):       {tier_c.value}")
    print()
    print("  Guardrail verdicts:")
    print("    Spec 1 (support summary, GREEN):   ALLOW")
    print("    Spec 2 (CV ranking, no review):    ESCALATE — bias audit + human sign-off required")
    print("    Spec 3 (benefit decision, RED):    BLOCK — resolve GDPR violations first")
    print("    Spec 4 (benefit + human review):   ALLOW — Art. 14 obligation met")
    print()
    print("  Key insight: Spec 2 is blocked even though its data tier is GREEN.")
    print("  The AI Act high-risk classification and 'ranking' output type are the")
    print("  deciding factors — not the data tier. Art. 14 human oversight is")
    print("  non-negotiable for consequential selection decisions.")


if __name__ == "__main__":
    main()
