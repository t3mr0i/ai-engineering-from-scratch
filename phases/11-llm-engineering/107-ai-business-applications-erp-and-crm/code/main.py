"""AI use-case boundary classifier and readiness scorer — stdlib Python.

Part 1: Boundary classifier.
    For each use case, the classifier assigns a RAG (Red/Amber/Green) status
    per evaluation axis: system_boundary, data_ownership, integration_pattern,
    and compliance. Rules are deterministic and based on the axis values
    declared in the use case struct.

Part 2: Readiness scorer.
    Aggregates the per-axis RAG into an overall readiness level:
      - GREEN all axes  -> Ready
      - Any RED         -> Blocked (surfaces the blocking axis)
      - Any AMBER, no RED -> Conditional (surfaces the Amber axes)

The driver runs five synthetic use cases spanning a range of outcomes:
  - Single-platform read-only (all Green, Ready)
  - Cross-platform read + recommend with PII (Amber on compliance)
  - Write-back with unclear data ownership (Amber on ownership)
  - Autonomous action with PII across platforms (Red on integration, Blocked)
  - Cross-platform read + summarize with data residency gap (Amber, Conditional)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class RAG(Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"


class Readiness(Enum):
    READY = "READY"
    CONDITIONAL = "CONDITIONAL"
    BLOCKED = "BLOCKED"


class IntegrationPattern(Enum):
    READ_SUMMARIZE = "read_summarize"
    READ_RECOMMEND = "read_recommend"
    WRITE_BACK_CONFIRMED = "write_back_confirmed"
    AUTONOMOUS_BOUNDED = "autonomous_bounded"
    AUTONOMOUS_OPEN = "autonomous_open"


# ---------- Use-case input shape ----------

@dataclass
class UseCase:
    name: str
    platforms: list[str]           # e.g. ["S4HANA", "SuccessFactors"]
    data_types: list[str]          # e.g. ["PII", "financial", "operational"]
    integration_pattern: IntegrationPattern
    data_owner_confirmed: bool     # True if data owner is named and available
    residency_confirmed: bool      # True if data residency contract covers scope


# ---------- Per-axis classifiers ----------

def classify_system_boundary(uc: UseCase) -> tuple[RAG, str]:
    """Green: single platform. Amber: 2 platforms (same or cross-vendor).
    Red: 3+ platforms (the multi-team integration surface is no longer tractable
    without explicit architecture sign-off)."""
    n = len(uc.platforms)
    vendors = {p.split("_")[0].upper() for p in uc.platforms}
    if n == 1:
        return RAG.GREEN, "single platform, no integration contract required"
    if n == 2:
        if len(vendors) == 1:
            return RAG.AMBER, f"two platforms, same vendor — integration spec required"
        return RAG.AMBER, f"two platforms, cross-vendor — multi-team integration contract required"
    return RAG.RED, f"{n} platforms across {len(vendors)} vendor(s) — architecture sign-off required; reduce scope"


def classify_data_ownership(uc: UseCase) -> tuple[RAG, str]:
    """Green: owner confirmed, single domain. Amber: owner confirmed, multi-domain.
    Red: owner not confirmed."""
    if not uc.data_owner_confirmed:
        return RAG.RED, "data owner not confirmed — use case cannot enter design without named owner"
    multi_type = len(uc.data_types) > 1
    if multi_type:
        return RAG.AMBER, f"multiple data domains ({', '.join(uc.data_types)}) — cross-owner sign-off required"
    return RAG.GREEN, f"single data domain ({uc.data_types[0]}), owner confirmed"


def classify_integration_pattern(uc: UseCase) -> tuple[RAG, str]:
    """Green: read-only. Amber: write-back confirmed or autonomous-bounded.
    Red: autonomous open-ended."""
    p = uc.integration_pattern
    if p in (IntegrationPattern.READ_SUMMARIZE, IntegrationPattern.READ_RECOMMEND):
        return RAG.GREEN, f"pattern '{p.value}' — no system writes, standard change"
    if p in (IntegrationPattern.WRITE_BACK_CONFIRMED, IntegrationPattern.AUTONOMOUS_BOUNDED):
        return RAG.AMBER, f"pattern '{p.value}' — elevated change tier, process owner + IT approval required"
    # AUTONOMOUS_OPEN
    return RAG.RED, f"pattern '{p.value}' — executive change + security review + data ethics sign-off required"


def classify_compliance(uc: UseCase) -> tuple[RAG, str]:
    """Green: no sensitive types and residency confirmed. Amber: sensitive types with
    residency confirmed. Red: sensitive types without residency confirmation."""
    sensitive = {"PII", "financial", "legally_privileged", "export_controlled"}
    hits = [d for d in uc.data_types if d in sensitive]
    if not hits:
        return RAG.GREEN, "no sensitive data types identified"
    if uc.residency_confirmed:
        return RAG.AMBER, f"sensitive data ({', '.join(hits)}) — DPA and residency confirmed; processing agreement required"
    return RAG.RED, f"sensitive data ({', '.join(hits)}) without confirmed residency/DPA — cannot route to LLM endpoint"


# ---------- Aggregated readiness scorer ----------

@dataclass
class EvaluationResult:
    use_case: str
    axes: dict[str, tuple[RAG, str]] = field(default_factory=dict)
    readiness: Readiness = Readiness.READY
    readiness_note: str = ""


def evaluate(uc: UseCase) -> EvaluationResult:
    result = EvaluationResult(use_case=uc.name)
    result.axes = {
        "system_boundary":    classify_system_boundary(uc),
        "data_ownership":     classify_data_ownership(uc),
        "integration_pattern": classify_integration_pattern(uc),
        "compliance":         classify_compliance(uc),
    }

    reds   = [ax for ax, (rag, _) in result.axes.items() if rag is RAG.RED]
    ambers = [ax for ax, (rag, _) in result.axes.items() if rag is RAG.AMBER]

    if reds:
        result.readiness = Readiness.BLOCKED
        result.readiness_note = f"BLOCKED — Red on: {', '.join(reds)}"
    elif ambers:
        result.readiness = Readiness.CONDITIONAL
        result.readiness_note = f"CONDITIONAL — Amber on: {', '.join(ambers)} (mitigations required)"
    else:
        result.readiness = Readiness.READY
        result.readiness_note = "READY — all axes Green; proceed to design"

    return result


# ---------- Driver ----------

SAMPLE_USE_CASES: list[UseCase] = [
    UseCase(
        name="S4HANA spend summarizer (read-only, single platform)",
        platforms=["S4HANA"],
        data_types=["operational"],
        integration_pattern=IntegrationPattern.READ_SUMMARIZE,
        data_owner_confirmed=True,
        residency_confirmed=True,
    ),
    UseCase(
        name="Salesforce case + Data Cloud PII recommendation",
        platforms=["SalesforceCore", "SalesforceDataCloud"],
        data_types=["PII", "operational"],
        integration_pattern=IntegrationPattern.READ_RECOMMEND,
        data_owner_confirmed=True,
        residency_confirmed=True,
    ),
    UseCase(
        name="S4HANA write-back: GL coding suggestion (owner unclear)",
        platforms=["S4HANA"],
        data_types=["financial"],
        integration_pattern=IntegrationPattern.WRITE_BACK_CONFIRMED,
        data_owner_confirmed=False,
        residency_confirmed=True,
    ),
    UseCase(
        name="Agentforce autonomous case routing with PII, cross-platform",
        platforms=["SalesforceCore", "SalesforceDataCloud", "ExternalLLMEndpoint"],
        data_types=["PII", "operational"],
        integration_pattern=IntegrationPattern.AUTONOMOUS_OPEN,
        data_owner_confirmed=True,
        residency_confirmed=False,
    ),
    UseCase(
        name="Dynamics 365 + S4HANA cross-vendor spend summarizer",
        platforms=["Dynamics365Finance", "S4HANA"],
        data_types=["financial"],
        integration_pattern=IntegrationPattern.READ_SUMMARIZE,
        data_owner_confirmed=True,
        residency_confirmed=True,
    ),
]


def print_result(r: EvaluationResult) -> None:
    width = 70
    print(f"\n  Use case: {r.use_case}")
    print(f"  {'Axis':<24} {'RAG':<8} Reason")
    print(f"  {'-'*24} {'-'*8} {'-'*34}")
    for ax, (rag, reason) in r.axes.items():
        print(f"  {ax:<24} {rag.value:<8} {reason}")
    print(f"\n  >> {r.readiness_note}")


def main() -> None:
    separator = "=" * 72
    print(separator)
    print("ERP/CRM AI USE-CASE EVALUATOR  (Phase 11, Lesson 107)")
    print("Boundary classifier + readiness scorer — five synthetic use cases")
    print(separator)

    counts = {r: 0 for r in Readiness}
    for uc in SAMPLE_USE_CASES:
        result = evaluate(uc)
        print_result(result)
        counts[result.readiness] += 1

    print()
    print(separator)
    print("HEADLINE: system boundary and integration pattern are the two axes")
    print("that most commonly gate AI use cases in ERP/CRM engagements.")
    print("-" * 72)
    print(f"  Ready:       {counts[Readiness.READY]}  use case(s) — proceed to design")
    print(f"  Conditional: {counts[Readiness.CONDITIONAL]}  use case(s) — named mitigations required before design")
    print(f"  Blocked:     {counts[Readiness.BLOCKED]}  use case(s) — must be redesigned or parked")
    print()
    print("  Rule: re-evaluate when integration pattern changes during delivery.")
    print("  'Read + Summarize' scoped in discovery is not 'Autonomous action'")
    print("  in design — the evaluation must be re-run, not inherited.")
    print(separator)


if __name__ == "__main__":
    main()
