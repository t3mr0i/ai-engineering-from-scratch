# AI Ecosystem Map: Models, Platforms, and Vendor Trade-offs (2026)

> As of mid-2026 there are more than forty production-grade frontier-model endpoints and over a hundred agent orchestration frameworks. Anthropic's Fable 5 and Opus 4.x family, OpenAI's o-series and GPT-4.x lineup, Google Gemini 2.x Pro and Flash, and Meta's Llama 4 open weights now all sit within a narrow capability band on standard benchmarks — differentiation has shifted from raw benchmark scores to deployment model, latency profile, compliance posture, and total cost of ownership. A consultant or engineer who cannot map a client's workload to the right tier of this landscape will routinely over-engineer (anchoring on flagship models when a distilled open-weight model running on premise would suffice) or under-provision (assuming a thin API wrapper is "production" when the workload actually needs a gateway, caching, and audit logging). The ecosystem is now stratified into four layers — model providers, managed inference platforms, AI gateways, and agent frameworks — and a defensible architecture decision requires engaging with each layer deliberately.

**Type:** Learn
**Languages:** Python (stdlib — vendor/platform scoring + deployment-mode decision router)
**Prerequisites:** Phase 17 · 01 (Managed LLM platforms), Phase 17 · 19 (AI gateways)
**Time:** ~45 minutes

## The Problem

The first failure mode is **false equivalence**: treating all frontier model API endpoints as interchangeable commodities and choosing based on benchmark leaderboards alone. Benchmarks measure capability in a controlled setting; they do not measure inference latency at p99, region-by-region data-residency compliance, rate-limit ceilings under burst load, or cost at the token volumes a real production workload generates. A team that chose a flagship model at $15/M output tokens when a task-tuned smaller model at $0.40/M output tokens handles 95 percent of the volume has not made a capability trade-off — it has made a pricing error dressed as a capability decision.

The second failure mode is **layer confusion**: conflating the model provider (who trains the weights), the inference platform (who serves the API), the AI gateway (who handles auth, caching, routing, and audit), and the agent framework (who orchestrates multi-step logic). These layers are independently composable, and the right answer at each layer depends on different constraints — data residency lives at the platform layer, retry and cost control live at the gateway layer, tool schema design lives at the framework layer. Conflating them leads to architectures where the model provider is doing gateway work (bespoke API wrappers per team), gateways are doing orchestration work (routing logic baked into the proxy), and agent frameworks are doing platform work (re-implementing retry logic inside each agent). Clarifying the layers is the consulting intervention that unblocks these designs.

## The Concept

### The four-layer stack

Every production AI system crosses these four layers. Naming them explicitly is the first move in a vendor conversation.

| Layer | What it does | Who sits here (2026) | What breaks if you ignore it |
|---|---|---|---|
| **Model provider** | Trains and publishes model weights or API endpoints | Anthropic (Claude Fable 5, Opus/Sonnet/Haiku 4.x), OpenAI (o3, GPT-4o), Google (Gemini 2.x Pro/Flash), Meta (Llama 4 open weights), Mistral, Cohere | Capability-cost mismatches; compliance gaps; no fallback when a provider has an outage |
| **Managed inference platform** | Hosts model endpoints, manages scaling, uptime SLA, region selection | Azure AI Foundry, AWS Bedrock, Google Vertex AI, Anthropic API direct, Together.ai, Groq | Data residency violations; unpredictable latency; no SLA for enterprise workloads |
| **AI gateway** | Auth, routing, rate limiting, semantic caching, audit logging, cost allocation | LiteLLM (OSS), Portkey, Kong AI Gateway, Azure APIM AI policies, internal gateways (LHIND internal) | No unified cost visibility; no audit trail; per-team API keys scattered across prod |
| **Agent framework** | Tool schemas, multi-step orchestration, memory, human-in-the-loop hooks | Claude Agent SDK (Phase 14 · 17), LangGraph, LlamaIndex Workflows, AutoGen, bare Anthropic `tool_use` | Brittle prompt glue; no retry hygiene; tool call errors silently lost |

