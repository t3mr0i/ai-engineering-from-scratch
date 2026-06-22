"""Task-to-tool router and verification-tier classifier — stdlib Python.

Part 1: Task-to-Tool Router
  Takes a structured task description (task type, data classification,
  requires retrieval from internal corpus) and routes it to the appropriate
  AI tool category with a brief rationale.

Part 2: Verification-Tier Classifier
  Takes the routed tool and task consequence level and returns the
  verification tier required, the checks to run, and a BLOCK flag when
  the data classification is incompatible with the chosen tool.

Part 3: Failure demonstration
  Reproduces the contract-reviewer failure shape in miniature: a
  correctly-routed confidential contract summarization where the
  chosen tool is fine but the position-bias follow-up question is
  still load-bearing. The HEADLINE at the bottom names the specific
  failure shape demonstrated.

No network, no model calls. The point is to make the decision policy
explicit and runnable, mirroring what a working consultant should do
before typing a prompt.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------- Enumerations ----------


class TaskType(Enum):
    RETRIEVAL = "retrieval"        # answer a question from existing knowledge
    DRAFTING = "drafting"          # write or rewrite text
    SUMMARIZATION = "summarization"
    CODE = "code"
    IDEATION = "ideation"          # brainstorm, explore options
    CLASSIFICATION = "classification"  # label or sort items


class DataTier(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    REGULATED = "regulated"


class ToolCategory(Enum):
    INTERNAL_RAG = "Internal RAG / Copilot M365"
    CHAT_ASSISTANT = "Chat assistant (Claude / ChatGPT / Gemini)"
    CODE_ASSISTANT = "Code assistant (Copilot / Cursor / Claude Code)"
    DOCUMENT_INTELLIGENCE = "Document intelligence (Azure DI / Claude file upload)"
    HUMAN_ONLY = "Human-only — do not use external AI"


class VerificationTier(Enum):
    T1_COSMETIC = "Tier 1 — read once, send or discard"
    T2_INTERNAL = "Tier 2 — spot-check key claims or run code in isolation"
    T3_CLIENT = "Tier 3 — full review by qualified human; treat output as first draft"
    T4_IRREVERSIBLE = "Tier 4 — second reviewer required; no AI output as sole check"


# ---------- Data structures ----------


@dataclass
class Task:
    label: str
    task_type: TaskType
    data_tier: DataTier
    consequence_level: int          # 1-4 matching VerificationTier
    internal_corpus_covers: bool    # True if internal RAG could answer this
    is_large_binary_document: bool  # True if source is PDF / complex binary
    note: str = ""


@dataclass
class RoutingDecision:
    tool: ToolCategory
    rationale: str
    blocked: bool = False
    block_reason: str = ""


@dataclass
class VerificationDecision:
    tier: VerificationTier
    checks: list[str]
    blocked: bool = False
    block_reason: str = ""
    mandatory_followup: str = ""  # the targeted-retrieval question for Tier 3+


# ---------- Part 1: Task-to-Tool Router ----------

# Tools that may process each data tier
_ALLOWED_TOOLS_BY_TIER: dict[DataTier, set[ToolCategory]] = {
    DataTier.PUBLIC: {
        ToolCategory.INTERNAL_RAG,
        ToolCategory.CHAT_ASSISTANT,
        ToolCategory.CODE_ASSISTANT,
        ToolCategory.DOCUMENT_INTELLIGENCE,
    },
    DataTier.INTERNAL: {
        ToolCategory.INTERNAL_RAG,
        ToolCategory.CODE_ASSISTANT,   # code rarely contains PII; still check
    },
    DataTier.CONFIDENTIAL: {
        ToolCategory.INTERNAL_RAG,
    },
    DataTier.REGULATED: {
        ToolCategory.HUMAN_ONLY,
    },
}


def route_task(task: Task) -> RoutingDecision:
    """Return the recommended tool category and rationale for a task.

    Decision order (mirrors the lesson's concept section):
      1. Regulated data -> human-only regardless of task type.
      2. Retrieval tasks with internal corpus coverage -> internal RAG first.
      3. Code tasks -> code assistant.
      4. Large binary documents -> document intelligence (if data tier allows).
      5. Drafting / summarization / ideation / classification -> chat assistant.
      6. Internal/confidential data outside internal RAG -> flag mismatch.
    """
    # Rule 1: regulated data is never sent to an external tool
    if task.data_tier is DataTier.REGULATED:
        return RoutingDecision(
            tool=ToolCategory.HUMAN_ONLY,
            rationale="Regulated data may not be sent to any external AI API.",
            blocked=True,
            block_reason="Data tier REGULATED — external tools prohibited.",
        )

    # Rule 2: retrieval from internal corpus (covers both retrieval and
    # summarization of internal documents the corpus indexes).
    if task.internal_corpus_covers:
        return RoutingDecision(
            tool=ToolCategory.INTERNAL_RAG,
            rationale=(
                "Question or document is covered by the internal corpus. "
                "Internal RAG keeps data inside your tenant and provides "
                "grounded, citable answers. Escalate to chat assistant only "
                "if RAG returns no useful result."
            ),
        )

    # Rule 3: code tasks
    if task.task_type is TaskType.CODE:
        allowed = _ALLOWED_TOOLS_BY_TIER.get(task.data_tier, set())
        if ToolCategory.CODE_ASSISTANT in allowed:
            return RoutingDecision(
                tool=ToolCategory.CODE_ASSISTANT,
                rationale=(
                    "Code task with compatible data tier. Use code assistant "
                    "for inline completion, multi-file edits, and review. "
                    "Secret-scan pasted context before sending."
                ),
            )
        return RoutingDecision(
            tool=ToolCategory.INTERNAL_RAG,
            rationale=(
                "Code task but data tier restricts external code tools. "
                "Use internal toolchain or anonymize the snippet first."
            ),
            blocked=True,
            block_reason=f"Code assistant not approved for {task.data_tier.value} data.",
        )

    # Rule 4: large binary document
    if task.is_large_binary_document:
        allowed = _ALLOWED_TOOLS_BY_TIER.get(task.data_tier, set())
        if ToolCategory.DOCUMENT_INTELLIGENCE in allowed:
            return RoutingDecision(
                tool=ToolCategory.DOCUMENT_INTELLIGENCE,
                rationale=(
                    "Source is a large binary document (PDF / complex format). "
                    "Document intelligence handles extraction and summarization "
                    "at scale. Confirm the provider's DPA covers this data tier."
                ),
            )
        return RoutingDecision(
            tool=ToolCategory.HUMAN_ONLY,
            rationale=(
                "Large binary document with restricted data tier. "
                "External document intelligence tools are not approved here. "
                "Use internal tools or manual extraction."
            ),
            blocked=True,
            block_reason=(
                f"Document intelligence not approved for {task.data_tier.value} data."
            ),
        )

    # Rule 5: generation tasks (drafting, summarization, ideation, classification)
    allowed = _ALLOWED_TOOLS_BY_TIER.get(task.data_tier, set())
    if ToolCategory.CHAT_ASSISTANT in allowed:
        return RoutingDecision(
            tool=ToolCategory.CHAT_ASSISTANT,
            rationale=(
                f"Generation task ({task.task_type.value}) with public data. "
                "Chat assistant is appropriate. Apply prompt engineering "
                "(Phase 11 · 01) and chain-of-thought for multi-step tasks "
                "(Phase 11 · 02)."
            ),
        )

    # Rule 6: mismatch — internal/confidential data and no safe external tool
    return RoutingDecision(
        tool=ToolCategory.INTERNAL_RAG,
        rationale=(
            "Data tier restricts external tools. Route through internal RAG "
            "or anonymize the input before using an external tool."
        ),
        blocked=True,
        block_reason=(
            f"No approved external tool for {task.task_type.value} "
            f"with {task.data_tier.value} data."
        ),
    )


# ---------- Part 2: Verification-Tier Classifier ----------

_TIER_CHECKS: dict[VerificationTier, list[str]] = {
    VerificationTier.T1_COSMETIC: [
        "Read output once for obvious errors.",
        "Adjust tone or length if needed.",
    ],
    VerificationTier.T2_INTERNAL: [
        "Spot-check 2-3 specific factual claims against source.",
        "Run code in an isolated environment; inspect test output.",
        "Check that no sensitive data was inadvertently included in output.",
    ],
    VerificationTier.T3_CLIENT: [
        "Route to a subject-matter expert for review before use.",
        "Ask targeted retrieval questions to check summary completeness.",
        "Verify all numbers, names, and dates against the source document.",
        "Confirm negations at clause boundaries (especially in contracts).",
        "Label the output 'AI-assisted draft' until expert-approved.",
    ],
    VerificationTier.T4_IRREVERSIBLE: [
        "Require a second qualified reviewer independent of the requester.",
        "No AI output may be the sole basis for an irreversible action.",
        "Maintain an audit trail: what model, what prompt, what date.",
        "Confirm rollback or undo path exists before proceeding.",
        "Executive or legal sign-off if the action is externally binding.",
    ],
}


# The targeted-retrieval follow-up that is mandatory for any Tier 3
# summarization task. This is the lesson's load-bearing rule: a correct
# tool choice does not remove the need for a targeted question, because
# position bias and hallucinated specificity survive a correct routing.
_T3_SUMMARY_FOLLOWUP = (
    "After reading the summary, ask the tool one targeted retrieval question "
    "about the most decision-critical clause in the source document "
    "(e.g. 'What does the document say about termination rights / "
    "liability caps / exclusivity?'). Do not skip this even when the "
    "summary 'looks complete'."
)


def classify_verification(routing: RoutingDecision, task: Task) -> VerificationDecision:
    """Return the required verification tier and checks.

    If the routing was blocked, the verification tier is irrelevant —
    the decision is already blocked. Otherwise tier follows consequence_level.

    For Tier 3 summarization tasks, the targeted-retrieval follow-up is
    mandatory regardless of which tool produced the summary.
    """
    if routing.blocked:
        return VerificationDecision(
            tier=VerificationTier.T4_IRREVERSIBLE,
            checks=["BLOCKED: resolve tool/data-tier mismatch before proceeding."],
            blocked=True,
            block_reason=routing.block_reason,
        )

    tier_map = {
        1: VerificationTier.T1_COSMETIC,
        2: VerificationTier.T2_INTERNAL,
        3: VerificationTier.T3_CLIENT,
        4: VerificationTier.T4_IRREVERSIBLE,
    }
    tier = tier_map.get(task.consequence_level, VerificationTier.T3_CLIENT)

    # The load-bearing rule: Tier 3 summarization always requires a
    # targeted-retrieval follow-up, even when the routing is clean.
    mandatory = ""
    if tier is VerificationTier.T3_CLIENT and task.task_type is TaskType.SUMMARIZATION:
        mandatory = _T3_SUMMARY_FOLLOWUP

    return VerificationDecision(
        tier=tier,
        checks=_TIER_CHECKS[tier],
        mandatory_followup=mandatory,
    )


# ---------- Part 3: Failure-shape demonstration ----------

def demonstrate_position_bias_failure_shape() -> None:
    """Reproduce the contract-reviewer failure in miniature.

    The shape: a 47-page supplier contract is routed to internal RAG
    (internal data tier, corpus covers it). The summarization returns
    a fluent, well-structured result. The contract reviewer reads the
    summary in four minutes and signs off — never asking the targeted
    retrieval question about the termination clause on page 34.

    The routing is correct. The verification tier is correctly Tier 3.
    The mandatory follow-up question is correctly required. The
    failure is that the human skips the follow-up — and the simulator
    here demonstrates exactly what the routing+verification policy
    would have caught if the follow-up had been run.

    The simulator models the middle-of-document clause being dropped
    by the summarizer. The follow-up retrieval question is the only
    step that would have surfaced it.
    """
    print("-" * 78)
    print("PART 3 — failure shape: contract-reviewer position-bias trap")
    print("-" * 78)

    # The contract as a list of (page, clause). Page 34 has the
    # load-bearing termination clause; everything else is "noise."
    contract_clauses = {
        1:  ("Definitions", "standard"),
        4:  ("Scope of services", "standard"),
        9:  ("Payment terms", "standard"),
        12: ("Confidentiality", "standard"),
        18: ("Indemnification", "standard"),
        24: ("Limitation of liability", "standard"),
        28: ("Force majeure", "standard"),
        # Page 34 — the buried, decision-critical clause.
        34: ("Termination rights", "TERMINATION EXPLICITLY EXCLUDED UNDER THIS AGREEMENT"),
        39: ("Governing law", "standard"),
        44: ("Dispute resolution", "standard"),
        47: ("Signatures", "standard"),
    }

    # Simulated summarizer output: position-biased, weights pages
    # 1-12 (front) and 44-47 (back), drops or paraphrases the middle.
    # This mirrors what transformer-based summarizers reliably do on
    # long documents in our experience.
    summary_pages_seen = [1, 4, 9, 12, 44, 47]
    summary_references_termination = False  # the load-bearing page was dropped

    print(f"  Contract: 47 pages, 11 clauses, page 34 carries the")
    print(f"            load-bearing termination clause (explicitly excluded).")
    print()
    print(f"  Summarizer output covers pages: {summary_pages_seen}")
    print(f"  Summary references termination clause on page 34: "
          f"{summary_references_termination}")
    print()

    # Step 1: the routing policy (above) already chose internal RAG
    # and Tier 3 verification, with the mandatory follow-up.
    # Step 2: what happens if the follow-up IS run.
    targeted_question = (
        "What does the contract say about termination rights?"
    )
    targeted_answer = contract_clauses[34][1]
    print(f"  Targeted retrieval question: \"{targeted_question}\"")
    print(f"  -> Tool returns: \"{targeted_answer}\"")
    print(f"  -> Page 34 visible. Position-bias failure surfaced.")
    print()

    # Step 3: what happens if the follow-up is SKIPPED (the actual
    # failure shape from the insurer).
    if not summary_references_termination:
        print("  IF THE FOLLOW-UP IS SKIPPED:")
        print(f"    - Reviewer reads summary. Termination not mentioned.")
        print(f"    - Reviewer signs off in 4 minutes.")
        print(f"    - Client renewal negotiation assumes termination is available.")
        print(f"    - Position taken on a clause the source actively excludes.")
        print(f"    - Consequence: unwound at material cost.")
    print()


# ---------- Driver ----------


def evaluate(task: Task) -> None:
    routing = route_task(task)
    verification = classify_verification(routing, task)

    status = "BLOCKED" if routing.blocked else "OK"
    print(f"  Task:  {task.label}")
    print(f"  Type:  {task.task_type.value}  |  Data: {task.data_tier.value}  "
          f"|  Consequence: {task.consequence_level}  |  Status: {status}")
    print(f"  Tool:  {routing.tool.value}")
    print(f"  Why:   {routing.rationale}")
    if routing.blocked:
        print(f"  BLOCK: {routing.block_reason}")
    print(f"  Verify: {verification.tier.value}")
    for check in verification.checks:
        print(f"    - {check}")
    if verification.mandatory_followup:
        print(f"  Mandatory follow-up (Tier 3 summarization):")
        print(f"    > {verification.mandatory_followup}")
    print()


def main() -> None:
    print("=" * 80)
    print("AI TOOL SELECTION: TASK ROUTER + VERIFICATION CLASSIFIER (Phase 11 · 74)")
    print("=" * 80)
    print()

    sample_tasks = [
        Task(
            label="What does our data retention policy say about email archives?",
            task_type=TaskType.RETRIEVAL,
            data_tier=DataTier.INTERNAL,
            consequence_level=2,
            internal_corpus_covers=True,
            is_large_binary_document=False,
            note="Internal RAG should answer; no need to send data externally.",
        ),
        Task(
            label="Draft a project kickoff email to the client team",
            task_type=TaskType.DRAFTING,
            data_tier=DataTier.PUBLIC,
            consequence_level=1,
            internal_corpus_covers=False,
            is_large_binary_document=False,
        ),
        Task(
            label="Summarize this 50-page supplier contract PDF for the procurement team",
            task_type=TaskType.SUMMARIZATION,
            data_tier=DataTier.CONFIDENTIAL,
            consequence_level=3,
            internal_corpus_covers=False,
            is_large_binary_document=True,
            note="Confidential data + external document intelligence = blocked.",
        ),
        Task(
            label="Write a Python script to parse CSV expense reports",
            task_type=TaskType.CODE,
            data_tier=DataTier.PUBLIC,
            consequence_level=2,
            internal_corpus_covers=False,
            is_large_binary_document=False,
        ),
        Task(
            label="Classify 300 customer complaints into themes",
            task_type=TaskType.CLASSIFICATION,
            data_tier=DataTier.PUBLIC,
            consequence_level=2,
            internal_corpus_covers=False,
            is_large_binary_document=False,
        ),
        Task(
            label="Summarize patient records for a regulatory filing",
            task_type=TaskType.SUMMARIZATION,
            data_tier=DataTier.REGULATED,
            consequence_level=4,
            internal_corpus_covers=False,
            is_large_binary_document=True,
            note="Regulated data: external AI prohibited.",
        ),
        Task(
            label="Brainstorm five angles for a go-to-market strategy deck",
            task_type=TaskType.IDEATION,
            data_tier=DataTier.PUBLIC,
            consequence_level=1,
            internal_corpus_covers=False,
            is_large_binary_document=False,
        ),
        Task(
            label="Review and refactor the authentication module before production deploy",
            task_type=TaskType.CODE,
            data_tier=DataTier.INTERNAL,
            consequence_level=4,
            internal_corpus_covers=False,
            is_large_binary_document=False,
            note="Internal data restricts external code tools; Tier 4 consequence.",
        ),
        # The contract-reviewer failure shape, modeled with a clean
        # Tier 3 routing so the mandatory targeted-retrieval follow-up
        # actually fires in the live output. (The confidential version
        # above is blocked at routing; this internal-RAG variant is
        # where the verification step becomes load-bearing.)
        Task(
            label="Summarize 47-page supplier contract for internal review",
            task_type=TaskType.SUMMARIZATION,
            data_tier=DataTier.INTERNAL,
            consequence_level=3,
            internal_corpus_covers=True,
            is_large_binary_document=False,
            note="Internal data, internal RAG covers it. Tier 3 with "
                 "mandatory targeted-retrieval follow-up -- the contract-"
                 "reviewer failure shape.",
        ),
    ]

    blocked_count = 0
    followup_required = 0
    for task in sample_tasks:
        evaluate(task)
        routing = route_task(task)
        verification = classify_verification(routing, task)
        if routing.blocked:
            blocked_count += 1
        if verification.mandatory_followup:
            followup_required += 1

    demonstrate_position_bias_failure_shape()

    print("=" * 80)
    print("HEADLINE: the failure shape was 'summarization Tier 3 with the")
    print("targeted-retrieval follow-up skipped.' A correct tool choice")
    print("(internal RAG, Tier 3 verification) does NOT remove the need for")
    print("the follow-up question — it just makes the follow-up the load-")
    print("bearing step. Position bias survives a clean routing.")
    print("-" * 80)
    print(f"  {len(sample_tasks)} tasks evaluated. {blocked_count} blocked by tool/data-tier mismatch.")
    print(f"  {followup_required} task(s) flagged for mandatory targeted-retrieval follow-up.")
    print("  Key rules:")
    print("    1. Internal RAG first for any retrieval the internal corpus covers.")
    print("    2. Regulated data -> human-only; no external API regardless of tool quality.")
    print("    3. Confidential data + external document intelligence -> blocked.")
    print("    4. Consequence level drives verification tier, independent of tool choice.")
    print("    5. Tier 3 summarization always requires a targeted retrieval question")
    print("       about the most decision-critical clause. A correct routing is not a")
    print("       substitute for the follow-up; it is the precondition for it.")
    print("    6. A blocked routing does not disappear with a better prompt.")
    print("       Fix the data classification or the tool choice, not the wording.")


if __name__ == "__main__":
    main()
