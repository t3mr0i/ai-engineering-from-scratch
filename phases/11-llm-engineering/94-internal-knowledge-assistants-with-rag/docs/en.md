# Internal Knowledge Assistants with RAG: When the Wrong Document Answers With Full Confidence (2026)

> Retrieval-augmented generation promised to ground language models in your actual documents and kill the hallucination problem at its root. Six years later, the failure mode that dominates our incident reviews is not hallucination in the classical sense — the system is doing exactly what it was designed to do. It is retrieving a chunk, quoting it, citing it, and being wrong. The wrong document has the highest cosine similarity to the query. The wrong document was indexed last year and never updated. The wrong document was mis-tagged at the source system and the assistant inherited the mis-tag. The wrong document is permitted for the user, so the permission gate does not catch it. The retrieval score is 0.84, the answer cites three sources, and the response is confident and wrong. This lesson is about that failure shape, and the small set of design decisions that turn it from "production rollback" into "logged edge case."

**Type:** Learn
**Languages:** Python (stdlib — wrong-doc failure simulator)
**Prerequisites:** Phase 11 · 06 (RAG), Phase 11 · 07 (Advanced RAG), Phase 11 · 10 (Evaluation)
**Time:** ~55 minutes

## The Problem

Most RAG projects that fail in production do not fail because the retriever cannot find *any* relevant chunk. They fail because the retriever finds the wrong one with high confidence and the system has no mechanism to notice. In client incident reviews, a large share of reported "the assistant gave a wrong answer" tickets turn out not to be hallucinations — they are correct retrievals of stale, mis-tagged, duplicated, or out-of-scope-but-cosinely-close documents. The most expensive incidents in our incident log were not retrieval misses; they were retrieval wins on the wrong document.

The engineering question for 2026 is not "which embedding model has the best benchmark score." It is operational: what properties must every indexed chunk carry so the runtime can detect a wrong-but-similar retrieval before it becomes a user-facing answer, and what does the system do when the retrieval score is high but the supporting signals (freshness, source authority, scope match, source agreement) are bad? Those questions must be answered before the first document is embedded. Retrofitting them is consistently harder than designing for them upfront — and almost always coincides with a compliance incident.

## The Concept

### The wrong-doc failure shape, named

Three named failure shapes account for the majority of post-rollout RAG incidents we see in client reviews. They share a signature: high retrieval score, plausible answer, wrong content.

**Shape 1 — Stale supersedes current.** A policy document was rewritten in 2025 and the new version lives in Confluence. The old 2019 version lives in SharePoint, was indexed first, and the new version was never pushed to the indexer because the SharePoint site is the auto-discovered source. Cosine similarity to the query is essentially identical. The old document wins on tie-breaker (it has the highest overall similarity, slightly, because the query phrasing happens to match its phrasing). The assistant cites the 2019 document with `last_modified: 2019-03-12` in the citation — a careful user spots it, most users do not.

**Shape 2 — Duplicate with wrong tagging.** A project deliverable was archived and re-uploaded to a different SharePoint site. Both copies are indexed. The duplicate is tagged `internal` at the source system but contains content from the original `confidential` location — the re-upload lost the original's permission tag. The assistant retrieves the mis-tagged duplicate and cites it for a user with `internal` permissions. The permission gate says "yes, this user can see this." The provenance metadata says "owner: Project X, last modified: 2026-04." Nothing in the answer reveals the leak; only the original author would recognize that the deliverable was never supposed to be `internal`.

**Shape 3 — Adjacent-topic with confident phrasing.** The user asks a question that the corpus can answer partially. The retriever finds a chunk on an adjacent topic whose phrasing matches the query closely. The chunk is in scope, current, and permitted. The assistant synthesizes an answer that *uses* the chunk but extrapolates beyond it. The citation is honest — the chunk really does exist, the chunk really is relevant, the chunk just does not actually answer the question. The user gets a confident answer that the chunk technically does not support. This shape is the hardest to detect with metadata alone; it requires either faithfulness evaluation on the answer or aggressive answer-snippet grounding.

All three shapes have the same observable property: the retrieval score is high, the citation is present and looks legitimate, and the answer is wrong. The fix in every case is not a better embedding model. It is structural signals on the chunk that the runtime can use as a second opinion: a freshness score, a source-agreement signal, a scope tag, a provenance chain back to the canonical version. The lesson teaches the minimum viable version of those signals.

### The four planning decisions, reconceived

The earlier framing of "source readiness, permissions, provenance, fallback" is correct but underweighted. Each of the four must be designed specifically to catch one of the wrong-doc shapes, not as abstract governance.

