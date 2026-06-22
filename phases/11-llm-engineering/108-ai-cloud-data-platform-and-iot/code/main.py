"""Data-boundary classifier and latency budget modeler — stdlib Python.

Part 1: Boundary classifier.
  Takes a data source specification (jurisdiction, network perimeter, sensitivity,
  refresh rate in seconds) and maps it to the boundary types it crosses
  (sovereignty, latency, ownership) and the feasible architecture patterns.

Part 2: Latency budget modeler.
  Takes a per-stage latency allocation and a total user-facing budget (ms),
  checks feasibility, and identifies the binding-constraint stage.

The driver runs three representative use cases drawn from the lesson:
  A. Factory-floor fault detection (OT-sourced sensor data, sub-3s budget)
  B. Regulatory document summarization (GDPR-scoped, flexible latency)
  C. Customer-churn prediction (CRM data, cloud-native, relaxed latency)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------- Enums ----------

class BoundaryType(Enum):
    SOVEREIGNTY = "sovereignty"
    LATENCY = "latency"
    OWNERSHIP = "ownership"


class ArchPattern(Enum):
    CLOUD_FIRST_RAG = "Cloud-first RAG"
    EDGE_PREPROCESSED_RAG = "Edge-preprocessed RAG"
    ON_PREMISES_INFERENCE = "On-premises inference"
    HYBRID_FEDERATED = "Hybrid federated"


# ---------- Data source specification ----------

@dataclass
class DataSource:
    name: str
    jurisdiction: str          # e.g. "EU", "US", "on-prem-only"
    perimeter: str             # "public-cloud", "private-cloud", "ot-network", "on-prem"
    sensitivity: str           # "personal", "regulated", "internal", "public"
    refresh_rate_seconds: float  # how often data is updated; use 0 for streaming


# ---------- Use case specification ----------

@dataclass
class UseCase:
    name: str
    sources: list[DataSource]
    user_latency_budget_ms: float
    pipeline_stages: list[tuple[str, float, bool]]
    # pipeline_stages: (stage_name, allocated_ms, negotiable?)


# ---------- Part 1: Boundary classifier ----------

LATENCY_THRESHOLD_SECONDS = 1.0  # refresh rates faster than this trigger a latency boundary


def classify_boundaries(source: DataSource) -> set[BoundaryType]:
    boundaries: set[BoundaryType] = set()

    # Sovereignty: data that may not leave a perimeter
    if source.perimeter in ("ot-network", "on-prem") or source.sensitivity in ("personal", "regulated"):
        boundaries.add(BoundaryType.SOVEREIGNTY)

    # Latency: streaming or near-real-time data
    if source.refresh_rate_seconds < LATENCY_THRESHOLD_SECONDS:
        boundaries.add(BoundaryType.LATENCY)

    # Ownership: any non-public data has a steward with rights over modification/deletion
    if source.sensitivity != "public":
        boundaries.add(BoundaryType.OWNERSHIP)

    return boundaries


def select_pattern(all_boundaries: set[BoundaryType]) -> ArchPattern:
    """Select the base architecture pattern from the combined boundary set."""
    has_sovereignty = BoundaryType.SOVEREIGNTY in all_boundaries
    has_latency = BoundaryType.LATENCY in all_boundaries
    has_ownership = BoundaryType.OWNERSHIP in all_boundaries

    if has_sovereignty and has_latency and has_ownership:
        return ArchPattern.HYBRID_FEDERATED
    if has_sovereignty and has_latency:
        return ArchPattern.EDGE_PREPROCESSED_RAG
    if has_sovereignty and not has_latency:
        return ArchPattern.ON_PREMISES_INFERENCE
    # Ownership alone or no sovereignty constraints
    return ArchPattern.CLOUD_FIRST_RAG


def run_boundary_classification(uc: UseCase) -> tuple[set[BoundaryType], ArchPattern]:
    all_boundaries: set[BoundaryType] = set()
    print(f"  Data sources:")
    for src in uc.sources:
        b = classify_boundaries(src)
        all_boundaries |= b
        tags = ", ".join(bt.value for bt in sorted(b, key=lambda x: x.value)) or "none"
        print(f"    [{src.name}] perimeter={src.perimeter} sensitivity={src.sensitivity} "
              f"refresh={src.refresh_rate_seconds}s  ->  boundaries: {tags}")
    pattern = select_pattern(all_boundaries)
    combined = ", ".join(bt.value for bt in sorted(all_boundaries, key=lambda x: x.value))
    print(f"  Combined boundaries : {combined}")
    print(f"  Recommended pattern : {pattern.value}")
    return all_boundaries, pattern


# ---------- Part 2: Latency budget modeler ----------

def run_latency_model(uc: UseCase) -> bool:
    """Check whether the pipeline fits the latency budget.
    Returns True if feasible, False if overrun."""
    total_allocated = sum(ms for _, ms, _ in uc.pipeline_stages)
    budget = uc.user_latency_budget_ms
    overrun = total_allocated > budget

    print(f"  Latency budget: {budget} ms")
    print(f"  Stage breakdown:")
    for stage_name, allocated_ms, negotiable in uc.pipeline_stages:
        flag = "" if negotiable else "  [fixed]"
        bar = "#" * int(allocated_ms / 50)
        print(f"    {stage_name:<35} {allocated_ms:>6.0f} ms  {bar}{flag}")
    print(f"  Total allocated   : {total_allocated:.0f} ms  "
          f"({'OVERRUN' if overrun else 'within budget'})")

    if overrun:
        # Identify the binding constraint: the largest fixed (non-negotiable) stage
        fixed_stages = [(n, ms) for n, ms, neg in uc.pipeline_stages if not neg]
        if fixed_stages:
            binding = max(fixed_stages, key=lambda x: x[1])
            print(f"  Binding constraint: '{binding[0]}' ({binding[1]:.0f} ms, non-negotiable)")
            print(f"  Resolution options: move inference closer to data, async delivery,")
            print(f"                      or reduce context to cut LLM round-trip.")
    return not overrun


# ---------- Driver ----------

def main() -> None:
    print("=" * 78)
    print("DATA-BOUNDARY CLASSIFIER + LATENCY BUDGET MODELER")
    print("Phase 11, Lesson 108 — AI Cloud, Data Platform, and IoT Use Case Design")
    print("=" * 78)

    use_cases = [
        UseCase(
            name="A. Factory-floor fault detection (IoT/OT-sourced sensor data)",
            sources=[
                DataSource("vibration-sensors", "EU", "ot-network", "internal", 0.1),
                DataSource("erp-maintenance-history", "EU", "private-cloud", "regulated", 3600),
            ],
            user_latency_budget_ms=3000,
            pipeline_stages=[
                ("IoT aggregation at edge",           500,  False),
                ("OT-to-IT bridge + schema norm",     200,  False),
                ("RAG retrieval (vector DB)",          350,  True),
                ("Context assembly",                   80,   True),
                ("LLM inference (Sonnet 4.6, 2k tok)", 1200, True),
                ("Post-processing + UI render",        150,  False),
            ],
        ),
        UseCase(
            name="B. Regulatory document summarization (GDPR-scoped, flexible latency)",
            sources=[
                DataSource("legal-contracts", "EU", "on-prem", "personal", 86400),
                DataSource("regulatory-updates-feed", "EU", "public-cloud", "public", 3600),
            ],
            user_latency_budget_ms=15000,
            pipeline_stages=[
                ("Document retrieval (on-prem index)", 1200, False),
                ("Sovereignty-boundary proxy",         300,  False),
                ("Context assembly",                   100,  True),
                ("LLM inference (Opus 4.6, 8k tok)",   4500, True),
                ("Citation extraction + formatting",   500,  True),
                ("UI render",                          100,  False),
            ],
        ),
        UseCase(
            name="C. Customer-churn prediction (CRM data, cloud-native, relaxed budget)",
            sources=[
                DataSource("crm-customer-records", "US", "public-cloud", "internal", 3600),
                DataSource("product-usage-events", "US", "public-cloud", "internal", 60),
            ],
            user_latency_budget_ms=5000,
            pipeline_stages=[
                ("Feature retrieval (cloud data platform)", 400, True),
                ("RAG retrieval (product docs)",             300, True),
                ("Context assembly",                         80,  True),
                ("LLM inference (Haiku 4.0, 1k tok)",       600, True),
                ("Scoring + UI render",                      120, False),
                # Deliberate overrun: product-usage streaming adds an unbudgeted stage
                ("Streaming event ingestion lag",           4800, False),
            ],
        ),
    ]

    results: list[tuple[str, ArchPattern, bool]] = []

    for uc in use_cases:
        print()
        print(f"USE CASE: {uc.name}")
        print("-" * 78)
        print("  -- Boundary Classification --")
        _, pattern = run_boundary_classification(uc)
        print()
        print("  -- Latency Budget --")
        feasible = run_latency_model(uc)
        results.append((uc.name, pattern, feasible))

    print()
    print("=" * 78)
    print("HEADLINE: boundary type determines architecture; budget determines feasibility")
    print("-" * 78)
    for name, pattern, feasible in results:
        status = "feasible" if feasible else "OVERRUN — architectural change required"
        short = name.split("(")[0].strip()
        print(f"  {short}")
        print(f"    Pattern  : {pattern.value}")
        print(f"    Budget   : {status}")
    print()
    print("  Rule: classify boundaries before selecting a model.")
    print("  Rule: decompose latency before writing integration code.")
    print("  Rule: never expose raw-zone data as a RAG source.")


if __name__ == "__main__":
    main()
