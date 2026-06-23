"""AI system type classifier, risk evaluator, and failure-shape simulator — stdlib Python.

Three runnable policies, all derived from the same lesson:

1. classify_system_type(): take structured use-case characteristics and route to
   RULE_BASED, ML_CLASSIFIER, GENERATIVE, or AGENTIC. Show reasoning at each gate.

2. evaluate_agent_risk(): for any AGENTIC classification, apply the four gates
   (blast radius, reversibility, oversight, injection surface). Returns
   PROCEED / REVIEW / BLOCK.

3. simulate_failure_shapes(): replay the three failure stories from the lesson
   (CRM RAG, contract reviewer, email reply agent) against the classifier and
   risk evaluator, with one case under-classified (the "chatbot that isn't") to
   show how a categorical error at scoping time produces a wrong risk verdict
   at deployment time.

The point is not just to classify correctly — it is to make the failure mode of
misclassification visible. A poorly classified system passes through the risk
gates with the wrong verdict, which is exactly how the failure stories in the
lesson started.
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
    # For this classifier, any non-generative, non-agentic use case that processes
    # variable input is ML at minimum. A pure rule is identified by the caller
    # explicitly; here we default to ML_CLASSIFIER with a recommendation to try
    # a deterministic rule first.
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
# Part 3: failure-shape simulator
# ---------------------------------------------------------------------------
#
# Each failure shape is a (use_case_profile, optional risk_profile) tuple with
# a lesson reference and a one-line expected verdict. Running them through the
# classifier + risk evaluator shows where the failure would have been flagged
# if anyone had asked the three consultant questions at scoping time.
#
# The final case — "the chatbot that isn't" — is the under-classified case:
# the use case is architecturally agentic, but the scoping documents called
# it a chatbot, so the risk gates were never run. The simulator shows what
# would have been flagged if the gates had been run.

@dataclass
class FailureCase:
    label: str
    lesson_section: str
    expected_failure_shape: str
    use_case: UseCaseProfile
    risk: AgentRiskProfile | None  # None = risk gates never run


def run_failure_case(case: FailureCase) -> dict:
    """Run one failure case through classifier + (optionally) risk evaluator."""
    system_type, reasoning = classify_system_type(case.use_case)
    result = {
        "label": case.label,
        "expected": case.expected_failure_shape,
        "classified_as": system_type,
        "reasoning_count": len(reasoning),
    }
    if case.risk is None:
        # Under-classification: risk gates never run. This is the failure shape.
        result["risk_verdict"] = "NOT EVALUATED (system was scoped as a chatbot)"
        result["would_have_blocked"] = True
    else:
        verdict, reason = evaluate_agent_risk(case.risk)
        result["risk_verdict"] = verdict
        result["risk_reason"] = reason
        result["would_have_blocked"] = verdict is RiskVerdict.BLOCK
    return result


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def print_separator(char: str = "-", width: int = 72) -> None:
    print(char * width)


def print_use_case_header(p: UseCaseProfile) -> None:
    print(f"\nUse case : {p.name}")
    if p.description:
        print(f"Context  : {p.description}")


def run_classifier(profiles: list[UseCaseProfile]) -> None:
    print("PART 1 — AI SYSTEM TYPE CLASSIFIER")
    print_separator("=")
    for p in profiles:
        system_type, reasoning = classify_system_type(p)
        print_use_case_header(p)
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


def run_failure_simulator(cases: list[FailureCase]) -> None:
    print("PART 3 — FAILURE-SHAPE SIMULATOR")
    print_separator("=")
    print("Replaying the three failure stories from the lesson against the")
    print("classifier + risk evaluator. A case marked 'NOT EVALUATED' is the")
    print("under-classified 'chatbot that isn't' shape — risk gates never run.")
    print()
    blocked = 0
    not_evaluated = 0
    for case in cases:
        result = run_failure_case(case)
        print(f"  Case    : {case.label}")
        print(f"  Section : {case.lesson_section}")
        print(f"  Classified as : {result['classified_as'].value}")
        print(f"  Risk verdict  : {result['risk_verdict']}")
        print(f"  Would have been flagged at scoping: {result['would_have_blocked']}")
        print(f"  Expected failure shape: {result['expected']}")
        if result["would_have_blocked"]:
            blocked += 1
        if "NOT EVALUATED" in str(result["risk_verdict"]):
            not_evaluated += 1
        print()
    print(f"  Summary: {blocked} cases would have been BLOCKED, "
          f"{not_evaluated} cases were under-classified and never evaluated.")
    print()


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 72)
    print("AI SYSTEM TYPE CLASSIFIER + RISK EVALUATOR + FAILURE SIMULATOR")
    print("(Phase 11, Lesson 73)")
    print("=" * 72)
    print()

    # -----------------------------------------------------------------------
    # Part 1: sample use cases
    # -----------------------------------------------------------------------
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
            name="Document summariser",
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

    # -----------------------------------------------------------------------
    # Part 2: sample risk profiles
    # -----------------------------------------------------------------------
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
            human_checkpoint_before_irreversible=False,
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
            reads_external_attacker_text=True,
        ),
    ]
    run_risk_evaluator(risk_profiles)

    # -----------------------------------------------------------------------
    # Part 3: failure-shape simulator
    # -----------------------------------------------------------------------
    failure_cases = [
        # Case 1: the CRM RAG. Classified correctly as GENERATIVE; no risk
        # gates run because it is not agentic. The failure was at verification,
        # not risk classification. The classifier would have surfaced the need
        # for a verification layer at scoping time.
        FailureCase(
            label="CRM RAG — logistics firm chatbot quotes nonexistent SLA",
            lesson_section="failure story: the CRM RAG at a logistics firm",
            expected_failure_shape="generator acting as verifier; no independent check on output",
            use_case=UseCaseProfile(
                name="Customer service chatbot (RAG over shipment records)",
                produces_open_ended_text=True,
                can_take_external_actions=False,
                plans_multi_step=False,
                uses_retrieval_from_live_data=True,
                description="Answers shipper questions grounded in shipment data.",
            ),
            risk=None,
        ),
        # Case 2: the contract reviewer. Classified as ML_CLASSIFIER (bounded
        # output), but should have been GENERATIVE + rule-validated post-processor.
        # The misclassification is not at this layer's gate but in the scoping
        # decision: they reached for a foundation model for a classification task.
        FailureCase(
            label="Contract reviewer — insurer extraction accuracy drops in production",
            lesson_section="failure story: the contract reviewer at an insurer",
            expected_failure_shape="foundation model used where ML classifier + rule validator was needed",
            use_case=UseCaseProfile(
                name="Contract term extractor",
                produces_open_ended_text=False,
                can_take_external_actions=False,
                plans_multi_step=False,
                uses_retrieval_from_live_data=False,
                description="Extracts renewal dates and policy terms from contracts.",
            ),
            risk=None,
        ),
        # Case 3: the email reply agent. Classified as AGENTIC, risk gates BLOCK.
        FailureCase(
            label="Email reply agent — sends legally binding concession on injected instruction",
            lesson_section="failure story: the prompt workshop at a public-sector team",
            expected_failure_shape="irreversible action + no HITL + reads attacker-controllable text",
            use_case=UseCaseProfile(
                name="Email triage + reply agent",
                produces_open_ended_text=True,
                can_take_external_actions=True,
                plans_multi_step=True,
                uses_retrieval_from_live_data=True,
                description="Reads inbox, looks up CRM, drafts reply, sends email.",
            ),
            risk=AgentRiskProfile(
                name="Email reply agent (no approval gate)",
                blast_radius=BlastRadius.IRREVERSIBLE,
                all_actions_reversible=False,
                human_checkpoint_before_irreversible=False,
                reads_external_attacker_text=True,
            ),
        ),
        # Case 4: the chatbot that isn't. Under-classified as a chatbot, risk
        # gates never run. This is the failure shape the lesson warns about.
        FailureCase(
            label="The chatbot that isn't — scoped as chatbot, actually agentic",
            lesson_section="consultant field notes: the chatbot that isn't",
            expected_failure_shape="system classified by UI, not by capability; risk gates skipped",
            use_case=UseCaseProfile(
                name="Customer 'chatbot' (actually reads email + updates CRM + sends)",
                produces_open_ended_text=True,
                can_take_external_actions=True,    # the capability the scoping missed
                plans_multi_step=True,             # the capability the scoping missed
                uses_retrieval_from_live_data=True,
                description="Scoping doc calls it a chatbot; architecture is agentic.",
            ),
            risk=None,
        ),
    ]
    run_failure_simulator(failure_cases)

    # -----------------------------------------------------------------------
    # HEADLINE
    # -----------------------------------------------------------------------
    print("=" * 72)
    print("HEADLINE: failure shape = 'the chatbot that isn't' (under-classification)")
    print("-" * 72)
    print("  The CRM RAG, the contract reviewer, and the email reply agent all")
    print("  failed at the same place: a system-type classification question was")
    print("  never asked, or was answered by UI rather than capability. The email")
    print("  reply agent was correctly classified by the runtime gates (BLOCK),")
    print("  but the 'chatbot that isn't' case shows what happens when the")
    print("  scoping document calls an agent a chatbot — the gates never run.")
    print()
    print("  Three questions, asked in writing before scoping:")
    print("    1. What type of AI system is this?")
    print("    2. What is the ground truth?")
    print("    3. What does a failure cost?")
    print("  Each failure story above had a moment where one of these would")
    print("  have surfaced the risk. The cost of asking is ten minutes. The")
    print("  cost of not asking is the lesson.")
    print_separator()


if __name__ == "__main__":
    main()
