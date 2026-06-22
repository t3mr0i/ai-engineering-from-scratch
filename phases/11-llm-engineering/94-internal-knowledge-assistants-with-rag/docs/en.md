# Planning an Internal Knowledge Assistant: Source Accountability, Permissions, and Fallbacks (2026)

> A 2025 Gartner survey found that 67 % of enterprise RAG deployments that went into production were rolled back or frozen within six months — not because retrieval quality was poor, but because the system answered questions using sources the asking user was not permitted to see, could not cite which document generated the answer, or had no defined path for queries the corpus could not answer. The engineering problem is not "how do I build a RAG pipeline" — Phase 11 · 06 covers that. The problem is: before a single chunk is indexed, what governance decisions must be made and encoded in the system so the assistant is defensible, maintainable, and trustworthy when it inevitably gets something wrong? This course frames those decisions as a structured planning exercise, and the following lessons (Phase 11 · 06, 07, and 10) fill in the technical execution.

**Type:** Learn
**Languages:** Python (stdlib — source readiness classifier + answer accountability router)
**Prerequisites:** Phase 11 · 06 (RAG), Phase 11 · 07 (Advanced RAG)
**Time:** ~45 minutes

## The Problem

Most internal knowledge assistant projects start with the same error: an engineer indexes "all available docs," builds a working prototype in a week, and demonstrates it to stakeholders using a query that happens to hit a high-quality, broadly-permitted source. Stakeholders approve production rollout. Three months later, the assistant is answering questions about a confidential HR restructuring plan with content from a SharePoint folder that was accessible to everyone because no one ever restricted it. Or it cites a superseded policy document from 2019 because that document had the highest cosine similarity to the query. Or a consultant asks why the assistant gave a specific answer and no one can reconstruct which source produced it. None of these are retrieval-quality failures — they are failures of planning.

The engineering question for 2026 is not just "does the answer match the source." It is: who is allowed to receive an answer derived from this source, how do I know this source is current and authoritative, what happens when no source exists, and how do I produce an audit trail that satisfies compliance and supports rollback? Every one of these questions must be answered before the first document is embedded. Retrofitting source permissions, provenance metadata, or fallback routing into a running system is consistently harder than designing for them upfront.

## The Concept

### The four planning decisions

Before indexing a single document, four decisions must be made and recorded in a design document. Skipping any one of them is the root cause behind most production rollbacks.

| Decision | Question | Why it must be answered first |
|---|---|---|
| **Source readiness** | Is this source current, authoritative, and scoped to a bounded domain? | A retriever cannot fix a stale or contradictory corpus |
| **Permission boundary** | Which users or roles may receive an answer derived from this source? | Access control cannot be retrofitted cleanly into a running vector store |
| **Provenance metadata** | What citation must accompany every answer — URL, doc title, last-modified date, owner? | Compliance and rollback both require a reconstruction path |
| **Fallback path** | What does the assistant do when no source covers the query or confidence is low? | Undefined fallback = hallucination at the boundary of the corpus |

### Source readiness: the corpus audit

Not every document that exists in your organization is ready to be indexed. A practical readiness checklist has three gates:

1. **Authority**: Is there a named owner? Is this the canonical version, not a draft or a copy?
2. **Currency**: Has it been reviewed within the freshness window relevant to its domain (24 h for pricing, 90 days for policy, 1 year for reference architecture)?
3. **Scope fit**: Does it contain the kind of factual, answerable content that retrieval benefits from? Meeting-notes summaries and raw email threads typically produce noisy chunks with high false-positive retrieval scores.

Phase 11 · 06 showed why chunk quality dominates retrieval quality. Source readiness is the prerequisite to chunk quality — bad sources produce bad chunks regardless of chunking strategy.

### Permission boundaries: encoding access control in the index

The standard error is a flat vector store with no per-chunk access metadata. Every query then implicitly has access to every chunk. The correct architecture stores a `permitted_roles` field alongside each chunk at index time and enforces it as a pre-filter or post-filter at query time.

Two enforcement models:

| Model | How it works | Tradeoff |
|---|---|---|
| **Pre-filter (metadata filter)** | Vector store receives the user's role set and excludes non-permitted chunks before ANN search | Only the permitted subset is ever ranked; no risk of a forbidden chunk winning a re-rank step |
| **Post-filter** | ANN search returns top-k across all chunks; forbidden chunks are removed from the result set | Simpler to implement; may reduce effective k below threshold on sparse corpora |

