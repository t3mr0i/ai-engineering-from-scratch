# LLM Observability Stack Selection

> The 2026 observability market splits into two categories. Development platforms (LangSmith, Langfuse, Comet Opik) bundle monitoring with evals, prompt management, session replays. Gateway/instrumentation tools (Helicone, SigNoz, OpenLLMetry, Phoenix) focus on telemetry. Langfuse is MIT-licensed core with strong OSS balance (50K events/month free cloud). Phoenix is OpenTelemetry-native under Elastic License 2.0 — excellent for drift/RAG visualization, not a persistent production backend. Arize AX uses zero-copy Iceberg/Parquet integration; the cost angle is real (you own the storage layer), but specific savings multipliers vary by workload. LangSmith leads for LangChain/LangGraph, $39/user/mo, self-host in Enterprise only. Helicone is proxy-based with 15-30 min setup, 100K req/mo free, but less depth on agent traces. Common production pattern: Gateway (Helicone/Portkey) + eval platform (Phoenix/TruLens) glued by OpenTelemetry.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 17 · 08 (Inference Metrics), Phase 14 (Agent Engineering)
**Time:** ~60 minutes

## Learning Objectives

- Distinguish development platforms (bundled: evals + prompts + sessions) from gateway/telemetry tools (traces + metrics only).
- Map six major tools (Langfuse, LangSmith, Phoenix, Arize AX, Helicone, Opik) to their licensing, pricing, and sweet-spot use cases.
- Explain the OpenTelemetry-glue pattern that lets you combine a gateway tool with a separate eval platform.
- Explain why the zero-copy / own-the-storage model (Arize AX) shifts cost away from ingest toward compute; specific multipliers vary by workload.

## The Problem

You shipped an LLM feature. It works. You have no visibility into prompt failures, tool loops, latency regressions, cost spikes, or prompt-cache hit rate. You Google "LLM observability" and get eight tools all claiming they solve the same problem at three different price points.

They don't solve the same problem. LangSmith answers "why did this LangGraph run fail?" Phoenix answers "is my RAG pipeline drifting?" Helicone answers "which app is burning tokens?" Langfuse answers "can I self-host the whole thing?" Different tools, different audiences.

Picking involves four axes: stack (LangChain? raw SDK? multi-vendor?), license tolerance (MIT only? Elastic OK? commercial fine?), budget (free tier? $100/mo? $1000/mo?), and self-host (must? nice-to-have? never?).

## The Concept

### Two categories

**Development platforms** bundle observability with evals, prompt management, dataset versioning, session replay. You run experiments, see which prompt worked, dataset-regression a new prompt against old winners. LangSmith, Langfuse, Comet Opik.

**Gateway/telemetry tools** instrument inference calls — prompt, response, tokens, latency, model, cost. Helicone, SigNoz, OpenLLMetry, Phoenix. Minimalist. Can be combined with a separate eval tool via OpenTelemetry.

### Langfuse — OSS balance

- Core Apache / MIT licensed; self-host via Docker.
- Cloud free tier: 50K events/month. Paid: $29/mo for team.
- Evals, prompt management, traces, datasets. Reasonable coverage of all four dev-platform features.
- Sweet spot: you want LangSmith-class features but must self-host or stay on OSS license.

### Phoenix (Arize) — telemetry-first, OpenTelemetry-native

- Elastic License 2.0; self-host trivial.
- Excellent at RAG and drift visualization. Embedding-space scatter plots shipped as first-class.
- Not designed as persistent production backend — primarily development-time observability.
- Sweet spot: RAG pipeline development, drift debugging, pairs with a separate gateway for production.

### Arize AX — the scale play

- Commercial. Zero-copy data lake integration via Iceberg/Parquet.
- The math: you store traces in your own Parquet on S3; Arize reads directly. Cost shifts from ingest fees to your own S3 + compute bill — favourable at scale, but the multiplier depends on retention, query patterns, and egress.
- Sweet spot: >10M traces/day, existing data lake, want LLM-specific dashboards without Datadog pricing.

### LangSmith — LangChain/LangGraph first

