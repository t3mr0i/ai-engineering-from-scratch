# AI Ecosystem Map: Vendor Decisions With Exit Costs in View (2026)

> As of mid-2026 the capability gap between Anthropic's Fable 5 and Opus/Sonnet/Haiku 4.x, OpenAI's o-series and GPT-4.x lineup, Google Gemini 2.x Pro/Flash, and Meta's Llama 4 open weights has narrowed to a few points on standard benchmarks. Selection has therefore moved upstream of the leaderboard: the defensible decision is now about *deployment model*, *exit cost*, and *who holds the keys when the contract ends* — not which model scores three points higher on MMLU this quarter. A consultant who recommends a vendor without modeling the cost of leaving that vendor has not finished the analysis. They have just deferred it to the next budget cycle.

**Type:** Learn
**Languages:** Python (stdlib — vendor/platform scorer with exit-cost model, plus a demonstration of the failure shape)
**Prerequisites:** Phase 17 · 01 (Managed LLM platforms), Phase 17 · 19 (AI gateways)
**Time:** ~50 minutes

## The Problem

Three failure shapes recur across LHIND engagements, and they are all about *what was not modeled* at procurement time.

**The "flagship default" shape.** A public-sector team procured a flagship-tier API endpoint for a contract-review assistant because the RFP evaluation scorecard weighted "model quality" most heavily. Twelve months in, monthly spend is approximately 11x what a balanced-tier model would have cost on the same workload, the procurement clause locks them in for two more years, and the production data is now scattered across three teams' worth of bespoke API wrappers. The team did not make a quality decision — they made a quality *signal* decision, anchored on a benchmark number that no longer predicts business value for their workload.

**The "fine-tuning data hostage" shape.** A logistics firm fine-tuned a hosted open-weight model on 80,000 annotated support tickets to hit a target accuracy on a niche classification task. Eighteen months later the firm wants to leave the platform: the fine-tuned weights are tied to that provider's serving stack, the training dataset was uploaded into a managed workspace that cannot be exported cleanly, and re-training on the new provider would cost approximately the same as the original effort. Switching is technically possible. Switching is not economically rational.

**The "audit trail gap" shape.** An insurer wired a single LLM provider directly into its claims triage pipeline because the gateway layer "felt like overhead." Six months later the regulator asks which claims were auto-decided, on what model version, and with what prompt. The team has no unified log; they have a per-service retry file and an API key spread across four repos. The gateway they skipped is now the retrofit they cannot defer.

The pattern across all three: each team picked a vendor, then a layer they thought was optional turned out to be load-bearing — and by the time they noticed, the cost of correction had compounded. Exit cost is not a theoretical future concern. It is the slope of the line you are already on.

## The Concept

### The four-layer stack, with the exit cost of each layer

Every production AI system crosses these four layers. The new twist in 2026 is that each layer carries a different *kind* of exit cost, and the layers you skip at the start are the layers that cost the most to retrofit.

| Layer | What it does | Representative options (2026) | What your exit cost looks like |
|---|---|---|---|
| **Model provider** | Trains and publishes weights or API endpoints | Anthropic (Fable 5, Opus/Sonnet/Haiku 4.x), OpenAI (o3, GPT-4o), Google (Gemini 2.x Pro/Flash), Meta (Llama 4), Mistral, Cohere | Application code that calls provider-specific SDKs; prompt formats tuned to one provider's tool-use schema; eval harness that is provider-coupled |
| **Managed inference platform** | Hosts model endpoints with SLA, scaling, region | Azure AI Foundry, AWS Bedrock, Google Vertex AI, Anthropic API direct, Groq, Together.ai | IAM roles and VPC endpoints bound to the platform; data-residency configuration; cross-region failover wiring; per-team billing that the platform owns |
| **AI gateway** | Auth, routing, rate limits, semantic caching, audit | LiteLLM OSS, Portkey, Kong AI Gateway, Azure APIM AI policies, internal gateways | The absence of one becomes the retrofit: re-instrumenting every service for audit, cost allocation, and retry hygiene is the cost |
| **Agent framework** | Tool schemas, multi-step orchestration, memory, HITL | Claude Agent SDK (Phase 14 · 17), LangGraph, LlamaIndex Workflows, AutoGen, bare `tool_use` | Graph definitions and checkpointing format; tool schemas re-authored for new framework; session memory migration |

The architectural principle is unchanged: each layer is independently substitutable. The 2026 addition: **measure the substitution cost of each layer in advance, and budget for it.** Switching from Anthropic direct API to Azure AI Foundry should not require touching the agent framework — but you only know whether the design honors that if you have *tried* a dry-run switch and counted the touch points. Teams that skip the dry-run discover the touch points during a real migration, at three to five times the cost.

### Model provider landscape and selection criteria

Benchmarks mislead when used as the primary selection signal. The decision tree that actually matters:

