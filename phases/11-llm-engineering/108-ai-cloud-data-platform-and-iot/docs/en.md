# AI Use Case Design Across Cloud, Data Platform, and IoT Boundaries (2026)

> Gartner estimates that by 2026 more than 60 percent of enterprise AI use cases span at least two distinct data environments: a cloud-hosted LLM, an on-premises data platform, and one or more IoT-generating edge locations. The boundary between those environments is where most AI projects fail — not because the model was wrong, but because the data never arrived at inference time in the right shape, with the right latency, and within the right ownership perimeter. Designing an AI use case in this context requires the same rigor as designing a distributed system: you map ownership, latency, and schema fidelity at every hop before you write a prompt. The missing discipline in 2026 is not "choosing the right model" — it is knowing which boundaries your use case actually crosses and making deliberate engineering decisions at each one.

**Type:** Learn
**Languages:** Python (stdlib — data-boundary classifier + latency budget modeler)
**Prerequisites:** Phase 11 · 06 (RAG patterns), Phase 17 · 27 (FinOps for LLMs)
**Time:** ~45 minutes

## The Problem

A consulting team proposes an AI assistant that summarizes equipment fault reports from 800 factory-floor sensors, enriches the result with ERP maintenance history, and surfaces recommendations through a cloud-hosted chat interface. The architecture diagram looks clean: sensors → data lake → LLM → UI. What the diagram omits is the boundary topology: the sensor data leaves an OT (operational technology) network under strict isolation rules, the ERP runs in a private cloud region where the LLM vendor has no presence, and the maintenance-history table contains personal data regulated under GDPR. Three distinct ownership boundaries, two different latency budgets (real-time fault detection vs. monthly maintenance summaries), and one compliance scope — none of which appear on the box-and-arrow slide.

The failure mode is predictable: the project starts with the LLM and the UI and only encounters the boundaries during integration testing. At that point, the cost of fixing data-flow decisions is high. The engineering question for 2026 is not which model to use — it is how to enumerate and classify the boundaries your use case crosses *before* the first line of integration code, and which architectural pattern each boundary demands.

## The Concept

### The three boundary types

Every AI use case that touches cloud, a data platform, or IoT crosses some combination of three boundary types. Classifying them first determines the allowable architecture.

| Boundary type | What crosses it | Key constraints | Typical pattern |
|---|---|---|---|
| **Data sovereignty** | Personal data, regulated records, IP | Data must not leave a jurisdiction or network perimeter | On-premises inference, federated retrieval, or data-clean-room synthesis |
| **Latency** | Streaming sensor events, real-time telemetry | Round-trip to a cloud LLM is 200 ms–2 s; edge events may require sub-100 ms decisions | Edge inference or in-stream feature extraction before LLM enrichment |
| **Ownership / stewardship** | Data owned by a business unit, partner, or customer | Schema changes, deletion requests, and audit trails belong to the steward, not the AI system | Retrieval-augmented generation (Phase 11 · 06) with lineage tracking; no training on data you do not own |

Boundaries compound. A factory-floor sensor dataset can simultaneously cross all three: it may contain worker-location data (sovereignty), arrive at 10 Hz (latency), and belong to a safety department that requires audit rights (ownership). Each compound boundary narrows the feasible architecture.

### IoT data: the pre-LLM processing obligation

IoT data is not ready for an LLM at the point of ingestion. Raw sensor telemetry has three properties that make direct LLM use expensive and unreliable:

1. **Volume.** A modest deployment of 1,000 sensors at 1-second intervals generates 86 million data points per day. At current token prices (Sonnet 4.6: \$3/million input tokens) passing even one hour of raw telemetry to a model costs more than any insight is worth.
2. **Noise and dropout.** Sensors miss readings, drift over time, and occasionally report physically impossible values. A model asked to reason over uncleaned sensor data will reason over the noise.
3. **Schema instability.** IoT firmware updates change field names and units without coordinated migrations. A downstream LLM system that assumed a fixed schema breaks silently.