The key architectural principle: **each layer is substitutable independently**. Switching from Anthropic direct API to Azure AI Foundry (platform swap) should not require touching the agent framework. Swapping LiteLLM for an internal gateway should not change the model provider. A design that forces you to touch three layers when you change one is over-coupled.

### Model provider landscape and selection criteria

Benchmarks mislead when used as the primary selection signal. The decision tree that actually matters:

1. **Data residency.** If the workload cannot leave the EU (GDPR, LHIND data policy), the set of viable providers shrinks immediately. Azure AI Foundry Germany West Central and Google Vertex AI in `europe-west3` are the two options with documented EU-only processing; Anthropic API direct routes through US East by default.

2. **Compliance posture.** Does the provider offer a DPA (Data Processing Agreement), GDPR Article 28 processor terms, SOC 2 Type II, or ISO 27001? For a consulting engagement at an airline or insurer, the answer must be yes before evaluation begins.

3. **Cost tier at expected volume.** In 2026 model pricing has stratified into three bands:

| Band | Representative models | Typical input / output price | Appropriate workloads |
|---|---|---|---|
| Flagship | Claude Fable 5, GPT-4o, Gemini 2.0 Pro | $5–$20 / $15–$75 per 1M tokens | Complex reasoning, code generation, multi-modal |
| Balanced | Claude Sonnet 4.x, Gemini 2.0 Flash, Llama 4 70B hosted | $0.25–$3 / $1–$15 per 1M tokens | Most production workloads: summarization, classification, RAG responses |
| Commodity | Haiku 4.x, Gemini 2.0 Flash Lite, Llama 4 8B hosted | $0.05–$0.20 / $0.10–$0.80 per 1M tokens | High-volume triage, extraction, routing, simple QA |

The practical rule: **route by task, not by default.** A classification step in a pipeline has no business calling a flagship model. A gateway with task-based routing (Phase 17 · 19) enforces this systematically.

4. **Latency profile.** Groq (LPU inference) and Gemini Flash on Vertex consistently hit sub-200ms TTFT for prompt lengths under 2K tokens. Flagship models via standard APIs often sit at 500ms–2s TTFT. For real-time interactive applications, this distinction is architectural.

5. **Open vs. closed weights.** Llama 4 open weights allow on-premise deployment, fine-tuning without data leaving your infrastructure, and freedom from per-token billing. The operational cost (GPU hosting, model management, update cadence) is real; model open weights do not mean zero cost, they mean cost shifted from usage to infrastructure.

### Managed inference platforms in detail

Phase 17 · 01 covers platform-level operations. The strategic layer here is **which hyperscaler to anchor on** for a given client:

- **Azure AI Foundry** — preferred entry point for clients already on Azure enterprise agreements. Native integration with Azure OpenAI Service (o3, GPT-4o), Anthropic models via Marketplace, and Meta Llama 4. Germany West Central region satisfies LHIND data residency. Azure APIM can serve as the gateway layer.
- **AWS Bedrock** — preferred for clients on AWS. Covers Anthropic Claude, Meta Llama, Mistral, Amazon Titan. Cross-region inference groups for failover. VPC endpoints for network isolation.
- **Google Vertex AI** — preferred for clients with Google Workspace or BigQuery dependencies. Gemini 2.x Pro/Flash natively. Strong for multi-modal pipelines and for clients where Workspace data (Docs, Sheets) is the primary context source.
- **Anthropic API direct** — lowest latency for Claude models; no intermediary markup. Appropriate for greenfield projects without hyperscaler anchor, or where the team needs direct access to beta features (Fable 5 preview, extended thinking). Requires explicit DPA for EU workloads.

