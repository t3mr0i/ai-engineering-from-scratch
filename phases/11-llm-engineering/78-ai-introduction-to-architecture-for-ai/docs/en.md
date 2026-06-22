# From LLM API Call to Production AI System: Architecture Decisions That Matter (2026)

> Most generative AI pilots die between "it works in the notebook" and "it runs in production under real load." The gap is architectural: a single LLM API call is not a system. A production AI application is an orchestration layer over models, retrieval infrastructure, tool execution environments, observability pipelines, and safety gates — and each layer introduces latency, cost, and failure modes the model itself cannot compensate for. In 2026 the model layer (GPT-4o, Claude Sonnet 4.6, Gemini 2.5 Pro) has largely commoditized; the architectural decisions around context assembly, retrieval strategy, agentic boundaries, and deployment topology are where consulting engagements succeed or fail. This lesson frames the complete architectural decision space and gives you a repeatable vocabulary to bring into a client conversation.

**Type:** Learn
**Languages:** Python (stdlib — architecture pattern classifier + layer cost estimator)
**Prerequisites:** Phase 11 · 13 (Production LLM applications), Phase 17 · 01 (Managed LLM platforms)
**Time:** ~45 minutes

## The Problem

The most common failure mode on AI system projects is sequential: a team evaluates a model, gets good results on a curated test set, deploys a thin wrapper around the API, and then discovers in week two that latency spikes to 12 seconds under concurrent load, context windows overflow on real documents, the model hallucinates on proprietary data it has never seen, and there is no way to explain to the client what happened in a given session. None of these are model failures. They are architecture failures.

The second-most-common failure mode is the opposite: over-engineering. Teams add RAG pipelines, vector databases, agent orchestration, custom fine-tuning, and red-team frameworks to a use case that would have been solved by a well-structured system prompt and a single-turn call. Architecture decisions are risk decisions — every layer you add is a layer that can fail, drift, or add to the monthly operating bill (in our experience, each new layer typically adds a low double-digit percentage to the per-request cost once retrieval, orchestration, and observability are fully wired). The discipline is knowing which layers a given requirement actually demands, and which can be deferred or omitted.

## The Concept

### The five-layer reference model

Every production AI system sits somewhere on a five-layer stack. Understanding which layers your system activates — and which it leaves at the platform default — is the first design question.

| Layer | What it is | Key 2026 technologies | The decision you make |
|---|---|---|---|
| **Model** | The LLM producing tokens | Claude Sonnet 4.6 / Opus 4.7, GPT-4o, Gemini 2.5 Pro, Llama 3.3 (self-hosted) | Hosted vs. self-hosted; latency vs. capability vs. cost |
| **Context assembly** | What you put in the prompt | System prompt, retrieved chunks, tool results, conversation history | Retrieval strategy, context compression, history windowing |
| **Orchestration** | How tasks flow between model calls | LangGraph, Semantic Kernel, custom state machines | Linear chain vs. DAG vs. agentic loop |
| **Tool execution** | What the model can call | Web search, code interpreter, internal APIs, databases | Trust boundary, timeout policy, sandboxing |
| **Deployment** | How the system runs and scales | Azure AI Foundry, AWS Bedrock, GCP Vertex AI, self-hosted Kubernetes | Latency SLA, concurrency, cost model, data residency |

Most notebook demos activate only Layer 1 (a single model call) and part of Layer 2 (a hardcoded prompt). Most production failures activate Layers 1 and 2 in production without designing Layers 3 through 5. The architectural conversation is about which layers a requirement activates and what must be designed for each.

### Context assembly: the highest-leverage layer

Context is what the model knows about *this* request. Assembling context well is the single highest-leverage intervention in most AI system projects — higher than model choice, higher than fine-tuning.

**Retrieval-Augmented Generation (RAG)** is the dominant pattern when the answer depends on proprietary or recent data the model was not trained on. The standard RAG pipeline has five steps:

1. **Ingest**: chunk documents, embed chunks with an embedding model (e.g., `text-embedding-3-large`, Cohere `embed-v4`), store in a vector index (Azure AI Search, Pinecone, pgvector).
2. **Retrieve**: embed the user query, find the top-k semantically similar chunks.
3. **Re-rank**: optionally pass retrieved chunks through a cross-encoder re-ranker (Cohere Rerank, BGE-Reranker) to improve precision before injecting into context.
4. **Assemble**: build the prompt by concatenating system instructions, retrieved chunks, and the user turn.
5. **Generate**: call the model with the assembled context.

The engineering decisions are in the seams: chunk size (512 vs. 2048 tokens), overlap, chunking strategy (fixed-size vs. semantic vs. hierarchical), embedding model choice, retrieval k, re-ranking budget, and context-length budget for the final prompt.

**Long-context alternatives**: Claude Opus 4.7 and Gemini 2.5 Pro both support 1M-token context windows. For some use cases (legal document review, codebase Q&A) it is now cheaper and more accurate to load the full document rather than build a retrieval pipeline. This is the "just stuff it in" pattern — cheap to implement, expensive in token cost, and bounded by the document size ceiling. The trade-off is explicit in Phase 17 · 01.

