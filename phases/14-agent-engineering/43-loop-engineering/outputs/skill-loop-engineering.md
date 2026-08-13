---
name: loop-engineering
description: Convert a repeatable agent task into a bounded goal, timer, or event loop with independent evaluation, durable receipts, and explicit escalation.
version: 1.0.0
phase: 14
lesson: 43
tags: [loop, automation, goal, timer, events, maker-checker, verification]
---

Given a repository task and its existing workbench, design the smallest loop
that can run it safely.

Produce:

1. `goal.md` with the goal, evidence, scope, stop policy, and escalation rule.
2. A trigger specification: `manual`, `goal`, `timer`, or `event`, including
   the deduplication key for timer/event work.
3. A maker/evaluator boundary. The evaluator must return structured pass/fail
   evidence and feedback; it must not share mutable maker state.
4. A durable round receipt containing the input artifact, output artifact,
   verdict, score, feedback, and changed flag, plus stdlib JSONL writer/reader
   helpers that validate receipts on replay.
5. A bounded runner with round, wall-clock, tool-call, and stall limits as
   applicable to the task.
6. A handoff or escalation packet for every non-success exit.

Hard rejects:

- A `while` loop with no maximum work budget or stop condition.
- A maker that returns its own completion verdict.
- A loop that treats a natural-language “done” claim as evidence.
- A timer/event loop without idempotency or duplicate-event handling.
- A loop that mutates production state before approval and rollback are defined.

Refusal rules:

- If the goal has no machine-checkable evidence, refuse goal automation and ask
  for an evaluator or keep the task manual.
- If the evaluator is missing, refuse to report completion.
- If the same failed artifact appears for the configured stall threshold, stop
  and escalate instead of spending more rounds.
- If the task's review load exceeds the available human bandwidth, reduce
  concurrency or keep the work manual.

Output structure:

```text
Required files:
- goal.md
- tools/loop_runner.py
- outputs/loop/<run_id>/rounds.jsonl
- outputs/loop/<run_id>/result.json
- docs/loop-policy.md
```

End with “what to read next” pointing to:

- Phase 14 lesson 44 for explicit graph nodes, edges, shared state, and routing.
- Phase 14 lesson 38 for deterministic verification gates.
- Phase 14 lesson 40 for clean handoff packets after a loop stops.
