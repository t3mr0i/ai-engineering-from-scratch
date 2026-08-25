# AutoGen v0.4: Actor Model and Agent Framework

> AutoGen v0.4 (Microsoft Research, Jan 2025) redesigned agent orchestration around the actor model. Async message exchange, event-driven agents, fault isolation, natural concurrency. The framework is now in maintenance mode while Microsoft Agent Framework (public preview Oct 2025) becomes the successor.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 minutes

## Learning Objectives

- Describe the actor model: agents as actors, messages as the only IPC, failure isolation per actor.
- Name AutoGen v0.4's three API layers — Core, AgentChat, Extensions — and what each is for.
- Explain why decoupling message delivery from handling gives fault isolation and natural concurrency.
- Implement a stdlib actor runtime in Python and port a two-agent code-review flow onto it.

## The Problem

Most agent frameworks are synchronous: one agent produces, one agent consumes, in a call stack. Failures crash the stack. Concurrency is bolted on. Distribution requires rewriting.

AutoGen v0.4's answer: the actor model. Each agent is an actor with a private inbox. Messages are the only interaction. The runtime decouples delivery from handling. Failures isolate to one actor. Concurrency is native. Distribution is just different transport.

## The Concept

### Actors

An actor has:

- A private state (never directly touched from outside).
- An inbox (message queue).
- A handler: `receive(message) -> effects` where effects can be "reply," "send to other actor," "spawn new actor," "update state," "stop self."

Two actors cannot share memory. They can only send messages.

### Three API layers in AutoGen v0.4

1. **Core.** Low-level actor framework. `AgentRuntime`, `Agent`, `Message`, `Topic`. Async message exchange, event-driven.
2. **AgentChat.** Task-driven high-level API (replacement for v0.2's ConversableAgent). `AssistantAgent`, `UserProxyAgent`, `RoundRobinGroupChat`, `SelectorGroupChat`.
3. **Extensions.** Integrations — OpenAI, Anthropic, Azure, tools, memory.

### Why decoupling matters

In the v0.2 model, calling `agent_a.chat(agent_b)` synchronously blocks agent_a until agent_b returns. In v0.4, `send(agent_b, msg)` puts the message in agent_b's inbox and returns. The runtime delivers later. Three consequences:

- **Fault isolation.** Agent B crashing does not crash Agent A — the runtime catches the failure in B's handler and decides what to do (log, retry, dead-letter).
- **Natural concurrency.** Many messages in flight at once; actors process their inbox concurrently.
- **Distribution-ready.** Inbox + transport is the same abstraction whether the actor is in-process or on another host.

### Topologies

- **RoundRobinGroupChat.** Agents take turns in a fixed rotation.
- **SelectorGroupChat.** A selector agent picks who goes next based on conversation context.
- **Magentic-One.** Reference multi-agent team for web browsing, code execution, file handling. Built on AgentChat.

### Observability

OpenTelemetry support is built in. Every message emits a span; tool calls carry `gen_ai.*` attributes per the 2026 OTel GenAI semantic conventions (Lesson 23).

### Status: maintenance mode

Early 2026: AutoGen v0.7.x is stable for research and prototyping. Microsoft has shifted active development to the Microsoft Agent Framework (public preview Oct 1 2025; 1.0 GA targeted end of Q1 2026). AutoGen patterns port forward cleanly — the actor model is the durable idea.




## Build It

Reconstruct **AutoGen v0.4: Actor Model and Agent Framework** by following `Message` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `Message` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-actor-runtime.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — the redesign post
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — graph-shaped alternative
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — spans AutoGen emits by default

## Exercises

Keep two runs side by side for **AutoGen v0.4: Actor Model and Agent Framework**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using the smallest valid record {"id": 1}. Follow `Message`, `Actor`, `receive`. Expect validation names the missing field or rejects the request; it must not silently accept an incomplete record; capture the first printed shape, metric, status, or summary field and state which part supports **Describe the actor model: agents as actors, messages as the only IPC, failure isolation per actor.**.
2. **Run a two-value comparison.** Repeat the command after changing only the optional field: use the same record with one optional field changed. Predict the direction of the change, then compare the two output values. Explain why **Name AutoGen v0.4's three API layers — Core, AgentChat, Extensions — and what each is for.** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation a record missing the required "id" field. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain why decoupling message delivery from handling gives fault isolation and natural concurrency.** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-actor-runtime.md` and add a worked example using the smallest valid record {"id": 1}. Include the input contract, one expected output field, and a named acceptance check for **Implement a stdlib actor runtime in Python and port a two-agent code-review flow onto it.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **AutoGen v0.4: Actor Model and Agent Framework** should contain:

- the `python3 main.py` output for the smallest valid record {"id": 1}, with `Message`, `Actor`, `receive` traced to the value or shape that supports **Describe the actor model: agents as actors, messages as the only IPC, failure isolation per actor.**;
- a before/after comparison for the optional field, where the same record with one optional field changed changes the observation in the direction predicted by **Name AutoGen v0.4's three API layers — Core, AgentChat, Extensions — and what each is for.**;
- a recorded result for a record missing the required "id" field that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain why decoupling message delivery from handling gives fault isolation and natural concurrency.**; and
- an updated `outputs/skill-actor-runtime.md` example with a concrete input, expected output field, and acceptance check tied to **Implement a stdlib actor runtime in Python and port a two-agent code-review flow onto it.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
