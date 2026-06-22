# RAG Source Governance Checklist

Use this at the start of any internal knowledge assistant project — before the first document is indexed. One page, four sections. Each section has a concrete test you can run.

---

## 1. Source Readiness

Run this gate on every candidate source before ingestion. A single failure blocks indexing.

| Gate | Pass condition | Common failure |
|---|---|---|
| **Authority — named owner** | A specific person or team is listed as the responsible owner in the source system | SharePoint doc with "Created by: System" or owner who left the company |
| **Authority — canonical version** | This is the master document, not a copy, draft, or attachment | PDF in someone's OneDrive that duplicates a Confluence page |
| **Currency** | Age in days is within the freshness window for its category (see table below) | Policy doc last reviewed 18 months ago; pricing sheet from last quarter |
| **Scope fit** | Document contains structured, answerable factual claims | Raw meeting notes, email threads, brainstorming wikis |

**Freshness windows by category:**

| Category | Max age |
|---|---|
| Pricing / rates | 1 day |
| Policy | 90 days |
| Project artifacts | 30 days |
| Reference architecture | 1 year |
| Methodology / handbook | 1 year |
| General reference | 180 days |

**Test:** Export a list of all candidate documents with `owner`, `last_modified`, and `source_system`. Apply the gates in a spreadsheet before any indexing pipeline is built. Expect 30–60 % of documents to fail on the first pass.

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

**Per-chunk schema (add these fields at index time):**

```
permitted_roles:  list[str]    # e.g. ["internal", "restricted"]
source_url:       str
owner_team:       str
```

**Enforcement model:**

- Use **pre-filter** (metadata filter before ANN search) when the vector store supports it (Qdrant, Weaviate, pgvector, Pinecone namespaces). Forbidden chunks are never scored.
- Use **post-filter** only as a fallback; monitor effective-k on sparse corpora.

**Test:** Create three synthetic queries that each require a source from a different permission level. Verify that a caller with `internal` role receives no answer from `restricted` or `confidential` sources. This test must be part of the go-live checklist.

---

## 3. Provenance Metadata

Every chunk must carry enough metadata to reconstruct the answer's origin for compliance, audit, and rollback.

**Required fields:**

| Field | Format | Purpose |
|---|---|---|
| `chunk_id` | `sha256(source_url + byte_offset)[:12]` | Stable reference in logs |
| `source_title` | String | Shown in citation |
| `source_url` | Canonical URL or path | User can navigate to source |
| `last_modified` | ISO-8601 date | User can check if source was updated since answer |
| `indexed_at` | ISO-8601 datetime | Debugging: was the chunk stale at query time? |
| `owner_team` | String | Escalation path when answer is disputed |

**Citation format (paste into prompt template):**

```
Answer based on: {source_title}
Owner: {owner_team} | Last updated: {last_modified} | {source_url}
```

**Test:** Given a logged query, verify you can reconstruct: which chunks were retrieved, their `source_url`, `last_modified`, and `indexed_at`. If any field is missing, the audit fails. Run this reconstruction against 10 logged queries before go-live.

---

## 4. Fallback Paths

Define the fallback strategy before launch. The default behavior without a defined path is hallucination at the corpus boundary.

**Decision table:**

| Condition | Strategy | Example response to user |
|---|---|---|
| Query outside declared scope | **Out-of-scope refusal** | "This assistant covers [topic]. Your question is outside that scope. Try [resource]." |
| Permission denied (user role not in `permitted_roles`) | **Abstain with redirect** | "I cannot provide information on that topic for your access level. Contact [owner team]." |
| Retrieval score below low threshold (< 0.45) | **Abstain with redirect** | "I don't have a reliable source for that. Contact [owner] or consult [URL]." |
| Retrieval score in medium band (0.45–0.72) | **Low-confidence disclosure** | "Based on [source] (confidence: medium), [answer]. Verify with [owner] before acting." |
| Retrieval score above high threshold (≥ 0.72) | **Answer with citation** | "[Answer]. Source: [title], [last_modified], [url]." |

**Threshold calibration:** Run the evaluation dataset (see next section) and adjust the 0.45 and 0.72 thresholds until the fallback trigger rate matches the domain's risk tolerance. A legal-advice assistant should have a higher high-threshold than a software-support assistant.

**Test:** Identify 5 queries that should trigger a fallback. Confirm each produces the correct fallback outcome, not a generated answer. Log the fallback trigger rate for the first 30 days of production; if it is above 40 %, the corpus has gaps that need to be filled before the assistant expands scope.

---

## Pre-Launch Sign-Off Checklist

- [ ] Source readiness audit complete; all indexed documents have passed all three gates
- [ ] Permission taxonomy documented and approved by data owner or compliance team
- [ ] `permitted_roles` field populated for 100 % of indexed chunks
- [ ] Provenance fields (`source_url`, `last_modified`, `indexed_at`, `owner_team`) populated for 100 % of indexed chunks
- [ ] Fallback strategy defined and documented for all four conditions
- [ ] Fallback confidence thresholds set and justified
- [ ] Synthetic permission-leakage test cases written and passing
- [ ] Evaluation dataset (min 30 QA pairs) created and baseline metrics recorded
- [ ] Audit reconstruction tested against at least 10 logged queries
- [ ] Freshness monitoring in place: alerts when a source exceeds its freshness window