Qdrant, Weaviate, and pgvector all support metadata filtering natively. Pinecone supports it via namespaces or metadata index. The implementation cost is low; the planning cost is designing the role taxonomy before ingestion, which requires talking to whoever administers the source systems.

For most internal deployments, a simple flat RBAC (role-based access control) model suffices: `[public, internal, restricted, confidential]` mapped to organizational roles. Multi-tenancy (user A and user B both have `internal` access but must not see each other's personal data) requires row-level security in the source system, not in the vector store.

### Provenance metadata: what every answer must carry

A citable answer requires at minimum:

- **Source title and URL** (or SharePoint path, Confluence page ID, etc.)
- **Last-modified date** at time of indexing
- **Document owner or team**
- **Index timestamp** (when was this chunk last re-indexed)

The last-modified date and index timestamp together let a user know whether the answer was generated from a document that has since been updated. Phase 11 · 07 covers reranking; note that reranking by recency is a valid strategy when two chunks score similarly on semantic similarity but differ in age.

A minimal provenance schema for a chunk:

```
chunk_id:        str           # deterministic hash of source_url + byte_offset
source_url:      str           # canonical URL or path
source_title:    str
last_modified:   ISO-8601 str
indexed_at:      ISO-8601 str
owner_team:      str
permitted_roles: list[str]
```

This schema should be decided before ingestion. Adding fields after the fact requires a full re-index.

### Fallback paths: what the assistant does at the corpus boundary

Every internal corpus has an edge. Queries that fall outside the corpus are not errors — they are expected traffic. A system with no defined fallback will hallucinate at that edge. Four fallback strategies, in order of increasing friction:

| Strategy | Behavior | When appropriate |
|---|---|---|
| **Abstain with redirect** | "I don't have a source for that. Contact [owner] or consult [URL]." | High-stakes domains (legal, HR, compliance) where a wrong answer is worse than no answer |
| **Low-confidence disclosure** | Answer with retrieved content but surface the retrieval score and a disclaimer | Reference material where approximate answers have value |
| **Human escalation** | Route query to a human expert queue | When the query pattern suggests an evolving situation not yet in the corpus |
| **Out-of-scope refusal** | Hard refusal if query domain is outside the declared assistant scope | When the assistant has a defined, narrow purpose and scope drift is a risk |

The fallback strategy must match the domain's risk tolerance. A customer-support assistant for a software product can safely use low-confidence disclosure. A legal-advice assistant cannot. Phase 11 · 10 covers evaluation; the fallback trigger threshold (what retrieval score or relevance score triggers a fallback) is a parameter that evaluation should tune, not a default.

### Evaluation as a planning input, not an afterthought

Phase 11 · 10 covers RAG evaluation in detail. At the planning stage, evaluation matters in two ways:

1. **Define success criteria before building.** "The assistant should correctly answer 80 % of tier-1 support queries without escalation" is a testable criterion. "The assistant should be helpful" is not.
2. **Plan an evaluation dataset.** An evaluation dataset requires question-answer pairs with known source attribution. Creating this dataset is non-trivial and requires domain expert time. If that time is not budgeted before the build starts, evaluation will be skipped entirely.

The standard evaluation metrics for this course's scope:

| Metric | What it measures | Tool |
|---|---|---|
| Retrieval recall@k | % of queries where the correct source appears in top-k | Manual or automated with known QA pairs |
| Answer faithfulness | Does the answer contain only claims supported by retrieved chunks? | LLM-as-judge (Claude Sonnet 4.x) or DeepEval |
| Permission leakage | Does the answer cite sources the user is not permitted to see? | Automated test with synthetic restricted queries |
| Fallback trigger rate | What % of queries trigger a fallback? | Logging on production traffic |

Permission leakage testing deserves special emphasis: it requires explicit synthetic test cases where the correct answer is "this user should not receive this content," which most teams never write.

### The full system decision flow

The four planning decisions compose into a runtime decision flow:

```
Query arrives with user identity
  -> Resolve permitted_roles for this user
  -> Pre-filter vector store to permitted chunks
  -> Retrieve top-k
  -> Check retrieval confidence
      [below threshold] -> apply fallback strategy
      [above threshold] -> generate answer
          -> attach provenance metadata to answer
          -> log (user, query, retrieved chunk_ids, answer_hash, timestamp)
```

Every box in that flow requires a prior planning decision. The flow is not recoverable by prompt engineering alone once it is in production without those decisions.

## Use It

`code/main.py` models two of the four planning decisions as deterministic, stdlib-only classifiers:

1. A **source readiness classifier** that takes a document descriptor (authority, currency, scope fit) and outputs a readiness verdict with the blocking reason.
2. An **answer accountability router** that takes a query context (user role, retrieval score, retrieved chunk metadata) and routes to one of four outcomes: answer-with-citation, low-confidence-disclosure, abstain-with-redirect, or out-of-scope-refusal.

No network, no model calls — the point is to make the planning policy explicit and executable, the same way Phase 15 · 10 made the permission classifier runnable.

## Ship It

`outputs/skill-rag-source-governance.md` is a one-page planning checklist: four sections (source readiness, permissions, provenance, fallback), each with a concrete test that can be run before go-live. Paste it into a design document or sprint kickoff at the start of any internal assistant project.

## Exercises

1. Run `code/main.py`. How many of the sample documents pass the source readiness gate? Which readiness criterion blocks the most documents, and what does that imply about the preparation work before indexing?

2. Run `code/main.py` again and find the query that triggers the `abstain_with_redirect` fallback path rather than a citation answer. Change the retrieval score in the sample data so the same query routes to `low_confidence_disclosure` instead. What threshold did you cross?

3. You are building an internal assistant for a consulting firm's project delivery team. List all the source types you would consider for indexing (project wikis, email archives, client contracts, methodology PDFs, etc.). Apply the authority, currency, and scope-fit gates to each. Which sources fail and why?

4. Design the `permitted_roles` field for an assistant that serves three groups: all employees (can see company-wide policy), engagement teams (can see their own project materials), and partners (can see shared deliverables only). Write the role taxonomy and describe one query that would produce different answers for different callers.

5. Your assistant is live and a user reports that an answer cited a document they believe is outdated. Walk through the audit trail you would need to reconstruct: what fields from the provenance schema does the investigation require, and which log entries would confirm or refute the claim?

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Source readiness | "Is the doc good enough to index?" | A structured gate: authority (named owner, canonical version), currency (within freshness window), and scope fit (produces useful retrievable chunks) |
| Permission boundary | "Access control for RAG" | A per-chunk `permitted_roles` field enforced as a pre-filter or post-filter at query time, designed before ingestion |
| Pre-filter | "Only search what the user can see" | Restricting the ANN search to the permitted subset before ranking, so forbidden chunks are never scored |
| Provenance metadata | "Where did the answer come from?" | Chunk-level fields: source URL, title, last-modified date, owner, index timestamp — the reconstruction path for audits and rollback |
| Fallback path | "What happens when there's no answer?" | A defined strategy (abstain, disclose, escalate, or refuse) for queries at or beyond the corpus boundary |
| Retrieval confidence threshold | "How sure does the system need to be?" | A configurable minimum similarity score below which the fallback path is triggered instead of generating an answer |
| Permission leakage | "The assistant told me something I shouldn't know" | A query that returns an answer derived from a source the requesting user is not permitted to access |
| Evaluation dataset | "How do we know it works?" | A curated set of question-answer-source triples used to measure retrieval recall, faithfulness, and permission correctness before and after changes |

## Further Reading

- [Anthropic — Retrieval-Augmented Generation docs](https://docs.claude.com/en/docs/build-with-claude/retrieval-augmented-generation) — Anthropic's current guidance on prompt construction, chunk sizing, and evaluation for Claude-based RAG systems.
- [NIST SP 800-53 Rev. 5 — Access Control (AC) family](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) — the US federal standard for access control; AC-3 (Access Enforcement) and AC-4 (Information Flow Enforcement) are the relevant controls for permission-boundary design.
- [Qdrant documentation — Filtering](https://qdrant.tech/documentation/concepts/filtering/) — concrete reference for metadata pre-filtering in a production vector store.
- [DeepEval — RAG evaluation metrics](https://docs.confident-ai.com/docs/metrics-overview) — open-source framework covering faithfulness, contextual recall, and answer relevancy; the tool most commonly used for RAG eval automation in 2026.
- [Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (2020)](https://arxiv.org/abs/2005.11401) — the original RAG paper; the retrieve-then-generate pattern this course builds on.