1. **Data residency.** If the workload cannot leave the EU (GDPR, LHIND data policy, client DPA terms), the set of viable providers shrinks immediately. Azure AI Foundry Germany West Central and Google Vertex AI `europe-west3` are the two options with documented EU-only processing; AWS Bedrock `eu-central-1` is available for several models with EU data routing. Anthropic API direct routes through US East by default. In our experience the EU-residency constraint eliminates roughly half of an initial longlist within the first hour of a vendor workshop.

2. **Compliance posture.** Does the provider offer a DPA with GDPR Article 28 processor terms, SOC 2 Type II, and ISO 27001? For a consulting engagement at an airline, insurer, or public-sector body, the answer must be yes *before* evaluation begins — not "yes, we can get one" at contract stage. A signed DPA is a 6–10 week procurement activity at large enterprises; budget for it.

3. **Cost tier at expected volume.** In 2026 model pricing has stratified into three bands. Blended per-1M-token rates (input+output combined, approximate 2026 midpoints):

| Band | Representative models | Blended $/1M tokens | Appropriate workloads |
|---|---|---|---|
| Flagship | Claude Fable 5, GPT-4o, Gemini 2.0 Pro | $15–$40 | Complex reasoning, code generation, multi-modal synthesis |
| Balanced | Claude Sonnet 4.x, Gemini 2.0 Flash, Llama 4 Scout hosted | $1–$6 | Most production workloads: RAG, summarization, structured extraction |
| Commodity | Haiku 4.x, Gemini 2.0 Flash Lite, Llama 3.1 8B hosted | $0.10–$0.50 | High-volume triage, extraction, routing, simple QA |

A flagship-tier misroute at 50M tokens/month costs approximately $725–$2,000/month more than the same workload on the commodity tier. At enterprise scale the annual delta is the cost of a junior engineer. The exit cost: a team that has built its prompts and evals around the flagship model cannot trivially drop down a tier without re-running the eval suite. *The tier you pick is the tier you stay on for at least the next two quarters.*

4. **Latency profile.** Groq (LPU inference) and Gemini Flash on Vertex consistently hit sub-200ms TTFT for prompt lengths under 2K tokens. Flagship models via standard APIs often sit at 500ms–2s TTFT. For real-time interactive applications the distinction is architectural; for batch analytics it is irrelevant. Do not let "low latency" appear on a vendor scorecard if your workload is batch.

5. **Open vs. closed weights.** Llama 4 open weights allow on-premise deployment, fine-tuning without data leaving your infrastructure, and freedom from per-token billing. The operational cost is real: GPU hosting, model management, update cadence, and the MLOps discipline to evaluate new open-weight releases on your eval suite. Open weights do not mean zero cost; they mean cost shifted from usage to infrastructure. **They also mean the lowest exit cost of any layer** — you already own the weights.

### The exit-cost matrix

A vendor decision is incomplete without an explicit exit-cost row. The four dimensions that recur:

| Exit dimension | What it measures | Typical cost shape |
|---|---|---|
| **Data egress** | Can we extract our data, prompts, fine-tune datasets, eval sets, and audit logs in a portable format? | Hours-to-days of data engineering for raw prompts; weeks if the platform owns a managed workspace |
| **Code re-instrumentation** | How many application call sites reference provider-specific SDKs, tool schemas, or response formats? | Linear in call sites for raw API usage; combinatorial if a proprietary framework is in the loop |
| **Eval and prompt re-tuning** | Are prompts tuned to one provider's idioms, and does the eval suite live inside the vendor's tooling? | Days to weeks; the longest tail of any exit, because prompt portability is poorly understood until you actually move |
| **Compliance re-attestation** | Does leaving the provider require a new DPA, a new security review, and a new data-flow diagram? | 4–12 weeks; not a technical problem at all, but often the binding constraint |

A team that has never *tried* a dry-run migration tends to underestimate code re-instrumentation by a factor of three to five. The mitigation is mechanical: once a year, pick one production workload, point it at a different provider for 48 hours, and count the touch points. The number is the budget for the real migration when it comes.

### Managed inference platforms in detail

Phase 17 · 01 covers platform-level operations. The strategic layer here is **which hyperscaler to anchor on** for a given client, and what the exit cost of that anchor is:

- **Azure AI Foundry** — preferred entry point for clients on Azure enterprise agreements. Native integration with Azure OpenAI Service (o3, GPT-4o), Anthropic models via Marketplace, and Meta Llama 4. Germany West Central region satisfies LHIND data residency. Azure APIM can serve as the gateway layer. Exit cost: tied to Azure IAM, VNet, and EA — moderate for a move to AWS or GCP, low for a move within Azure.
- **AWS Bedrock** — preferred for clients on AWS. Covers Anthropic Claude, Meta Llama, Mistral, Amazon Titan. Cross-region inference groups for failover. VPC endpoints for network isolation. Exit cost: tied to AWS IAM and Bedrock-specific API surface; high for a move off AWS, moderate within.
- **Google Vertex AI** — preferred for clients with Google Workspace or BigQuery dependencies. Gemini 2.x Pro/Flash natively. Strong for multi-modal pipelines. Exit cost: Vertex-specific Model Garden access; BigQuery-coupled workloads are the most expensive to migrate.
- **Anthropic API direct** — lowest latency for Claude models; no intermediary markup. Appropriate for greenfield projects without hyperscaler anchor, or where the team needs direct access to beta features (Fable 5 preview, extended thinking). Exit cost: application-level refactoring of provider-specific SDK calls; otherwise low.

