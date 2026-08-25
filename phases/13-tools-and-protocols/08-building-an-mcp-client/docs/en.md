# Building an MCP Client — Discovery, Invocation, Session Management

> Most MCP content ships server tutorials and waves a hand at the client. Client code is where the hard orchestration lives: process spawning, capability negotiation, tool list merging across multiple servers, sampling callbacks, reconnection, and namespace collision resolution. This lesson builds a multi-server client that lifts three different MCP servers into one flat tool namespace for the model.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (building an MCP server)
**Time:** ~75 minutes

## Learning Objectives

- Spawn an MCP server as a child process, complete `initialize`, and send a `notifications/initialized`.
- Maintain per-server session state (capabilities, tool list, last-seen notification ids).
- Merge tool lists across multiple servers into one namespace with collision handling.
- Route a tool call to the server that owns it and reassemble the response.

## The Problem

A real agent host (Claude Desktop, Cursor, Goose, Gemini CLI) loads multiple MCP servers at once. A user might have a filesystem server, a Postgres server, and a GitHub server running simultaneously. The client's job:

1. Spawn each server.
2. Handshake each independently.
3. Call `tools/list` on each and flatten the result.
4. When the model emits `notes_search`, look it up in the merged namespace and route to the right server.
5. Handle notifications from any server (`tools/list_changed`) without blocking.
6. Reconnect on transport failure.

Hand-rolling all of that is what separates "toy" from "serviceable". The official SDKs wrap this, but the mental model has to be yours.

## The Concept

### Child-process spawning

`subprocess.Popen` with `stdin=PIPE, stdout=PIPE, stderr=PIPE`. Set `bufsize=1` and use text mode for line-by-line reads. Each server is one process; the client holds one `Popen` handle per server.

### Per-server session state

A `Session` object per server holds:

- `process` — the Popen handle.
- `capabilities` — what the server declared at `initialize`.
- `tools` — the last `tools/list` result.
- `pending` — map of request id to a promise/future waiting for the response.

Requests are async by nature; a `tools/call` sent to server A while server B is mid-call must not block. Either use threads with queues or asyncio.

### Merged namespace

When the client sees the aggregate tool list, names can collide. Two servers might both expose `search`. The client has three options:

1. **Prefix by server name.** `notes/search`, `files/search`. Clear but ugly.
2. **Silent first-come.** Later server's `search` overrides the earlier. Risky; hides collisions.
3. **Collision rejection.** Refuse to load the second server; notify the user. Safest for security-sensitive hosts.

Claude Desktop uses prefix-by-server. Cursor uses collision rejection with a clear error. VS Code MCP adopts prefix-by-server as well.

### Routing

After merging, a dispatch table maps `tool_name -> session`. The model emits a call by name; the client finds the session and writes a `tools/call` message to that server's stdin, then awaits the response.

### Sampling callback

If the server declared the `sampling` capability at `initialize`, it may send `sampling/createMessage` asking the client to run its LLM. The client must:

1. Block further requests to that server until the sample resolves, or pipeline if its implementation supports concurrency.
2. Call its LLM provider.
3. Send the response back to the server.

Lesson 11 covers sampling end-to-end. This lesson stubs it for completeness.

### Notification handling

`notifications/tools/list_changed` means re-call `tools/list`. `notifications/resources/updated` means re-read the resource if it is in use. Notifications must not produce responses — do not try to ack them.

A common client bug: blocking the read loop on `tools/call` while a notification sits in the stream. Use a background reader thread that pushes every message onto a queue; the main thread dequeues and dispatches.

### Reconnection

Transport can fail: server crashed, OS killed the process, stdio pipe broke. The client detects EOF on stdout and treats the session as dead. Options:

- Silently restart the server and re-handshake. OK for pure read-only servers.
- Surface the failure to the user. OK for stateful servers with user-visible sessions.

Phase 13 · 09 covers the Streamable HTTP reconnection semantics; stdio is simpler.

### Keepalive and session id

Streamable HTTP uses a `Mcp-Session-Id` header. Stdio has no session id — the process identity IS the session. Keepalive pings are optional; stdio pipes do not break under inactivity.



## Build It

Reconstruct **Building an MCP Client — Discovery, Invocation, Session Management** by following `server_notes` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `server_notes` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-mcp-client-harness.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Model Context Protocol — Client spec](https://modelcontextprotocol.io/specification/2025-11-25/client) — canonical client behavior
- [MCP — Quickstart client guide](https://modelcontextprotocol.io/quickstart/client) — hello-world client tutorial with the Python SDK
- [MCP Python SDK — client module](https://github.com/modelcontextprotocol/python-sdk) — reference `ClientSession` and `stdio_client`
- [MCP TypeScript SDK — Client](https://github.com/modelcontextprotocol/typescript-sdk) — TS parallel
- [VS Code — MCP in extensions](https://code.visualstudio.com/api/extension-guides/ai/mcp) — how VS Code multiplexes multiple MCP servers in a single editor host

## Exercises

Work from the smallest fixture that the Building an MCP Client — Discovery, Invocation, Session Management demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `server_notes`, `server_files`, `server_github`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Spawn an MCP server as a child process, complete `initialize`, and send a `notifications/initialized`.**.
2. **Perturb one field.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Maintain per-server session state (capabilities, tool list, last-seen notification ids).** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Merge tool lists across multiple servers into one namespace with collision handling.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-mcp-client-harness.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Route a tool call to the server that owns it and reassemble the response.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Building an MCP Client — Discovery, Invocation, Session Management** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `server_notes`, `server_files`, `server_github` traced to the value or shape that supports **Spawn an MCP server as a child process, complete `initialize`, and send a `notifications/initialized`.**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Maintain per-server session state (capabilities, tool list, last-seen notification ids).**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Merge tool lists across multiple servers into one namespace with collision handling.**; and
- an updated `outputs/skill-mcp-client-harness.md` example with a concrete input, expected output field, and acceptance check tied to **Route a tool call to the server that owns it and reassemble the response.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
