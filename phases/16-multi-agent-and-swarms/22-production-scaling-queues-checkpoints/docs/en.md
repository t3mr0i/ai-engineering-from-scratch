# Production Scaling — Queues, Checkpoints, Durability

> Scaling multi-agent systems to thousands of concurrent runs requires **durable execution**. LangGraph's runtime writes a checkpoint after each super-step keyed by `thread_id` (Postgres by default); worker crashes release a lease and another worker resumes. Agents can sleep indefinitely waiting for human input. **MegaAgent** (arXiv:2408.09955) ran a per-agent producer-consumer queue with three states (Idle / Processing / Response) and two-layer coordination (intra-group chat + inter-group admin chat). **Fiber/async** beats thread-per-job for LLM streaming: threads sit idle 99% of the time waiting for tokens, fibers cooperatively yield on I/O. Counterpoint: Ashpreet Bedi's "Scaling Agentic Software" argues for **FastAPI + Postgres + nothing else** until load proves otherwise — simple architectures go further than expected. This lesson builds a durable checkpoint log, a per-agent work queue with state transitions, an async-vs-thread demo, and lands the pragmatic "start simple" rule.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 09 (Parallel Swarm Networks), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Production Scaling — Queues, Checkpoints, Durability
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

A prototype multi-agent system works on one laptop with three agents in an in-memory event loop. You move to production:

- Agents sometimes run for hours (long research, human-in-the-loop waits).
- Worker processes crash. Restarting loses state.
- Peak load is 10x average; you need horizontal scaling.
- Users pay per agent-run; you need exactly-once semantics for charging.

The in-memory event loop does none of these. You need a durable execution layer underneath. The 2026 canonical options are:

1. A workflow engine with checkpoints (Temporal, LangGraph runtime).
2. A message queue with a state store (Postgres + SQS/RabbitMQ).
3. Actor-model frameworks (MegaAgent's producer-consumer per agent).
4. Hand-rolled FastAPI + Postgres (Bedi's argument).

This lesson builds a miniature of each.

## Concept

### Durable execution, the pattern

A durable-execution engine persists the full program state after each "step" (super-step, in LangGraph's language). On crash:

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

Requirements for this to work:

- **Serializable state.** All agent state has to be persistable. Function closures with live database connections do not survive.
- **Deterministic resume.** Given the same state and same inputs, the agent produces the same actions (or defers to an external deterministic oracle for LLM calls).
- **Idempotent side effects.** External calls (tool calls, payments) must be idempotent or use a deduplication key.

LangGraph writes a checkpoint after each super-step; Temporal writes after each activity; Restate uses event-sourced journals. All three implement the same pattern.

### LangGraph's runtime

Each agent has a `thread_id`; state is a typed dict; each super-step writes a row to the checkpoints table. On resume, the runtime replays from the last checkpoint, not from scratch. Agents can `interrupt()` waiting for human input; the runtime persists and releases the worker. When input arrives, any worker can resume.

This is the reference production design in April 2026.

### MegaAgent's per-agent queue

arXiv:2408.09955 describes a scale experiment: thousands of concurrent agents in one cluster. Architecture:

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

The two-layer coordination lets intra-group conversation happen densely while inter-group stays sparse — the pattern used for keeping cost linear in thousands of agents.

### Async vs thread-per-job

LLM calls are I/O-bound. A thread waiting for the next token is idle 99% of the time. Threads cost ~1MB RAM each; at 10,000 concurrent calls, that is 10GB just for stacks.

Fibers (Python `asyncio`, Go goroutines, Rust `tokio`) cooperatively yield on I/O. The same 10,000 calls fit comfortably in process. At LLM-agent scale, async is not an optimization — it is the architecture.

Exception: CPU-bound post-processing (embedding, tokenizer tricks) still wants threads or processes. Separate your I/O layer from your CPU layer.

### Bedi's counterpoint

"Scaling Agentic Software" (Ashpreet Bedi, 2026) argues that most teams over-engineer before they have measured load. The pragmatic default:

- FastAPI + Postgres.
- Each agent run is a row; state updated in-place with optimistic concurrency.
- Background jobs via `pg_notify` or a simple Celery worker.
- Retry policy in application code.

For loads under ~100 concurrent agent-runs on manageable tasks, this is often all you need. Upgrade when you measure it failing.

The rule: adopt durable-execution frameworks when you hit a concrete problem that simple architectures cannot solve. Premature adoption burns time on ceremonies that do not pay off.

### Exactly-once semantics

For paid agent runs, you need "exactly-once effective" (at-least-once delivery + idempotent consumer). The engineering moves:

- **Dedup key per run.** Include it in every side-effect call.
- **Outbox pattern.** Side effects write to a table first, then a separate process executes them. Both steps idempotent.
- **Compensating transactions.** When a side effect succeeds but its tracking write fails, schedule a compensate.

These are database-engineering patterns, not LLM-specific. The LLM tax is only that LLM calls are slow; everything else is standard distributed systems.

### Rainbow deployment

Anthropic's multi-agent research system uses "rainbow deployments": multiple versions of the agent runtime run concurrently so long-running agents do not have to be killed on every code deploy. Canary new versions on a slice of traffic; retire old versions when their agents finish.

This is standard for long-running stateful systems; the 2026 adaptation is that agents can live for hours, so deployment cycles must accommodate.

### The canonical production checklist

- Durable state (checkpoints, snapshots, or outbox + replayable log).
- Idempotent side effects.
- Async I/O layer for LLM calls.
- At-least-once delivery with dedup.
- Rainbow/canary deployment for stateful workloads.
- Observability: per-agent traces, super-step audit, retry counter.




## Build It

Reconstruct **Production Scaling — Queues, Checkpoints, Durability** by following `CheckpointStore` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `CheckpointStore` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-scaling-advisor.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) — LangGraph runtime design
- [MegaAgent](https://arxiv.org/abs/2408.09955) — per-agent producer-consumer queue; two-layer coordination at thousands of concurrent agents
- [Matrix](https://arxiv.org/abs/2511.21686) — decentralized framework with message queues as the coordination substrate
- [Temporal docs](https://docs.temporal.io/) — the reference workflow engine for durable execution
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — production lessons including rainbow deployment

## Exercises

This lab follows `CheckpointStore` and `write` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `CheckpointStore`, `write`, `latest`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind Production Scaling — Queues, Checkpoints, Durability**.
2. **Change the controlled parameter.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-scaling-advisor.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Production Scaling — Queues, Checkpoints, Durability** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `CheckpointStore`, `write`, `latest` traced to the value or shape that supports **Explain the coordination mechanism behind Production Scaling — Queues, Checkpoints, Durability**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-scaling-advisor.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
