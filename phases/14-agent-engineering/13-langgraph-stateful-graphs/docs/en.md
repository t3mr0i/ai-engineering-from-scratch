# LangGraph: Stateful Graphs and Durable Execution

> LangGraph is the 2026 reference for low-level stateful orchestration. Agent is a state machine; nodes are functions; edges are transitions; state is immutable and checkpointed after every step. Resume from any failure exactly where it left off.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 minutes

## Learning Objectives

- Describe LangGraph's core model: state machine with immutable state, function nodes, conditional edges, and post-step checkpoints.
- Name the four capabilities the docs highlight: durable execution, streaming, human-in-the-loop, comprehensive memory.
- Explain the three orchestration topologies LangGraph supports: supervisor, peer-to-peer (swarm), hierarchical (nested subgraphs).
- Implement a stdlib state graph with immutable state, conditional edges, and a checkpoint/resume cycle.

## The Problem

Agents and workflows share a problem: when a 40-step run fails at step 38, you want to resume from step 38, not start over. Second-class state models leave operators hacking retries around a library that assumes fresh runs.

LangGraph's design answer: state is a first-class typed object, mutations are explicit, and checkpoints persist after every node. Resume means re-invoking the graph with the same `thread_id` in its config; the checkpointer loads the last snapshot for that thread and `graph.get_state(config)` reads it back.

## The Concept

### The graph

A graph is defined by:

- **State type.** A typed dict (or Pydantic model) that every node reads and mutates.
- **Nodes.** Pure functions `(state) -> state_update`. Updates are merged into state after return.
- **Edges.** Conditional or direct transitions between nodes.
- **Entry and exit.** `START` and `END` sentinel nodes mark the boundary.

Example: an agent with `classify`, `refund`, `bug`, `sales`, `done` nodes — a routing workflow as a graph.

### Durable execution

After each node returns, the runtime serializes the state and writes it to a checkpointer (SQLite, Postgres, Redis, custom). On failure at step N, invoking the graph again with the same `thread_id` picks up from step N+1 with exact state.

The LangGraph docs explicitly highlight production users where this matters: Klarna, Uber, J.P. Morgan. The claim isn't the graph shape; it's that the graph shape plus checkpointing makes recovery cheap.

### Streaming

Every node can yield partial output. The graph streams per-node-delta events to the caller so UIs update as the graph runs.

### Human-in-the-loop

Inspect and modify state between nodes. Implementations: pause before a critical node, surface state to a human, accept modifications, resume. The checkpointer makes this easy because state is already serialized.

### Memory

Short-term (within a run — conversation history in state) and long-term (across runs — persistent via the checkpointer plus a separate long-term store). LangGraph integrates with external memory systems (Mem0, custom) via tools.

### Three topologies

1. **Supervisor.** Central router LLM dispatches to specialist subagents. `create_supervisor()` in `langgraph-supervisor` (though the LangChain team in 2026 recommends doing this through tool calls directly for more context control).
2. **Swarm / peer-to-peer.** Agents hand off directly via a shared tool surface. No central router.
3. **Hierarchical.** Supervisors managing sub-supervisors, implemented as nested subgraphs.

### Where this pattern goes wrong

- **Checkpoints too small.** Only checkpointing conversation turns leaves tool state and memory writes unrecoverable. Full state must serialize.
- **Non-deterministic nodes.** Resume assumes node inputs produce the same state update. Random seeds, wall-clock, external APIs must be captured.
- **Over-use of conditional edges.** A graph with every edge conditional is a state machine that cannot be reasoned about. Prefer linear chains with occasional branches.




## Further Reading

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — the reference docs
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) — supervisor pattern API
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — actor-model alternative
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — session store and subagents
