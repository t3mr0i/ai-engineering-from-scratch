# AI Vendor Selection Scorecard

One-page decision aid for consultants and engineers selecting a model provider,
inference platform, and AI gateway. Eliminate non-compliant options first, then
score and rank.

---

## Step 1 — Compliance Gate (eliminate before scoring)

Answer each question. Any "No" eliminates the option from consideration.

| Question | EU workloads | US / global workloads |
|---|---|---|
| Does the provider offer a GDPR Art. 28 DPA? | Required | Recommended |
| Is the inference region EU-only or configurable? | Required | Not applicable |
| Does the provider have SOC 2 Type II or ISO 27001? | Required | Required for enterprise clients |
| Can customer data be excluded from training? | Required | Required for enterprise clients |

**Known EU-resident options (2026):** Azure AI Foundry (Germany West Central),
AWS Bedrock (eu-central-1), Google Vertex AI (europe-west3), self-hosted open weights.

**Not EU-resident by default:** Anthropic API direct (US East), Groq, most
direct-API endpoints unless explicitly documented otherwise. Check the provider's
current data processing addendum — this changes.

---

## Step 2 — Model Band Selection by Task Type

Route each task type to the lowest viable band. Do not route low-complexity tasks
to flagship models.

| Task type | Recommended band | Rationale |
|---|---|---|
| Complex code generation, multi-step planning, long-horizon reasoning | Flagship | Requires strong instruction following and extended context |
| RAG answer synthesis, document summarization, structured extraction from complex docs | Balanced | Medium complexity; good accuracy/cost trade-off |
| Intent classification, entity extraction, simple QA, routing decisions | Commodity | Deterministic output space; accuracy gap is negligible |
| Embedding generation, reranking, semantic similarity scoring | Commodity or dedicated embedding model | Not a generation task; do not use generation-model pricing |

**Approximate 2026 blended prices (input+output combined):**

| Band | Representative models | Blended $/1M tokens |
|---|---|---|
| Flagship | Claude Fable 5, GPT-4o, Gemini 2.0 Pro | $20–$50 |
| Balanced | Claude Sonnet 4.x, Gemini 2.0 Flash, Llama 4 70B hosted | $2–$8 |
| Commodity | Haiku 4.x, Gemini 2.0 Flash Lite, Llama 4 8B hosted | $0.15–$0.60 |

**Cost check:** at 50M tokens/month, misrouting commodity tasks to flagship
costs ~$1,200/month more than the balanced/commodity rate. Verify the actual
prices with the provider at the time of decision — they change quarterly.

---

## Step 3 — Platform Selection Scoring Rubric

Score each feasible option 1–5 on each axis. Eliminate any option scoring 1 on
a mandatory axis.

| Axis | Weight | What to assess |
|---|---|---|
| Compliance & data residency | 5 (mandatory) | DPA, GDPR terms, region configuration |
| Monthly cost at expected volume | 4 | Token price × volume × (1 - cache hit rate) |
| Latency class | 3 | p50 and p99 TTFT at expected prompt length |
| Operational fit | 3 | Does the team have infra/expertise to operate this? |
| Strategic alignment | 2 | Existing hyperscaler EA? Procurement speed? |

Sum weighted scores. Document the top-2 options with their scores. The
recommendation is the top scorer that passes all mandatory axes.

---

## Step 4 — AI Gateway Checklist

Before declaring a deployment production-ready, verify the gateway layer is in
place. Missing items are risk exposure, not future enhancements.

- [ ] Single unified proxy endpoint in front of all model backends
- [ ] Centralized API key / IAM credential management (no team-level keys in app code)
- [ ] Per-request audit log: user id, timestamp, model, input token count, output token count
- [ ] Retry with exponential backoff and jitter (not implemented in each application separately)
- [ ] Rate limiting per team / per user to prevent runaway cost
- [ ] Semantic caching enabled for high-volume repeated query patterns
- [ ] Cost allocation tags per team or cost center
- [ ] Prometheus / OpenTelemetry metrics exported to monitoring stack
- [ ] Fallback routing to secondary model/provider on primary outage

**Reference implementations:** LiteLLM OSS (proxy + caching + metrics), Portkey
(managed, team dashboards), Azure APIM with AI policies (default for Azure-anchored
LHIND engagements).

---

## Step 5 — Agent Framework Selection

Pick the abstraction level that matches the team's maintenance burden tolerance.
Avoid importing a framework to solve a problem a 50-line function handles.

| Scenario | Recommended approach |
|---|---|
| Single tool call, one response | Direct API + bare `tool_use`; no framework |
| 3–5 step linear pipeline with retries | Claude Agent SDK or minimal `tool_use` loop |
| Stateful multi-step agent with checkpointing | Claude Agent SDK (Phase 14 · 17) or LangGraph |
| Multi-agent simulation / research pipeline | AutoGen or LangGraph multi-agent |
| RAG-heavy pipeline with retrieval steps | LlamaIndex Workflows |

**Rule:** if you are re-implementing retry, state serialization, or tool error
handling inside your own orchestration glue, move up one abstraction level.
If you cannot understand the framework's control flow in 10 minutes of reading,
move down one level.

---

## Quick Reference: Four-Layer Stack

```
Layer 4  Agent framework   Claude Agent SDK / LangGraph / raw tool_use
Layer 3  AI gateway        LiteLLM / Portkey / Azure APIM AI policies
Layer 2  Inference platform Azure AI Foundry / AWS Bedrock / Vertex AI / Direct API
Layer 1  Model provider    Anthropic / OpenAI / Google / Meta (open weights)
```

Each layer is independently substitutable. A change at one layer should not
require changes at another layer. If it does, the architecture is over-coupled.
