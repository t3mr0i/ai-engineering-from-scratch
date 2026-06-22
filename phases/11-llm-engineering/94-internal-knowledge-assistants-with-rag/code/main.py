"""Wrong-doc failure-shape simulator for RAG internal knowledge assistants.

Models the three failure shapes that dominate post-rollout RAG incidents:

  Shape 1 - Stale supersedes current.
            Old policy is still indexed; retriever wins on cosine similarity
            against the new policy.

  Shape 2 - Duplicate with wrong tagging.
            A re-uploaded file lost its source-system permission list;
            indexer trusted the share path. Assistant cites a document the
            user should never have been allowed to see.

  Shape 3 - Adjacent-topic with confident phrasing.
            High retrieval score, in-scope, current, permitted - and the
            generated answer extrapolates beyond what the chunk supports.
            Only the faithfulness gate catches this.

The simulator walks a single query through the corpus three times:

  pass 1: no gates (baseline) - the wrong-doc confidence is visible.
  pass 2: structural gates only (pre-filter + supersedure + content_hash
          dedup) - Shapes 1 and 2 are caught; Shape 3 still slips through.
  pass 3: structural gates + faithfulness gate - all three caught.

No model, no network. Stdlib only.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from enum import Enum


# ---------------------------------------------------------------------------
# Corpus - synthetic chunks that include all three failure shapes on purpose
# ---------------------------------------------------------------------------

def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


@dataclass
class Chunk:
    chunk_id: str
    text: str
    source_title: str
    source_url: str
    provenance_source_id: str       # stable source-system record id
    last_modified: str
    owner_team: str
    permitted_roles: list[str]
    superseded_by: str | None = None   # if set, this chunk is historical
    note: str = ""


def build_corpus() -> list[Chunk]:
    """A small corpus that contains all three wrong-doc shapes on purpose."""

    # Shape 1: stale supersedes current.
    # The 2019 policy was replaced in 2025 by policy-v5. The 2019 version
    # is shorter and uses phrasing closer to what users typically query,
    # so it wins the retrieval on cosine similarity. The 2025 version is
    # longer, with more qualifying clauses.
    stale_policy = Chunk(
        chunk_id="c-stale-001",
        text=(
            "Personal devices may connect to internal systems after a one-line "
            "manager approval. No MDM enrollment required. Last reviewed 2019."
        ),
        source_title="IT Security Policy v3.1",
        source_url="https://intranet.example.com/security/policy-v3.1",
        provenance_source_id="sp-item-aaa-001",
        last_modified="2019-03-12",
        owner_team="Information Security",
        permitted_roles=["internal"],
        superseded_by="https://intranet.example.com/security/policy-v5.0",
        note="SHAPE 1 source: superseded in 2025; indexer still reading the old share",
    )

    current_policy = Chunk(
        chunk_id="c-cur-002",
        text=(
            "Personal devices must complete MDM enrollment before any access to "
            "internal systems. Manager approval is required in addition. "
            "See Mobile Device Standard for exceptions."
        ),
        source_title="IT Security Policy v5.0",
        source_url="https://intranet.example.com/security/policy-v5.0",
        provenance_source_id="sp-item-aaa-099",
        last_modified="2025-11-04",
        owner_team="Information Security",
        permitted_roles=["internal"],
        note="the canonical version - newer, longer, slightly different wording",
    )

    # Shape 2: duplicate with wrong tagging.
    # The original confidential document IS indexed - it is the canonical
    # record at the source system (provenance_source_id from the source
    # system, permitted_roles: confidential). A re-uploaded copy lives
    # in an internal share; the indexer picked it up and trusted the share
    # tag. An internal-role user is allowed to read the duplicate. The
    # pre-filter gate allows the duplicate through; the content-hash
    # dedup gate catches it (the duplicate's hash matches a confidential
    # original in the corpus).
    confidential_original = Chunk(
        chunk_id="c-conf-003",
        text=(
            "Project Atlas restructuring plan: 14 redundancies in Q3, "
            "primarily in the EMEA delivery organization. Comms plan attached."
        ),
        source_title="Project Atlas Restructuring Plan",
        source_url="https://intranet.example.com/confidential/atlas-plan",
        provenance_source_id="confluence-page-9001",
        last_modified="2026-05-20",
        owner_team="HR Leadership",
        permitted_roles=["confidential"],
        note="SHAPE 2: the source-system canonical record, confidential",
    )

    mis_tagged_duplicate = Chunk(
        chunk_id="c-dup-004",
        text=(
            "Project Atlas restructuring plan: 14 redundancies in Q3, "
            "primarily in the EMEA delivery organization. Comms plan attached."
        ),
        source_title="Project Atlas Restructuring Plan",
        source_url="https://intranet.example.com/internal/atlas-plan-copy",
        provenance_source_id="sp-item-bbb-444",
        last_modified="2026-05-22",
        owner_team="HR Leadership",
        permitted_roles=["internal"],   # the re-upload dropped the original tag
        note="SHAPE 2: re-uploaded copy with internal tag; canonical is confidential",
    )

    # Shape 3: adjacent topic with confident phrasing.
    # The chunk matches a query about contractors - same policy source, same
    # topic cluster - but actually only covers employees. The unfaithful
    # generator extrapolates "contractors also need MDM enrollment" from
    # a chunk that says nothing about contractors.
    employee_chunk = Chunk(
        chunk_id="c-emp-005",
        text=(
            "All employees must complete MDM enrollment before accessing "
            "internal systems from a personal device. Enrollment is "
            "self-service via the IT portal."
        ),
        source_title="IT Security Policy v5.0",
        source_url="https://intranet.example.com/security/policy-v5.0",
        provenance_source_id="sp-item-aaa-099",
        last_modified="2025-11-04",
        owner_team="Information Security",
        permitted_roles=["internal"],
        note="SHAPE 3 source: about employees, not contractors - same policy cluster",
    )

    return [stale_policy, current_policy, mis_tagged_duplicate,
            confidential_original, employee_chunk]


# ---------------------------------------------------------------------------
# Retrieval - deterministic, no embeddings. We score by simple term overlap,
# which is enough to reproduce the wrong-doc shapes because the failure
# pattern is not specific to any embedding model.
# ---------------------------------------------------------------------------

def retrieval_score(chunk: Chunk, query_terms: set[str]) -> float:
    text_terms = set(chunk.text.lower().split())
    if not query_terms:
        return 0.0
    overlap = len(query_terms & text_terms)
    # A length-normalized overlap so longer chunks do not automatically win.
    return overlap / (len(query_terms) ** 0.5)


def top_k(corpus: list[Chunk], query_terms: set[str], k: int) -> list[tuple[Chunk, float]]:
    scored = [(c, retrieval_score(c, query_terms)) for c in corpus]
    scored.sort(key=lambda x: (x[1], x[0].chunk_id), reverse=True)
    return scored[:k]


# ---------------------------------------------------------------------------
# Gates
# ---------------------------------------------------------------------------

class GateResult(Enum):
    PASS = "pass"
    BLOCK = "block"


def gate_pre_filter(chunks: list[tuple[Chunk, float]], user_role: str) -> list[tuple[Chunk, float]]:
    """Shape 2 (partial). Drops chunks the user is not permitted to see."""
    return [(c, s) for c, s in chunks if user_role in c.permitted_roles]


def gate_supersedure(chunks: list[tuple[Chunk, float]]) -> list[tuple[Chunk, float]]:
    """Shape 1. Drops chunks that have been superseded."""
    return [(c, s) for c, s in chunks if c.superseded_by is None]


def gate_content_dedup(chunks: list[tuple[Chunk, float]],
                       corpus: list[Chunk]) -> list[tuple[Chunk, float]]:
    """Shape 2 (deep). When two chunks in the wider corpus share a
    content_hash, the canonical one wins. A duplicate's provenance_source_id
    is NOT in the source system as the master - we use a deterministic
    marker here: chunks whose note mentions 'confidential' are the
    canonical originals (the source-system record)."""
    canonical_hashes = {_content_hash(c.text) for c in corpus
                        if "confidential" in c.permitted_roles}
    out: list[tuple[Chunk, float]] = []
    for c, s in chunks:
        h = _content_hash(c.text)
        if h in canonical_hashes and "confidential" not in c.permitted_roles:
            # This is a mis-tagged duplicate; the source-system canonical
            # version was confidential and is not in the permitted subset.
            # Drop it.
            continue
        out.append((c, s))
    return out


# ---------------------------------------------------------------------------
# Faithfulness gate - Shape 3
# ---------------------------------------------------------------------------

def faithfulness_check(answer_claims: list[str], retrieved_chunks: list[Chunk]) -> tuple[bool, list[str]]:
    """Return (supported?, unsupported_claims).

    A claim is supported only if EVERY key content token from the claim
    appears in some retrieved chunk's text. The cheap extractive check
    used here catches the most common Shape 3 case - a claim that
    introduces a specific noun (e.g. 'contractors') that the retrieved
    chunk never mentioned. The 2026-default hybrid escalates borderline
    cases to an LLM-as-judge (Sonnet/Haiku 4.x).
    """
    supported_blob = " ".join(c.text.lower() for c in retrieved_chunks)
    unsupported: list[str] = []
    for claim in answer_claims:
        # Pull content-bearing tokens: length >= 5, not a common stopword.
        stopwords = {"must", "before", "after", "every", "their", "where",
                     "through", "which", "these", "those", "about", "during",
                     "without", "within", "between", "because"}
        key_terms = [t.strip(".,;:()").lower() for t in claim.split()
                     if len(t) >= 5 and t.strip(".,;:()").lower() not in stopwords]
        if not key_terms:
            continue
        # All content terms must appear in some retrieved chunk.
        if not all(term in supported_blob for term in key_terms):
            missing = [t for t in key_terms if t not in supported_blob]
            unsupported.append(f"{claim}  [unsupported terms: {missing}]")
    return (len(unsupported) == 0), unsupported


# ---------------------------------------------------------------------------
# The three failure-shape queries and their (incorrect) model answers
# ---------------------------------------------------------------------------

@dataclass
class Scenario:
    name: str
    query: str
    query_terms: set[str]
    user_role: str
    # What the unfaithful generator would produce given the top retrieval.
    # In the real system this is what the LLM emits; here we hand it in.
    model_answer_claims: list[str]
    expected_shape: str   # which wrong-doc shape this scenario triggers


SCENARIOS: list[Scenario] = [
    Scenario(
        name="personal-device policy lookup",
        query="what is the policy for personal devices connecting to internal systems",
        query_terms={"personal", "devices", "policy", "internal", "systems"},
        user_role="internal",
        model_answer_claims=[
            "Personal devices may connect after one-line manager approval (no MDM required).",
        ],
        expected_shape="Shape 1 - Stale supersedes current",
    ),
    Scenario(
        name="atlas restructuring leak",
        query="tell me about the atlas restructuring plan and the redundancies",
        query_terms={"atlas", "restructuring", "plan", "redundancies"},
        user_role="internal",  # not confidential
        model_answer_claims=[
            "Project Atlas will cut 14 redundancies in Q3, primarily in EMEA delivery.",
        ],
        expected_shape="Shape 2 - Duplicate with wrong tagging",
    ),
    Scenario(
        name="contractor device policy",
        query="what device requirements apply to contractors",
        query_terms={"device", "requirements", "contractors"},
        user_role="internal",
        # The unfaithful answer extrapolates "contractors also need MDM"
        # from a chunk that only says employees need MDM.
        model_answer_claims=[
            "Contractors must complete MDM enrollment before accessing internal systems.",
            "Contractor enrollment is self-service via the IT portal.",
        ],
        expected_shape="Shape 3 - Adjacent-topic with confident phrasing",
    ),
]


# ---------------------------------------------------------------------------
# Pass runner
# ---------------------------------------------------------------------------

def run_pass(
    label: str,
    corpus: list[Chunk],
    scenario: Scenario,
    apply_structural_gates: bool,
    apply_faithfulness_gate: bool,
) -> tuple[str, str]:
    """Returns (verdict, detail). Verdict is one of:
       'ANSWERED (correct)', 'ANSWERED (wrong)', 'ABSTAINED'."""

    retrieved = top_k(corpus, scenario.query_terms, k=2)

    if apply_structural_gates:
        retrieved = gate_pre_filter(retrieved, scenario.user_role)
        retrieved = gate_supersedure(retrieved)
        retrieved = gate_content_dedup(retrieved, corpus)

    if not retrieved:
        return ("ABSTAINED", "structural gates removed all candidates")

    best_chunk, best_score = retrieved[0]

    if apply_faithfulness_gate:
        supported, unsupported = faithfulness_check(
            scenario.model_answer_claims, [c for c, _ in retrieved]
        )
        if not supported:
            return ("ABSTAINED",
                    f"faithfulness gate blocked - unsupported claims: {unsupported}")

    # If we got here, the system would emit the model's answer citing the
    # best chunk. We report whether the cited chunk supports the answer
    # or is a wrong-doc shape.
    if scenario.expected_shape == "Shape 1 - Stale supersedes current":
        if best_chunk.superseded_by is not None:
            return ("ANSWERED (wrong)",
                    f"cited: {best_chunk.source_title} ({best_chunk.last_modified}) "
                    f"- superseded by {best_chunk.superseded_by}")
        return ("ANSWERED (correct)",
                f"cited: {best_chunk.source_title} ({best_chunk.last_modified})")

    if scenario.expected_shape == "Shape 2 - Duplicate with wrong tagging":
        # The mis-tagged duplicate has permitted_roles that include the
        # user. If it slipped through, that's a Shape 2 wrong answer.
        if scenario.user_role in best_chunk.permitted_roles and \
           "SHAPE 2" in best_chunk.note:
            return ("ANSWERED (wrong)",
                    f"cited: {best_chunk.source_title} from "
                    f"{best_chunk.provenance_source_id} - duplicate of a "
                    f"confidential source; tag was lost in re-upload")
        return ("ANSWERED (correct)",
                f"cited: {best_chunk.source_title}")

    if scenario.expected_shape == "Shape 3 - Adjacent-topic with confident phrasing":
        # The chunk is in scope, current, and permitted; the wrong answer
        # extrapolates. Faithfulness gate is the only check that catches
        # this; we mark it wrong unless the gate was applied.
        return ("ANSWERED (wrong)",
                f"cited: {best_chunk.source_title} (score {best_score:.2f}) - "
                f"answer extrapolated beyond the chunk's content")

    return ("ANSWERED (correct)", "no wrong-doc shape detected")


def main() -> None:
    print("=" * 78)
    print("WRONG-DOC FAILURE-SHAPE SIMULATOR (Phase 11 - 94)")
    print("Three scenarios. Three passes. The third pass is the lesson.")
    print("=" * 78)

    corpus = build_corpus()

    passes = [
        ("Pass 1: NO gates (baseline)",                  False, False),
        ("Pass 2: structural gates only",                True,  False),
        ("Pass 3: structural + faithfulness gate",       True,  True),
    ]

    for scenario in SCENARIOS:
        print()
        print("-" * 78)
        print(f"Scenario: {scenario.name}")
        print(f"  query:   \"{scenario.query}\"")
        print(f"  user:    role={scenario.user_role}")
        print(f"  shape:   {scenario.expected_shape}")
        print()
        for label, structural, faithful in passes:
            verdict, detail = run_pass(label, corpus, scenario,
                                       apply_structural_gates=structural,
                                       apply_faithfulness_gate=faithful)
            marker = "[WRONG!]" if verdict == "ANSWERED (wrong)" else \
                     "[abstain]" if verdict == "ABSTAINED" else "[ok]    "
            print(f"  {marker} {label}")
            print(f"          -> {verdict}")
            print(f"             {detail}")
        print()

    # Source-agreement detail for Shape 2 (visible in logs).
    print("=" * 78)
    print("Source-agreement trace for the atlas query (Shape 2):")
    print("-" * 78)
    atlas_terms = {"atlas", "restructuring", "plan", "redundancies"}
    hits = top_k(corpus, atlas_terms, k=4)
    h_mis = _content_hash(mis_tagged_duplicate_text :=
                          "Project Atlas restructuring plan: 14 redundancies in Q3, "
                          "primarily in the EMEA delivery organization. Comms plan attached.")
    for c, s in hits:
        h = _content_hash(c.text)
        flag = ""
        if h == h_mis and "internal" in c.permitted_roles:
            flag = "  <-- re-uploaded copy with internal tag; original is confidential"
        print(f"  {c.source_title:<40} score={s:.2f}  hash={h}{flag}")

    print()
    print("=" * 78)
    print("HEADLINE: this run demonstrated the wrong-doc failure shape.")
    print("In Pass 1 (no gates) every scenario produced a confidently-wrong")
    print("answer with a citation that looked legitimate:")
    print("  - Shape 1: 2019 policy cited as current (high score, dated 2019)")
    print("  - Shape 2: confidential restructuring plan leaked via a")
    print("             re-uploaded copy with an 'internal' tag")
    print("  - Shape 3: employee policy extrapolated to contractors")
    print("Structural gates (Pass 2) caught Shapes 1 and 2 - supersedure")
    print("excludes the stale policy, content_hash dedup drops the")
    print("mis-tagged duplicate. Shape 3 still slipped through because")
    print("no metadata-only signal catches an LLM that extrapolates")
    print("beyond the chunk it was given. Only the faithfulness gate")
    print("(Pass 3) catches Shape 3.")
    print("The fix is not a better embedding model - it is gates 1 and 2")
    print("(structural) AND gate 3 (faithfulness).")
    print("=" * 78)


if __name__ == "__main__":
    main()
