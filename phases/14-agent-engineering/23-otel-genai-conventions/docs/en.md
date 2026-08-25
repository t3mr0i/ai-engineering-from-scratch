# OpenTelemetry GenAI Semantic Conventions

> OpenTelemetry's GenAI SIG (launched April 2024) defines the standard schema for agent telemetry. Span names, attributes, and content-capture rules converge across vendors so agent traces mean the same thing in Datadog, Grafana, Jaeger, and Honeycomb.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 minutes

## Learning Objectives

- Name the GenAI span categories: model/client, agent, tool.
- Distinguish `invoke_agent` CLIENT vs INTERNAL spans and when each applies.
- List the top-level GenAI attributes: provider name, request model, data-source ID.
- Explain the content-capture contract: opt-in, `OTEL_SEMCONV_STABILITY_OPT_IN`, external-reference recommendation.

## The Problem

Every vendor invents their own span names. Ops teams end up building per-framework dashboards. OpenTelemetry's GenAI SIG fixes this by defining one standard the whole ecosystem targets.

## The Concept

### Span categories

1. **Model / client spans.** Cover raw LLM calls. Emitted by provider SDKs (Anthropic, OpenAI, Bedrock) and framework model adapters.
2. **Agent spans.** `create_agent` (when the agent is constructed) and `invoke_agent` (when it runs).
3. **Tool spans.** One per tool invocation; connected to the agent span by parent-child relation.

### Agent span naming

- Span name: `invoke_agent {gen_ai.agent.name}` if named; fallback to `invoke_agent`.
- Span kind:
  - **CLIENT** — for remote agent services (OpenAI Assistants API, Bedrock Agents).
  - **INTERNAL** — for in-process agent frameworks (LangChain, CrewAI, local ReAct).

### Key attributes

- `gen_ai.provider.name` — `anthropic`, `openai`, `aws.bedrock`, `google.vertex`.
- `gen_ai.request.model` — the model ID.
- `gen_ai.response.model` — the resolved model (may differ from request due to routing).
- `gen_ai.agent.name` — agent identifier.
- `gen_ai.operation.name` — `chat`, `completion`, `invoke_agent`, `tool_call`.
- `gen_ai.data_source.id` — for RAG: which corpus or store was consulted.

Technology-specific conventions exist for Anthropic, Azure AI Inference, AWS Bedrock, OpenAI.

### Content capture

The default rule: instrumentations SHOULD NOT capture inputs/outputs by default. Capture is opt-in via:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

Recommended production pattern: store content externally (S3, your log store), record references on spans (pointer IDs, not prose). This is the Lesson 27 content-poisoning defense wired into observability.

### Stability

Most conventions are experimental as of March 2026. Opt in to the stable preview with:

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ maps GenAI attributes natively into its LLM Observability schema. Other backends (Grafana, Honeycomb, Jaeger) support the raw attributes.

### Where this pattern goes wrong

- **Capturing full prompts in spans.** PII, secrets, customer data in traces that ops can read. Store externally.
- **No `gen_ai.provider.name`.** Multi-provider dashboards break when attribution is missing.
- **Spans without parent links.** Orphaned tool spans. Always propagate context.
- **Not setting stability opt-in.** Your attributes may get renamed on backend upgrade.




## Build It

Reconstruct **OpenTelemetry GenAI Semantic Conventions** by following `Span` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `Span` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-otel-genai.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — the spec
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — GenAI spans by default
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — OTel spans built in
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) — W3C trace context propagation

## Exercises

Work from the smallest fixture that the OpenTelemetry GenAI Semantic Conventions demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `Span`, `duration_ms`, `ExternalContentStore`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Name the GenAI span categories: model/client, agent, tool.**.
2. **Perturb one field.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Distinguish `invoke_agent` CLIENT vs INTERNAL spans and when each applies.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **List the top-level GenAI attributes: provider name, request model, data-source ID.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-otel-genai.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Explain the content-capture contract: opt-in, `OTEL_SEMCONV_STABILITY_OPT_IN`, external-reference recommendation.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **OpenTelemetry GenAI Semantic Conventions** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `Span`, `duration_ms`, `ExternalContentStore` traced to the value or shape that supports **Name the GenAI span categories: model/client, agent, tool.**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Distinguish `invoke_agent` CLIENT vs INTERNAL spans and when each applies.**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **List the top-level GenAI attributes: provider name, request model, data-source ID.**; and
- an updated `outputs/skill-otel-genai.md` example with a concrete input, expected output field, and acceptance check tied to **Explain the content-capture contract: opt-in, `OTEL_SEMCONV_STABILITY_OPT_IN`, external-reference recommendation.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
