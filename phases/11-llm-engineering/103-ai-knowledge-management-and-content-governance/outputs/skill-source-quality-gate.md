# Source Quality Gate — Decision Aid

Use this checklist when setting up or auditing a RAG corpus. Apply it to every candidate source before indexing.

---

## Step 1 — Assign an authority tier

| Tier | Criteria | Examples |
|---|---|---|
| **T1 Authoritative** | Named organizational owner; version-controlled; formal change process documented | Internal policy repository, certified training materials, official product docs, legal contracts |
| **T2 Reference** | Identifiable contributors with edit history; no formal version control; owner reachable | Team wikis, project final reports, shared knowledge bases with active owners |
| **T3 Informal** | No formal owner; no review process; provenance unverifiable | Personal notes, draft decks, AI-generated summaries, chat exports |

Anything T3 must go to human sign-off before indexing. Record the sign-off in the governance log with the reviewer's name and date.

---

## Step 2 — Score the four quality dimensions (AND-gate)

All four must pass. A single FAIL rejects the source.

| Dimension | Pass condition | Fail condition |
|---|---|---|
| **Authority** | T1 or T2 with a named owner on record | Orphaned document; anonymous wiki; T3 without human sign-off |
| **Currency** | Last modified within the domain recency window (see table below) | Older than the domain window |
| **Consistency** | No hard contradiction with a higher-tier source already in the corpus | Contradicts a T1 source on the same claim |
| **Scope fit** | Content falls within the assistant's declared task domain | Out-of-domain content that widens retrieval without adding signal |

### Domain recency windows

| Domain | Maximum age | Notes |
|---|---|---|
| Regulatory / compliance | 6 months | Fast-changing rules; older guidance creates legal risk |
| HR and internal policy | 12 months | Annual policy cycles |
| Technical architecture | 24 months | Major tech shifts; older patterns mislead |
| Core methodology | 36 months | Stable frameworks; review on major version release |
| Historical case studies | No expiry | Label the context year; currency is not the concern |

---

## Step 3 — Decide and log the disposition

| Disposition | Meaning | Action |
|---|---|---|
| **ADMIT** | All four dimensions pass; tier T1 or T2 | Index immediately; attach tier + scores + owner as chunk metadata |
| **REJECT** | One or more dimensions fail | Do not index; record the rejection reason in the governance log |
| **DEFER** | T3 source or human judgment required | Hold; route to named reviewer; admit only after documented sign-off |

---

## Step 4 — Write the governance log entry

One structured record per candidate. Minimum required fields:

```
source_id:          <unique identifier, e.g. filename or URL>
source_name:        <human-readable title>
tier:               T1 | T2 | T3
authority_pass:     true | false
currency_pass:      true | false
consistency_pass:   true | false
scope_fit_pass:     true | false
disposition:        ADMIT | REJECT | DEFER
reject_reasons:     [<list of reasons if REJECT or DEFER>]
reviewer:           <name if human sign-off; "automated" if policy-only>
evaluated_at:       <ISO 8601 timestamp>
```

Write the log as JSON or CSV, not prose. The log must be a pipeline artifact — written to disk and retained for at least as long as the corpus is in production.

---

## Step 5 — Set up scheduled rescoring (drift detection)

Indexed corpora drift. Schedule a rescore run to catch documents that age out after initial indexing.

| Domain | Suggested rescore cadence |
|---|---|
| Compliance | Weekly |
| HR policy | Monthly |
| Architecture, methodology | Quarterly |
| Case studies | Annually or on major restructure |

When rescore marks a previously-ADMIT source as REJECT, remove it from the index immediately and note the removal in the governance log.

---

## Supersession checklist

When a new document replaces an old one:

- [ ] Add a supersession registry entry: `{old_doc_id, new_doc_id, superseded_date}`
- [ ] Remove the old document from the index (do not leave it as a lower-tier fallback)
- [ ] Log the removal in the governance log
- [ ] Verify the new document passes all four quality dimensions before admitting it

---

## Quick-reference: common rejection triggers

| Symptom | Likely dimension failure | Fix |
|---|---|---|
| Team wiki edited two years ago | Currency | Check last-modified date against architecture window (24 m) |
| FAQ page with no author listed | Authority | Assign an owner or move to T3 with sign-off |
| Two policy docs that say opposite things | Consistency | Determine which is current; reject the other; add to supersession registry |
| Marketing case study for a different industry | Scope fit | Exclude; scope fit is evaluated against the assistant's declared domain, not general usefulness |
| AI-generated summary document | Authority (T3) | Route to DEFER; require human sign-off with documented rationale |