A client with an existing Azure Enterprise Agreement does not need a procurement exercise to add Azure AI Foundry. The gateway and billing are already governed. This is often the fastest path to a compliant PoC, *and* it is the anchor that, once set, makes a multi-cloud strategy expensive to reverse.

### AI gateways: the operational layer that teams skip — and pay for later

The most common gap in early-stage AI deployments is the absent gateway layer (Phase 17 · 19). Without it:

- Multiple teams hold separate API keys with no centralized cost visibility.
- There is no audit log showing which user query produced which model call — a compliance exposure for financial services and healthcare clients.
- Retry logic is re-implemented in every service, each subtly differently.
- Semantic caching (returning a cached response when a near-duplicate query arrives) is absent, leaving 20–40% cost savings on the table for high-volume query patterns.

The gateway is the layer with the lowest implementation cost and the highest *retrofit* cost. Implementing LiteLLM at project start is a one-day exercise. Retrofitting LiteLLM into a six-service architecture 18 months later is a multi-week refactor with risk of regression. The vendor conversation is incomplete if the gateway is not on the diagram.

### Agent frameworks: choosing the right abstraction

The agent framework layer determines how multi-step logic, tool calls, and human-in-the-loop checkpoints are structured. The decision is not "which framework is best" — it is "which level of abstraction matches this team's maintenance burden tolerance *and* the exit cost of that abstraction." A LangGraph checkpoint file is not portable to the Claude Agent SDK without re-authoring. An AutoGen conversation trace is not portable anywhere.

| Framework | Abstraction level | Best fit | Exit cost to a different framework |
|---|---|---|---|
| **Raw `tool_use` / API** | Lowest — you write the loop | Teams that need full control; one-off scripts | Low — you own the loop, you can rewrite it |
| **Claude Agent SDK** (Phase 14 · 17) | Mid — managed loop, explicit tool schema, permission hooks | Anthropic-native workloads; teams that want Anthropic's safety guardrails in the loop | Moderate — session memory and permission hooks are Anthropic-specific |
| **LangGraph** | Mid-high — graph-based state machines, native checkpointing | Stateful multi-agent pipelines | High — graph definitions and checkpointing format are LangGraph-specific |
| **LlamaIndex Workflows** | High — event-driven, declarative | Teams already using LlamaIndex for RAG; async-first pipelines | High — RAG-coupled design |
| **AutoGen** | High — multi-agent conversation orchestration | Research-grade multi-agent experiments | Very high — conversation topology is the artifact |

The architectural principle: start with the lowest abstraction that handles your error surface *and* that you can plausibly exit in two weeks if the framework loses momentum. A three-step pipeline that calls a search tool and returns a summary does not need LangGraph; a bare `tool_use` loop with explicit retry suffices and exits cleanly to anything.

### Making the decision: a scoring approach that includes exit cost

A defensible vendor/platform recommendation for a client involves scoring five axes, then ranking options within the feasible set:

1. **Compliance feasibility** — binary gate: does the option satisfy data residency and DPA requirements? If no, eliminate it.
2. **Cost at expected volume** — model the expected monthly token volume × per-token price × expected cache hit rate.
3. **Operational fit** — does the team have the infrastructure and expertise to operate this option? (Open-weight self-hosting is only viable if GPU infrastructure is already managed.)
4. **Strategic alignment** — does the choice compound an existing vendor relationship or introduce a new procurement dependency?
5. **Exit cost** — given the touch points (data, code, eval, compliance), how many engineer-weeks would a 12-month-later migration cost? Score 1–5 where 5 is the lowest exit cost.

`code/main.py` makes this scoring model runnable with a concrete sample of options and workloads, and demonstrates the failure shape that the exit-cost row is designed to catch.



## Further Reading

- [Anthropic API documentation](https://docs.claude.com) — model catalog, pricing, data residency, DPA information, and Claude model family overview.
- [Azure AI Foundry documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/) — managed inference on Azure, model catalog, regional availability, and enterprise compliance posture.
- [AWS Bedrock documentation](https://aws.amazon.com/bedrock/) — model catalog, cross-region inference, VPC endpoints, and Bedrock Guardrails.
- [LiteLLM documentation](https://docs.litellm.ai) — open-source gateway reference implementation: proxy setup, provider normalization, semantic caching, and Prometheus metrics.
- [Google Vertex AI model garden](https://cloud.google.com/vertex-ai/generative-ai/docs/model-garden/explore-models) — Gemini model lineup, third-party models, and region-by-region availability for EU data residency.
- [GDPR Article 28 — Processor obligations](https://gdpr-info.eu/art-28-gdpr/) — the contractual instrument a DPA implements, and the legal basis for the compliance gate in Step 1 of the scorecard.
