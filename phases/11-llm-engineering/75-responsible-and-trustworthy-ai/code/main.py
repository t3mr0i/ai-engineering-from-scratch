"""Responsible-AI compliance engine — stdlib Python.

Three composable gates, made runnable:

1. assess_gdpr_risk(): retrieval context -> GREEN / AMBER / RED.
   Special-category data without an Art. 9 basis, or any field declared
   unnecessary for the purpose, is RED. Personal data without an Art. 6
   basis is AMBER.

2. evaluate_guardrail_policy(): data tier + AI Act use case + output type
   + human review -> ALLOW / ESCALATE / BLOCK. The deciding rule: a
   CV-shortlisting assistant with GREEN data and no human review is
   ESCALATE — the use case, not the data, is the deciding factor
   (Art. 14, AI Act).

3. proxy_bias_audit(): the live demonstration. A simulated CV shortlister
   ranks 400 anonymised candidates across five postcode bands. The model
   is given no protected attributes; it is given a UK postcode. The
   audit computes the disparity ratio across bands and applies the
   four-fifths rule (0.80). This is the gate that would have caught the
   contract-reviewer's clause-extraction prompts in week one, not week
   six of production.

No model, no network. Run with `python3 main.py`.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
import random


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
    "postcode",
})


@dataclass
class ContextField:
    """One annotated field in a retrieval context."""
    name: str
    field_type: str
    necessary_for_purpose: bool
    legal_basis: str | None


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

    RED   -> special-category data without an Art. 9 basis, or any
              field declared unnecessary (data minimisation).
    AMBER -> personal data without an Art. 6 basis.
    GREEN -> all fields have a lawful basis and are declared necessary.
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
    use_case: str
    data_tier: RiskTier
    output_type: str        # "recommendation", "ranking", "decision", "summary"
    human_review: bool      # is a human reviewing every output before action?
    ai_act_high_risk: bool  # does this use case appear in Annex III?


@dataclass
class PolicyDecision:
    verdict: Verdict
    rule_fired: str
    mitigation: str | None = None


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
        "AI Act Art. 14(4) requires a human overseer who can properly understand, "
        "monitor, and override the system in a high-risk use case. Add that "
        "oversight capability before acting on output.",
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
        None,
    ),
    (
        "GREEN data, non-high-risk, human review optional",
        lambda s: (
            s.data_tier is RiskTier.GREEN
            and not s.ai_act_high_risk
        ),
        Verdict.ALLOW,
        None,
    ),
]


def evaluate_guardrail_policy(spec: LlmCallSpec) -> PolicyDecision:
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


# ---------- Part 3: Proxy-Bias Audit ----------

# Simulated ranking scores for CV shortlisting across UK postcode bands.
# The model is given no protected attributes. It is given a postcode.
# The ranking function approximates a real-world pattern we have seen:
# a model that uses postcode as a proxy for "cultural fit" against
# historical hiring data, scoring postcodes in higher socioeconomic
# bands (which in this geography correlate with ethnicity at r ~ 0.7)
# more favourably.
#
# This is the gate that catches proxy bias BEFORE the first shortlist
# is sent to a hiring manager. Without it, the contract-reviewer
# failure shape repeats — the system passes the data-tier gate, the
# AI Act use-case gate catches it, but only after production.

POSTCODE_BANDS = [
    # (band_label, simulated_mean_score, sample_size)
    ("WC1 (high band)",       0.82, 80),
    ("EC1 (high band)",       0.79, 80),
    ("N1 (mid band)",         0.71, 80),
    ("E1 (mid-low band)",     0.62, 80),
    ("SE1 (low band)",        0.46, 80),
]

FOUR_FIFTHS_THRESHOLD = 0.80


@dataclass
class BiasAuditResult:
    per_band: dict[str, float]
    disparity_ratio: float
    threshold: float
    passes: bool
    notes: list[str]


def proxy_bias_audit(
    rng: random.Random,
    threshold: float = FOUR_FIFTHS_THRESHOLD,
) -> BiasAuditResult:
    """Run a stratified proxy-bias audit on the simulated postcode data.

    Returns the shortlist rate per band, the disparity ratio
    (lowest rate / highest rate), and whether the ratio clears the
    four-fifths rule.
    """
    shortlist_rates: dict[str, float] = {}
    notes: list[str] = []

    for label, mean, n in POSTCODE_BANDS:
        # The simulated ranking produces a shortlist (top-half) rate per
        # band. We sample from a Bernoulli with p derived from the mean
        # ranking score, which approximates the realistic disparity shape
        # without claiming to be a specific real dataset.
        p_shortlist = max(0.05, min(0.95, mean * 0.85 + 0.10))
        successes = sum(1 for _ in range(n) if rng.random() < p_shortlist)
        shortlist_rates[label] = successes / n

    rates = list(shortlist_rates.values())
    highest = max(rates)
    lowest = min(rates)
    ratio = lowest / highest if highest > 0 else 0.0

    if ratio < threshold:
        notes.append(
            f"Disparity ratio {ratio:.3f} is below the four-fifths rule "
            f"({threshold:.2f}). The system fails the proxy-bias gate and "
            f"is BLOCKED from production regardless of overall accuracy."
        )
        notes.append(
            "Cheapest remediation levers, in order: (1) drop postcode from "
            "the retrieval context entirely, (2) replace the ranking prompt "
            "with one that scores on explicit skills only, (3) re-rank with "
            "a fairness-constrained model."
        )
    else:
        notes.append(
            f"Disparity ratio {ratio:.3f} clears the threshold ({threshold:.2f}). "
            "Proxy bias audit passed at this threshold; re-run on every "
            "model or prompt change."
        )

    return BiasAuditResult(
        per_band=shortlist_rates,
        disparity_ratio=ratio,
        threshold=threshold,
        passes=ratio >= threshold,
        notes=notes,
    )


# ---------- Driver ----------

def _print_gdpr_section(label: str, purpose: str, fields: list[ContextField]) -> RiskTier:
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


def _print_bias_audit(label: str, result: BiasAuditResult) -> None:
    print(f"  [{label}]")
    print(f"    Shortlist rate per postcode band:")
    for band, rate in result.per_band.items():
        print(f"      - {band:<24} {rate:.3f}")
    print(f"    Disparity ratio: {result.disparity_ratio:.3f} "
          f"(threshold {result.threshold:.2f})")
    print(f"    Verdict: {'PASS' if result.passes else 'BLOCK'}")
    for n in result.notes:
        print(f"    NOTE: {n}")
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

    tier_a = _print_gdpr_section(
        label="Context A — account support chatbot",
        purpose="Resolve customer account query",
        fields=[
            ContextField("account_id", "employee_id", True, "contract"),
            ContextField("query_text", "full_name", True, "contract"),
        ],
    )

    _print_gdpr_section(
        label="Context B — marketing personalisation",
        purpose="Personalise product recommendations",
        fields=[
            ContextField("email", "email", True, None),
            ContextField("location", "location_data", True, None),
        ],
    )

    tier_c = _print_gdpr_section(
        label="Context C — HR benefit eligibility screener",
        purpose="Determine benefit eligibility",
        fields=[
            ContextField("health_status", "health_data", True, "legitimate_interest"),
            ContextField("employee_salary", "salary", False, "contract"),
            ContextField("employee_email", "email", True, "contract"),
        ],
    )

    # ── Part 2: Guardrail Policy Evaluator ───────────────────────────────────
    print("PART 2  GUARDRAIL POLICY EVALUATOR")
    print("-" * 72)
    print()

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

    _print_guardrail_section(
        "Spec 4 — benefit eligibility with human review",
        LlmCallSpec(
            use_case="HR — benefit eligibility recommendation (human reviews each case)",
            data_tier=RiskTier.GREEN,
            output_type="recommendation",
            human_review=True,
            ai_act_high_risk=True,
        ),
    )

    # ── Part 3: Proxy-Bias Audit (the demonstrated failure shape) ────────────
    print("PART 3  PROXY-BIAS AUDIT")
    print("-" * 72)
    print()
    print("  Simulated CV shortlister. The model is given no protected")
    print("  attributes. It is given a UK postcode. The audit computes")
    print("  the shortlist rate per band and the disparity ratio across")
    print("  bands. The four-fifths rule is the threshold.")
    print()

    rng = random.Random(20260622)  # deterministic for reproducibility
    audit = proxy_bias_audit(rng)
    _print_bias_audit("Audit 1 — postcode as proxy, default threshold 0.80", audit)

    # ── Summary ──────────────────────────────────────────────────────────────
    print(sep)
    print("HEADLINE: GREEN data is not shippable — the proxy-bias gate catches")
    print("         what the data-tier gate and the use-case gate both miss")
    print("-" * 72)
    print()
    print("  Part 1 (GDPR data tier):")
    print("    Context A (support chatbot):    GREEN")
    print("    Context B (marketing, no basis): AMBER — Art. 6 basis missing")
    print("    Context C (HR health,           RED   — Art. 9 lacks explicit basis")
    print("                 + unnecessary salary):       and Art. 5(1)(c) violated")
    print()
    print("  Part 2 (guardrail composition):")
    print("    Spec 1 (summary, GREEN, no risk): ALLOW")
    print("    Spec 2 (CV ranking, GREEN, no review): ESCALATE — use-case triggers")
    print("                                              Art. 14 human oversight")
    print("    Spec 3 (decision, RED):              BLOCK  — resolve data tier first")
    print("    Spec 4 (recommendation, + review):   ALLOW  — Art. 14 obligation met")
    print()
    print(f"  Part 3 (proxy-bias audit):")
    print(f"    Disparity ratio across postcode bands: {audit.disparity_ratio:.3f}")
    print(f"    Four-fifths threshold:                 {audit.threshold:.2f}")
    print(f"    Verdict:                               "
          f"{'PASS' if audit.passes else 'BLOCK — system is not production-ready'}")
    print()
    print("  The demonstrated failure shape is the GREEN-data-but-blocked-")
    print("  anyway outcome. Spec 2 in Part 2 passes the data-tier gate")
    print("  (GREEN) and is ESCALATEd by the use-case gate. Part 3 shows")
    print("  the third gate that catches the same failure shape from a")
    print("  different angle: even when the data is clean and the policy")
    print("  verdict allows it with human review, a disparity ratio of "
          f"{audit.disparity_ratio:.3f}")
    print(f"  below {audit.threshold:.2f} BLOCKs the deployment on proxy bias")
    print("  alone. This is the gate that would have caught the contract-")
    print("  reviewer's clause-extraction prompts in week one — the gate")
    print("  that runs at retrieval time, not in the quarterly review.")


if __name__ == "__main__":
    main()
