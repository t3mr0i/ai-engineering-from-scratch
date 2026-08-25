# Async Tasks (SEP-1686) — Call-Now, Fetch-Later for Long-Running Work

> Real agent work takes minutes to hours: CI runs, deep-research synthesis, batch exports. Synchronous tool calls drop connections, time out, or block the UI. SEP-1686, merged in 2025-11-25, adds a Tasks primitive: any request can be augmented to become a task, and the result can be fetched later or streamed via state notifications. Drift-risk note: Tasks are experimental through H1 2026; SDK surface is still being designed around the spec.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 09 (transports)
**Time:** ~75 minutes

## Learning Objectives

- Identify when to promote a tool from synchronous to task-augmented (>30 seconds of server-side work).
- Walk the task lifecycle: `working` → `input_required` → `completed` / `failed` / `cancelled`.
- Persist task state so crashes do not lose in-flight work.
- Poll `tasks/get` and fetch `tasks/result` correctly.

## The Problem

A `generate_report` tool runs a multi-minute extraction pipeline. Options under the synchronous model:

1. Hold the connection open for three minutes. Remote transports drop it; clients time out; UIs freeze.
2. Return immediately with a placeholder; require the client to poll a custom endpoint. Breaks the MCP uniformity.
3. Fire-and-forget; no result.

None are good. SEP-1686 adds a fourth: task augmentation. Any request (typically `tools/call`) can be tagged as a task. The server returns a task id immediately. The client polls `tasks/get` and fetches `tasks/result` when done. Server-side state survives restarts.

## The Concept

### Task augmentation

A request becomes a task by setting `params._meta.task.required: true` (or `optional: true`, server decides). The server responds immediately with:

```json
{
  "jsonrpc": "2.0", "id": 1,
  "result": {
    "_meta": {
      "task": {
        "id": "tsk_9f7b...",
        "state": "working",
        "ttl": 900000
      }
    }
  }
}
```

`ttl` is the server's promise to retain state; after ttl the task result is discarded.

### Per-tool opt-in

Tool annotations can declare task support:

- `taskSupport: "forbidden"` — this tool always runs synchronously. Safe for fast tools.
- `taskSupport: "optional"` — client may request task-augmentation.
- `taskSupport: "required"` — client MUST use task augmentation.

A `generate_report` tool would be `required`. A `notes_search` tool would be `forbidden`.

### States

```
working  -> input_required -> working  (loop via elicitation)
working  -> completed
working  -> failed
working  -> cancelled
```

State machine is append-only: once `completed`, `failed`, or `cancelled`, the task is terminal.

### Methods

- `tasks/get {taskId}` — returns current state and a progress hint.
- `tasks/result {taskId}` — blocks or returns 404 if not yet done.
- `tasks/cancel {taskId}` — idempotent; terminal states ignore.
- `tasks/list` — optional; enumerates active and recently-completed tasks.

### Streaming state changes

When the server supports it, the client can subscribe to state notifications:

```
server -> notifications/tasks/updated {taskId, state, progress?}
```

Clients that stream rather than poll get better UX. Polling is always supported as the minimal surface.

### Durable state

The spec requires servers that declare task support to persist state. A crash should not lose completed results within ttl. Stores range from SQLite to Redis to the filesystem. The Lesson 13 harness uses the filesystem.

### Cancellation semantics

`tasks/cancel` is idempotent. If the task is mid-execution, the server attempts to stop (check executor-cooperative cancellation). If already terminal, the request is a no-op.

### Crash recovery

When the server process restarts:

1. Load all persisted task states.
2. Mark any `working` tasks whose process died as `failed` with error `CRASH_RECOVERY`.
3. Preserve `completed` / `failed` / `cancelled` for their ttl.

### Async tasks plus sampling

A task can itself call `sampling/createMessage`. This is how long-running research tasks work: the server's task thread samples the client's model as needed, while the client's UI shows the task as `working` with periodic progress updates.

### Why this is experimental

SEP-1686 shipped in 2025-11-25 but the broader roadmap calls out three open issues: durable subscription primitives, subtasks (parent-child task relationships), and result-TTL standardization. Expect the spec to evolve through 2026. Production code should treat Tasks as stable only for the common case and guard against future SDK changes for subtasks.



## Build It

Reconstruct **Async Tasks (SEP-1686) — Call-Now, Fetch-Later for Long-Running Work** by following `Task` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `Task` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-task-store-designer.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [MCP — GitHub SEP-1686 issue](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1686) — the originating proposal and full discussion
- [WorkOS — MCP async tasks for AI agent workflows](https://workos.com/blog/mcp-async-tasks-ai-agent-workflows) — design walkthrough with rationale
- [DeepWiki — MCP task system and async operations](https://deepwiki.com/modelcontextprotocol/modelcontextprotocol/2.7-task-system-and-async-operations) — mechanics and state machine
- [FastMCP — Tasks](https://gofastmcp.com/servers/tasks) — SDK-level task implementation patterns
- [MCP blog — 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — open issues and 2026 priorities including subtasks

## Exercises

Use `Task` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `Task`, `persist`, `load`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Identify when to promote a tool from synchronous to task-augmented (>30 seconds of server-side work).**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Walk the task lifecycle: `working` → `input_required` → `completed` / `failed` / `cancelled`.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Persist task state so crashes do not lose in-flight work.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-task-store-designer.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Poll `tasks/get` and fetch `tasks/result` correctly.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Async Tasks (SEP-1686) — Call-Now, Fetch-Later for Long-Running Work** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `Task`, `persist`, `load` traced to the value or shape that supports **Identify when to promote a tool from synchronous to task-augmented (>30 seconds of server-side work).**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Walk the task lifecycle: `working` → `input_required` → `completed` / `failed` / `cancelled`.**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Persist task state so crashes do not lose in-flight work.**; and
- an updated `outputs/skill-task-store-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Poll `tasks/get` and fetch `tasks/result` correctly.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
