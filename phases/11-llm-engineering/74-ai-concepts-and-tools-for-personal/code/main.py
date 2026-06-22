"""Task-to-tool router and verification-tier classifier — stdlib Python.

Part 1: Task-to-Tool Router
  Takes a structured task description (task type, data classification,
  requires retrieval from internal corpus) and routes it to the appropriate
  AI tool category with a brief rationale.

Part 2: Verification-Tier Classifier
  Takes the routed tool and task consequence level and returns the
  verification tier required, the checks to run, and a BLOCK flag when
  the data classification is incompatible with the chosen tool.

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
    consequence_level: int          # 1–4 matching VerificationTier
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

    # Rule 2: retrieval from internal corpus
    if task.task_type is TaskType.RETRIEVAL and task.internal_corpus_covers:
        return RoutingDecision(
            tool=ToolCategory.INTERNAL_RAG,
            rationale=(
                "Question is answerable from the internal corpus. "
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


def classify_verification(routing: RoutingDecision, task: Task) -> VerificationDecision:
    """Return the required verification tier and checks.

    If the routing was blocked, the verification tier is irrelevant —
    the decision is already blocked. Otherwise tier follows consequence_level.
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
    return VerificationDecision(
        tier=tier,
        checks=_TIER_CHECKS[tier],
    )


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
    ]

    blocked_count = 0
    for task in sample_tasks:
        evaluate(task)
        routing = route_task(task)
        if routing.blocked:
            blocked_count += 1

    print("=" * 80)
    print("HEADLINE: match the task type and data tier before typing the prompt")
    print("-" * 80)
    print(f"  {len(sample_tasks)} tasks evaluated. {blocked_count} blocked by tool/data-tier mismatch.")
    print("  Key rules:")
    print("    1. Internal RAG first for any retrieval the internal corpus covers.")
    print("    2. Regulated data -> human-only; no external API regardless of tool quality.")
    print("    3. Confidential data + external document intelligence -> blocked.")
    print("    4. Consequence level drives verification tier, independent of tool choice.")
    print("    5. A blocked routing does not disappear with a better prompt.")
    print("       Fix the data classification or the tool choice, not the wording.")


if __name__ == "__main__":
    main()
