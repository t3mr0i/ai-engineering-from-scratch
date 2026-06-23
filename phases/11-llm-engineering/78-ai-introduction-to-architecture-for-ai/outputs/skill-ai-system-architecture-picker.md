# AI System Architecture Picker

One-page decision aid for consultants and engineers. Use this at project kickoff to anchor the architecture conversation and avoid both under-engineering (single-call wrappers) and over-engineering (speculative pipelines).

---

## Step 1 — Requirement intake checklist

Answer each question Yes / No before any tooling or vendor discussion.

| # | Question | Yes activates |
|---|---|---|
| 1 | Does the answer depend on proprietary or recent data the model was not trained on? | RAG pipeline (Layer 2 extended) |
| 2 | Does the task require more than one model call? | Orchestration layer (Layer 3) |
| 3 | Can subtasks run in parallel? (only if #2 = Yes) | DAG pattern instead of chain |
| 4 | Does the task require calling external tools, APIs, or code execution? | Tool execution layer (Layer 4) |
| 5 | Is there a user-facing latency SLA under 3 seconds? | Streaming + pre-warmed instances; constrains model size |
| 6 | Is EU data residency required? | Deployment in germanywestcentral (Azure AI Foundry) |
| 7 | Is sustained volume above ~1M tokens/day? | Cost analysis for self-hosted open-weight model |

---

## Step 2 — Orchestration pattern selector

| Pattern | When to use | Latency profile |
|---|---|---|
| Single call | Q1=No, Q2=No | Fastest; single model round-trip |
| Chain | Q2=Yes, Q3=No, Q4=No | Linear: N x model latency |
| DAG | Q2=Yes, Q3=Yes | Parallel depth x model latency |
| Agent loop | Q2=Yes, Q4=Yes | Unpredictable; budget with `max_turns` |

Default to the simplest pattern the requirements justify. Do not add orchestration speculatively.

---

## Step 3 — Five-layer activation table

| Layer | Default (minimal) | Activate when |
|---|---|---|
| 1 — Model | Claude Sonnet 4.6 / GPT-4o (managed API) | Always |
| 2 — Context assembly | System prompt + conversation history | Q1=Yes: add RAG pipeline (embed, index, retrieve, re-rank) |
| 3 — Orchestration | None (single call) | Q2=Yes: add chain / DAG / agent loop |
| 4 — Tool execution | None | Q4=Yes: add sandboxed tool runner with timeout + audit log |
| 5 — Deployment | Managed API endpoint | Q6=Yes: EU region. Q7=Yes: self-hosted cost analysis |

---

## Step 4 — RAG pipeline decision sub-checklist

Activate only when Layer 2 is extended (Q1=Yes).

- [ ] Document volume: under 10k pages? Consider long-context load instead of full RAG.
- [ ] Chunk strategy defined (fixed-size / semantic / hierarchical).
- [ ] Embedding model selected (e.g., `text-embedding-3-large`, Cohere `embed-v4`).
- [ ] Vector index provisioned (Azure AI Search, pgvector, Pinecone).
- [ ] Re-ranking step included if precision matters (Cohere Rerank, BGE-Reranker).
- [ ] Groundedness monitoring configured (Ragas faithfulness score, or Azure AI Foundry Content Safety).
- [ ] Stale-data refresh schedule defined (chunked re-ingest cadence).

---

## Step 5 — Tool execution safety gates

Activate only when Layer 4 is activated (Q4=Yes).

- [ ] Minimum tool surface: only the tools the task requires, nothing broader.
- [ ] Sandboxed execution environment: container / VM / Dynamic Session.
- [ ] Timeout policy set per tool (recommend 10s default; never unbounded).
- [ ] Full audit log: tool name, arguments, and result logged *before* execution.
- [ ] Prompt injection risk assessed: is tool input derived from user-controlled text?

---

## Step 6 — Observability minimum viable stack

Required for any production deployment regardless of architecture complexity.

| Signal | What to capture | Tool |
|---|---|---|
| Trace log | Full assembled prompt + model response per request | LangSmith, Azure AI Foundry Tracing, Weave |
| Latency breakdown | Model / retrieval / tool latency — p50, p95, p99 | Application metrics (OpenTelemetry) |
| Token cost | Input + output tokens per request, by feature/user | Token usage API fields; aggregate in dashboards |
| Groundedness | Faithfulness to retrieved sources (RAG only) | Ragas, Azure Content Safety |
| Human feedback | Thumbs up/down, corrections, escalations | Application layer capture |

---

## Cost order-of-magnitude reference (mid-2026, managed API)

| Architecture | Tokens/request | Tool calls/req | ~EUR/day at 10k req |
|---|---|---|---|
| Single call (FAQ chatbot) | 800 | 0 | ~0.05 |
| RAG + single call | 3,000 | 0 | ~0.20 |
| RAG + chain (3 calls) | 6,000 | 0 | ~0.36 |
| RAG + agent loop (avg 4 calls, 3 tools) | 8,000 | 3 | ~0.52 |

Rule: each additional layer costs money and adds a failure mode. Activate only on requirement evidence.

---

## Quick reference — data residency options (EU)

| Provider | EU endpoint | Notes |
|---|---|---|
| Azure OpenAI | germanywestcentral | GPT-4o, embedding models; AI Foundry orchestration available |
| Anthropic (via Azure) | West Europe / Germany | Claude models via Azure Marketplace |
| Self-hosted | Your GCP/Azure/on-prem GPU fleet | Full data control; ops burden |

---

*Generated from Phase 11 · 78 — AI system architecture. Verify pricing against current provider documentation before client-facing use.*
