# Skill: Cloud, Data Platform, and IoT Boundary Mapper

One-page decision aid for scoping an AI use case that spans cloud, data platform, and IoT sources.
Use this during the first scoping session, before architecture is chosen or model is selected.

---

## Step 1 — Classify each data source (fill one row per source)

| Source name | Jurisdiction | Network perimeter | Sensitivity | Refresh rate | Boundary types |
|---|---|---|---|---|---|
| | EU / US / on-prem-only | public-cloud / private-cloud / ot-network / on-prem | personal / regulated / internal / public | streaming / minutes / hours / daily | sovereignty / latency / ownership |
| | | | | | |
| | | | | | |

**Boundary type rules:**
- **Sovereignty** — perimeter is `ot-network` or `on-prem`, OR sensitivity is `personal` or `regulated`
- **Latency** — refresh rate is under 1 second (streaming or near-real-time)
- **Ownership** — sensitivity is anything other than `public` (a steward holds audit/deletion rights)

---

## Step 2 — Select the base architecture pattern

Combine all boundary types across sources, then read across:

| Combined boundaries | Recommended pattern |
|---|---|
| Ownership only (no sovereignty, no latency) | Cloud-first RAG |
| Sovereignty + latency (no additional compound) | Edge-preprocessed RAG |
| Sovereignty, no latency | On-premises inference |
| Sovereignty + latency + ownership (all three) | Hybrid federated |

> If no pattern fits cleanly: the use case as stated is architecturally infeasible at the required combination of constraints. Restate the use case or relax a constraint before proceeding.

---

## Step 3 — Decompose the latency budget

Fill in the stages for your use case. Mark non-negotiable stages with [F].

| Stage | Allocated ms | Negotiable? | Notes |
|---|---|---|---|
| IoT / edge aggregation | | [F] if polling interval is fixed | |
| Data retrieval (RAG / DB) | | Yes — index tuning | |
| Context assembly | | Yes — minimal overhead | |
| LLM inference | | Partial — model choice, caching | |
| Post-processing + UI render | | [F] in most cases | |
| **Total** | | | Must be <= user-facing budget |

**If total exceeds budget:**
1. Identify the largest fixed stage — that is the binding constraint.
2. Options: move inference closer to data (edge/regional endpoint), switch to async delivery, or reduce context size to shorten LLM round-trip.
3. Do not assume "faster model" is the fix — the bottleneck is almost always retrieval or network, not inference.

---

## Step 4 — Data platform layer selection

Choose the correct catalog layer for your RAG source:

| Layer | Use as RAG source? | Condition |
|---|---|---|
| Raw / landing zone | Never | Schema-volatile, no lineage, no freshness guarantee |
| Curated / silver zone | Yes, with caveat | Inject freshness timestamp into every context window |
| Aggregated / gold zone | Yes | State freshness in system prompt; clarify to user when stale |
| Semantic layer (dbt, Fabric) | Preferred | Full provenance; use for auditable or regulated use cases |

---

## Step 5 — Ownership contracts checklist

Before integration code is written, answer these for every non-public data source:

- [ ] Who is the named data steward (business unit or individual)?
- [ ] What is the deletion/RTBF process if the LLM system has indexed or cached this data?
- [ ] Is there an audit log requirement? (If yes: semantic layer is mandatory.)
- [ ] Does the data include personal data as defined by GDPR Art. 4? (If yes: sovereignty boundary applies automatically.)
- [ ] Is the LLM system allowed to use this data for fine-tuning? (Default: No, unless written consent from steward.)

---

## Quick-reference summary card

```
SCOPING DECISION SEQUENCE
1. Map each source → boundary types (sovereignty / latency / ownership)
2. Combine boundary types → architecture pattern (one of four)
3. Decompose latency budget → feasibility check
4. Select data platform layer → raw is never correct
5. Document ownership contracts → before integration
6. Only then: select model (Sonnet 4.6, Opus 4.6, on-prem, etc.)

NEVER:
  - Expose raw-zone data as a RAG source
  - Begin with model selection
  - Skip the latency decomposition for any IoT-sourced use case
  - Assume "cloud-first" when perimeter is ot-network or on-prem
```
