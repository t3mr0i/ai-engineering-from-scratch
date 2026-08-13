---
name: workflow-graph
description: Model agent coordination as explicit nodes, labeled edges, shared state, checkpoints, and merge rules.
version: 1.0.0
phase: 14
lesson: 52
tags: [graph, routing, checkpoint, approval, fan-in]
---

Before adding graph nodes:

1. list each node's input, output patch, and definition of done;
2. enumerate success, failure, retry, rollback, and approval edges;
3. validate routes before committing state or trace;
4. checkpoint after every committed node;
5. define append, overwrite, and conflict semantics for fan-in;
6. pause when approval is absent instead of assuming consent, and consume each
   decision at the approval node so a rejection routes to repair exactly once.
