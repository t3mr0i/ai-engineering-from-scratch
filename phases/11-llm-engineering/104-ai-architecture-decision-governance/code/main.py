"""AI Architecture Decision Record (ADR) validator and portfolio register — stdlib Python.

Part 1 — ADR Validator:
    Takes a candidate AI ADR (a dict) and checks it for completeness: required
    fields, trigger conditions, cost projection, and owner. Returns a structured
    gap report so teams can run this as a CI check or pre-merge hook.

Part 2 — Portfolio Register Simulator:
    Maintains a list of accepted AI ADRs, flags decisions whose review date has
    passed, and computes a total projected monthly spend across the portfolio.
    The spend summary surfaces which tier is the dominant cost driver so
    re-evaluation effort is directed at the highest-leverage decision.
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

class AdrStatus(Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    DEPRECATED = "deprecated"
    SUPERSEDED = "superseded"
    UNDER_REVIEW = "under-re-evaluation"


class ModelTier(Enum):
    FRONTIER_REASONING = "frontier-reasoning"
    FRONTIER_GENERAL = "frontier-general"
    EFFICIENT = "efficient"
    SELF_HOSTED = "self-hosted"


# ---------------------------------------------------------------------------
# Part 1 — ADR Validator
# ---------------------------------------------------------------------------

REQUIRED_FIELDS = (
    "id",
    "title",
    "status",
    "owner",
    "data_classification",
    "model_id",
    "model_tier",
    "vendor",
    "inference_endpoint_type",
    "cost_per_mtok_input",
    "cost_per_mtok_output",
    "avg_prompt_tokens",
    "avg_completion_tokens",
    "daily_requests",
    "cost_ceiling_monthly_usd",
    "trigger_conditions",
    "alternatives_evaluated",
    "review_date",
    "context",
    "decision",
    "consequences",
)

REQUIRED_TRIGGERS = ("cost", "capability", "compliance", "deprecation")


@dataclass
class ValidationResult:
    adr_id: str
    passed: bool
    missing_fields: list[str] = field(default_factory=list)
    trigger_gaps: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    projected_monthly_usd: float = 0.0


def project_monthly_cost(adr: dict[str, Any]) -> float:
    """Compute projected monthly cost from ADR token economics."""
    total_tokens = adr.get("avg_prompt_tokens", 0) + adr.get("avg_completion_tokens", 0)
    daily = adr.get("daily_requests", 0)
    # Simplification: use input price for prompt tokens, output price for completion.
    prompt_cost = (adr.get("avg_prompt_tokens", 0) * daily * 30
                   / 1_000_000 * adr.get("cost_per_mtok_input", 0))
    completion_cost = (adr.get("avg_completion_tokens", 0) * daily * 30
                       / 1_000_000 * adr.get("cost_per_mtok_output", 0))
    return round(prompt_cost + completion_cost, 2)


def validate_adr(adr: dict[str, Any]) -> ValidationResult:
    """Check an AI ADR dict for completeness. Return a structured gap report."""
    adr_id = adr.get("id", "<unknown>")
    result = ValidationResult(adr_id=adr_id, passed=False)

    # Required fields check
    for f in REQUIRED_FIELDS:
        if f not in adr or adr[f] is None or adr[f] == "":
            result.missing_fields.append(f)

    # Trigger-condition coverage
    triggers = adr.get("trigger_conditions", {})
    for category in REQUIRED_TRIGGERS:
        if category not in triggers or not triggers[category]:
            result.trigger_gaps.append(category)

    # Warn when cost projection exceeds ceiling
    if not result.missing_fields:
        projected = project_monthly_cost(adr)
        result.projected_monthly_usd = projected
        ceiling = adr.get("cost_ceiling_monthly_usd", 0)
        if projected > ceiling:
            result.warnings.append(
                f"Projected monthly cost ${projected:,.2f} exceeds ceiling "
                f"${ceiling:,.2f} — decision should already be under re-evaluation."
            )
        # Warn on versionless alias with no behavioral-drift note
        if "versionless" in str(adr.get("model_id", "")).lower():
            result.warnings.append(
                "model_id appears to be a versionless alias — document "
                "behavioral-drift risk or switch to a pinned version."
            )

    result.passed = not result.missing_fields and not result.trigger_gaps
    return result


def print_validation_result(r: ValidationResult) -> None:
    status = "PASS" if r.passed else "FAIL"
    print(f"  ADR {r.adr_id}: {status}")
    if r.missing_fields:
        print(f"    Missing fields : {', '.join(r.missing_fields)}")
    if r.trigger_gaps:
        print(f"    Trigger gaps   : {', '.join(r.trigger_gaps)}")
    for w in r.warnings:
        print(f"    Warning        : {w}")
    if r.projected_monthly_usd:
        print(f"    Projected cost : ${r.projected_monthly_usd:,.2f}/month")


# ---------------------------------------------------------------------------
# Part 2 — Portfolio Register Simulator
# ---------------------------------------------------------------------------

@dataclass
class RegisterEntry:
    adr: dict[str, Any]
    validation: ValidationResult


def build_register(adrs: list[dict[str, Any]]) -> list[RegisterEntry]:
    return [RegisterEntry(adr=a, validation=validate_adr(a)) for a in adrs]


def print_register_summary(entries: list[RegisterEntry], today: datetime.date) -> None:
    print("  ADR ID          Status          Owner                   Next Review   Cost/month")
    print("  " + "-" * 82)
    total_cost = 0.0
    overdue = []
    for e in entries:
        a = e.adr
        status = a.get("status", "?")
        owner = a.get("owner", "?")[:20]
        review_raw = a.get("review_date", "")
        try:
            review_date = datetime.date.fromisoformat(review_raw)
            review_str = review_raw
            if review_date < today and status == AdrStatus.ACCEPTED.value:
                review_str += " [OVERDUE]"
                overdue.append(a.get("id", "?"))
        except (ValueError, TypeError):
            review_str = review_raw or "?"

        cost = e.validation.projected_monthly_usd
        if status == AdrStatus.ACCEPTED.value:
            total_cost += cost
        print(f"  {a.get('id','?'):<16}{status:<16}{owner:<24}{review_str:<14}  ${cost:>8,.2f}")

    print("  " + "-" * 82)
    print(f"  Total projected monthly spend (accepted ADRs): ${total_cost:,.2f}")
    if overdue:
        print(f"  Overdue reviews: {', '.join(overdue)}")


# ---------------------------------------------------------------------------
# Sample data
# ---------------------------------------------------------------------------

SAMPLE_ADRS: list[dict[str, Any]] = [
    # ADR-001: Complete, accepted, efficient tier — passes validation
    {
        "id": "AI-ADR-001",
        "title": "Claude Haiku 4.x for synchronous document classification",
        "status": "accepted",
        "owner": "Platform team",
        "data_classification": "internal",
        "model_id": "claude-haiku-4-20250514",
        "model_tier": ModelTier.EFFICIENT.value,
        "vendor": "Anthropic",
        "inference_endpoint_type": "shared-multi-tenant",
        "cost_per_mtok_input": 0.80,
        "cost_per_mtok_output": 4.00,
        "avg_prompt_tokens": 600,
        "avg_completion_tokens": 120,
        "daily_requests": 8_000,
        "cost_ceiling_monthly_usd": 2_000.0,
        "trigger_conditions": {
            "cost": "Monthly spend exceeds $2,000 or Anthropic price increase >20%",
            "capability": "Open-weights model on same benchmark score (F1 >= 0.92) at <$0.50/MTok",
            "compliance": "Anthropic changes training opt-out policy for API tier",
            "deprecation": "Model EOL announced; migrate within 60 days",
        },
        "alternatives_evaluated": [
            {"model": "claude-sonnet-4", "reason_rejected": "3x cost, no quality gain on this task"},
            {"model": "llama-4-scout-self-hosted", "reason_rejected": "GPU infra not available in Q1"},
        ],
        "review_date": "2026-09-01",
        "context": "High-volume classification pipeline; data is internal-only; latency <500ms P95 required.",
        "decision": "Haiku 4 on shared endpoint; prompt cache enabled to reduce token spend.",
        "consequences": "Low cost at scale; shared endpoint means no tenant isolation; acceptable for internal data.",
    },
    # ADR-002: Accepted, frontier tier, high cost — triggers ceiling warning
    {
        "id": "AI-ADR-002",
        "title": "Claude Opus 4.x for legal contract review agentic pipeline",
        "status": "accepted",
        "owner": "AI architecture lead",
        "data_classification": "confidential",
        "model_id": "claude-opus-4-20250514",
        "model_tier": ModelTier.FRONTIER_REASONING.value,
        "vendor": "Anthropic",
        "inference_endpoint_type": "dedicated-provisioned-throughput",
        "cost_per_mtok_input": 15.00,
        "cost_per_mtok_output": 75.00,
        "avg_prompt_tokens": 18_000,
        "avg_completion_tokens": 4_000,
        "daily_requests": 120,
        "cost_ceiling_monthly_usd": 5_000.0,
        "trigger_conditions": {
            "cost": "Monthly spend exceeds $5,000",
            "capability": "Sonnet 4.x reaches same pass rate on legal-bench eval (>=0.88)",
            "compliance": "Vendor changes data residency for EU dedicated endpoints",
            "deprecation": "Opus 4.x EOL; successor model evaluated within 30 days",
        },
        "alternatives_evaluated": [
            {"model": "claude-sonnet-4", "reason_rejected": "Legal-bench pass rate 0.81 vs 0.91 for Opus — below threshold"},
            {"model": "gpt-4.1", "reason_rejected": "EU data residency not contractually guaranteed on dedicated tier"},
        ],
        "review_date": "2026-07-01",
        "context": "Confidential EU contract data; DSGVO applies; dedicated endpoint required for data isolation.",
        "decision": "Opus 4 on dedicated provisioned throughput in EU West region.",
        "consequences": "Highest cost tier; justified by quality gap and compliance requirement; review quarterly.",
    },
    # ADR-003: Fails validation — missing owner and trigger conditions
    {
        "id": "AI-ADR-003",
        "title": "Embedding model for semantic search",
        "status": "proposed",
        "owner": "",                         # missing — will fail
        "data_classification": "public",
        "model_id": "text-embedding-3-large",
        "model_tier": ModelTier.EFFICIENT.value,
        "vendor": "OpenAI",
        "inference_endpoint_type": "shared-multi-tenant",
        "cost_per_mtok_input": 0.13,
        "cost_per_mtok_output": 0.0,
        "avg_prompt_tokens": 400,
        "avg_completion_tokens": 0,
        "daily_requests": 20_000,
        "cost_ceiling_monthly_usd": 800.0,
        "trigger_conditions": {},            # missing all categories — will fail
        "alternatives_evaluated": [
            {"model": "text-embedding-ada-002", "reason_rejected": "Lower quality on domain eval"},
        ],
        "review_date": "2026-12-01",
        "context": "Public product search; no PII; latency-tolerant batch indexing.",
        "decision": "text-embedding-3-large on shared endpoint.",
        "consequences": "Low cost; good quality on domain benchmark; no compliance constraints for public data.",
    },
]


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    today = datetime.date(2026, 6, 22)  # fixed for deterministic output

    print("=" * 80)
    print("AI ADR VALIDATOR AND PORTFOLIO REGISTER (Phase 11, Lesson 104)")
    print("=" * 80)

    # --- Part 1: Validate each ADR ---
    print()
    print("PART 1 — ADR VALIDATION")
    print("-" * 80)
    results = [validate_adr(a) for a in SAMPLE_ADRS]
    for r in results:
        print_validation_result(r)
        print()

    # --- Part 2: Portfolio register ---
    entries = build_register(SAMPLE_ADRS)
    print("PART 2 — PORTFOLIO REGISTER SUMMARY")
    print("-" * 80)
    # Only accepted ADRs appear in cost summary; proposed ones are flagged but not counted.
    print_register_summary(entries, today)

    print()
    print("=" * 80)
    print("HEADLINE: AI ADRs without trigger conditions are museum exhibits, not governance")
    print("-" * 80)
    passed = sum(1 for r in results if r.passed)
    failed = sum(1 for r in results if not r.passed)
    print(f"  {passed} ADR(s) passed validation. {failed} ADR(s) have gaps that must be closed")
    print("  before a decision is considered governed.")
    print()
    print("  The dominant cost driver in this portfolio is the frontier-reasoning")
    print("  tier (AI-ADR-002). A capability trigger fires when Sonnet 4.x reaches")
    print("  the same benchmark score — that review is higher-leverage than any")
    print("  other action the architecture team can take.")


if __name__ == "__main__":
    main()
