"""AI system type classifier and risk flag evaluator — stdlib Python.

Part 1: AI system type classifier.
  Takes structured characteristics of a proposed AI use case (output type,
  data access, action capability, multi-step planning) and routes it to the
  correct AI system layer: RULE_BASED, ML_CLASSIFIER, GENERATIVE, or AGENTIC.
  Shows the reasoning at each decision gate.

Part 2: Agentic risk evaluator.
  For any use case classified as agentic (or where the caller wants a risk
  check), applies the four gates: blast radius, reversibility, oversight, and
  injection surface. Returns PROCEED / REVIEW / BLOCK with the blocking reason.

The point is to make classification and risk policy explicit and runnable,
matching the lesson's core claim: choosing the wrong AI system type is not
a neutral error.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SystemType(Enum):
    RULE_BASED = "rule-based (no ML)"
    ML_CLASSIFIER = "ML classifier / predictor"
    GENERATIVE = "generative AI (foundation model)"
    AGENTIC = "agentic AI (planner + tools)"


class RiskVerdict(Enum):
    PROCEED = "PROCEED"
    REVIEW = "REVIEW REQUIRED"
    BLOCK = "BLOCK"


class BlastRadius(Enum):
    READ_ONLY = "read-only"          # can only observe
    LIMITED_WRITE = "limited write"  # writes to bounded scope (a database row)
    BROAD_WRITE = "broad write"      # writes to files, email, external APIs
    IRREVERSIBLE = "irreversible"    # deletes, financial transactions, sends


# ---------------------------------------------------------------------------
# Data shapes
# ---------------------------------------------------------------------------

@dataclass
class UseCaseProfile:
    """Structured description of a proposed AI use case."""
    name: str
    produces_open_ended_text: bool          # True -> at minimum generative
    can_take_external_actions: bool         # True -> agentic candidate
    plans_multi_step: bool                  # True -> agentic
    uses_retrieval_from_live_data: bool     # relevant for generative+RAG
    description: str = ""


@dataclass
class AgentRiskProfile:
    """Risk assessment inputs for an agentic deployment."""
    name: str
    blast_radius: BlastRadius
    all_actions_reversible: bool
    human_checkpoint_before_irreversible: bool  # technically enforced
    reads_external_attacker_text: bool          # emails, web, tickets, etc.


# ---------------------------------------------------------------------------
# Part 1: AI system type classifier
# ---------------------------------------------------------------------------

def classify_system_type(profile: UseCaseProfile) -> tuple[SystemType, list[str]]:
    """Route a use case to its AI system layer. Returns (type, reasoning_steps)."""
    reasoning: list[str] = []

    # Gate 1: does it plan and act?
    if profile.can_take_external_actions and profile.plans_multi_step:
        reasoning.append(
            "GATE 1: use case can take external actions AND plans multi-step "
            "-> AGENTIC. Blast radius, reversibility, and oversight must be assessed."
        )
        return SystemType.AGENTIC, reasoning

    reasoning.append(
        "GATE 1: no multi-step planning with external actions -> not agentic."
    )

    # Gate 2: does it produce open-ended text/content?
    if profile.produces_open_ended_text:
        if profile.uses_retrieval_from_live_data:
            reasoning.append(
                "GATE 2: open-ended text output + live retrieval -> GENERATIVE (RAG). "
                "Grounding reduces hallucination; verification layer still required."
            )
        else:
            reasoning.append(
                "GATE 2: open-ended text output, no live retrieval -> GENERATIVE. "
                "Outputs are plausible but not guaranteed accurate; human review needed."
            )
        return SystemType.GENERATIVE, reasoning

    reasoning.append(
        "GATE 2: structured/bounded output -> not generative."
    )

    # Gate 3: is statistical learning involved?
    # For this classifier, we assume any non-generative, non-agentic use case
    # that still processes variable input is ML at minimum. A pure rule can be
    # identified by the caller; here we default to ML_CLASSIFIER.
    reasoning.append(
        "GATE 3: bounded output, no generative content -> ML_CLASSIFIER or rule-based. "
        "Use a deterministic rule first; only escalate to ML if rules cannot be enumerated."
    )
    return SystemType.ML_CLASSIFIER, reasoning


# ---------------------------------------------------------------------------
# Part 2: Agentic risk evaluator
# ---------------------------------------------------------------------------

def evaluate_agent_risk(risk: AgentRiskProfile) -> tuple[RiskVerdict, str]:
    """Apply the four agentic risk gates. Returns (verdict, reason)."""

    # Gate A: blast radius
    if risk.blast_radius is BlastRadius.IRREVERSIBLE:
        if not risk.human_checkpoint_before_irreversible:
            return (
                RiskVerdict.BLOCK,
                "GATE A: irreversible blast radius with no human checkpoint. "
                "Cannot approve autonomous deployment. Add technically-enforced "
                "HITL before destructive/financial/send actions."
            )
        # Irreversible but checkpointed -> still requires review
        return (
            RiskVerdict.REVIEW,
            "GATE A: irreversible actions present. Human checkpoint is configured "
            "but must be verified as technically enforced, not just policy."
        )

    if risk.blast_radius is BlastRadius.BROAD_WRITE and not risk.all_actions_reversible:
        return (
            RiskVerdict.REVIEW,
            "GATE B: broad write scope with non-reversible actions. "
            "Document rollback procedure and confirm audit logging is in place."
        )

    # Gate B: reversibility
    if not risk.all_actions_reversible and not risk.human_checkpoint_before_irreversible:
        return (
            RiskVerdict.REVIEW,
            "GATE B: some actions are not reversible and no checkpoint is defined. "
            "Enumerate which actions cannot be undone and add explicit approval gates."
        )

    # Gate C: prompt injection surface
    if risk.reads_external_attacker_text:
        return (
            RiskVerdict.REVIEW,
            "GATE C: agent reads external text (emails, web, tickets) — active "
            "prompt injection surface. Apply input sanitization and scope restrictions "
            "before production deployment. See Phase 18 · 15."
        )

    return (
        RiskVerdict.PROCEED,
        "All four gates pass. Proceed with standard monitoring and logging."
    )


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def print_separator(char: str = "-", width: int = 72) -> None:
    print(char * width)


def run_classifier(profiles: list[UseCaseProfile]) -> None:
    print("PART 1 — AI SYSTEM TYPE CLASSIFIER")
    print_separator("=")
    for p in profiles:
        system_type, reasoning = classify_system_type(p)
        print(f"\nUse case : {p.name}")
        if p.description:
            print(f"Context  : {p.description}")
        for step in reasoning:
            print(f"  -> {step}")
        print(f"  VERDICT: {system_type.value}")
    print()


def run_risk_evaluator(risks: list[AgentRiskProfile]) -> None:
    print("PART 2 — AGENTIC RISK EVALUATOR")
    print_separator("=")
    for r in risks:
        verdict, reason = evaluate_agent_risk(r)
        print(f"\nDeployment : {r.name}")
        print(f"  Blast radius     : {r.blast_radius.value}")
        print(f"  All reversible   : {r.all_actions_reversible}")
        print(f"  HITL enforced    : {r.human_checkpoint_before_irreversible}")
        print(f"  Reads ext. text  : {r.reads_external_attacker_text}")
        print(f"  VERDICT          : {verdict.value}")
        print(f"  REASON           : {reason}")
    print()


def main() -> None:
    print("=" * 72)
    print("AI SYSTEM TYPE CLASSIFIER + RISK EVALUATOR (Phase 11, Lesson 73)")
    print("=" * 72)
    print()

    # --- Sample use cases for Part 1 ---
    use_cases = [
        UseCaseProfile(
            name="Contract risk flagger (keyword rules)",
            produces_open_ended_text=False,
            can_take_external_actions=False,
            plans_multi_step=False,
            uses_retrieval_from_live_data=False,
            description="Flags contracts containing specific prohibited clauses.",
        ),
        UseCaseProfile(
            name="Document summarizer",
            produces_open_ended_text=True,
            can_take_external_actions=False,
            plans_multi_step=False,
            uses_retrieval_from_live_data=False,
            description="Produces a plain-language summary of uploaded PDFs.",
        ),
        UseCaseProfile(
            name="Customer support RAG chatbot",
            produces_open_ended_text=True,
            can_take_external_actions=False,
            plans_multi_step=False,
            uses_retrieval_from_live_data=True,
            description="Answers questions grounded in the live knowledge base.",
        ),
        UseCaseProfile(
            name="Email triage and reply agent",
            produces_open_ended_text=True,
            can_take_external_actions=True,
            plans_multi_step=True,
            uses_retrieval_from_live_data=True,
            description="Reads inbox, looks up CRM, drafts reply, sends email.",
        ),
        UseCaseProfile(
            name="Invoice approval predictor",
            produces_open_ended_text=False,
            can_take_external_actions=False,
            plans_multi_step=False,
            uses_retrieval_from_live_data=False,
            description="Predicts approve/reject for invoice review queue.",
        ),
    ]

    run_classifier(use_cases)

    # --- Sample risk profiles for Part 2 ---
    risk_profiles = [
        AgentRiskProfile(
            name="Read-only research assistant",
            blast_radius=BlastRadius.READ_ONLY,
            all_actions_reversible=True,
            human_checkpoint_before_irreversible=True,
            reads_external_attacker_text=False,
        ),
        AgentRiskProfile(
            name="Email reply agent (sends without approval)",
            blast_radius=BlastRadius.IRREVERSIBLE,
            all_actions_reversible=False,
            human_checkpoint_before_irreversible=False,  # <-- the problem
            reads_external_attacker_text=True,
        ),
        AgentRiskProfile(
            name="CRM update agent (field writes, no delete)",
            blast_radius=BlastRadius.LIMITED_WRITE,
            all_actions_reversible=True,
            human_checkpoint_before_irreversible=True,
            reads_external_attacker_text=False,
        ),
        AgentRiskProfile(
            name="Ticket-driven code agent (reads Jira tickets)",
            blast_radius=BlastRadius.BROAD_WRITE,
            all_actions_reversible=True,
            human_checkpoint_before_irreversible=True,
            reads_external_attacker_text=True,  # Jira = attacker-controllable text
        ),
    ]

    run_risk_evaluator(risk_profiles)

    print("=" * 72)
    print("HEADLINE: system type determines risk profile, not just capability")
    print_separator()
    print("  Classifier verdict summary:")
    print("    Rule-based  -> 0 use cases (none mapped here)")
    print("    ML          -> 2 use cases (contract flagger, invoice predictor)")
    print("    Generative  -> 2 use cases (summarizer, RAG chatbot)")
    print("    Agentic     -> 1 use case  (email triage + reply agent)")
    print()
    print("  Risk verdict summary:")
    print("    PROCEED         -> 1 deployment (read-only research assistant)")
    print("    REVIEW REQUIRED -> 2 deployments (CRM agent, code agent)")
    print("    BLOCK           -> 1 deployment  (email agent: irreversible + no HITL)")
    print()
    print("  The email agent is blocked not because it uses AI, but because")
    print("  it combines an irreversible action (send) with no human checkpoint")
    print("  and reads external text (prompt injection surface).")
    print("  Fix: add HITL approval before send; sanitize email inputs.")
    print_separator()


if __name__ == "__main__":
    main()