### Orchestration: when you need more than one call

A **chain** is a fixed sequence of model calls: prompt → model → parse → prompt → model. Chains work when the task decomposes cleanly into sequential steps with no branching.

An **agent loop** is a model calling tools, observing results, and deciding the next action — iteratively, until a stopping condition. The model reasons about what to do next at each step. Agent loops work when the task requires open-ended reasoning or cannot be fully specified in advance. The cost: each loop iteration is a round-trip to the model and to whatever tools it calls, and loops can diverge.

A **DAG (directed acyclic graph)** of tasks sits between chains and agent loops: multiple model calls run in a structured dependency graph, some in parallel. LangGraph and Semantic Kernel both provide DAG orchestration. Use when subtasks are independent (can parallelize) but the workflow is known in advance (no open-ended loop needed).

The rule: **use the simplest orchestration that the task requires.**

| Pattern | When to use | Latency impact | Failure modes |
|---|---|---|---|
| Single call | Task fits in one prompt; answer is standalone | Fastest | Prompt engineering only |
| Chain | Sequential subtasks with known structure | Linear (N x model latency) | Error propagation down the chain |
| DAG | Parallel independent subtasks | Parallel (depth x model latency) | Fan-in complexity, partial failure |
| Agent loop | Open-ended reasoning; tool use required | Unpredictable (N loops) | Divergence, infinite loops, tool abuse |

### Tool execution and trust boundaries

When a model can call external tools, the blast radius of a bad or injected instruction expands to whatever the tools can reach. Relevant rules (see also Phase 13 · 06 on MCP fundamentals, and Phase 15 · 10 on permission modes):

- **Least privilege**: give the model the minimum tool surface the task requires. A customer-facing chat assistant does not need write access to the production database.
- **Sandboxing**: code interpreter and shell execution must run in an isolated environment (container, VM, Dynamic Session). Azure Container Apps Dynamic Sessions and AWS Lambda sandboxes are the current managed options.
- **Timeouts and retries**: every tool call must have a timeout. Unbounded tool calls stall the agent loop and accumulate cost.
- **Audit trail**: every tool call and its arguments must be logged before execution, not after. You need the log to debug a bad trajectory.

### Deployment topology: where computation happens

Three patterns dominate in 2026:

| Topology | How it works | Good for | Watch out for |
|---|---|---|---|
| **Managed API** | Call a hosted endpoint (Azure OpenAI, Anthropic API, Bedrock) | Most workloads; fastest to production | Data residency; no model customization; cost at scale |
| **Platform-managed orchestration** | Azure AI Foundry / Vertex AI runs the full pipeline | Enterprises needing monitoring, guardrails, RBAC out of the box | Vendor lock-in; less flexibility |
| **Self-hosted** | Run open-weight models on your own GPU fleet (Llama 3.3, Mistral Large) | Data sovereignty; fine-tuning requirements; sustained high volume | Ops burden; model quality ceiling vs. frontier models |

Data residency is the first compliance question on every client engagement. Germany-based deployments default to `germanywestcentral` on Azure, which hosts Azure OpenAI and AI Foundry endpoints as of 2026. Check the Azure region availability matrix before committing to a model.

### Observability: the layer most teams skip

A production AI system without observability is a black box. The minimum viable observability stack for an LLM application:

- **Trace logging**: log the full prompt (assembled context, tool results, model response) for every request. This is the foundation for debugging, audits, and fine-tuning.
- **Latency breakdowns**: measure model call latency, retrieval latency, and tool latency separately. Aggregated p50/p95/p99 per stage.
- **Token cost tracking**: log input/output tokens per request. Multiply by current pricing and aggregate by user/feature/time.
- **Groundedness metrics**: automated checks against retrieved sources (Azure AI Foundry Content Safety, Ragas, TruLens) for RAG systems.
- **Human feedback loops**: thumbs up/down, corrections, and escalations captured at the application layer, stored for fine-tuning and evaluation.

LangSmith, Azure AI Foundry Tracing, and Weights & Biases Weave are the current leading platforms. The critical constraint: trace logs contain the full user input and model output — they are sensitive data and must be treated accordingly (retention policy, access control, PII masking).

### The architecture selection heuristic

Given a new AI system requirement, the decision sequence is:

1. **Does the answer depend on data the model was not trained on?** Yes → RAG or long-context. No → proceed with a well-structured prompt.
2. **Does the task require more than one model call?** Yes → chain, DAG, or agent loop. No → single call.
3. **Does the task require tool execution?** Yes → define the tool surface, trust boundary, and sandboxing before choosing an orchestration framework.
4. **What is the data residency constraint?** Determines the deployment topology (managed API region, platform, or self-hosted).
5. **What is the latency SLA?** Streaming vs. batch; single-stage vs. multi-stage; model size trade-off.

`code/main.py` makes this decision sequence executable.

## Use It

`code/main.py` implements two deterministic models of this lesson's core decisions:

1. An **architecture pattern classifier** that takes a set of requirement flags (needs RAG, needs tool use, latency-sensitive, multi-step workflow, data residency constraints) and selects the appropriate layer activations with reasoning.
2. A **layer cost estimator** that takes an architecture choice and a usage profile (requests per day, tokens per request, tool calls per request) and produces a cost-per-day breakdown across the active layers — making the trade-off between a single-call and a full agent-RAG architecture numerically concrete.

No network, no API keys — the point is to run the decision logic yourself and see how requirement flags drive architecture choices.

## Ship It

`outputs/skill-ai-system-architecture-picker.md` is a one-page consulting decision aid: a requirement intake checklist, the five-layer activation table, the orchestration pattern selector, and a cost order-of-magnitude reference. Paste it into a client kickoff to anchor the architecture conversation.

## Exercises

1. Run `code/main.py`. Which requirement flag most often activates the full five-layer stack? Which flag, when removed, simplifies the architecture the most? Change one flag in the sample profiles and observe what changes in the output.

2. The cost estimator shows a price difference between a single-call architecture and a RAG + agent architecture at 10,000 requests per day. Compute the break-even: at what request volume does the added retrieval quality justify the cost if each correct answer is worth 0.05 EUR to the client?

3. A client's legal department says no user data may leave the EU. Map which architecture layers this constraint affects and which managed API options remain available for a German-law firm use case.

4. Draw a five-layer stack diagram for a use case in your current or recent project. For each layer, write one sentence describing the technology you would use and one sentence describing the failure mode you would monitor.

5. A RAG pipeline returns a retrieved chunk that is factually correct but outdated — the model uses it to generate a confidently wrong answer. Which observability metric would have caught this before it reached the user, and what is the mitigation at the ingest stage?

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| RAG | "Grounded AI" | Retrieval-Augmented Generation: retrieve relevant chunks, inject into prompt, then generate |
| Vector index | "The AI database" | An index of dense embeddings (e.g., Azure AI Search, pgvector) enabling semantic similarity search |
| Agent loop | "Let it think by itself" | An iterative model-calls-tool-observes-result loop with no fixed number of steps |
| Context window | "How much it can read" | Maximum token budget for a single model call; includes prompt, retrieved chunks, and response |
| Orchestration | "The pipeline" | Code that controls the sequence, branching, and parallelism of model and tool calls |
| Groundedness | "Does it match the sources?" | Whether a generated answer is supported by retrieved or provided reference material |
| Data residency | "Where does the data live?" | Regulatory requirement that data be processed and stored in a specific geographic jurisdiction |
| Managed API | "Cloud AI endpoint" | A hosted model endpoint (Azure OpenAI, Anthropic API, Bedrock) where the provider manages infrastructure |

## Consultant field notes

Five shapes you will see again. Name them early in the engagement; clients recognize the pattern faster than the abstract principle.

- **The prompt that worked in the demo but failed in production.** A carefully crafted few-shot prompt dazzles on five curated examples, then collapses on real distribution: long inputs, adversarial users, languages it was never tested on. Lesson: never ship a prompt you have not evaluated against at least a few hundred real production queries, ideally stratified by user segment.
- **The RAG that returned the right doc but the wrong paragraph.** The vector index hit at the document level; the chunk boundary cut the actual answer in half. The model then hallucinated the missing clause with confidence. Lesson: chunk strategy is a content-quality decision, not an embedding decision — re-rank and citation checks catch this; embedding similarity does not.
- **The vendor pilot that never made it past the security review.** A six-week PoC ran beautifully, then stalled three months in procurement because data residency, audit logging, or model fine-tuning rights were never agreed at contract level. Lesson: involve InfoSec and legal on day one, not week eight.
- **The use case everyone approved but nobody wanted.** A steering committee greenlit the AI assistant for case workers; six months later, adoption sits at 8% because the workflow did not match how the job actually gets done. Lesson: validate the use case with the end users, not just the sponsors — enthusiasm at the top is not a proxy for usage in the field.
- **The AI feature that hit a cost ceiling in month two.** A prototype looked free at 200 test queries; at production volume the retrieval + LLM + re-rank stack pushed per-interaction cost past what the business case assumed, and the feature got quietly disabled. Lesson: model the cost ceiling at 10x your expected volume before approving scope, not after.

## Further Reading

- [Microsoft — Azure AI Foundry documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/) — orchestration, RAG pipelines, tracing, content safety, and managed endpoints.
- [Anthropic — Claude model overview and context windows](https://docs.claude.com/en/docs/about-claude/models/overview) — current model capabilities, pricing, and context limits.
- [LangChain — RAG tutorial and conceptual guide](https://python.langchain.com/docs/tutorials/rag/) — canonical walkthrough of the five-step RAG pipeline.
- [Ragas — RAG evaluation framework](https://docs.ragas.io/) — automated groundedness, faithfulness, and relevance metrics for RAG systems.
- [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) — the risk management framework referenced in most enterprise AI governance conversations.
