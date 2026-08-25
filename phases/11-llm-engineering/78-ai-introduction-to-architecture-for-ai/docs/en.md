# From LLM API Call to Production AI System: Architecture Decisions That Matter (2026)

> Most generative AI pilots die between "it works in the notebook" and "it runs in production under real load." The gap is architectural: a single LLM API call is not a system. A production AI application is an orchestration layer over models, retrieval infrastructure, tool execution environments, observability pipelines, and safety gates — and each layer introduces latency, cost, and failure modes the model itself cannot compensate for. In 2026 the model layer (GPT-4o, Claude Sonnet 4.6, Gemini 2.5 Pro) has largely commoditized; the architectural decisions around context assembly, retrieval strategy, agentic boundaries, and deployment topology are where consulting engagements succeed or fail. This lesson frames the complete architectural decision space and gives you a repeatable vocabulary to bring into a client conversation.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 13 (Production LLM applications), Phase 17 · 01 (Managed LLM platforms)
**Time:** ~100 minutes

## Learning Objectives

- Explain the production problem addressed by From LLM API Call to Production AI System: Architecture Decisions That Matter (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

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



## Build It

Reconstruct **From LLM API Call to Production AI System: Architecture Decisions That Matter (2026)** by following `OrchestrationPattern` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `OrchestrationPattern` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-ai-system-architecture-picker.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Microsoft — Azure AI Foundry documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/) — orchestration, RAG pipelines, tracing, content safety, and managed endpoints.
- [Anthropic — Claude model overview and context windows](https://docs.claude.com/en/docs/about-claude/models/overview) — current model capabilities, pricing, and context limits.
- [LangChain — RAG tutorial and conceptual guide](https://python.langchain.com/docs/tutorials/rag/) — canonical walkthrough of the five-step RAG pipeline.
- [Ragas — RAG evaluation framework](https://docs.ragas.io/) — automated groundedness, faithfulness, and relevance metrics for RAG systems.
- [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) — the risk management framework referenced in most enterprise AI governance conversations.

## Exercises

Make the experiment auditable. Save the input, output, and one sentence explaining how the result bears on the claim.

1. **Start with a known input.** Run [main.py](../code/main.py) with `python3 main.py` from the lesson's `code/` directory. Record the smallest input that demonstrates “Explain the production problem addressed by From LLM API Call to Production AI System: Architecture Decisions That Matter (2026)”. Point to `classify_architecture()`, `estimate_cost()`, `print_decision()` and name the returned field or printed value that serves as evidence.
2. **Run a controlled comparison.** Change exactly one input, threshold, or option that affects “Apply the lesson's decision or implementation workflow to a concrete case”. Predict the direction of the change before running it, then compare the two outputs and explain why the other fields should stay stable.
3. **Try the smallest valid counterexample.** Construct a case that stresses “Measure quality, cost, latency, and risk with explicit acceptance criteria”: choose an empty collection, missing field, maximum-sized value, malformed record, or another boundary that fits this lesson. Write the expected behavior first and distinguish an intentional guard from an accidental crash.
4. **Transfer the result.** Open outputs/skill-ai-system-architecture-picker.md and adapt one example to a real workflow. State the owner, evidence, and next decision required for “Identify failure modes and define a safe rollback or review path”; mark any assumption that the demo does not establish.

## Reference Solution

A useful submission records python3 main.py, the observed output, and the conclusion drawn from it. It should contain:

- evidence for “Explain the production problem addressed by From LLM API Call to Production AI System: Architecture Decisions That Matter (2026)” with the relevant input and returned field;
- a one-variable comparison that makes “Apply the lesson's decision or implementation workflow to a concrete case” visible;
- a predicted and observed boundary result for “Measure quality, cost, latency, and risk with explicit acceptance criteria”, including why the behavior is safe; and
- one concrete update to outputs/skill-ai-system-architecture-picker.md that applies “Identify failure modes and define a safe rollback or review path” without hiding uncertainty.

Use classify_architecture(), estimate_cost(), print_decision() to explain the result, not only the prose output. If the experiment disagrees with the prediction, keep the failed prediction in the receipt and revise the explanation rather than changing the input until it passes.