A client with an existing Azure Enterprise Agreement does not need a procurement exercise to add Azure AI Foundry. The gateway and billing are already governed. This is often the fastest path to a compliant PoC.

### AI gateways: the operational layer that teams skip

The most common gap in early-stage AI deployments is the absent gateway layer (Phase 17 · 19). Without it:

- Multiple teams hold separate API keys with no centralized cost visibility.
- There is no audit log showing which user query produced which model call — a compliance exposure for financial services and healthcare clients.
- Retry logic is re-implemented in every service, each subtly differently.
- Semantic caching (returning a cached response when a near-duplicate query arrives) is absent, leaving 20–40% cost savings on the table for high-volume query patterns.

LiteLLM OSS is the reference open-source implementation: a single proxy that normalizes the Anthropic, OpenAI, and Vertex request formats behind one endpoint, handles retries, exposes Prometheus metrics, and lets you swap model assignments without touching application code. For clients who need enterprise support and a UI, Portkey and Kong AI Gateway add policy management and team dashboards. For LHIND engagements on Azure, Azure APIM with AI policies is the natural default because it reuses existing access control and logging infrastructure.

### Agent frameworks: choosing the right abstraction

The agent framework layer determines how multi-step logic, tool calls, and human-in-the-loop checkpoints are structured. The decision is not "which framework is best" — it is "which level of abstraction matches this team's maintenance burden tolerance."

| Framework | Abstraction level | Best fit | Watch-out |
|---|---|---|---|
| **Raw `tool_use` / API** | Lowest — you write the loop | Teams that need full control; one-off scripts | You re-implement retry, state management, error handling |
| **Claude Agent SDK** (Phase 14 · 17) | Mid — managed loop, explicit tool schema, permission hooks | Anthropic-native workloads; teams that want Anthropic's safety guardrails in the loop | Anthropic-specific; not portable to other providers without rewrapping |
| **LangGraph** | Mid-high — graph-based state machines, native checkpointing | Stateful multi-agent pipelines; teams comfortable with Python and graph primitives | Graph model has a learning curve; verbose for simple tasks |
| **LlamaIndex Workflows** | High — event-driven, declarative | Teams already using LlamaIndex for RAG; async-first pipelines | RAG-centric design; overkill for pure-agent tasks without retrieval |
| **AutoGen** | High — multi-agent conversation orchestration | Research-grade multi-agent experiments; simulated team workflows | High abstraction hides control flow; hard to debug in production |

The architectural principle: start with the lowest abstraction that handles your error surface. A three-step pipeline that calls a search tool and returns a summary does not need LangGraph; a bare `tool_use` loop with explicit retry suffices. Move up the abstraction ladder when the control-flow complexity of the raw loop exceeds what the team can maintain.

### Making the decision: a scoring approach

A defensible vendor/platform recommendation for a client involves scoring four axes, then ranking options within the feasible set:

1. **Compliance feasibility** — binary gate: does the option satisfy data residency and DPA requirements? If no, eliminate it.
2. **Cost at expected volume** — model the expected monthly token volume × per-token price × expected cache hit rate.
3. **Operational fit** — does the team have the infrastructure and expertise to operate this option? (Open-weight self-hosting is only viable if GPU infrastructure is already managed.)
4. **Strategic alignment** — does the choice compound an existing vendor relationship (Azure EA, Google Workspace) or introduce a new procurement dependency?

`code/main.py` makes this scoring model runnable with a concrete sample of options and workloads.

## Use It

`code/main.py` implements two deterministic models of this lesson's core decisions:

1. A **vendor/platform scorer** that takes a workload descriptor (data-residency requirement, expected monthly token volume, latency requirement, open-weights requirement) and scores a hardcoded catalog of model provider + platform combinations against those requirements, eliminating non-feasible options and ranking the rest.
2. A **deployment-mode router** that maps a task type, volume tier, and latency requirement to the recommended model band (flagship / balanced / commodity) with the cost reasoning shown.

