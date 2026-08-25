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



## Build It

Reconstruct **Roots and Elicitation — Scoping and Mid-Flight User Input** by following `uri_in_roots` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `uri_in_roots` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-elicitation-form-designer.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [MCP — Client roots spec](https://modelcontextprotocol.io/specification/draft/client/roots) — canonical roots reference
- [MCP — Client elicitation spec](https://modelcontextprotocol.io/specification/draft/client/elicitation) — canonical elicitation reference
- [Cisco — What's new in MCP elicitation, structured content, OAuth enhancements](https://blogs.cisco.com/developer/whats-new-in-mcp-elicitation-structured-content-and-oauth-enhancements) — 2025-11-25 additions walk-through
- [MCP — GitHub SEP-1036](https://github.com/modelcontextprotocol/modelcontextprotocol) — URL-mode elicitation proposal (experimental, drift-risk)
- [The New Stack — How elicitation brings human-in-the-loop to AI tools](https://thenewstack.io/how-elicitation-in-mcp-brings-human-in-the-loop-to-ai-tools/) — UX walkthrough

## Exercises

Work from the smallest fixture that the Roots and Elicitation — Scoping and Mid-Flight User Input demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `uri_in_roots`, `elicit`, `tool_notes_delete`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Declare `roots` and respond to `notifications/roots/list_changed`.**.
2. **Perturb one field.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Restrict server file operations to URIs inside the declared root set.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Use `elicitation/create` to ask the user for a confirmation or structured input mid-tool-call.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-elicitation-form-designer.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Choose between form-mode and URL-mode elicitation (the latter is experimental; drift-risk noted).**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Roots and Elicitation — Scoping and Mid-Flight User Input** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `uri_in_roots`, `elicit`, `tool_notes_delete` traced to the value or shape that supports **Declare `roots` and respond to `notifications/roots/list_changed`.**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Restrict server file operations to URIs inside the declared root set.**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Use `elicitation/create` to ask the user for a confirmation or structured input mid-tool-call.**; and
- an updated `outputs/skill-elicitation-form-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Choose between form-mode and URL-mode elicitation (the latter is experimental; drift-risk noted).**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
