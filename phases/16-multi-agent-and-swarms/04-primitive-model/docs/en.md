# The Multi-Agent Primitive Model

> Every multi-agent framework shipping in 2026 — AutoGen, LangGraph, CrewAI, OpenAI Agents SDK, Microsoft Agent Framework — is a point in a four-dimensional design space. Four primitives, nothing more: the agent, the handoff, the shared state, the orchestrator. This lesson builds them from zero, runs a toy system on all four, then maps every major framework onto the same axes so you can read any new release in one paragraph.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## Learning Objectives

- Explain the coordination mechanism behind The Multi-Agent Primitive Model
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Every six months a new multi-agent framework ships. AutoGen in 2023. CrewAI in 2024. LangGraph and OpenAI Swarm in 2024. Google ADK in April 2025. Microsoft Agent Framework RC in February 2026. Each press release claims to be "the right abstraction."

If you try to learn them one at a time you will burn out. The APIs look different. The docs disagree about what an "agent" is. One framework calls its shared memory a "blackboard," another calls it a "message pool," a third calls it a "StateGraph." You start suspecting the field is just churning.

It is not. Underneath the marketing, the four primitives are stable. Learn them once, read every new framework in one paragraph.

## Concept

### The four primitives

1. **Agent** — a system prompt plus a tool list. Stateless; every run starts from its system prompt and the current message history.
2. **Handoff** — a structured transfer of control from one agent to another. Mechanically, a tool call that returns a new agent or a graph edge that follows a condition.
3. **Shared state** — any data structure that more than one agent can read (sometimes write). Message pool, blackboard, key-value store, vector memory.
4. **Orchestrator** — whoever decides who speaks next. Options: an explicit graph (deterministic), an LLM speaker-selector (soft), the last speaker's handoff call (OpenAI Swarm), or a scheduler over a queue (swarm architecture).

That is the entire design space. Every framework picks defaults for each axis; the rest is surface syntax.

### How every 2026 framework maps to it

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

Surface differences look huge. Underneath: same four knobs.

### Why this matters

Once you see the primitives, framework comparison becomes a short checklist:

- Does the orchestrator trust the LLM to route (Swarm) or does it pin routing in code (LangGraph)?
- Is shared state full-history (GroupChat) or projected (StateGraph reducer)?
- Can agents modify each other's prompts (CrewAI manager) or only hand off (Swarm)?

Those three questions answer 80% of which framework fits a given problem. You stop shopping for "the best multi-agent framework" and start designing for the axis you actually care about.

### The stateless insight

Every primitive except shared state is stateless. Agent is a function of (prompt, tools). Handoff is a function call. Orchestrator is a scheduler. **The only stateful thing in the system is shared state.** That is where all the interesting bugs live: memory poisoning (Lesson 15), message ordering, versioning, write contention.

Frameworks that hide shared state (Swarm) push the problem to the caller. Frameworks that centralize it (LangGraph checkpoint, AutoGen pool) make it inspectable but shift coordination cost onto the shared-state implementation.

### Anatomy of a single primitive

#### Agent

```
Agent = (system_prompt, tools, model, optional_name)
```

No memory. No state. Two agents with the same system prompt and tools are interchangeable. Everything that looks like per-agent state is actually in shared state or the handoff protocol.

#### Handoff

```
Handoff = (from_agent, to_agent, reason, payload)
```

Three implementations dominate:

- **Function return** — the tool returns the next agent. This is the OpenAI Swarm pattern. Agents carry routing in their tool schemas.
- **Graph edge** — LangGraph. Edges are declarative. The LLM produces a value; a condition selects the next node.
- **Speaker selection** — AutoGen GroupChat. A selector function (sometimes itself an LLM call) reads the pool and picks who speaks next.

#### Shared state

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

At minimum, a list of messages. Often more: structured artifacts (CrewAI Task outputs), typed context (LangGraph reducers), external memory (MCP, vector DB).

Two topologies: **full pool** (every agent sees every message) and **projected** (agents see a role-scoped view). Full pools are simple and scale badly. Projected pools scale but require upfront schema design.

#### Orchestrator

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

Four flavors:

- **Static** — the graph is fixed at build time (LangGraph deterministic, CrewAI Sequential).
- **LLM-selected** — an LLM reads the pool and picks the next speaker (AutoGen, CrewAI Hierarchical).
- **Handoff-driven** — the current agent decides by calling a handoff tool (Swarm).
- **Queue-driven** — workers pull from a shared queue; no explicit next-speaker (swarm architectures, Matrix).

### What changes between frameworks

Once the primitives are fixed, the remaining design decisions are:

- **Memory strategy** — ephemeral vs durable checkpointing (LangGraph checkpointer).
- **Safety boundary** — who can approve a handoff (human-in-the-loop).
- **Cost accounting** — per-agent token budgets.
- **Observability** — tracing handoffs, persisting state for replay.

All implementable on top of the primitives. None of them are new primitives.




## Build It

Reconstruct **The Multi-Agent Primitive Model** by following `SharedState` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `SharedState` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-primitive-mapper.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — the clearest articulation of handoff-driven orchestration
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) — GroupChat + speaker selection is the reference for LLM-selected orchestration
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — graph-edge orchestration and reducer-based shared state
- [CrewAI introduction](https://docs.crewai.com/en/introduction) — role-goal-backstory agents, Sequential / Hierarchical processes
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) — the live AutoGen v0.2 line after Microsoft moved v0.4 into maintenance

## Exercises

This lab follows `SharedState` and `append` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the smallest valid record {"id": 1}. Follow `SharedState`, `append`, `snapshot`. Expect validation names the missing field or rejects the request; it must not silently accept an incomplete record; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind The Multi-Agent Primitive Model**.
2. **Change the controlled parameter.** Repeat the command after changing only the optional field: use the same record with one optional field changed. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation a record missing the required "id" field. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-primitive-mapper.md` and add a worked example using the smallest valid record {"id": 1}. Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **The Multi-Agent Primitive Model** should contain:

- the `python3 main.py` output for the smallest valid record {"id": 1}, with `SharedState`, `append`, `snapshot` traced to the value or shape that supports **Explain the coordination mechanism behind The Multi-Agent Primitive Model**;
- a before/after comparison for the optional field, where the same record with one optional field changed changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for a record missing the required "id" field that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-primitive-mapper.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
