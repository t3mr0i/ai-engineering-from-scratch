---
name: complete-harness
description: Compose explicit instructions, state, scope, feedback, verification, review, and handoff surfaces.
version: 1.0.0
phase: 14
lesson: 50
tags: [capstone, harness, control-plane, handoff]
---

For a candidate task, emit one report with:

- instructions loaded;
- durable task state and touched files;
- scope violations;
- command feedback receipts;
- every required verification check;
- an independent review verdict;
- a handoff with one next action.

Report `ready` only when every surface passes. A ready report advances to the
next approval gate; it is not an unrestricted production authorization.
