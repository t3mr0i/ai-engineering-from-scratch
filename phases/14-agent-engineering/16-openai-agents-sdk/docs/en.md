# OpenAI Agents SDK: Handoffs, Guardrails, Tracing

> OpenAI Agents SDK is the lightweight multi-agent framework built on the Responses API. Five primitives: Agent, Handoff, Guardrail, Session, Tracing. Handoffs are tools named `transfer_to_<agent>`. Guardrails trip on input or output. Tracing is on by default.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Learning Objectives

- Name the five primitives of the OpenAI Agents SDK.
- Explain handoffs: why they are modeled as tools, what name shape the model sees, and how context transfers.
- Distinguish input guardrails, output guardrails, and tool guardrails; explain `run_in_parallel` vs blocking mode.
- Implement a stdlib runtime with handoffs + guardrails + span-style tracing.

## The Problem

Agents that cannot delegate cleanly end up stuffing everything into one prompt. Agents without guardrails ship PII, policy-violating output, or loop forever. OpenAI's SDK codifies the three primitives that make multi-agent work tractable.

## The Concept

### Five primitives

1. **Agent.** LLM + instructions + tools + handoffs.
2. **Handoff.** Delegation to another agent. Represented to the model as a tool named `transfer_to_<agent_name>`.
3. **Guardrail.** Validation on input (first agent only), output (last agent only), or tool invocation (per function tool).
4. **Session.** Automatic conversation history across turns.
5. **Tracing.** Built-in spans for LLM generations, tool calls, handoffs, guardrails.

### Handoffs as tools

The model sees `transfer_to_billing_agent` in its tool list. Calling it signals the runtime to:

1. Copy the conversation context (or collapse it via `nest_handoff_history` beta).
2. Initialize the target agent with its instructions.
3. Continue the run with the target agent.

This is the supervisor pattern (Lesson 13 / Lesson 28) productized.

### Guardrails

Three flavors:

- **Input guardrails.** Run on the first agent's input. Reject unsafe or out-of-scope requests before any LLM call.
- **Output guardrails.** Run on the last agent's output. Catch PII leaks, policy violations, malformed responses.
- **Tool guardrails.** Run per-function-tool. Validate arguments, check permissions, audit execution.

Mode:

- **Parallel** (default). Guardrail LLM runs alongside the main LLM. Lower tail latency. If tripped, the main LLM's work is discarded (token waste).
- **Blocking** (`run_in_parallel=False`). Guardrail LLM runs first. If tripped, no tokens wasted on the main call.

Tripwires raise `InputGuardrailTripwireTriggered` / `OutputGuardrailTripwireTriggered`.

### Tracing

On by default. Every LLM generation, tool call, handoff, and guardrail emits a span. `OPENAI_AGENTS_DISABLE_TRACING=1` opts out. `add_trace_processor(processor)` fans spans to your own backend alongside OpenAI's.

### Sessions

`Session` stores conversation history in a backend (SQLite, Redis, custom). `Runner.run(agent, input, session=session)` auto-loads and appends.

### Where this pattern goes wrong

- **Handoff drift.** Agent A hands off to Agent B which hands back to Agent A. Add a hop counter.
- **Guardrail bypass.** Tool guardrails only fire on function tools; built-in tools (file reader, web fetch) need separate policy.
- **Over-tracing.** Sensitive content in spans. Pair with OTel GenAI content-capture rules (Lesson 23) — store externally, reference by ID.




## Further Reading

- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — primitives, handoffs, guardrails, tracing
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — Claude-flavored counterpart
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — when to reach for handoffs at all
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — the standard Agents SDK spans map to
