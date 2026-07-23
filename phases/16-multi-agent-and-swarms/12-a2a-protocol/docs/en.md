# A2A — The Agent-to-Agent Protocol

> Google announced A2A in April 2025; by April 2026 the spec is at https://a2a-protocol.org/latest/specification/ and 150+ organizations back it. A2A is the horizontal complement to MCP (Lesson 13): where MCP is vertical (agent ↔ tools), A2A is peer-to-peer (agent ↔ agent). It defines Agent Cards (discovery), tasks with artifacts (text, structured data, video), opaque task lifecycles, and auth. Production systems increasingly pair MCP with A2A. Google Cloud rolled A2A support into Vertex AI Agent Builder during 2025-2026.

**Type:** Learn + Build
**Languages:** Python (stdlib, `http.server`, `json`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## Problem

Your agent needs to call another agent on another system. How? You can expose an HTTP endpoint, define a bespoke JSON schema, and hope the other side speaks it. Every pair of agents becomes a custom integration.

A2A is the universal wire protocol for that call. Standard discovery, standard task model, standard transport, standard artifacts. Like HTTP+REST but for agents as first-class citizens.

## Concept

### The four elements

**Agent Card.** A JSON document at `/.well-known/agent.json` describing the agent: name, skills, endpoints, supported modalities, auth requirements. Discovery happens by reading the card.

```
GET https://agent.example.com/.well-known/agent.json
→ {
    "name": "code-review-agent",
    "skills": ["review-python", "review-typescript"],
    "endpoints": {
      "tasks": "https://agent.example.com/tasks"
    },
    "auth": {"type": "bearer"},
    "modalities": ["text", "structured"]
  }
```

**Task.** The unit of work. An async, stateful object with a lifecycle: `submitted → working → completed / failed / canceled`. A client sends a task, polls or subscribes for updates.

**Artifact.** The result type produced by a task. Text, structured JSON, image, video, audio. Artifacts are typed so different modalities are first-class.

**Opaque lifecycle.** A2A does not prescribe *how* the remote agent solves the task. The client sees state transitions and artifacts; the implementation is free to use any framework.

### The MCP/A2A split

- **MCP** (Lesson 13): agent ↔ tool. The agent reads/writes via JSON-RPC to a tool server. Stateless by default.
- **A2A**: agent ↔ agent. Peer protocol; both sides are agents with their own reasoning.

Production multi-agent systems use both. An A2A peer calls MCP tools on its side. The split keeps the two concerns clean.

### Discovery flow

```
Client                     Agent server
  ├──GET /.well-known/agent.json──>
  <──Agent Card JSON─────────────
  ├──POST /tasks {skill, input}──>
  <──201 task_id, state=submitted
  ├──GET /tasks/{id}──────────────>
  <──state=working, 42% done──────
  ├──GET /tasks/{id}──────────────>
  <──state=completed, artifacts──
```

Or with streaming: SSE subscription to `/tasks/{id}/events` for push updates.

### Auth

A2A supports three common patterns:

- **Bearer token** — OAuth2 or opaque.
- **mTLS** — mutual TLS; organizations prove identity to each other.
- **Signed requests** — HMAC over the payload.

Auth is declared in the Agent Card; clients discover and comply.

### 150+ organizations by April 2026

Enterprise adoption drove A2A scale. The headline: A2A became the way enterprise agent systems cross trust boundaries. Google Cloud shipped Vertex AI Agent Builder A2A support; Microsoft Agent Framework supports it; most major frameworks (LangGraph, CrewAI, AutoGen) ship A2A adapters.

### Where A2A wins

- **Cross-organization calls.** Agent at company A calls agent at company B. Without A2A, every pair is a bespoke contract.
- **Heterogeneous frameworks.** LangGraph agent calls CrewAI agent calls custom Python agent. A2A normalizes.
- **Typed artifacts.** Video result, structured JSON, audio — all first-class.
- **Long-running tasks.** Opaque lifecycle + polling makes hours-long tasks straightforward.

### Where A2A struggles

- **Latency-sensitive micro-calls.** A2A's lifecycle is async. Sub-millisecond agent-to-agent does not fit; use direct RPC.
- **Tight-coupled in-process agents.** If both agents run in the same Python process, A2A's HTTP round-trip is overkill.
- **Small teams.** Spec overhead is real; internal-only agents may not need the formality.

### A2A vs ACP, ANP, NLIP

Several related specs emerged in 2024-2026:

- **ACP** (IBM/Linux Foundation) — predecessor to A2A, narrower scope.
- **ANP** (Agent Network Protocol) — peer-discovery-heavy, decentralized-first.
- **NLIP** (Ecma Natural Language Interaction Protocol, standardized December 2025) — natural-language content type.

A2A is the most-adopted peer protocol as of April 2026. See arXiv:2505.02279 (Liu et al., "A Survey of Agent Interoperability Protocols") for the comparison.




## Further Reading

- [A2A specification](https://a2a-protocol.org/latest/specification/) — the canonical spec
- [Google Developers Blog — A2A announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) — April 2025 launch post
- [A2A GitHub repo](https://github.com/a2aproject/A2A) — reference implementations and SDKs
- [Liu et al. — A Survey of Agent Interoperability Protocols](https://arxiv.org/html/2505.02279v1) — MCP, ACP, A2A, ANP comparison
