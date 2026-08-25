# Handoffs and Routines — Stateless Orchestration

> OpenAI's Swarm (October 2024) distilled multi-agent orchestration to two primitives: **routines** (instructions + tools as a system prompt) and **handoffs** (a tool that returns another Agent). No state machine, no branching DSL — the LLM routes by calling the right handoff tool. The OpenAI Agents SDK (March 2025) is the production successor. Swarm itself remains the cleanest conceptual reference — its entire source fits in a few hundred lines. The pattern is viral because the API surface is roughly "agent = prompt + tools; handoff = function returning agent." Limitation: stateless, so memory is the caller's problem.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## Learning Objectives

- Explain the coordination mechanism behind Handoffs and Routines — Stateless Orchestration
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Every multi-agent framework wants you to learn its DSL: LangGraph nodes and edges, CrewAI crews and tasks, AutoGen GroupChat and managers. The DSLs are real abstractions, but they make the thing feel heavier than it needs to be.

Swarm pushes in the opposite direction: use the tool-calling capability the model already has. Handoffs become tool calls. The orchestrator is whichever agent currently holds the conversation. The state machine is implicit in the agents' system prompts.

## Concept

### Two primitives

**Routine.** A system prompt that defines an agent's role and available tools. Think of it like a scoped set of instructions: "you are a triage agent; if the user asks about refunds, hand off to the refund agent."

**Handoff.** A tool the agent can call that returns a new Agent object. The Swarm runtime detects the Agent return value and switches the active agent for the next turn.

That is the entire abstraction.

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

The triage agent's system prompt makes it choose the right handoff based on the user message. The LLM's tool-calling does the routing.

### Why it is viral

- **Small API.** Two concepts to learn.
- **Uses what the model already does.** Tool calling is already production-grade across providers.
- **No state-machine burden.** You do not describe the graph; the agents' prompts describe who they hand off to.

### The stateless trade

Swarm is explicitly stateless between runs. The framework keeps a message history during a run, but it does not persist anything. Memory, continuity, long-running tasks — all the caller's problem.

In production (OpenAI Agents SDK, March 2025) this was one of the main things that changed: the SDK adds built-in session management, guardrails, and tracing while keeping the handoff primitive.

### When Swarm/handoffs fit

- **Triage patterns.** Front-line agent routes user to a specialist.
- **Skill-based handoffs.** "If the task needs code, call the coder; if it needs research, call the researcher."
- **Short, bounded conversations.** Customer support, FAQ-to-ticket, simple workflows.

### When Swarm struggles

- **Long sessions with shared memory.** Handoffs reset the conversation state to the new agent's prompt plus history. No persistent state across agents without caller-managed memory.
- **Parallel execution.** Handoff is one-at-a-time — the active agent switches. Parallelism requires the caller orchestrating multiple Swarm runs.
- **Audit and replay.** Stateless runs are hard to replay exactly; the LLM's handoff choice is not deterministic.

### OpenAI Agents SDK (March 2025)

The production successor adds:

- **Session state.** Persistent thread across runs.
- **Guardrails.** Input/output validation hooks.
- **Tracing.** Every tool call and handoff is logged.
- **Handoff filters.** Control what context transfers on handoff.

The handoff primitive survives; production ergonomics get added around it.

### Swarm vs GroupChat

Both use LLM-driven routing, but they differ on **who picks next**:

- GroupChat: a selector (function or LLM) picks the next speaker from outside.
- Swarm: the current agent picks its successor by calling a handoff tool.

Swarm is "agent decides what's next"; GroupChat is "manager decides what's next." Swarm's decision lives in the active agent's tool call; GroupChat's lives in the `GroupChatManager`.




## Build It

Reconstruct **Handoffs and Routines — Stateless Orchestration** by following `returning` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `returning` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-handoff-designer.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — the reference articulation
- [OpenAI Swarm repo](https://github.com/openai/swarm) — original implementation, kept as conceptual reference
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — production successor with sessions and tracing
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) — how Claude Code subagents use a handoff-like pattern via `Task`

## Exercises

Use `returning` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `returning`, `Agent`, `Msg`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind Handoffs and Routines — Stateless Orchestration**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-handoff-designer.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Handoffs and Routines — Stateless Orchestration** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `returning`, `Agent`, `Msg` traced to the value or shape that supports **Explain the coordination mechanism behind Handoffs and Routines — Stateless Orchestration**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-handoff-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
