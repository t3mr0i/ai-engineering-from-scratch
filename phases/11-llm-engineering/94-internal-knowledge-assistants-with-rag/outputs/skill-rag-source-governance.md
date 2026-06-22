# RAG Source Governance Checklist (2026)

Use this at the start of any internal knowledge assistant project — before the first document is indexed. One page, four sections. Each section has a concrete test you can run. The 2026 framing is shaped around three wrong-doc failure shapes: stale-supersedes-current, duplicate-with-wrong-tagging, adjacent-topic-with-confident-phrasing. Every gate below catches one of those.

---

## 1. Source Readiness (four gates, not three)

Run all four gates on every candidate source before ingestion. A single failure blocks indexing.

| Gate | Pass condition | Failure shape caught |
|---|---|---|
| **Authority — named owner** | A specific person or team is listed as the responsible owner in the source system | Operational debt |
| **Authority — canonical version** | This is the master document, not a copy, draft, or attachment | All three |
| **Currency** | Age in days is within the freshness window for its category (see table below) | All three |
| **Supersedure state** | `superseded_by` is null OR the chunk carries a `superseded: true` flag the runtime will downgrade | **Shape 1 — Stale supersedes current** |

**Freshness windows by category:**

| Category | Max age |
|---|---|
| Pricing / rates | 1 day |
| Policy / compliance | 90 days |
| Project artifacts | 30 days |
| Reference architecture | 1 year |
| Methodology / handbook | 1 year |
| General reference | 180 days |

**Test:** Export all candidate documents with `owner`, `last_modified`, `superseded_by`, and `source_system_record_id`. Apply the gates in a spreadsheet before any indexing pipeline is built. Expect 30–60 % of documents to fail on the first pass.

---

## 2. Permission Boundaries

Decide the role taxonomy before designing the index schema. Retrofitting is expensive.

**Minimum viable role taxonomy (internal deployments):**

| Role | Who | What they can receive |
|---|---|---|
| `public` | External partners, customers | Public-facing content only |
| `internal` | All employees | Company-wide policies, general reference |
| `restricted` | Project teams, named groups | Project artifacts, engagement materials |
| `confidential` | Senior leadership, named individuals | HR, M&A, financial planning |

**Per-chunk schema (add at index time):**

```
permitted_roles:        list[str]    # e.g. ["internal", "restricted"]
provenance_source_id:   str          # source-system record ID (SharePoint GUID,
                                     #   Confluence page ID, Notion block ID),
                                     #   NOT a share path
permission_list_hash:   str          # hash of the source-system permission list
                                     #   at index time, for audit reconciliation
source_url:             str
owner_team:             str
```

**Enforcement model:**

- Use **pre-filter** (metadata filter before ANN search) when the vector store supports it (Qdrant, Weaviate, pgvector, Pinecone namespaces). Forbidden chunks are never scored.
- Use **post-filter** only as a fallback; monitor effective-k on sparse corpora.

**Test:** Create three synthetic queries that each require a source from a different permission level. Verify a caller with `internal` role receives no answer from `restricted` or `confidential` sources. Add a fourth test: create a synthetic duplicate of a `confidential` source, re-upload it with an `internal` tag, and verify the content-hash dedup gate drops it. This last test catches **Shape 2 — duplicate with wrong tagging**.

---

## 3. Provenance Metadata

Every chunk must carry enough metadata to reconstruct the answer's origin for compliance, audit, and rollback. The 2026 minimum adds two fields the 2025 checklist missed.

**Required fields:**

| Field | Format | Purpose |
|---|---|---|
| `chunk_id` | `sha256(source_url + byte_offset)[:12]` | Stable reference in logs |
| `content_hash` | `sha256(chunk_text)[:12]` | Catches Shape 2 (duplicate with wrong tagging) at index and query time |
| `provenance_source_id` | Source-system record ID | Stable across re-uploads; supports audit reconciliation |
| `source_url` | Canonical URL or path | User navigation |
| `last_modified` | ISO-8601 date | Check if source was updated since answer |
| `indexed_at` | ISO-8601 datetime | Debugging: was the chunk stale at query time? |
| `superseded_by` | URL or null | Gate catches Shape 1 (stale supersedes current) |
| `owner_team` | String | Escalation path |

