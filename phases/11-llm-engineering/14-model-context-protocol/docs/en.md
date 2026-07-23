# Model Context Protocol (MCP)

> Every LLM app built before 2025 invented its own tool schema. Then Anthropic shipped MCP, Claude adopted it, OpenAI adopted it, and by 2026 it is the default wire format for connecting any LLM to any tool, data source, or agent.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 03 (Structured Outputs)
**Time:** ~75 minutes

## The Problem

You ship a chatbot that needs three tools: a database query, a calendar API, and a file reader. You write three JSON schemas for Claude. Then sales wants the same tools in ChatGPT — you rewrite them for OpenAI's `tools` parameter. Then you add Cursor, Zed, and Claude Code — three more rewrites, each with subtly different JSON conventions. A week later, Anthropic adds a new field; you update six schemas.

This was the pre-2025 reality. Every host (the thing running an LLM) and every server (the thing exposing tools and data) shipped bespoke protocols. Scaling meant an N×M integration matrix.

Model Context Protocol collapses that matrix. One JSON-RPC-based spec. One server exposes tools, resources, and prompts. Any compliant host — Claude Desktop, ChatGPT, Cursor, Claude Code, Zed, and a long tail of agent frameworks — can discover and call them without custom glue.

MCP is the default tool-and-context protocol across the big three (Anthropic, OpenAI, Google) and every major agent harness.

## The Concept

![MCP: one host, one server, three capabilities](../assets/mcp-architecture.svg)

**The three primitives.** An MCP server exposes exactly three things.

1. **Tools** — functions the model can call. Analog of OpenAI's `tools` or Anthropic's `tool_use`. Each has a name, description, JSON Schema input, and a handler.
2. **Resources** — read-only content the model or user can request (files, database rows, API responses). Addressed by URI.
3. **Prompts** — reusable templated prompts the user can invoke as shortcuts.

**The wire format.** JSON-RPC 2.0 over stdio, WebSocket, or streamable HTTP. Every message is `{"jsonrpc": "2.0", "method": "...", "params": {...}, "id": N}`. Discovery methods are `tools/list`, `resources/list`, `prompts/list`. Invocation methods are `tools/call`, `resources/read`, `prompts/get`.

**Host vs client vs server.** The host is the LLM application (Claude Desktop). The client is a sub-component of the host that speaks to exactly one server. The server is your code. One host can mount many servers simultaneously.

### The handshake

Every session opens with `initialize`. The client sends protocol version and its capabilities. The server responds with its version, name, and the capability set it supports (`tools`, `resources`, `prompts`, `logging`, `roots`). Everything after is negotiated against those capabilities.

### What MCP is not

- Not a retrieval API. RAG (Phase 11 · 06) still decides what to pull; MCP is the transport for exposing retrieval results as resources.
- Not an agent framework. MCP is the plumbing; frameworks like LangGraph, PydanticAI, and OpenAI Agents SDK sit above it.
- Not tied to Anthropic. The spec and reference implementations are open source under the `modelcontextprotocol` org.


## Use It

The 2026 MCP stack:

| Situation | Pick |
|-----------|------|
| Local dev, single-user tools | Python `FastMCP`, stdio transport |
| Remote team tools / SaaS integration | Streamable HTTP, OAuth 2.1 auth |
| TypeScript host (VS Code extension, web app) | `@modelcontextprotocol/sdk` |
| High-throughput server, typed access | Official Rust SDK (`modelcontextprotocol/rust-sdk`) |
| Exploring ecosystem servers | `modelcontextprotocol/servers` monorepo (Filesystem, GitHub, Postgres, Slack, Puppeteer) |

Rule of thumb: if a tool is read-only, cacheable, and called from two or more hosts, ship it as an MCP server. If it is one-off inline logic, keep it as a local function (Phase 11 · 09).

## Ship It

Save `outputs/skill-mcp-server-designer.md`:

```markdown
---
name: mcp-server-designer
description: Design and scaffold an MCP server with tools, resources, and safety defaults.
version: 1.0.0
phase: 11
lesson: 14
tags: [llm-engineering, mcp, tool-use]
---

Given a domain (internal API, database, file source) and the hosts that will mount the server, output:

1. Primitive map. Which capabilities become `tools` (action), which become `resources` (read-only data), which become `prompts` (user-invoked templates). One line per primitive.
2. Auth plan. Stdio (trusted local), streamable HTTP with API key, or OAuth 2.1 with PKCE. Pick and justify.
3. Schema draft. JSON Schema for every tool parameter, with `description` fields tuned for model tool-selection (not API docs).
4. Destructive-action list. Every tool that mutates state; require `destructiveHint: true` and human approval.
5. Test plan. Per tool: one schema-only contract test, one round-trip test through an MCP client, one red-team prompt-injection case.

Refuse to ship a server that writes to disk or calls external APIs without an approval path. Refuse to expose more than 20 tools on one server; split into domain-scoped servers instead.
```


## Further Reading

- [Model Context Protocol specification](https://modelcontextprotocol.io/specification) — canonical reference, versioned by date.
- [Anthropic — Introducing MCP (Nov 2024)](https://www.anthropic.com/news/model-context-protocol) — launch post with design rationale.
- [Security considerations for MCP](https://modelcontextprotocol.io/docs/concepts/security) — roots, destructive hints, tool poisoning.