The pattern: run a deterministic processing pipeline (aggregation, anomaly detection, schema normalization) at the edge or in a streaming layer before the LLM ever sees the data. The LLM receives a structured summary (e.g., "sensor cluster B-12 shows mean temperature 4.3°C above baseline for 22 consecutive minutes"), not raw readings. This is not a compromise — it is the design. The LLM's job is reasoning over structured context, not parsing telemetry.

### Data platform integration: schema lineage and freshness SLAs

Enterprise data platforms (Databricks, Snowflake, Microsoft Fabric, Google BigQuery) expose data through catalogs, views, and APIs — but the freshness and lineage guarantees vary by layer:

| Layer | Typical freshness | Lineage support | LLM integration approach |
|---|---|---|---|
| Landing / raw zone | Near-real-time (seconds to minutes) | Low — raw ingest, no transformation history | Avoid; use for pipeline input, not LLM context |
| Curated / silver zone | 15 minutes to 1 hour | Moderate — transformation jobs logged | Appropriate for operational RAG (Phase 11 · 06) with explicit freshness caveat |
| Aggregated / gold zone | Daily or weekly | High — business-metric certified | Appropriate for analytical summarization; freshness must be stated in the prompt context |
| Semantic layer (dbt metrics, Fabric semantic models) | On-query (computed fresh) | Full — model-level provenance | Preferred for any use case where data governance or audit is a requirement |

The practical rule: never expose a raw-zone table as a RAG source. The LLM will present stale, schema-volatile, lineage-opaque data as authoritative. Use the semantic layer or curated zone, and inject the freshness timestamp into every context window so the model can reason about what it does not know (Phase 17 · 27 covers the cost angle).

### Latency budget decomposition

Every AI use case has an implicit latency budget determined by the user or system waiting for a response. Decomposing that budget exposes whether the architecture is feasible before any code is written.

A standard decomposition for a cloud-LLM-backed use case:

```
Total user-visible latency = data retrieval + context assembly + LLM round-trip + post-processing + UI rendering
```

For an IoT-enriched maintenance recommendation use case with a 5-second UI budget:

| Stage | Budget allocation | Negotiable? |
|---|---|---|
| IoT aggregation (edge) | 500 ms | No — set by sensor polling interval |
| RAG retrieval (vector DB) | 200–400 ms | Yes — index tuning, embedding model choice |
| Context assembly | 50–100 ms | Minimal |
| LLM inference (Sonnet 4.6, ~2k tokens) | 800–1 500 ms | Partial — model choice, caching |
| Post-processing + UI | 100–200 ms | No |
| **Total** | ~1 650–2 500 ms | Well within 5 s budget |

When the decomposition reveals a budget overrun, the fix is architectural: move inference closer to data (edge or regional endpoint), reduce context size, or shift to asynchronous delivery. "Use a faster model" is rarely the right lever because the latency bottleneck is almost always retrieval or network, not model inference.

### The four feasible architecture patterns

Given boundary type and latency budget, only four base patterns are feasible:

| Pattern | When to use | Data boundary handled | Latency profile |
|---|---|---|---|
| **Cloud-first RAG** | No sovereignty constraint; data reachable via API; latency > 3 s acceptable | Ownership (retrieval only) | Moderate |
| **Edge-preprocessed RAG** | IoT source; sovereignty at edge; LLM in cloud; latency < 3 S | Latency + partial sovereignty | Fast (edge) + moderate (cloud LLM) |
| **On-premises inference** | Strict sovereignty; no data egress permitted; latency flexible | Full sovereignty | Depends on on-prem hardware |
| **Hybrid federated** | Compound boundary: some data sovereign, some not; unified user-facing interface | All three boundary types | Complex; requires explicit budget per federated source |

Most enterprise IoT use cases land on edge-preprocessed RAG or hybrid federated. The cloud-first pattern is only viable when the data is already in the cloud and sovereignty is not a concern — which is rarer than it appears in architecture reviews.

### Practical decision sequence for a new use case

1. **Map every data source.** For each: jurisdiction, network perimeter, steward, schema stability, freshness SLA.
2. **Classify boundary types.** Sovereignty, latency, ownership — or a compound. This is a one-page table, not a slide.
3. **Decompose the latency budget.** Assign milliseconds to each stage. Identify which stages are non-negotiable constraints.
4. **Select the base pattern.** One of the four above. If none fits, the use case as stated is not feasible at the required latency or within the required perimeter.
5. **Apply data platform layer rules.** Identify which catalog layer is the appropriate RAG source and inject freshness metadata.
6. **Define ownership contracts.** Who can modify, delete, or audit the data the LLM accessed? Document this before integration.