| Decision | What it must catch | Minimum viable design |
|---|---|---|
| **Source readiness** | Stale supersedes current (Shape 1) | Named owner, canonical-version pointer, freshness window per category, deprecation date for any document that has been superseded |
| **Permission boundary** | Duplicate with wrong tagging (Shape 2) | Per-chunk `permitted_roles` plus a `provenance_source_id` that points back to the source system's record, not to a path on a share |
| **Provenance metadata** | All three shapes | `source_url` to the canonical version, `last_modified`, `indexed_at`, `superseded_by` if applicable, and a `content_hash` so two indexings of the "same" document can be detected as duplicates |
| **Fallback paths** | Adjacent-topic with confident phrasing (Shape 3) | A faithfulness gate that compares the generated answer against the retrieved snippets and triggers an abstain path if support is weak |

The fourth row is the one most projects skip. The faithfulness gate is the only line of defense against Shape 3, and Shape 3 is the failure mode that produces the most confident wrong answers.

### Source readiness: the supersedure audit

A practical readiness checklist for 2026 has four gates, not three:

1. **Authority**: Is there a named owner? Is this the canonical version, not a draft, copy, or archive?
2. **Currency**: Has it been reviewed within the freshness window for its category (24 h for pricing, 90 days for policy, 1 year for reference architecture)?
3. **Scope fit**: Does it contain structured, answerable factual claims? Meeting-notes summaries and raw email threads produce noisy chunks with high false-positive scores.
4. **Supersedure state**: Has this document been officially replaced? A document marked `superseded_by: <canonical_url>` must either be excluded from the index or carry a `superseded: true` flag that the runtime uses to downgrade its retrieval priority.

The fourth gate is what catches Shape 1. Without it, the index contains both the 2019 policy and the 2025 policy and the retriever has no way to prefer the current one. Phase 11 · 06 covers chunking; this is a prerequisite to chunking because the chunker should not be chunking superseded documents at all.

Freshness windows worth committing to memory:

| Category | Max age | Rationale |
|---|---|---|
| Pricing / rates | 1 day | Goes stale inside a sprint |
| Policy / compliance | 90 days | Audit cycles |
| Project artifacts | 30 days | Status changes weekly |
| Reference architecture | 1 year | Slow-moving |
| Methodology / handbook | 1 year | Annual reviews |
| General reference | 180 days | Twice-yearly check |

Expect 30–60 % of an unscoped corporate corpus to fail the gates on the first pass. That is the point of the gate — to surface what cannot safely be retrieved.

### Permission boundaries: provenance back to the source system

The standard permission error is a flat vector store with no per-chunk access metadata; every query then implicitly has access to every chunk. The 2026-correct architecture adds two fields per chunk:

- **`permitted_roles`** — the role set authorized to receive an answer derived from this chunk. Same as in the earlier framing, enforced as a pre-filter before ANN search (Qdrant, Weaviate, pgvector, Pinecone via metadata index all support this natively).
- **`provenance_source_id`** — a pointer back to the source system's canonical record ID, not to the share path or storage URL. This is what catches Shape 2. If two chunks in the index share a `provenance_source_id`, they are the same source-system document — duplicate. If they have different `provenance_source_id` values but high cosine similarity and overlapping content, they are likely a re-uploaded copy and the runtime should prefer the one whose `provenance_source_id` is recorded in the source system as canonical.

The reason `provenance_source_id` matters more than `source_url`: URLs change. Files are moved, renamed, re-uploaded. The source system's record ID (a SharePoint item GUID, a Confluence page ID, a Notion block ID) is stable and is what the governance system can actually reconcile against. Without it, the indexer is reconciling URLs, which is a fundamentally lossy process.

The minimum viable role taxonomy for internal deployments is unchanged from the earlier lesson: `[public, internal, restricted, confidential]`. What changed in 2026 is that compliance reviewers routinely ask how a chunk's `permitted_roles` field was derived from the source system. The defensible answer is "by automated reconciliation against the source system's permission list at index time, stored as `provenance_source_id` and a `permission_list_hash`". The indefensible answer is "we set it manually when we indexed the document".

### Provenance metadata: the reconstruction path

A citable answer requires, at minimum:

- **`source_url`** — canonical URL or path to the *current* version of the source document, not the path the chunker happened to read from
- **`last_modified`** — when the source was last modified at the source system, at index time
- **`indexed_at`** — when this specific chunk was last indexed
- **`owner_team`** — escalation path
- **`permitted_roles`** — as above
- **`superseded_by`** — if not null, the chunk is historical; the runtime should either exclude it or surface its supersedure in the citation
- **`content_hash`** — SHA-256 of the chunk text, used to deduplicate at query time and at re-index time