**Citation format (paste into prompt template):**

```
Answer based on: {source_title}
Owner: {owner_team} | Last updated: {last_modified} | {source_url}
Indexed: {indexed_at} | Source record: {provenance_source_id}
```

**Test:** Given a logged query, verify you can reconstruct which chunks were retrieved, their `content_hash` values, their `provenance_source_id` values, and their `indexed_at` timestamps. Run this against 10 logged queries before go-live.

---

## 4. Fallback Paths (including the faithfulness gate)

Define the fallback strategy before launch. The default behavior without a defined path is hallucination at the corpus boundary.

**Decision table:**

| Condition | Strategy | Example response |
|---|---|---|
| Query outside declared scope | **Out-of-scope refusal** | "This assistant covers [topic]. Try [resource]." |
| Permission denied (user role not in `permitted_roles`) | **Abstain with redirect** | "I cannot provide information for your access level. Contact [owner]." |
| Retrieval score below low threshold (< 0.45) | **Abstain with redirect** | "I don't have a reliable source. Contact [owner]." |
| Retrieval score in medium band (0.45–0.72) | **Low-confidence disclosure** | "Based on [source] (confidence: medium), [answer]. Verify with [owner]." |
| Retrieval score above high threshold (≥ 0.72) AND faithfulness check passes | **Answer with citation** | "[Answer]. Source: [title], [last_modified], [url]." |
| Retrieval score above high threshold (≥ 0.72) AND faithfulness check FAILS | **Abstain with redirect** | "I cannot produce a verified answer for that question. Contact [owner]." |

**The faithfulness gate** (the 2026 addition, catches **Shape 3 — adjacent-topic with confident phrasing**):

For every answer above the high threshold, check that every claim in the generated answer is supported by some sentence in the retrieved snippets. A cheap extractive check (every content-bearing noun/number in the claim must appear in some retrieved chunk) handles the common case; escalate borderline cases to an LLM-as-judge (Claude Haiku 4.x for cost, Claude Sonnet 4.x when borderline is rare).

Cost numbers: LLM-as-judge faithfulness on ~2K tokens of answer plus ~2K tokens of snippets costs ~$0.003 (Sonnet 4.x) or ~$0.0004 (Haiku 4.x). At 10K queries/day that's $30/day (Sonnet) or $4/day (Haiku) — trivial compared to a single compliance incident. Calibrate threshold on your evaluation dataset using answer faithfulness as the success metric, not retrieval recall. Retrieval recall of 0.9 with faithfulness 0.6 is worse than retrieval recall 0.7 with faithfulness 0.9.

---

## Pre-Launch Sign-Off Checklist

- [ ] Source readiness audit complete; all four gates (authority, currency, scope fit, supersedure) passed
- [ ] Permission taxonomy documented and approved by data owner or compliance team
- [ ] `permitted_roles`, `provenance_source_id`, `content_hash` populated for 100 % of indexed chunks
- [ ] `superseded_by` populated and supersedure gate tested against synthetic stale-current pairs
- [ ] Provenance fields (`source_url`, `last_modified`, `indexed_at`, `owner_team`) populated for 100 %
- [ ] Fallback strategy defined for all six conditions (including the faithfulness-gate failure path)
- [ ] Faithfulness threshold calibrated on evaluation dataset; faithfulness as success metric, not retrieval recall
- [ ] Synthetic permission-leakage test cases (including duplicate-with-wrong-tag) written and passing
- [ ] Evaluation dataset (min 30 QA pairs) created and baseline faithfulness + recall recorded
- [ ] Audit reconstruction tested against at least 10 logged queries
- [ ] Freshness monitoring in place: alerts when a source exceeds its freshness window