The sequence is upstream of model selection. Choosing Claude Sonnet 4.6 vs. a self-hosted model is step 7, not step 1.

## Use It

`code/main.py` is a deterministic, stdlib-only model of the two decisions this lesson centers on:

1. A **boundary classifier** that takes a data source description (jurisdiction, perimeter, sensitivity, refresh rate) and returns the boundary types it crosses and the feasible architecture patterns.
2. A **latency budget modeler** that takes a use case's user-facing latency budget and a set of pipeline stages, checks feasibility, and identifies which stage is the binding constraint.

The driver walks through three representative use cases (factory-floor fault detection, regulatory document summarization, customer-churn prediction with CRM data) and prints the classification, the recommended pattern, and the budget breakdown for each.

## Ship It

`outputs/skill-cloud-data-iot-boundary-mapper.md` is a one-page decision aid: a boundary-classification checklist and a latency-budget worksheet that a consulting team can fill in during a use-case scoping session to determine feasibility and the correct base architecture before the engagement begins.

## Exercises

1. Run `code/main.py`. Which of the three sample use cases hits a latency budget overrun? What is the binding constraint stage, and what architectural change would resolve it?

2. The boundary classifier assigns a pattern to each use case. Find the one that maps to "hybrid federated." Explain in two sentences why neither cloud-first RAG nor on-premises inference alone handles its compound boundary.

3. Take a real AI use case from your current project or engagement. Fill in the boundary classification table from the lesson (four columns: jurisdiction, perimeter, steward, freshness SLA) for each data source. Which pattern does the table point to?

4. The lesson states that raw-zone data should not be used as a RAG source. Describe a specific failure scenario where a team violates this rule — what does the user see, and what audit finding does a data governance team raise?

5. Run `code/main.py` and locate the latency budget decomposition output. Modify one stage budget (in the source) so the use case becomes infeasible. Which architectural change (edge preprocessing, async delivery, or regional endpoint) would restore feasibility, and why?

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Data sovereignty boundary | "We can't put it in the cloud" | A legal or contractual rule that data must not leave a specific jurisdiction or network perimeter |
| OT network | "Factory floor systems" | Operational technology network — isolated from IT systems by design; IoT sensors typically originate here |
| Gold zone | "Clean data" | The aggregated, certified layer of a data platform; appropriate for LLM context; not always fresh |
| Semantic layer | "dbt metrics / Fabric models" | A query-time computed layer with full provenance; preferred for auditable LLM use cases |
| Edge-preprocessed RAG | "Preprocess at the sensor" | IoT data is aggregated and normalized at the edge before reaching the LLM; reduces cost and latency |
| Latency budget | "How fast does it need to be?" | The total user-visible response time broken into per-stage allocations; must be decomposed before architecture is chosen |
| Hybrid federated | "Data from everywhere" | A pattern where sovereign and non-sovereign sources are queried separately and composed at the application layer |
| Data steward | "Who owns this table?" | The business unit or individual accountable for schema, access, deletion, and audit of a dataset |

## Further Reading

- [Azure IoT Hub documentation](https://learn.microsoft.com/en-us/azure/iot-hub/) — event ingestion, routing, and edge processing with Azure IoT Edge.
- [Microsoft Fabric data engineering documentation](https://learn.microsoft.com/en-us/fabric/data-engineering/) — lakehouse zones, OneLake, and the semantic model layer relevant to LLM integration.
- [Databricks Unity Catalog](https://docs.databricks.com/en/data-governance/unity-catalog/index.html) — lineage, governance, and access control for data platform RAG sources.
- [ENISA — AI and IoT security guidelines](https://www.enisa.europa.eu/) — European security framework for IoT-connected AI systems; covers OT/IT boundary requirements.
- [GDPR Article 5 — principles relating to processing of personal data](https://gdpr-info.eu/art-5-gdpr/) — the data minimisation and purpose limitation principles that constrain what an LLM system may store or process.
