# Agno and Mastra: Production Runtimes

> Agno (Python) and Mastra (TypeScript) are the 2026 production-runtime pairing. Agno aims at microsecond agent instantiation and stateless FastAPI backends. Mastra ships agents, tools, workflows, unified model routing, and composite storage on the Vercel AI SDK substrate.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## Learning Objectives

- Identify Agno's performance targets and when they matter.
- Name Mastra's three primitives — Agents, Tools, Workflows — and the supported server adapters.
- Explain why a stateless session-scoped FastAPI backend is the recommended Agno production path.
- Pick Agno vs Mastra for a given stack (Python-first vs TypeScript-first).

## The Problem

LangGraph, AutoGen, CrewAI are framework-heavy. Teams that want "just the agent loop, fast, in my runtime" reach for Agno (Python) or Mastra (TypeScript). Both trade some of the framework-owned primitives for raw speed and a tighter fit to the surrounding stack.

## The Concept

### Agno

- Python runtime, formerly Phi-data.
- "No graphs, chains, or convoluted patterns — just pure python."
- Performance targets from their docs: ~2μs agent instantiation, ~3.75 KiB memory per agent, ~23 model providers.
- Production path: stateless session-scoped FastAPI backend. Each request starts a fresh agent; session state lives in a DB.
- Native multimodal (text, image, audio, video, file) and agentic RAG.

The speed targets matter when you have thousands of short-lived agents per second (chat fan-in, evaluation pipelines). They matter less when one agent runs for 10 minutes.

### Mastra

- TypeScript, built on Vercel AI SDK.
- Three primitives: **Agents**, **Tools** (Zod-typed), **Workflows**.
- Unified Model Router — 3,300+ models across 94 providers (March 2026).
- Composite storage: memory, workflows, observability to different backends; ClickHouse recommended for observability at scale.
- Apache 2.0 with `ee/` directories under source-available enterprise license.
- Server adapters for Express, Hono, Fastify, Koa; first-class Next.js and Astro integration.
- Ships Mastra Studio (localhost:4111) for debugging.
- 22k+ GitHub stars, 300k+ weekly npm downloads at 1.0 (Jan 2026).

### Positioning

Neither is trying to be LangGraph. They compete on:

- **Language fit.** Agno for Python-first teams; Mastra for TypeScript-first.
- **Runtime ergonomics.** Agno = near-zero overhead; Mastra = integrated with the Vercel ecosystem.
- **Observability.** Both integrate with Langfuse/Phoenix/Opik (Lesson 24) but Mastra Studio is first-party.

### When to pick each

- **Agno** — Python backend, many short-lived agents, strong perf requirements, FastAPI shop.
- **Mastra** — TypeScript backend, Next.js / Vercel deploy, unified multi-provider model routing, Zod-typed tools.
- **LangGraph** (Lesson 13) — when durable state and explicit graph reasoning matter more than raw speed.
- **OpenAI / Claude Agent SDK** — when you want the provider's productized shape (Lessons 16–17).

### Where this pattern goes wrong

- **Perf-for-perf's-sake.** Picking Agno because "2μs" sounds good when the workload is one slow agent call per request. Overhead is not the bottleneck.
- **Ecosystem lock-in.** Mastra's Vercel-flavored integration is a plus on Vercel, a minus elsewhere.
- **Enterprise license confusion.** Mastra's `ee/` directories are source-available, not Apache 2.0. Read the licenses if you're planning to fork.




## Further Reading

- [Agno Agent Framework docs](https://www.agno.com/agent-framework) — performance targets, FastAPI integration
- [Mastra docs](https://mastra.ai/docs) — primitives, server adapters, Model Router
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — the stateful-graph alternative
- [Comet Opik](https://www.comet.com/site/products/opik/) — observability comparisons cited by Mastra integrations

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify Agno's performance targets and when they matter.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Name Mastra's three primitives — Agents, Tools, Workflows — and the supported server adapters.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Explain why a stateless session-scoped FastAPI backend is the recommended Agno production path.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify Agno's performance targets and when they matter,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Explain why a stateless session-scoped FastAPI backend is the recommended Agno production path,” and cite a repeatable check rather than relying on visual inspection alone.
