# A2A — Agent-to-Agent Protocol

> MCP is agent-to-tool. A2A (Agent2Agent) is agent-to-agent — an open protocol for letting opaque agents built on different frameworks collaborate. Released by Google in April 2025, donated to the Linux Foundation in June 2025, reaching v1.0 in April 2026 with 150+ supporters including AWS, Cisco, Microsoft, Salesforce, SAP, and ServiceNow. It absorbed IBM's ACP and added the AP2 payments extension. This lesson walks the Agent Card, Task lifecycle, and the two transport bindings.

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP fundamentals), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## Learning Objectives

- Distinguish agent-to-tool (MCP) from agent-to-agent (A2A) use cases.
- Publish an Agent Card at `/.well-known/agent.json` with skills and endpoint metadata.
- Walk the Task lifecycle (submitted → working → input-required → completed / failed / canceled / rejected).
- Use Messages with Parts (text, file, data) and Artifacts as outputs.

## The Problem

A customer-service agent needs to delegate report-writing to a specialized writer agent. Options pre-A2A:

- Custom REST API. Works but every pairing is a one-off.
- Shared codebase. Requires the two agents to run the same framework.
- MCP. Doesn't fit: MCP is for calling tools, not for two agents collaborating while preserving each agent's opaque internal reasoning.

A2A fills the gap. It models the interaction as one agent sending a Task to another, with a lifecycle, messages, and artifacts. The called agent's internal state stays opaque — the caller sees only task state transitions and eventual outputs.

A2A is the "let agents across frameworks talk to each other" protocol. It does not replace MCP; the two are complementary.

## The Concept

### Agent Card

Every A2A-compliant agent publishes a card at `/.well-known/agent.json`:

```json
{
  "schemaVersion": "1.0",
  "name": "research-agent",
  "description": "Summarizes academic papers and drafts citations.",
  "url": "https://research.example.com/a2a",
  "version": "1.2.0",
  "skills": [
    {
      "id": "summarize_paper",
      "name": "Summarize a paper",
      "description": "Read a paper PDF and produce a 3-paragraph summary.",
      "inputModes": ["text", "file"],
      "outputModes": ["text", "artifact"]
    }
  ],
  "capabilities": {"streaming": true, "pushNotifications": true}
}
```

Discovery is URL-based: fetch the card, learn the URL of the A2A endpoint, enumerate skills.

### Signed Agent Cards (AP2)

The AP2 extension (September 2025) adds cryptographic signatures to Agent Cards. A publisher signs its own card with a JWT; consumers verify. Prevents impersonation.

### Task lifecycle

```
submitted -> working -> completed | failed | canceled | rejected
             -> input_required -> working (loop via message)
```

Clients initiate with `tasks/send`. The called agent transitions through states; clients subscribe to state updates via SSE or poll.

### Messages and Parts

A message carries one or more Parts:

- `text` — plain content.
- `file` — base64 blob with mimeType.
- `data` — typed JSON payload (structured input for the called agent).

Example:

```json
{
  "role": "user",
  "parts": [
    {"type": "text", "text": "Summarize this paper."},
    {"type": "file", "file": {"name": "paper.pdf", "mimeType": "application/pdf", "bytes": "..."}},
    {"type": "data", "data": {"targetLength": "3 paragraphs"}}
  ]
}
```

### Artifacts

Outputs are Artifacts, not raw strings. An Artifact is a named, typed output:

```json
{
  "name": "summary",
  "parts": [{"type": "text", "text": "..."}],
  "mimeType": "text/markdown"
}
```

Artifacts can be streamed as chunks. The caller accumulates.

### Two transport bindings

1. **JSON-RPC over HTTP.** `/a2a` endpoint, POST for requests, optional SSE for streaming. Default binding.
2. **gRPC.** For enterprise environments where gRPC is native.

Both bindings carry the same logical message shape.

### Opacity preservation

A key design principle: the called agent's internal state is opaque. The caller sees task state and artifacts. The called agent's chain-of-thought, its tool calls, its sub-agent delegation — all invisible. This is different from MCP, where tool calls are transparent.

Rationale: A2A enables competitors to collaborate without revealing internals. A2A can be "call this customer-service agent" without the caller learning how that agent implements the service.

### Timeline

- **2025-04-09.** Google announces A2A.
- **2025-06-23.** Donated to Linux Foundation.
- **2025-08.** Absorbs IBM's ACP.
- **2025-09.** AP2 extension (Agent Payments) ships.
- **2026-04.** v1.0 released with 150+ supporting organizations.

### Relationship to MCP

| Dimension | MCP | A2A |
|-----------|-----|-----|
| Use case | Agent-to-tool | Agent-to-agent |
| Opacity | Transparent tool calls | Opaque inner reasoning |
| Typical caller | Agent runtime | Another agent |
| State | Tool-call result | Task with lifecycle |
| Authorization | OAuth 2.1 (Phase 13 · 16) | JWT-signed Agent Cards (AP2) |
| Transport | Stdio / Streamable HTTP | JSON-RPC over HTTP / gRPC |

Use MCP when you want to invoke a specific tool. Use A2A when you want to delegate a whole task to another agent. Many production systems use both: an agent uses MCP for its tool layer and A2A for its collaboration layer.



## Further Reading

- [a2a-protocol.org](https://a2a-protocol.org/latest/) — canonical A2A specification
- [a2aproject/A2A — GitHub](https://github.com/a2aproject/A2A) — reference implementations and SDKs
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) — June 2025 governance transfer
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) — roadmap and partner momentum
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) — v1.0 release notes and backward-compat guidance