A 2026 incident we reviewed that cost a logistics firm roughly 3 weeks of compliance work was traceable to the absence of `content_hash`. Two re-uploads of the same vendor contract had been indexed with different `chunk_id` values (different paths, different byte offsets) but identical content. The retriever returned both as "two sources agreeing," which inflated the system's confidence in the answer. The answer was correct, but the audit trail could not prove it was derived from the canonical version of the contract, only from two copies of the same file. A `content_hash` would have flagged them as duplicates during indexing.

### Fallback paths: the faithfulness gate

The earlier lesson's four strategies (abstain with redirect, low-confidence disclosure, human escalation, out-of-scope refusal) remain correct. What 2026 practice adds is a per-answer faithfulness check between retrieval and response.

The faithfulness gate compares the generated answer against the retrieved snippets and asks: "Is every claim in the answer supported by some sentence in the retrieved snippets?" If not, the answer is downgraded to one of the fallback strategies regardless of retrieval score. This is what catches Shape 3 — the high-score, adjacent-topic retrieval that produces a plausible-sounding extrapolation.

In production, the faithfulness check is either:

- An LLM-as-judge call (Claude Sonnet 4.x or Claude Haiku 4.x) that receives the answer and the snippets and returns a faithfulness score in [0, 1]
- A cheaper extractive check that verifies that named entities, numbers, and quoted phrases in the answer appear in the retrieved snippets
- A hybrid where the extractive check is the default and the LLM-as-judge is invoked only when the extractive check is borderline

Cost numbers worth knowing: an LLM-as-judge faithfulness call on ~2K tokens of answer plus ~2K tokens of snippets costs roughly $0.012 with Sonnet 4.x and roughly $0.004 with Haiku 4.x (at $3 / $1 per million input tokens respectively). At 10K queries per day that is $120/day (Sonnet) or $40/day (Haiku) — trivial compared to the cost of a single compliance incident. At 1M queries per day it becomes $12K/day (Sonnet) versus $4K/day (Haiku), which is the point at which teams start to prefer the extractive check or a hybrid.

The fallback trigger threshold should be calibrated against an evaluation dataset (Phase 11 · 10) using answer faithfulness, not retrieval recall, as the success metric. A retrieval recall of 0.9 with a faithfulness of 0.6 is worse than a retrieval recall of 0.7 with a faithfulness of 0.9. The wrong-doc failure shapes all produce high recall and low faithfulness — the retriever is doing its job, the answer is just not supported by what was retrieved.

### The full system decision flow

The four planning decisions compose into a runtime decision flow that explicitly handles the wrong-doc shapes:

```
Query arrives with user identity
  -> Resolve permitted_roles for this user
  -> Pre-filter vector store to permitted chunks (Shape 2 gate)
  -> Exclude chunks with superseded_by != null (Shape 1 gate, configurable)
  -> Retrieve top-k
  -> Deduplicate by content_hash (Shape 2 deep gate)
  -> Check retrieval confidence + source agreement (k chunks from different sources?)
      [low confidence] -> abstain or disclose (per strategy)
      [high confidence] -> generate answer
          -> faithfulness check vs retrieved snippets (Shape 3 gate)
              [unsupported claims] -> abstain with redirect or low-confidence disclosure
              [supported claims] -> attach provenance, log, respond
  -> Log (user, query, chunk_ids, content_hashes, faithfulness_score, answer_hash, timestamp)
```

The faithfulness check is the only line that is not present in the pre-2026 design and is the single highest-value addition for catching wrong-doc confidence. Every other line is a refinement of an existing concern.



## Further Reading

- [Anthropic — Claude for RAG workflows](https://docs.claude.com/en/docs/build-with-claude/retrieval-augmented-generation) — current guidance on chunk construction, citation prompting, and faithfulness evaluation with Claude 4.x models.
- [NIST SP 800-53 Rev. 5 — Access Control (AC) family](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) — the US federal standard for access control; AC-3 (Access Enforcement) and AC-4 (Information Flow Enforcement) are the relevant controls for permission-boundary design.
- [Qdrant documentation — Filtering](https://qdrant.tech/documentation/concepts/filtering/) — concrete reference for metadata pre-filtering in a production vector store.
- [DeepEval — RAG evaluation metrics](https://docs.confident-ai.com/docs/metrics-overview) — open-source framework covering faithfulness, contextual recall, and answer relevancy; the tool most commonly used for RAG eval automation in 2026.
- [Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (2020)](https://arxiv.org/abs/2005.11401) — the original RAG paper; the retrieve-then-generate pattern this course builds on.
