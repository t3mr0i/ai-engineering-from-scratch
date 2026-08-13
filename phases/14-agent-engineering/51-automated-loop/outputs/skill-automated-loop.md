---
name: automated-loop
description: Turn a scoped task into a bounded trigger-driven maker/evaluator loop with receipts.
version: 1.0.0
phase: 14
lesson: 51
tags: [loop, trigger, evaluator, budgets]
---

Define the goal, trigger, maker, evaluator, feedback channel, intervention
handler, and stop policy. Record each round's input, output, verdict, feedback,
change flag, and any intervention request/answer. Enforce a hard intervention
budget and stop on pass, round budget, stalled failure, or budget exhaustion.
Compare the recorded intervention count and evidence quality with a manual
baseline before increasing autonomy.
