# Source Quality Gates Before Retrieval (2026)

> Gartner estimates that 60% of AI projects will be abandoned through 2026 because organizations lack AI-ready data — the same failure mode shows up in RAG pilots specifically: not because the retrieval model was wrong, but because the source corpus was ([Gartner — Lack of AI-Ready Data Puts AI Projects at Risk](https://www.gartner.com/en/newsroom/press-releases/2025-02-26-lack-of-ai-ready-data-puts-ai-projects-at-risk)). By 2026 this is the known failure mode: an LLM cannot compensate for a corpus that mixes authoritative policy documents with outdated wikis, shadow spreadsheets, and hallucinated FAQ entries drafted by previous AI runs. The field now has a name for the discipline — AI Knowledge Management and Content Governance — and a clear engineering mandate: treat source selection and source quality as a first-class engineering gate, not an afterthought. Retrieval amplifies what is already there; it does not filter out noise, it promotes it. Getting governance right before indexing is typically an order of magnitude cheaper than correcting hallucinated answers that trace back to a bad source: in our experience, fixing a governance miss post-deployment costs roughly 5–10× the equivalent ingest-time effort, once you factor in root-cause analysis, corpus re-indexing, user-facing corrections, and the audit trail that an early-stage log would have produced automatically.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 06 (RAG fundamentals), Phase 11 · 10 (RAG evaluation)
**Time:** ~45 minutes

## Learning Objectives

- Explain the production problem addressed by Source Quality Gates Before Retrieval (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## The Problem

A team builds a RAG assistant for internal consulting knowledge. They index everything they can reach: SharePoint, Confluence, old project decks, team wikis, and a handful of PDF exports from client deliverables. The retrieval metrics look fine in offline evaluation — recall at 5 is 0.82. Then the assistant starts citing a three-year-old process document that was superseded by a policy update nobody remembered to delete, and a client-facing consultant repeats the wrong compliance guidance. The governance failure happened before a single embedding was computed.

The engineering question for 2026 is not "did we pick the right chunking strategy." It is upstream: which sources are authoritative, which are stale, which have no documented owner, and which should never enter the corpus at all? These questions require a formal source quality framework — a set of testable criteria applied to every candidate source before it touches the index. Phase 11 · 10 showed how to evaluate retrieval quality after the fact; this lesson shows how to prevent poor quality from entering the pipeline in the first place.

## The Concept

### The four quality dimensions

Every candidate source should be scored on four independently measurable dimensions. All four must clear a minimum threshold; a single failing dimension disqualifies the source regardless of how well it scores on the others.

| Dimension | What you measure | Disqualifying condition |
|---|---|---|
| **Authority** | Does a named, accountable owner or organizational unit stand behind this document? Is the owner reachable for clarifications? | Orphaned documents with no owner; anonymous wikis with open edit access |
| **Currency** | Is the content within the recency window for this domain? (Legal/compliance: typically < 12 months; stable technical docs: < 36 months.) | Last modified date older than the domain recency threshold |
| **Consistency** | Does the document contradict another source already in the corpus? | Hard contradiction with a higher-authority source on the same claim |
| **Scope fit** | Is the content within the declared scope of the assistant's task domain? | Out-of-scope content that widens retrieval without adding relevant signal |

This four-dimension model is deliberately simple so it can be operationalized by a pipeline stage, not only by a human reviewer. Phase 11 · 06 and Phase 11 · 10 both assume a clean corpus; this lesson fills the gap by providing the gate that produces one.

### Tiered authority classification

Not every source type deserves equal trust, and the authority dimension above requires a concrete classification scheme. The following three-tier model works across most enterprise and consulting knowledge bases:

| Tier | Label | Characteristics | Example sources |
|---|---|---|---|
| **T1** | Authoritative | Owned by a named group with review authority; version-controlled; change process is documented | Internal policy repository, legal contracts, certified training materials, official product documentation |
| **T2** | Reference | Maintained by identifiable contributors; not version-controlled formally; subject-matter relevance is high | Team wikis with edit history, project final reports, shared knowledge bases with active owners |
| **T3** | Informal | No formal owner; created or modified without a review process; may be accurate but cannot be verified | Personal notes, draft slide decks, AI-generated summaries, chat exports |

Only T1 and T2 sources should enter a production corpus under normal operating conditions. T3 sources require explicit human sign-off per document, documented in the governance log, before indexing.

The tier assignment is itself a policy artifact — it needs to be written down, versioned, and audited. "We index everything" is a policy; it is just a bad one.

### Domain recency windows

Currency is domain-specific. A general "documents older than two years are stale" rule fails on both ends: it excludes stable technical references that are still correct, and it passes recent documents in fast-moving compliance domains that are already outdated. Define explicit recency windows per domain at the corpus setup stage:

| Domain | Recency window | Rationale |
|---|---|---|
| Regulatory compliance | 6 months | Rules change frequently; old guidance creates legal risk |
| Internal HR and policy | 12 months | Annual policy cycles; older versions may conflict with current |
| Technical architecture | 24 months | Major technology shifts; older patterns can mislead |
| Core methodology | 36 months | Frameworks stable; review when major version published |
| Historical case studies | No expiry | Past projects are still facts; label context year |

Historical case studies are the one category where currency is not a concern, but scope fit becomes critical — a five-year-old project's technical choices are informative context, not current recommendations.

### The governance log

Each corpus indexing run must produce a governance log entry: a structured record of every source evaluated, its tier assignment, its quality dimension scores, the disposition (admitted, rejected, deferred), and the reviewer if human sign-off was required. This log serves three purposes:

1. **Auditability.** When a user challenge traces back to a bad source, the governance log answers why it was admitted.
2. **Drift detection.** Running the scorer on an already-indexed corpus on a schedule (weekly or monthly) catches documents that aged out of their recency window after indexing.
3. **Policy enforcement proof.** For regulated environments (finance, healthcare, public sector), the log demonstrates due diligence to auditors.

The log format should be machine-readable (JSON or CSV) so it can feed a monitoring dashboard. A plain-text summary is not sufficient for drift detection at scale.

### Integration with the RAG pipeline

Source governance is a pre-indexing stage, but it must also be a continuous stage. Indexed corpora drift: owners leave, policy documents are superseded, scope expands without a corresponding governance review. The practical pattern in 2026 is:

1. **Ingest gate** — run the quality scorer on every candidate source before first indexing. Reject or defer anything below threshold.
2. **Index-time metadata** — attach tier, scores, owner, and last-reviewed date as chunk metadata so retrieval can filter by authority or recency at query time.
3. **Scheduled rescore** — re-run the scorer on all indexed sources on a cadence (weekly for compliance domains; monthly for stable references). Flag any source whose scores have degraded.
4. **Supersession detection** — maintain a supersession registry: when document A replaces document B, document B is removed from the index regardless of its quality scores.

Phase 11 · 06 covers chunking and retrieval configuration. Phase 11 · 10 covers evaluation metrics once the corpus is built. This lesson's governance pipeline sits upstream of both and is the prerequisite for making those downstream steps meaningful.

### What current models can and cannot do

Sonnet 4.6 and Opus 4.x (the current Anthropic production models as of mid-2026) can assist with several governance subtasks when used carefully:

- **Extracting claimed authority signals** from document text (who is the stated owner, when was it last reviewed) for pre-classification
- **Detecting potential contradictions** between two candidate documents when both are provided in context
- **Scope fit classification** against a declared domain description

They cannot reliably: determine whether a stated review date is genuine, resolve contradictions when both sources are T2 or below, or make a final governance decision that carries organizational accountability. The governance decision — admitted or rejected — must be signed by a human reviewer or a formally approved automated policy that the organization has accepted. Using an LLM to make the final call without a human review loop is a governance failure even if the model is usually correct.

### Common failure modes

| Failure | Mechanism | Prevention |
|---|---|---|
| Superseded document remains indexed | No supersession registry; old version not removed when new one is added | Maintain a document ID registry with supersession links |
| AI-generated content enters corpus | T3 source admitted without human sign-off | Require provenance metadata; flag AI-generated content at ingest |
| Scope creep over time | New sources indexed by teams who do not update the scope definition | Scope definition versioned; scorer enforces declared scope |
| Governance log not maintained | Log treated as optional; drift goes undetected | Make log a pipeline artifact, not an optional output |
| Authority score trusted over currency | High-authority source passes even though it is three years old in a compliance domain | Each dimension scored independently; AND-gate, not weighted average |



## Further Reading

- [NIST AI Risk Management Framework (AI RMF)](https://airc.nist.gov/Home) — the US federal framework for AI risk, including data governance and provenance requirements.
- [ISO/IEC 42001:2023 — AI Management Systems](https://www.iso.org/standard/81230.html) — the international standard for AI management systems; Section 8 covers data and knowledge management obligations.
- [Anthropic — Building effective agents](https://docs.claude.com/en/docs/agents) — Anthropic's guidance on agentic pipelines; the retrieval and tool-use sections are directly relevant to corpus design decisions.
- [LlamaIndex — Data ingestion and pipeline docs](https://docs.llamaindex.ai/en/stable/) — practical reference for the ingestion pipeline stage where source governance gates plug in.
- [RAG Survey (Gao et al., 2024)](https://arxiv.org/abs/2312.10997) — the comprehensive academic survey of RAG approaches; Section 4 covers advanced RAG pre-retrieval techniques including corpus quality concerns.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the production problem addressed by Source Quality Gates Before Retrieval (2026).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Apply the lesson's decision or implementation workflow to a concrete case.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Measure quality, cost, latency, and risk with explicit acceptance criteria.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the production problem addressed by Source Quality Gates Before Retrieval (2026),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Measure quality, cost, latency, and risk with explicit acceptance criteria,” and cite a repeatable check rather than relying on visual inspection alone.
