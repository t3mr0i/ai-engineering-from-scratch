# Roots and Elicitation — Scoping and Mid-Flight User Input

> Hard-coded paths break the moment a user opens a different project. Pre-filled tool arguments break when the user under-specifies. Roots scope the server to a user-controlled set of URIs; elicitation pauses mid-tool-call to ask the user for structured input via a form or URL. Two client primitives, two fixes for common MCP failure modes. SEP-1036 (URL-mode elicitation, 2025-11-25) is experimental through H1 2026 — check SDK versions before depending on it.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server)
**Time:** ~45 minutes

## Learning Objectives

- Declare `roots` and respond to `notifications/roots/list_changed`.
- Restrict server file operations to URIs inside the declared root set.
- Use `elicitation/create` to ask the user for a confirmation or structured input mid-tool-call.
- Choose between form-mode and URL-mode elicitation (the latter is experimental; drift-risk noted).

## The Problem

Two concrete failures a notes MCP server hits in production.

**Broken path assumption.** The server is written against `~/notes`. A user on a different machine with notes in `~/Documents/Notes` gets a tool call that fails silently (no file found) or worse, wrote to the wrong place.

**Missing argument the user would know.** The user asks "delete the old TPS report note". The model calls `notes_delete(title: "TPS report")` but there are three matching notes from 2023, 2024, and 2025. The tool cannot guess. Failing with "ambiguous" is annoying; running on all three is catastrophic.

Roots fix the first: the client declares at `initialize` the set of URIs the server may touch. Elicitation fixes the second: the server pauses the tool call and sends `elicitation/create` to ask the user to pick which one.

## The Concept

### Roots

The client declares a root list at `initialize`:

```json
{
  "capabilities": {"roots": {"listChanged": true}}
}
```

Server can then call `roots/list`:

```json
{"roots": [{"uri": "file:///Users/alice/Documents/Notes", "name": "Notes"}]}
```

Servers MUST treat roots as the boundary: any file read or write outside the root set is rejected. This is not enforced by the client (the server is still code the user trusted), but spec-compliant servers honor it.

When the user adds or removes a root, the client sends `notifications/roots/list_changed`. The server re-calls `roots/list` and updates its boundary.

**Roots is deprecated as of protocol version 2026-07-28 (SEP-2577).** It stays in the spec for at least twelve months after that revision before it becomes eligible for removal, so the mechanics above still apply today — but new implementations should not adopt it; the spec's guidance is to pass directories or files via tool parameters, resource URIs, or server configuration instead. Elicitation (below) is unaffected.

### Why roots are a client primitive

Roots are declared by the client because they represent the user's consent model. The user told Claude Desktop "give this notes server access to these two directories". The server cannot widen that scope.

### Elicitation: the form-mode default

`elicitation/create` takes a form schema plus a natural-language prompt:

```json
{
  "method": "elicitation/create",
  "params": {
    "message": "Delete 'TPS report'? Multiple notes match; pick one.",
    "requestedSchema": {
      "type": "object",
      "properties": {
        "note_id": {
          "type": "string",
          "enum": ["note-3", "note-7", "note-14"]
        },
        "confirm": {"type": "boolean"}
      },
      "required": ["note_id", "confirm"]
    }
  }
}
```

Client renders a form, collects the user's answer, returns:

```json
{
  "action": "accept",
  "content": {"note_id": "note-14", "confirm": true}
}
```

Three possible actions: `accept` (user filled it), `decline` (user closed it), `cancel` (user aborted the whole tool call).

Form schemas are flat — nested objects are not supported in v1. SDKs typically reject anything more complex than a single layer.

### Elicitation: URL mode (SEP-1036, experimental)

New in 2025-11-25. Instead of a schema, the server sends a URL:

```json
{
  "method": "elicitation/create",
  "params": {
    "message": "Sign in to GitHub",
    "url": "https://github.com/login/oauth/authorize?client_id=..."
  }
}
```

Client opens the URL in a browser, waits for completion, returns when the user comes back. Useful for OAuth flows, payment authorization, and document signing where a form is insufficient.

Drift-risk note: the SEP-1036 response shape is still settling; some SDKs return the callback URL, others return a completion token. Read your SDK's release notes before using URL mode in production.

### When elicitation is the right tool

- User confirmation before destructive actions (destructive hint + elicitation).
- Disambiguation (pick one of N matches).
- First-run setup (API keys, directories, preferences).
- OAuth-style flows (URL mode).

### When elicitation is wrong

- Filling a tool's required arguments that the model could have asked for in prose. Use a normal re-prompt, not an elicitation dialog.
- High-frequency calls. Elicitation interrupts the conversation; do not fire it inside a loop.
- Anything the server could validate after the fact. Validate, return an error, let the model ask the user in text.

### Human-in-the-loop bridge

Elicitation plus sampling together enable MCP's "human-in-the-loop" model. A server's agent loop can pause for either user input (elicitation) or model reasoning (sampling). Phase 13 · 11 covered sampling; this lesson covers elicitation. Put them together for full mid-loop control.



## Further Reading

- [MCP — Client roots spec](https://modelcontextprotocol.io/specification/draft/client/roots) — canonical roots reference
- [MCP — Client elicitation spec](https://modelcontextprotocol.io/specification/draft/client/elicitation) — canonical elicitation reference
- [Cisco — What's new in MCP elicitation, structured content, OAuth enhancements](https://blogs.cisco.com/developer/whats-new-in-mcp-elicitation-structured-content-and-oauth-enhancements) — 2025-11-25 additions walk-through
- [MCP — GitHub SEP-1036](https://github.com/modelcontextprotocol/modelcontextprotocol) — URL-mode elicitation proposal (experimental, drift-risk)
- [The New Stack — How elicitation brings human-in-the-loop to AI tools](https://thenewstack.io/how-elicitation-in-mcp-brings-human-in-the-loop-to-ai-tools/) — UX walkthrough

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Declare `roots` and respond to `notifications/roots/list_changed`.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Restrict server file operations to URIs inside the declared root set.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Use `elicitation/create` to ask the user for a confirmation or structured input mid-tool-call.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Declare `roots` and respond to `notifications/roots/list_changed`,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Use `elicitation/create` to ask the user for a confirmation or structured input mid-tool-call,” and cite a repeatable check rather than relying on visual inspection alone.