- Commercial, $39/user/month. Self-host only on Enterprise.
- Best-in-class for LangChain and LangGraph stacks. If you are not on either, it is less compelling.
- Sweet spot: team committed to LangChain, willing to pay.

### Helicone — proxy-based minimum viable

- 15-30 minute setup by swapping your `OPENAI_API_BASE` to Helicone proxy.
- MIT licensed; 100K req/mo free, paid $20/mo+.
- Includes failover, caching, rate limits — acts as a gateway too.
- Less depth on agent / multi-step traces.
- Sweet spot: quick start, single-stack app, need gateway + observability in one.

### Opik (Comet) — OSS dev platform

- Apache 2.0, fully OSS.
- Similar feature set to Langfuse with Comet heritage.
- Sweet spot: ML teams already on Comet, want LLM observability in the same pane.

### SigNoz — OpenTelemetry-first full APM

- Apache 2.0. Handles general APM plus LLM via OpenTelemetry.
- Sweet spot: unified observability across services and LLM calls.

### The glue: OpenTelemetry + GenAI semantic conventions

OpenTelemetry published GenAI semantic conventions in late 2025 (`gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`). Tools that consume OTel can interoperate. The production pattern emerging:

1. Emit OTel with GenAI conventions from every LLM call.
2. Route to gateway (Helicone / Portkey) for day-to-day.
3. Dual-ship to eval platform (Phoenix / Langfuse) for regressions.
4. Archive in data lake (Iceberg) for long-term analysis via Arize AX or DuckDB.

### The trap: instrumenting at the wrong layer

Instrumenting inside your agent framework (e.g., adding LangSmith traces) couples you to that framework. Instrumenting at the HTTP/OpenAI-SDK layer (via OpenLLMetry or your gateway) is portable.

### Sampling — you can't keep everything

At >1M requests/day, full-trace retention costs more than the LLM calls. Sample by rules: 100% errors, 100% high-cost, 5% success. Keep aggregates always; keep raw for the long tail.

### Numbers you should remember

- Langfuse free cloud: 50K events/month.
- LangSmith: $39/user/month.
- Helicone free: 100K req/month.
- Arize AX: zero-copy / own-the-storage model; size the multiplier against your actual retention and query patterns.
- OpenTelemetry GenAI conventions: 2025 shipping, 2026 widely adopted.



## Build It

Reconstruct **LLM Observability Stack Selection** by following `ARIZE_AX_PER_GB` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `ARIZE_AX_PER_GB` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-observability-stack.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [SigNoz — Top LLM Observability Tools 2026](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — Setting Up Langfuse, LangSmith, Helicone, Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)

## Exercises

This lab follows `ARIZE_AX_PER_GB` and `Strategy` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `ARIZE_AX_PER_GB`, `Strategy`, `simulate_day`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Distinguish development platforms (bundled: evals + prompts + sessions) from gateway/telemetry tools (traces + metrics only).**.
2. **Change the controlled parameter.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Map six major tools (Langfuse, LangSmith, Phoenix, Arize AX, Helicone, Opik) to their licensing, pricing, and sweet-spot use cases.** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain the OpenTelemetry-glue pattern that lets you combine a gateway tool with a separate eval platform.** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-observability-stack.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Explain why the zero-copy / own-the-storage model (Arize AX) shifts cost away from ingest toward compute; specific multipliers vary by workload.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **LLM Observability Stack Selection** should contain:

- the `python3 main.py` output for the text "red fox", with `ARIZE_AX_PER_GB`, `Strategy`, `simulate_day` traced to the value or shape that supports **Distinguish development platforms (bundled: evals + prompts + sessions) from gateway/telemetry tools (traces + metrics only).**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Map six major tools (Langfuse, LangSmith, Phoenix, Arize AX, Helicone, Opik) to their licensing, pricing, and sweet-spot use cases.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain the OpenTelemetry-glue pattern that lets you combine a gateway tool with a separate eval platform.**; and
- an updated `outputs/skill-observability-stack.md` example with a concrete input, expected output field, and acceptance check tied to **Explain why the zero-copy / own-the-storage model (Arize AX) shifts cost away from ingest toward compute; specific multipliers vary by workload.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
