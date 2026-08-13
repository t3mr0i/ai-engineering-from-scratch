---
name: session-handoff
description: Persist and validate a compact task state so another session can continue safely.
version: 1.0.0
phase: 14
lesson: 47
tags: [state, handoff, continuity, persistence]
---

At every session boundary:

1. validate a versioned state object;
2. record completed steps, touched files, blockers, and one next action;
3. write through a temporary file and atomic replace;
4. emit commands, risks, and the task id in a handoff packet;
5. make the next session load and validate before it acts.

The repository state is the continuity mechanism; chat is supporting evidence.
