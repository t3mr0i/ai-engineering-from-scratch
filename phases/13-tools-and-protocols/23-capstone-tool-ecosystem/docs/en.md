# Capstone — Build a Complete Tool Ecosystem

> Phase 13 taught every piece. This capstone wires them into one production-shaped system: an MCP server with tools + resources + prompts + tasks + UI, OAuth 2.1 at the edge, an RBAC gateway, a multi-server client, an A2A sub-agent call, OTel tracing into a collector, tool-poisoning detection in CI, and an AGENTS.md + SKILL.md bundle. By the end you can defend every architectural choice.

**Type:** Build
**Languages:** Python (stdlib, end-to-end ecosystem harness)
**Prerequisites:** Phase 13 · 01 through 21
**Time:** ~120 minutes

## Learning Objectives

- Compose an MCP server exposing tools, resources, prompts, and a task with a `ui://` app.
- Front the server with an OAuth 2.1 gateway that enforces RBAC and pinned hashes.
- Write a multi-server client that traces with OTel GenAI attributes end-to-end.
- Delegate part of a workload to an A2A sub-agent; verify opacity is preserved.
- Package the whole stack with AGENTS.md + SKILL.md so other agents can drive it.

## The Problem

Ship the "research and report" system:

- User asks: "summarize the three most-cited 2026 arXiv papers on agent protocols."
- System: search arXiv via MCP; delegate paper summarization to a specialized writer agent via A2A; aggregate results; render an interactive report as an MCP Apps `ui://` resource; log every step to OTel.

All the primitives from Phase 13 show up. This is not a toy — production research-assistant systems shipped in 2026 by Anthropic (the Claude Research product), OpenAI (GPTs with Apps SDK), and third parties have this exact shape.

## The Concept

### Architecture

```
[user] -> [client] -> [gateway (OAuth 2.1 + RBAC)] -> [research MCP server]
                                                      |
                                                      +- MCP tool: arxiv_search (pure)
                                                      +- MCP resource: notes://recent
                                                      +- MCP prompt: /research_topic
                                                      +- MCP task: generate_report (long)
                                                      +- MCP Apps UI: ui://report/current
                                                      +- A2A call: writer-agent (tasks/send)
                                                      |
                                                      +- OTel GenAI spans
```

### Trace hierarchy

```
agent.invoke_agent
 ├── llm.chat (kick off)
 ├── mcp.call -> tools/call arxiv_search
 ├── mcp.call -> resources/read notes://recent
 ├── mcp.call -> prompts/get research_topic
 ├── a2a.tasks/send -> writer-agent
 │    └── task transitions (opaque internals)
 ├── mcp.call -> tools/call generate_report (task-augmented)
 │    └── tasks/status polling
 │    └── tasks/result (completed, returns ui:// resource)
 └── llm.chat (final synthesis)
```

One trace id. Every span has the right `gen_ai.*` attributes.

### Security posture

- OAuth 2.1 + PKCE with resource indicator pinning audience to gateway.
- Gateway holds upstream credentials; user never sees them.
- RBAC: `alice` has `research:read`, `research:write`, can call all tools. `bob` has `research:read`, cannot call `generate_report`.
- Pinned description manifest: dropped any server whose tool hashes changed.
- Rule of Two audit: no tool combines untrusted input, sensitive data, and consequential action.

### Rendering

The final `generate_report` task returns content blocks plus a `ui://report/current` resource. The client's host (Claude Desktop, etc.) renders the interactive dashboard in a sandbox iframe. The dashboard contains a sorted paper list, citation counts, and a button that calls `host.callTool('summarize_paper', {arxiv_id})` for any paper the user clicks.

### Packaging

The whole thing ships as:

```
research-system/
  AGENTS.md                     # project conventions
  skills/
    run-research/
      SKILL.md                  # the top-level workflow
  servers/
    research-mcp/               # the MCP server
      pyproject.toml
      src/
  agents/
    writer/                     # the A2A agent
  gateway/
    config.yaml                 # RBAC + pinned manifest
```

Users deploy with `docker compose up`. Claude Code, Cursor, Codex, and opencode users can drive the system by invoking the `run-research` skill.

### What each Phase 13 lesson contributed

| Lesson | What the capstone uses |
|--------|------------------------|
| 01-05 | Tool interface, provider-portability, parallel calls, schemas, linting |
| 06-10 | MCP primitives, server, client, transports, resources + prompts |
| 11-14 | Sampling, roots + elicitation, async tasks, `ui://` apps |
| 15-17 | Tool poisoning, OAuth 2.1, gateway + registry |
| 18 | A2A sub-agent delegation |
| 19 | OTel GenAI tracing |
| 20 | Routing gateway for the LLM layer |
| 21 | SKILL.md + AGENTS.md packaging |



## Further Reading

- [MCP — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — consolidated reference
- [MCP blog — 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — where the protocol is heading
- [a2a-protocol.org](https://a2a-protocol.org/latest/) — A2A v1.0 reference
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — canonical tracing conventions
- [Anthropic — Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) — production agent runtime patterns
