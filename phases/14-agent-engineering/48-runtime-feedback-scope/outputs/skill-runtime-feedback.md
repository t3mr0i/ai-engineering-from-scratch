---
name: runtime-feedback
description: Execute scoped argv commands and preserve bounded runtime receipts for the next decision.
version: 1.0.0
phase: 14
lesson: 48
tags: [feedback, scope, subprocess, timeout]
---

For every command-backed agent action:

1. validate POSIX-relative paths against the task scope, rejecting absolute and
   `..`-traversal paths before matching, with forbidden patterns taking priority;
2. invoke an argv list with no shell interpolation;
3. capture return code, stdout, stderr, and timeout status;
4. keep failed receipts available for repair;
5. cap retries and escalate when the evidence remains insufficient.
