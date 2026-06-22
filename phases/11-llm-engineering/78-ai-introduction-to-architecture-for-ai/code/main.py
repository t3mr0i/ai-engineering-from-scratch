"""AI system architecture pattern classifier and layer cost estimator — stdlib Python.

Part 1: Architecture pattern classifier.
Takes a set of requirement flags (needs_rag, needs_tools, multi_step,
latency_sensitive, data_residency_eu) and selects which of the five
architecture layers are activated and which orchestration pattern applies.
The decision follows the five-question heuristic from the lesson.

Part 2: Layer cost estimator.
Takes an architecture profile and a usage volume (requests/day, tokens/request,
tool calls/request) and produces a per-day cost breakdown in EUR. Prices are
approximate order-of-magnitude figures for mid-2026 managed API pricing;
treat these as illustrative, not contractual.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

class OrchestrationPattern(Enum):
    SINGLE_CALL = "single-call"
    CHAIN = "chain"
    DAG = "dag"
    AGENT_LOOP = "agent-loop"


class DeploymentTopology(Enum):
    MANAGED_API = "managed-api"
    PLATFORM_MANAGED = "platform-managed (AI Foundry / Vertex AI)"
    SELF_HOSTED = "self-hosted"


# ---------------------------------------------------------------------------
# Part 1 — Architecture pattern classifier
# ---------------------------------------------------------------------------

@dataclass
class Requirements:
    name: str
    needs_rag: bool = False          # answer depends on proprietary / recent data
    needs_tools: bool = False        # model must call external tools or code
    multi_step: bool = False         # more than one model call required
    parallel_subtasks: bool = False  # subtasks can run in parallel
    latency_sensitive: bool = False  # p95 < 2 s user-facing SLA
    data_residency_eu: bool = False  # EU data residency required


@dataclass
class ArchitectureDecision:
    requirements: Requirements
    layers_activated: list[str] = field(default_factory=list)
    orchestration: OrchestrationPattern = OrchestrationPattern.SINGLE_CALL
    deployment: DeploymentTopology = DeploymentTopology.MANAGED_API
    reasoning: list[str] = field(default_factory=list)


def classify_architecture(req: Requirements) -> ArchitectureDecision:
    """Apply the five-question heuristic and return an ArchitectureDecision."""
    decision = ArchitectureDecision(requirements=req)
    layers = decision.layers_activated
    notes = decision.reasoning

    # Layer 1 — model is always activated
    layers.append("Layer 1: Model")

    # Q1: Does the answer depend on data the model was not trained on?
    if req.needs_rag:
        layers.append("Layer 2: Context assembly (RAG pipeline)")
        notes.append("RAG activated: needs retrieval of proprietary/recent data")
    else:
        layers.append("Layer 2: Context assembly (system prompt + history only)")
        notes.append("No RAG: system prompt and history window are sufficient")

    # Q2: Does the task require more than one model call?
    if req.needs_tools and req.multi_step:
        decision.orchestration = OrchestrationPattern.AGENT_LOOP
        layers.append("Layer 3: Orchestration (agent loop)")
        notes.append("Agent loop: multi-step + tool use requires open-ended iteration")
    elif req.multi_step and req.parallel_subtasks:
        decision.orchestration = OrchestrationPattern.DAG
        layers.append("Layer 3: Orchestration (DAG)")
        notes.append("DAG: parallel independent subtasks with known structure")
    elif req.multi_step:
        decision.orchestration = OrchestrationPattern.CHAIN
        layers.append("Layer 3: Orchestration (chain)")
        notes.append("Chain: sequential subtasks with known structure, no parallelism")
    else:
        decision.orchestration = OrchestrationPattern.SINGLE_CALL
        notes.append("Single call: task fits in one prompt")

    # Q3: Does the task require tool execution?
    if req.needs_tools:
        layers.append("Layer 4: Tool execution (sandboxed)")
        notes.append("Tool layer: requires sandboxing, timeout policy, and audit log")
    else:
        notes.append("No tool layer: model output is terminal, no external calls")

    # Q4 + Q5: Data residency and latency
    if req.data_residency_eu:
        decision.deployment = DeploymentTopology.PLATFORM_MANAGED
        notes.append("EU data residency: use germanywestcentral Azure AI Foundry endpoint")
    elif req.latency_sensitive and decision.orchestration in (
        OrchestrationPattern.AGENT_LOOP, OrchestrationPattern.DAG
    ):
        notes.append(
            "Latency-sensitive + multi-stage: consider streaming + pre-warmed instances"
        )

    layers.append("Layer 5: Deployment — " + decision.deployment.value)

    return decision


# ---------------------------------------------------------------------------
# Part 2 — Layer cost estimator
# ---------------------------------------------------------------------------

# Approximate mid-2026 pricing in EUR per unit (illustrative order of magnitude).
# Model: EUR per 1M tokens (blended input/output 1:2 ratio).
# Retrieval: EUR per 1000 vector queries (Azure AI Search S1 tier).
# Tool: EUR per 1000 tool calls (lightweight API or code interpreter).
# Orchestration overhead: fraction of model cost added by multi-call overhead.
PRICING = {
    "model_eur_per_m_tokens": 6.0,    # ~Claude Sonnet 4.6 / GPT-4o equivalent
    "retrieval_eur_per_1k_queries": 0.04,
    "tool_eur_per_1k_calls": 0.15,
}


@dataclass
class UsageProfile:
    requests_per_day: int
    tokens_per_request: int   # prompt + completion
    tool_calls_per_request: float = 0.0   # average; 0 if no tools
    rag_queries_per_request: float = 0.0  # vector queries per request


def estimate_cost(arch: ArchitectureDecision, usage: UsageProfile) -> dict[str, float]:
    """Return a per-day cost breakdown in EUR across active layers."""
    costs: dict[str, float] = {}

    # Model cost
    total_tokens = usage.requests_per_day * usage.tokens_per_request
    costs["model"] = (total_tokens / 1_000_000) * PRICING["model_eur_per_m_tokens"]

    # Retrieval cost (only if RAG is activated)
    if usage.rag_queries_per_request > 0:
        total_queries = usage.requests_per_day * usage.rag_queries_per_request
        costs["retrieval"] = (total_queries / 1000) * PRICING["retrieval_eur_per_1k_queries"]
    else:
        costs["retrieval"] = 0.0

    # Tool cost
    if usage.tool_calls_per_request > 0:
        total_tools = usage.requests_per_day * usage.tool_calls_per_request
        costs["tool_execution"] = (total_tools / 1000) * PRICING["tool_eur_per_1k_calls"]
    else:
        costs["tool_execution"] = 0.0

    costs["total"] = sum(v for k, v in costs.items() if k != "total")
    return costs


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def print_decision(d: ArchitectureDecision) -> None:
    req = d.requirements
    print(f"  Requirement profile: {req.name}")
    flags = [
        ("RAG", req.needs_rag),
        ("tools", req.needs_tools),
        ("multi-step", req.multi_step),
        ("parallel", req.parallel_subtasks),
        ("latency-SLA", req.latency_sensitive),
        ("EU-residency", req.data_residency_eu),
    ]
    print("  Flags: " + "  ".join(f"{k}={v}" for k, v in flags))
    print(f"  Orchestration: {d.orchestration.value}")
    print(f"  Deployment: {d.deployment.value}")
    print("  Layers:")
    for layer in d.layers_activated:
        print(f"    - {layer}")
    print("  Reasoning:")
    for note in d.reasoning:
        print(f"    * {note}")


def print_cost(costs: dict[str, float], usage: UsageProfile, label: str) -> None:
    print(f"  Cost estimate for '{label}' at {usage.requests_per_day:,} req/day:")
    for k, v in costs.items():
        if k != "total":
            print(f"    {k:<20} EUR {v:>8.2f}/day")
    print(f"    {'total':<20} EUR {costs['total']:>8.2f}/day  "
          f"(~EUR {costs['total'] * 30:,.0f}/month)")


def main() -> None:
    print("=" * 80)
    print("AI SYSTEM ARCHITECTURE CLASSIFIER + COST ESTIMATOR (Phase 11, Lesson 78)")
    print("=" * 80)

    # --- Part 1: classify three representative requirement profiles ---
    print()
    print("PART 1 — Architecture pattern classifier")
    print("-" * 80)

    profiles = [
        Requirements(
            name="Customer FAQ chatbot (simple)",
            needs_rag=False,
            needs_tools=False,
            multi_step=False,
            latency_sensitive=True,
        ),
        Requirements(
            name="Internal document Q&A (EU law firm)",
            needs_rag=True,
            needs_tools=False,
            multi_step=False,
            latency_sensitive=False,
            data_residency_eu=True,
        ),
        Requirements(
            name="Agentic research assistant (full stack)",
            needs_rag=True,
            needs_tools=True,
            multi_step=True,
            parallel_subtasks=False,
            latency_sensitive=False,
            data_residency_eu=False,
        ),
        Requirements(
            name="Parallel report generator (DAG)",
            needs_rag=True,
            needs_tools=False,
            multi_step=True,
            parallel_subtasks=True,
            latency_sensitive=True,
        ),
    ]

    decisions = []
    for req in profiles:
        print()
        d = classify_architecture(req)
        decisions.append(d)
        print_decision(d)

    # --- Part 2: cost estimates for simple vs. full-stack ---
    print()
    print("PART 2 — Layer cost estimator")
    print("-" * 80)

    cost_profiles = [
        (decisions[0], UsageProfile(requests_per_day=10_000, tokens_per_request=800)),
        (decisions[2], UsageProfile(
            requests_per_day=10_000,
            tokens_per_request=4_000,
            tool_calls_per_request=3.0,
            rag_queries_per_request=5.0,
        )),
    ]

    for arch_decision, usage in cost_profiles:
        print()
        costs = estimate_cost(arch_decision, usage)
        print_cost(costs, usage, arch_decision.requirements.name)

    print()
    print("=" * 80)
    print("HEADLINE: architecture complexity is a cost multiplier, not just a quality lever")
    print("-" * 80)
    print("  Simple single-call FAQ chatbot vs. full RAG+agent stack at 10k req/day:")
    simple_costs = estimate_cost(decisions[0], UsageProfile(10_000, 800))
    full_costs = estimate_cost(
        decisions[2],
        UsageProfile(10_000, 4_000, tool_calls_per_request=3.0, rag_queries_per_request=5.0),
    )
    ratio = full_costs["total"] / simple_costs["total"] if simple_costs["total"] > 0 else 0
    print(f"  Simple: EUR {simple_costs['total']:.2f}/day | "
          f"Full stack: EUR {full_costs['total']:.2f}/day | "
          f"Ratio: {ratio:.1f}x")
    print("  Each architecture layer activated by a real requirement is justified.")
    print("  Each layer activated speculatively is a cost and ops liability.")
    print("  The five-question heuristic is the minimum viable architectural discipline.")


if __name__ == "__main__":
    main()
