"""Internal Knowledge Assistant — planning policy simulator. stdlib Python only.

Part 1: Source Readiness Classifier
  Takes a document descriptor (authority, currency, scope fit) and outputs a
  readiness verdict. Models the corpus audit gate that must pass before a
  document is indexed.

Part 2: Answer Accountability Router
  Takes a query context (user role, retrieval score, retrieved chunk metadata)
  and routes to one of four outcomes: answer-with-citation,
  low-confidence-disclosure, abstain-with-redirect, or out-of-scope-refusal.
  Models the runtime decision flow described in Phase 11 · 94.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

class ReadinessVerdict(Enum):
    READY = "ready"
    BLOCKED = "blocked"


class RouteOutcome(Enum):
    ANSWER_WITH_CITATION = "answer_with_citation"
    LOW_CONFIDENCE_DISCLOSURE = "low_confidence_disclosure"
    ABSTAIN_WITH_REDIRECT = "abstain_with_redirect"
    OUT_OF_SCOPE_REFUSAL = "out_of_scope_refusal"


# ---------------------------------------------------------------------------
# Part 1 — Source Readiness Classifier
# ---------------------------------------------------------------------------

# Maximum age in days for each freshness category.
# A document is "current" if its age_days <= this threshold.
FRESHNESS_WINDOWS = {
    "pricing":             1,
    "policy":             90,
    "reference_arch":    365,
    "methodology":       365,
    "project_artifact":   30,
    "general":           180,
}


@dataclass
class DocumentDescriptor:
    title: str
    has_named_owner: bool        # authority gate 1
    is_canonical_version: bool   # authority gate 2
    age_days: int                # currency gate
    freshness_category: str      # maps to FRESHNESS_WINDOWS
    is_factual_content: bool     # scope-fit gate: structured, answerable facts?
    note: str = ""


def classify_source(doc: DocumentDescriptor) -> tuple[ReadinessVerdict, str]:
    """Return (verdict, blocking_reason).

    All three gates must pass. First failure wins and is reported as the
    blocking reason so the document owner knows what to fix.
    """
    # Gate 1: authority
    if not doc.has_named_owner:
        return ReadinessVerdict.BLOCKED, "no named owner (authority)"
    if not doc.is_canonical_version:
        return ReadinessVerdict.BLOCKED, "not the canonical version (authority)"

    # Gate 2: currency
    window = FRESHNESS_WINDOWS.get(doc.freshness_category, FRESHNESS_WINDOWS["general"])
    if doc.age_days > window:
        return ReadinessVerdict.BLOCKED, (
            f"stale: {doc.age_days} days old, window is {window} days "
            f"(category: {doc.freshness_category})"
        )

    # Gate 3: scope fit
    if not doc.is_factual_content:
        return ReadinessVerdict.BLOCKED, "not factual/answerable content (scope fit)"

    return ReadinessVerdict.READY, ""


# ---------------------------------------------------------------------------
# Part 2 — Answer Accountability Router
# ---------------------------------------------------------------------------

# Confidence thresholds. Values are cosine-similarity-equivalent scores [0, 1].
CONFIDENCE_HIGH = 0.72   # above this: answer with citation
CONFIDENCE_LOW  = 0.45   # below this: abstain or refuse; between: disclose


@dataclass
class ChunkMetadata:
    source_title: str
    source_url: str
    last_modified: str       # ISO-8601 date string
    owner_team: str
    permitted_roles: list[str] = field(default_factory=list)


@dataclass
class QueryContext:
    question: str
    user_role: str                  # single role for this demo
    retrieval_score: float          # best chunk's similarity score [0, 1]
    best_chunk: ChunkMetadata | None
    in_declared_scope: bool         # is query topic within the assistant's scope?
    note: str = ""


def route_answer(ctx: QueryContext) -> tuple[RouteOutcome, str]:
    """Return (outcome, human-readable reason).

    Decision order:
    1. Scope check — out-of-scope queries are refused regardless of score.
    2. Permission check — forbidden chunks cannot be cited.
    3. Confidence routing — high / medium / low.
    """
    # Step 1: scope
    if not ctx.in_declared_scope:
        return (
            RouteOutcome.OUT_OF_SCOPE_REFUSAL,
            "query topic is outside the declared scope of this assistant",
        )

    # Step 2: permission
    if ctx.best_chunk is not None:
        if ctx.user_role not in ctx.best_chunk.permitted_roles:
            # Treat a forbidden-chunk hit the same as no result: abstain.
            return (
                RouteOutcome.ABSTAIN_WITH_REDIRECT,
                f"best chunk is restricted to roles {ctx.best_chunk.permitted_roles}; "
                f"caller has role '{ctx.user_role}' — abstaining to prevent leakage",
            )

    # Step 3: confidence
    if ctx.retrieval_score >= CONFIDENCE_HIGH and ctx.best_chunk is not None:
        citation = (
            f"{ctx.best_chunk.source_title} "
            f"(owner: {ctx.best_chunk.owner_team}, "
            f"last modified: {ctx.best_chunk.last_modified}, "
            f"url: {ctx.best_chunk.source_url})"
        )
        return (
            RouteOutcome.ANSWER_WITH_CITATION,
            f"score {ctx.retrieval_score:.2f} >= {CONFIDENCE_HIGH} — cite: {citation}",
        )

    if ctx.retrieval_score >= CONFIDENCE_LOW:
        return (
            RouteOutcome.LOW_CONFIDENCE_DISCLOSURE,
            f"score {ctx.retrieval_score:.2f} in [{CONFIDENCE_LOW}, {CONFIDENCE_HIGH}) — "
            "surface answer with disclaimer and retrieval score",
        )

    return (
        RouteOutcome.ABSTAIN_WITH_REDIRECT,
        f"score {ctx.retrieval_score:.2f} < {CONFIDENCE_LOW} — "
        "no sufficiently relevant source; redirect to document owner or contact",
    )


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 78)
    print("INTERNAL KNOWLEDGE ASSISTANT — PLANNING POLICY SIMULATOR (Phase 11 · 94)")
    print("=" * 78)

    # --- Part 1: Source Readiness ---

    print()
    print("PART 1: SOURCE READINESS CLASSIFIER")
    print("-" * 78)

    sample_docs = [
        DocumentDescriptor(
            title="Enterprise Pricing Sheet Q2 2026",
            has_named_owner=True,
            is_canonical_version=True,
            age_days=0,
            freshness_category="pricing",
            is_factual_content=True,
        ),
        DocumentDescriptor(
            title="IT Security Policy v4.2",
            has_named_owner=True,
            is_canonical_version=True,
            age_days=45,
            freshness_category="policy",
            is_factual_content=True,
        ),
        DocumentDescriptor(
            title="Project Kickoff Meeting Notes (draft)",
            has_named_owner=False,
            is_canonical_version=False,
            age_days=10,
            freshness_category="project_artifact",
            is_factual_content=False,
            note="raw meeting notes, no owner assigned",
        ),
        DocumentDescriptor(
            title="Reference Architecture — Cloud Landing Zone",
            has_named_owner=True,
            is_canonical_version=False,   # a copy, not the master doc
            age_days=200,
            freshness_category="reference_arch",
            is_factual_content=True,
            note="SharePoint copy, not the Confluence master",
        ),
        DocumentDescriptor(
            title="Consulting Methodology Handbook 2024",
            has_named_owner=True,
            is_canonical_version=True,
            age_days=400,
            freshness_category="methodology",
            is_factual_content=True,
            note="last review was pre-2026 AI practice update",
        ),
        DocumentDescriptor(
            title="AI Engineering Best Practices Guide",
            has_named_owner=True,
            is_canonical_version=True,
            age_days=60,
            freshness_category="general",
            is_factual_content=True,
        ),
    ]

    ready_count = 0
    for doc in sample_docs:
        verdict, reason = classify_source(doc)
        status = "READY  " if verdict is ReadinessVerdict.READY else "BLOCKED"
        note = f"  [{doc.note}]" if doc.note else ""
        reason_str = f"  -> {reason}" if reason else ""
        print(f"  {status}  {doc.title}{note}{reason_str}")
        if verdict is ReadinessVerdict.READY:
            ready_count += 1

    print()
    print(f"  {ready_count}/{len(sample_docs)} documents passed the readiness gate.")

    # --- Part 2: Answer Accountability Router ---

    print()
    print("PART 2: ANSWER ACCOUNTABILITY ROUTER")
    print("-" * 78)

    # Reusable chunk metadata
    policy_chunk = ChunkMetadata(
        source_title="IT Security Policy v4.2",
        source_url="https://intranet.example.com/security/policy-v4.2",
        last_modified="2026-04-15",
        owner_team="Information Security",
        permitted_roles=["internal", "restricted", "confidential"],
    )
    confidential_chunk = ChunkMetadata(
        source_title="HR Restructuring Plan 2026",
        source_url="https://intranet.example.com/hr/restructuring-2026",
        last_modified="2026-06-01",
        owner_team="HR Leadership",
        permitted_roles=["confidential"],  # only senior leadership
    )

    sample_queries = [
        QueryContext(
            question="What is the policy for personal device access to internal systems?",
            user_role="internal",
            retrieval_score=0.81,
            best_chunk=policy_chunk,
            in_declared_scope=True,
            note="high-confidence hit, user has permission",
        ),
        QueryContext(
            question="What device policy applies to contractors?",
            user_role="internal",
            retrieval_score=0.58,
            best_chunk=policy_chunk,
            in_declared_scope=True,
            note="medium confidence: policy exists but contractor specifics are thin",
        ),
        QueryContext(
            question="Who is being made redundant in the restructuring?",
            user_role="internal",  # not confidential
            retrieval_score=0.77,
            best_chunk=confidential_chunk,
            in_declared_scope=True,
            note="permission leakage scenario: high score but user lacks access",
        ),
        QueryContext(
            question="What is the weather forecast for Frankfurt next week?",
            user_role="internal",
            retrieval_score=0.12,
            best_chunk=None,
            in_declared_scope=False,
            note="out of scope: assistant covers internal policies, not weather",
        ),
        QueryContext(
            question="What is the approval process for vendor contracts above 50k?",
            user_role="internal",
            retrieval_score=0.31,
            best_chunk=None,
            in_declared_scope=True,
            note="in scope but no good source exists yet — low retrieval score",
        ),
    ]

    outcome_counts: dict[RouteOutcome, int] = {}
    for ctx in sample_queries:
        outcome, reason = route_answer(ctx)
        outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1
        print(f"  Q: \"{ctx.question[:60]}\"")
        print(f"     role={ctx.user_role}  score={ctx.retrieval_score:.2f}")
        print(f"     -> {outcome.value}")
        print(f"        {reason}")
        if ctx.note:
            print(f"        [note: {ctx.note}]")
        print()

    print("  Outcome distribution:")
    for outcome, count in sorted(outcome_counts.items(), key=lambda x: x[0].value):
        print(f"    {outcome.value:<35} {count}")

    # --- Headline ---
    print()
    print("=" * 78)
    print("HEADLINE: governance decisions must precede indexing")
    print("-" * 78)
    print("  Source readiness blocked 3/6 sample docs — stale sources and missing")
    print("  owners are the most common failure modes before a chunk is written.")
    print("  Permission leakage is silent at query time without a pre-filter:")
    print("  the router catches it, but only because permitted_roles was encoded")
    print("  at index time. Out-of-scope and low-confidence queries both need")
    print("  explicit fallback paths — the default is hallucination at the boundary.")


if __name__ == "__main__":
    main()
