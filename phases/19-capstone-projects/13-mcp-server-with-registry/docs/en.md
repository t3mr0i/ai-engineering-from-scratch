# Capstone 13 — MCP Server with Registry and Governance

> The Model Context Protocol stopped being the future and became the default tool-use spec in 2026. Anthropic, OpenAI, Google, and every major IDE ship MCP clients. Pinterest published its internal ecosystem of MCP servers. The AAIF Registry formalized capability metadata at `.well-known`. AWS ECS published the reference stateless deployment. Block's goose-agent put the same protocol inside a hosted assistant. The 2026 production shape is: StreamableHTTP transport, OAuth 2.1 scopes, OPA policy gating, and a registry that lets platform teams discover, validate, and enable servers. Build that end to end.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools and MCP), Phase 14 (agents), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P11 · P13 · P14 · P17 · P18
**Time:** 25 hours

## Learning Objectives

- Define measurable acceptance criteria for Capstone 13 — MCP Server with Registry and Governance
- Integrate the required components into one self-terminating workflow
- Exercise happy paths, edge cases, and failure recovery with reproducible fixtures
- Package the verified result as a reusable curriculum artifact

## Problem

MCP became the tool-use lingua franca. Claude Code, Cursor 3, Amp, OpenCode, Gemini CLI, and every managed agent now consume MCP servers. The production challenges are not authoring servers (FastMCP makes that easy) but deploying them at scale with enterprise requirements: per-tenant OAuth scopes, OPA policy on destructive tools, StreamableHTTP stateless scaling, a registry for discovery, audit logs per tool call. Pinterest's internal MCP ecosystem and the AAIF Registry spec set the 2026 bar.

You will build an MCP server exposing 10 internal tools (Postgres read-only, S3 listing, Jira, Linear, Datadog, etc.), a registry UI for platform discovery, and a human-approval gate for destructive tools. The load test demonstrates StreamableHTTP horizontal scaling. The audit trail satisfies an enterprise security review.

## Concept

MCP 2026 revision mandates StreamableHTTP as the default transport. Unlike the earlier stdio-and-SSE shape, StreamableHTTP is stateless by default: a single HTTP endpoint accepts JSON-RPC requests, streams responses, and supports long-lived connections for notifications. Stateless means horizontally scalable behind a load balancer.

Authorization is OAuth 2.1 with per-tool scopes. A token carries scopes like `jira:read`, `s3:list`, `postgres:query:readonly`. The MCP server checks scopes at tool-call time, not just session start. For high-risk tools, the server rejects any call whose scope is not elevated to `approved:by:human` within the last N minutes — that elevation comes from a Slack review card.

The registry is a separate service. Every MCP server exposes a `.well-known/mcp-capabilities` document with its tool manifest, transport URL, auth requirements. The registry polls, validates, and indexes. Platform teams use the registry UI to see what tools are available, what scopes they need, and which teams own them.

## Architecture

```
MCP client (Claude Code, Cursor 3, ...)
          |
          v
StreamableHTTP over HTTPS (JSON-RPC + streaming)
          |
          v
MCP server (FastMCP) behind load balancer
          |
   +------+------+---------+----------+------------+
   v             v         v          v            v
Postgres    S3 listing  Jira       Linear     Datadog
(read-only) (paged)     (read)     (read)     (query)
          |
   +------+-------------+
   v                    v
 OPA policy gate   destructive tool MCP (separate server)
                        |
                        v
                   human approval via Slack
                        |
                        v
                   audit log (append-only, per-tenant)

  registry service
     |
     v  GET /.well-known/mcp-capabilities from each server
     v
     UI: search / validate / enable-disable / ownership
```

## Stack

- Server framework: FastMCP (Python) or `@modelcontextprotocol/sdk` (TypeScript)
- Transport: StreamableHTTP over HTTPS (stateless)
- Auth: OAuth 2.1 with workload identity via SPIFFE / SPIRE
- Policy: OPA / Rego rules per tool; policy decision service per request
- Registry: self-hosted, consumes `.well-known/mcp-capabilities` manifests
- Human approval: Slack interactive message for destructive tools
- Deployment: AWS ECS Fargate or Fly.io, one server per tenant or shared with tenant scoping
- Audit: structured JSONL per-tenant bucket with per-call lineage




## Build It

Reconstruct **Capstone 13 — MCP Server with Registry and Governance** by following `ToolSchema` on a graph with edges (0,1) and (1,2). Run `python3 main.py` and verify that degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly.

## Use It

Call `ToolSchema` from a small caller with a graph with edges (0,1) and (1,2). Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-mcp-server.md` with the command `python3 main.py`, the accepted input shape (a graph with edges (0,1) and (1,2)), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Model Context Protocol 2026 Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — StreamableHTTP, capability metadata, registry
- [AAIF MCP Registry spec](https://github.com/modelcontextprotocol/registry) — the 2026 registry spec
- [AWS ECS reference deployment](https://aws.amazon.com/blogs/containers/deploying-model-context-protocol-mcp-servers-on-amazon-ecs/) — reference production deployment
- [Pinterest internal MCP ecosystem](https://www.infoq.com/news/2026/04/pinterest-mcp-ecosystem/) — the reference internal deployment
- [Block `goose` MCP usage](https://block.github.io/goose/) — reference agent consumption pattern
- [FastMCP](https://github.com/jlowin/fastmcp) — Python server framework
- [Open Policy Agent](https://www.openpolicyagent.org/) — policy engine reference
- [SPIFFE / SPIRE](https://spiffe.io) — workload identity reference

## Exercises

This lab follows `ToolSchema` and `MCPServer` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using a graph with edges (0,1) and (1,2). Follow `ToolSchema`, `MCPServer`, `register`. Expect degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly; capture the first printed shape, metric, status, or summary field and state which part supports **Define measurable acceptance criteria for Capstone 13 — MCP Server with Registry and Governance**.
2. **Change the controlled parameter.** Repeat the command after changing only the edge list: use the same graph with an isolated node 3. Predict the direction of the change, then compare the two output values. Explain why **Integrate the required components into one self-terminating workflow** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation a graph with no edges. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Exercise happy paths, edge cases, and failure recovery with reproducible fixtures** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-mcp-server.md` and add a worked example using a graph with edges (0,1) and (1,2). Include the input contract, one expected output field, and a named acceptance check for **Package the verified result as a reusable curriculum artifact**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Capstone 13 — MCP Server with Registry and Governance** should contain:

- the `python3 main.py` output for a graph with edges (0,1) and (1,2), with `ToolSchema`, `MCPServer`, `register` traced to the value or shape that supports **Define measurable acceptance criteria for Capstone 13 — MCP Server with Registry and Governance**;
- a before/after comparison for the edge list, where the same graph with an isolated node 3 changes the observation in the direction predicted by **Integrate the required components into one self-terminating workflow**;
- a recorded result for a graph with no edges that matches the implementation’s validation or empty-result contract and explains the evidence for **Exercise happy paths, edge cases, and failure recovery with reproducible fixtures**; and
- an updated `outputs/skill-mcp-server.md` example with a concrete input, expected output field, and acceptance check tied to **Package the verified result as a reusable curriculum artifact**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
