# AI Vendor Selection Scorecard (with Exit Cost)

One-page decision aid for consultants and engineers selecting a model provider,
inference platform, and AI gateway. Eliminate non-compliant options first, then
score and rank across **five axes** — the fifth being exit cost, weighted at
parity with monthly run-rate. A vendor decision that minimizes this year's
spend but ignores next year's migration cost has not actually saved money.

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
| Flagship | Claude Fable 5, GPT-4o, Gemini 2.0 Pro | $15–$40 |
| Balanced | Claude Sonnet 4.x, Gemini 2.0 Flash, Llama 4 Maverick hosted | $1–$6 |
| Commodity | Haiku 4.x, Gemini 2.0 Flash Lite, Llama 4 Scout hosted | $0.10–$0.50 |

**Cost check:** at 50M tokens/month, misrouting commodity tasks to flagship
costs approximately $1,200–$2,000/month more than the balanced/commodity rate.
Verify the actual prices with the provider at the time of decision — they
change quarterly.

---

## Step 3 — Platform Selection Scoring Rubric (five axes)

Score each feasible option 1–5 on each axis. Eliminate any option scoring 1 on
a mandatory axis. Sum the weighted scores; the recommendation is the top
scorer that passes all mandatory axes.

| Axis | Weight | What to assess | Mandatory? |
|---|---|---|---|
| Compliance & data residency | 20 | DPA, GDPR terms, region configuration | Yes (gate in Step 1) |
| Monthly cost at expected volume | 25 | Token price × volume × (1 − cache hit rate) | No |
| **Exit cost** | **25** | **Data egress, code re-instrumentation, eval re-tuning, compliance re-attestation** | **No (but never below 20)** |
| Latency class | 15 | p50 and p99 TTFT at expected prompt length | No |
| Operational fit | 15 | Does the team have infra/expertise to operate this? | No |

**Why exit cost is weighted at 25:** a procurement decision that buys the
cheapest platform this year and the most expensive migration next year has
not saved money. A 6–10 engineer-week migration at $2,500/week is $15K–$25K —
comparable to a year of run-rate difference between flagship and balanced.
Budget for it at parity with the run-rate itself.

---

## Step 4 — Exit Cost Checklist (the axis that changes decisions)

Score each option 1–5 where 5 is the lowest exit cost. The sum across these
four dimensions is the exit-cost input to Step 3.

- [ ] **Data egress** — Can we extract prompts, fine-tune datasets, eval sets, and audit logs in a portable format? (5 = managed workspace is not the only copy; 1 = fine-tuned weights and datasets are trapped in vendor tooling)
- [ ] **Code re-instrumentation** — How many application call sites reference provider-specific SDKs, tool schemas, or response formats? (5 = bare API + Anthropic/OpenAI-compatible interface; 1 = proprietary framework with deep coupling)
- [ ] **Eval and prompt re-tuning** — Are prompts tuned to one provider's idioms, and does the eval suite live inside the vendor's tooling? (5 = evals in your repo, prompts portable; 1 = eval suite is a vendor-managed dashboard)
- [ ] **Compliance re-attestation** — Does leaving the provider require a new DPA, a new security review, and a new data-flow diagram? (5 = DPA and security review reusable; 1 = entire attestation cycle required)

**Self-hosted open weights score 5/5/5/5 on exit cost by construction** — you
own the weights, the data, the eval suite, and the deployment. The trade-off
shifts entirely to operational cost (GPU hosting, model management, update
cadence).

**Mitigation:** run a dry-run migration once a year. Point one production
workload at a different provider for 48 hours, count the touch points, and
that touch-point count is the real budget for the next real migration.

---

## Step 5 — AI Gateway Checklist

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

**Gateway-as-overhead fallacy:** implementing LiteLLM at project start is a
one-day exercise. Retrofitting it into a six-service architecture 18 months
later is approximately 12 engineer-weeks. The gateway is the layer with the
lowest implementation cost and the highest retrofit cost.

---

## Step 6 — Agent Framework Selection (with exit cost)

Pick the abstraction level that matches the team's maintenance burden tolerance
*and* the exit cost of that abstraction.

| Scenario | Recommended approach | Exit cost to a different framework |
|---|---|---|
| Single tool call, one response | Direct API + bare `tool_use`; no framework | Low — you own the loop |
| 3–5 step linear pipeline with retries | Claude Agent SDK or minimal `tool_use` loop | Moderate — session memory and hooks are framework-specific |
| Stateful multi-step agent with checkpointing | Claude Agent SDK (Phase 14 · 17) or LangGraph | High — graph definitions and checkpointing format are framework-specific |
| Multi-agent simulation / research pipeline | AutoGen or LangGraph multi-agent | Very high — conversation topology is the artifact |
| RAG-heavy pipeline with retrieval steps | LlamaIndex Workflows | High — RAG-coupled design |

**Rule:** if you are re-implementing retry, state serialization, or tool error
handling inside your own orchestration glue, move up one abstraction level.
If you cannot understand the framework's control flow in 10 minutes of reading,
move down one level. Always ask: "can I exit this framework in two weeks if it
loses momentum?"

---

## Quick Reference: Four-Layer Stack with Exit-Cost Row

```
Layer 4  Agent framework   Claude Agent SDK / LangGraph / raw tool_use
                            Exit cost: graph/framework-specific artifacts
Layer 3  AI gateway        LiteLLM / Portkey / Azure APIM AI policies
                            Exit cost: low (gateway is a normal proxy)
Layer 2  Inference platform Azure AI Foundry / AWS Bedrock / Vertex AI / Direct API
                            Exit cost: moderate (IAM, VNet, data-residency config)
Layer 1  Model provider    Anthropic / OpenAI / Google / Meta (open weights)
                            Exit cost: low (API) to very high (proprietary framework)
```

Each layer is independently substitutable *if* the architecture respects the
layer boundaries. A change at one layer should not require changes at another.
If it does, the architecture is over-coupled, and the exit cost of every
future change is higher than it needs to be.
