# MCP Resources and Prompts — Context Exposure Beyond Tools

> Tools get 90 percent of MCP attention. The other two server primitives solve different problems. Resources expose data for reading; prompts expose reusable templates as slash-commands. Many servers should use resources instead of wrapping reads in tools, and prompts instead of hard-coding workflows in client prompts. This lesson names the decision rule and walks the `resources/*` and `prompts/*` messages.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server)
**Time:** ~45 minutes

## Learning Objectives

- Decide between exposing a capability as a tool, a resource, or a prompt for a given domain.
- Implement `resources/list`, `resources/read`, `resources/subscribe` and handle `notifications/resources/updated`.
- Implement `prompts/list` and `prompts/get` with argument templates.
- Recognize when the host surfaces prompts as slash-commands vs auto-injected context.

## The Problem

A naive MCP server for a notes app exposes everything as tools: `notes_read`, `notes_list`, `notes_search`. This wraps every data access in a model-driven tool call. Consequences:

- The model has to decide whether to call `notes_read` for every query that might benefit from context.
- Read-only content cannot be subscribed to or streamed to the host's side panel.
- Client UIs (Claude Desktop's resource attachment panel, Cursor's "Include file" picker) cannot surface the data.

The right split: expose data as a resource, expose mutating or computed actions as tools, expose reusable multi-step workflows as prompts. Each primitive has its UX affordance and its access pattern.

## The Concept

### Tools vs resources vs prompts — the decision rule

| Capability | Primitive |
|------------|-----------|
| User wants to search, filter, or transform data | tool |
| User wants the host to include this data as context | resource |
| User wants a templated workflow they can re-run | prompt |

Guideline: if the model would benefit from calling it on every related query, it is a tool. If the user would benefit from attaching it to a conversation, it is a resource. If a whole multi-step workflow is the unit the user wants to re-use, it is a prompt.

### Resources

`resources/list` returns `{resources: [{uri, name, mimeType, description?}]}`. `resources/read` takes `{uri}` and returns `{contents: [{uri, mimeType, text | blob}]}`.

URIs can be anything addressable:

- `file:///Users/alice/notes/mcp.md`
- `postgres://my-db/query/SELECT ...`
- `notes://note-14` (custom scheme)
- `memory://session-2026-04-22/recent` (server-specific)

`contents[]` supports both text and binary. Binary uses `blob` as a base64-encoded string plus a `mimeType`.

### Resource subscriptions

Declare `{resources: {subscribe: true}}` in capabilities. Client calls `resources/subscribe {uri}`. Server sends `notifications/resources/updated {uri}` when the resource changes. Client re-reads.

Use case: a notes server whose resources are files on disk; a file watcher triggers update notifications; Claude Desktop re-pulls the file into context when edited outside the host.

### Resource templates (2025-11-25 addition)

`resourceTemplates` let you expose a parameterized URI pattern: `notes://{id}` with `id` as a completion target. The client can autocomplete ids in the resource picker.

### Prompts

`prompts/list` returns `{prompts: [{name, description, arguments?}]}`. `prompts/get` takes `{name, arguments}` and returns `{description, messages: [{role, content}]}`.

A prompt is a template that fills to a list of messages the host feeds its model. `PromptMessage.role` is `user` or `assistant` only — there is no `system` role in `prompts/get` responses. For example, a `code_review` prompt takes a `file_path` argument and returns a two-message sequence: a user message with the file body, and an assistant kickoff with a reasoning template.

### Hosts and prompts

Claude Desktop, VS Code, and Cursor expose prompts as slash-commands in the chat UI. The user types `/code_review` and picks arguments from a form. The server's prompt is the contract between "user shortcut" and "full prompt sent to model".

Not every client supports prompts yet — check capability negotiation. A server with prompt capability declared but a client without prompt support simply will not see the slash commands.

### The "list changed" notification

Both resources and prompts emit their own "list changed" notification when their set mutates — `notifications/resources/list_changed` and `notifications/prompts/list_changed` respectively, not a single shared method name. A notes server that just imported 20 new notes emits `notifications/resources/list_changed`; the client re-calls `resources/list` to pick up the additions.

### Content type conventions

For text: `mimeType: "text/plain"`, `text/markdown`, `application/json`.
For binary: `image/png`, `application/pdf`, plus the `blob` field.
For MCP Apps (Lesson 14): `text/html;profile=mcp-app` in a `ui://` URI.

### Dynamic resources

A resource URI does not have to correspond to a static file. `notes://recent` can return the latest five notes on every read. `db://query/users/active` can execute a parameterized query. The server is free to compute content dynamically.

Rule: if the client can cache by URI, the URI must be stable. If computation is one-shot, the URI should include a timestamp or nonce so the client cache does not stale out.

### Subscriptions vs polling

Subscription-capable clients get server push via `notifications/resources/updated`. Pre-subscription clients or hosts that do not support it poll by re-reading. Both are spec-compliant. The server's capability declaration tells the client which it supports.

Cost of subscriptions: per-session state on the server (who is subscribed to what). Keep the subscribed set bounded; disconnected clients should time out.

### Prompts vs system prompts

Prompts in MCP are not system prompts. The host's system prompt (its own operating instructions) and MCP prompts (server-supplied templates invoked by user) live side by side. A well-behaved client never lets a server prompt override its own system prompt; it layers them.



## Build It

Reconstruct **MCP Resources and Prompts — Context Exposure Beyond Tools** by following `emit_notification` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `emit_notification` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-primitive-splitter.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [MCP — Concepts: Resources](https://modelcontextprotocol.io/docs/concepts/resources) — resource URIs, subscriptions, and templates
- [MCP — Concepts: Prompts](https://modelcontextprotocol.io/docs/concepts/prompts) — prompt templates and slash-command integration
- [MCP — Server resources spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) — full `resources/*` message reference
- [MCP — Server prompts spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/prompts) — full `prompts/*` message reference
- [MCP — Protocol info site: resources](https://modelcontextprotocol.info/docs/concepts/resources/) — community guide expanding on the official docs

## Exercises

This lab follows `emit_notification` and `update_note` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `emit_notification`, `update_note`, `handle_resources_list`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Decide between exposing a capability as a tool, a resource, or a prompt for a given domain.**.
2. **Change the controlled parameter.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Implement `resources/list`, `resources/read`, `resources/subscribe` and handle `notifications/resources/updated`.** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Implement `prompts/list` and `prompts/get` with argument templates.** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-primitive-splitter.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Recognize when the host surfaces prompts as slash-commands vs auto-injected context.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **MCP Resources and Prompts — Context Exposure Beyond Tools** should contain:

- the `python3 main.py` output for the text "red fox", with `emit_notification`, `update_note`, `handle_resources_list` traced to the value or shape that supports **Decide between exposing a capability as a tool, a resource, or a prompt for a given domain.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Implement `resources/list`, `resources/read`, `resources/subscribe` and handle `notifications/resources/updated`.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Implement `prompts/list` and `prompts/get` with argument templates.**; and
- an updated `outputs/skill-primitive-splitter.md` example with a concrete input, expected output field, and acceptance check tied to **Recognize when the host surfaces prompts as slash-commands vs auto-injected context.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