No network calls, no pip dependencies. The purpose is to make the scoring policy explicit and runnable — the same thing Phase 15 · 10 did for the permission-mode decision.

## Ship It

`outputs/skill-vendor-selection-scorecard.md` is a one-page consultant's scorecard: paste in a client's workload constraints, eliminate non-compliant options, score the remaining ones, and arrive at a defensible recommendation. Includes the four-axis scoring rubric and a routing table for model band selection by task type.

## Exercises

1. Run `code/main.py`. Which platform options are eliminated by the EU data-residency constraint? Note the exact reason printed. Then change the `data_residency` parameter from `"EU"` to `"US"` and re-run: which eliminated options become feasible?

2. The cost model in `code/main.py` computes monthly spend at two volume tiers. Find the crossover point (in monthly token volume) where the flagship-band option becomes more expensive than switching to the balanced band. Does that crossover point shift if you add a 35% semantic-cache hit rate? Calculate manually using the printed per-token prices.

3. Review the gateway checklist in `outputs/skill-vendor-selection-scorecard.md`. Pick a real or hypothetical project at a client. For each gateway capability listed (audit log, semantic cache, retry, cost allocation), write one sentence explaining whether it is currently provided, missing, or provided by a non-gateway mechanism (e.g., application-level retry). Where are the gaps?

4. A client's team is already running LangGraph. They ask whether to switch to the Claude Agent SDK (Phase 14 · 17). Using the framework abstraction table above and the agent SDK's documented feature set, write a two-paragraph recommendation: one paragraph for switching, one against. Which scenario tips the decision?

5. A workload today calls `claude-opus-4-5` for every request including simple classification steps that return one of five labels. Using the model band table and the commodity pricing row, estimate the monthly cost difference for a workload of 50 million classification tokens per month. What is the minimum accuracy drop that would justify staying on the flagship tier?

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Model provider | "The AI company" | Entity that trains and publishes model weights or endpoints; separate from the platform that hosts inference |
| Managed inference platform | "Hosting the model" | Cloud service that serves model API endpoints with SLA, scaling, and region selection (Bedrock, Vertex, Foundry) |
| AI gateway | "Proxy layer" | Middleware handling auth, routing, rate limiting, semantic caching, and audit logging across multiple model backends |
| Semantic caching | "Caching AI responses" | Returning a stored response when an incoming query is semantically near-duplicate of a previous query; typically 20-40% cost reduction on high-volume QA workloads |
| Open weights | "Open source AI" | Model weights are publicly downloadable and may be run on-premise; does not mean zero-cost or zero-maintenance |
| Token volume tier | "How much we use it" | Expected monthly input+output token volume; determines which cost band is economically rational |
| Data Processing Agreement (DPA) | "GDPR paperwork" | Contractual instrument required under GDPR Art. 28 before a cloud processor can handle personal data; a compliance gate, not a nice-to-have |
| Layer confusion | "It's all just AI" | Conflating model provider, inference platform, gateway, and agent framework as one monolithic vendor choice; the root cause of over-coupled AI architectures |

## Further Reading

- [Anthropic API documentation](https://docs.claude.com) — model catalog, pricing, data residency, DPA information, and Claude model family overview.
- [Azure AI Foundry documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/) — managed inference on Azure, model catalog, regional availability, and enterprise compliance posture.
- [AWS Bedrock documentation](https://docs.aws.amazon.com/bedrock/) — model catalog, cross-region inference, VPC endpoints, and Bedrock Guardrails.
- [LiteLLM documentation](https://docs.litellm.ai) — open-source gateway reference implementation: proxy setup, provider normalization, semantic caching, and Prometheus metrics.
- [Google Vertex AI model garden](https://cloud.google.com/vertex-ai/generative-ai/docs/model-garden/explore-models) — Gemini model lineup, third-party models, and region-by-region availability for EU data residency.
