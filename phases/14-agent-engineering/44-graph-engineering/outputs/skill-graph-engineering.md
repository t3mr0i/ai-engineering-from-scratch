---
name: graph-engineering
description: Turn a multi-step agent workflow into an explicit graph with typed state, named routing, checkpoints, approval pauses, and safe fan-in semantics.
version: 1.0.0
phase: 14
lesson: 44
tags: [graph, orchestration, routing, state, checkpoint, fan-out, approval]
---

Given an existing agent loop and a task with multiple responsibilities, design
the smallest graph that makes its hidden control flow reviewable.

Produce:

1. `graph.md` containing every node, edge, route label, state field, field owner,
   checkpoint point, approval point, and definition of done.
2. A `GraphState` schema with explicit merge semantics: overwrite, append, sum,
   or reject conflicts for each writable field.
3. Node functions with one responsibility and structured `NodeResult` patches.
4. A finite routing table. Unknown route labels must fail closed.
5. A checkpoint after every node, stdlib JSON save/load validation, and a
   restore/resume path that does not replay already committed side effects.
6. Fan-out/fan-in rules that isolate branch inputs and reject ambiguous scalar
   conflicts.
7. A trace or event record that lets a reviewer reconstruct the path taken.

The JSON checkpoint stores resumable state and next-node position only; it does
not persist or reconstruct historical `TraceEvent` payloads. Persist the trace
separately, for example at `outputs/graph/<run_id>/trace.jsonl`, when the full
path must be audited or replayed.

Hard rejects:

- A graph with implicit default success when a route label is unknown.
- Shared mutable context passed directly between nodes.
- Parallel branches that overwrite each other without a merge policy.
- A human approval node that treats missing approval as approval.
- A diagram that has no matching executable tests or replayable state.

Refusal rules:

- If the task is linear and has no branch, rollback, checkpoint, or approval
  need, keep it as a loop or workflow and explain why.
- If a node has no independent responsibility or acceptance condition, merge it
  with its neighbor before adding another edge.
- If the review queue cannot absorb the graph's output, reduce fan-out or keep
  the loop single-threaded.
- If state ownership or merge semantics are unclear, stop at design review and
  ask for a decision instead of guessing.

Output structure:

```text
Required files:
- docs/graph.md
- tools/graph_runner.py
- schemas/graph_state.schema.json
- outputs/graph/<run_id>/trace.jsonl
- tests/test_graph_runner.py
```

End with “what to read next” pointing to:

- Phase 14 lesson 43 for the bounded loop inside each agent node.
- Phase 14 lesson 38 for deterministic verification gates.
- Phase 14 lesson 40 for handoffs after a graph pauses or stops.
