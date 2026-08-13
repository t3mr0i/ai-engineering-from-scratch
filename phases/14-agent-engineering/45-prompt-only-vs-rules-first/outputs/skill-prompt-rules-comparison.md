---
name: prompt-rules-comparison
description: Compare an agent attempt against a task contract before trusting its completion claim.
version: 1.0.0
phase: 14
lesson: 45
tags: [scope, acceptance, evidence, review]
---

Use this contract when evaluating an agent on a small repository task:

1. Record the goal, allowed files, and required checks before the run.
2. Capture changed paths and completed checks separately from the agent's prose.
3. Reject any out-of-scope path or missing required check.
4. Keep both the prompt-only baseline and the rules-first verdict as receipts.
5. Repair or escalate a violation; do not silently turn it into success.

The validator is the source of truth. Confidence is context, never evidence.
