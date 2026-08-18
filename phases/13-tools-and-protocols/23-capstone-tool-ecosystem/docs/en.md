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
                                                      +- A2A call: writer-agent (SendMessage)
                                                      |
                                                      +- OTel GenAI spans
```

The research server exposes two tools. Pin their description hashes up front — the same rug-pull defense from Phase 13 · 15, applied here:

```python editable
import hashlib
import json

# Define the tools available in the ecosystem
TOOLS = [
    {
        "name": "arxiv_search",
        "description": "Search arXiv papers by keyword. Returns matching papers with IDs and titles.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Keywords to search for"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "generate_report",
        "description": "Generate a research report in the specified format (html, markdown, json).",
        "input_schema": {
            "type": "object",
            "properties": {
                "format": {"type": "string", "enum": ["html", "markdown", "json"]}
            },
            "required": ["format"]
        }
    }
]

# Security: pin the tool descriptions to detect tampering
PINNED_HASHES = {
    t["name"]: hashlib.sha256(t["description"].encode()).hexdigest()
    for t in TOOLS
}

print("Tools defined:")
for t in TOOLS:
    print(f"  - {t['name']}: {t['description']}")
print(f"\nPinned hashes (defense against poisoning):")
for name, hash_val in PINNED_HASHES.items():
    print(f"  {name}: {hash_val[:12]}...")
```

The MCP server backs those tools with real (mock) implementations:

```python editable
# Mock data: papers from arXiv
PAPERS = [
    {"arxiv_id": "2603.22489", "title": "Tool poisoning attacks on MCP deployments", "citations": 42},
    {"arxiv_id": "2604.01055", "title": "Agent-to-agent coordination benchmarks", "citations": 38},
    {"arxiv_id": "2603.30016", "title": "Long-running tool calls via Tasks", "citations": 29}
]

def arxiv_search_impl(args):
    """Mock arXiv search tool."""
    query = args.get("query", "").lower()
    hits = [p for p in PAPERS if query in p["title"].lower()]
    return {
        "type": "text",
        "text": json.dumps(hits, indent=2),
        "is_error": False
    }

def generate_report_impl(args):
    """Mock report generation tool with UI resource."""
    fmt = args.get("format", "html")
    if fmt == "html":
        content = "<h1>Research Report</h1><ul>" + "".join(
            f"<li><strong>{p['title']}</strong> ({p['citations']} citations, arXiv:{p['arxiv_id']})</li>"
            for p in PAPERS
        ) + "</ul>"
    elif fmt == "markdown":
        content = "# Research Report\n" + "".join(
            f"- **{p['title']}** ({p['citations']} citations, arXiv:{p['arxiv_id']})\n"
            for p in PAPERS
        )
    else:
        content = json.dumps({"papers": PAPERS}, indent=2)
    return {
        "type": "text",
        "text": f"Report generated ({len(PAPERS)} papers): {fmt.upper()}",
        "_resource_html": content,
        "is_error": False
    }

print("✅ Backend tools implemented")
```

The gateway in the diagram enforces OAuth 2.1 + RBAC. Define the users and the scope each tool requires:

```python editable
import uuid

# Define users and their scopes (OAuth-style access control)
USERS = {
    "tok_alice": {"id": "alice", "scopes": {"research:read", "research:write"}},
    "tok_bob": {"id": "bob", "scopes": {"research:read"}}
}

# Define which scopes are required for each tool
REQUIRED_SCOPES = {
    "arxiv_search": "research:read",
    "generate_report": "research:write"
}

print("Users and permissions:")
for token, user_info in USERS.items():
    print(f"  {user_info['id']}: {user_info['scopes']}")

print(f"\nTool requirements:")
for tool, scope in REQUIRED_SCOPES.items():
    print(f"  {tool} → {scope}")
```

Before any tool executes, the gateway authenticates the token, checks the required scope, and verifies the pinned hash — defense-in-depth, all three checks or no call:

```python editable
def gateway_authorize(token, tool_name):
    """Check if a user token can call a tool."""
    # Step 1: Authentication
    user = USERS.get(token)
    if not user:
        return {"ok": False, "error": "unauthenticated", "user": None}

    # Step 2: Authorization (RBAC)
    required_scope = REQUIRED_SCOPES.get(tool_name)
    if required_scope and required_scope not in user["scopes"]:
        return {
            "ok": False,
            "error": "insufficient_scope",
            "required": required_scope,
            "user": user["id"]
        }

    # Step 3: Integrity check (pinned hash)
    tool = next((t for t in TOOLS if t["name"] == tool_name), None)
    if not tool:
        return {"ok": False, "error": "tool_not_found", "user": user["id"]}

    current_hash = hashlib.sha256(tool["description"].encode()).hexdigest()
    if PINNED_HASHES[tool_name] != current_hash:
        return {
            "ok": False,
            "error": "hash_mismatch",
            "reason": "Tool definition was tampered with",
            "user": user["id"]
        }

    return {"ok": True, "user": user["id"]}

# Test authorization
print("Authorization tests:")
print(f"  alice calls arxiv_search: {gateway_authorize('tok_alice', 'arxiv_search')}")
print(f"  alice calls generate_report: {gateway_authorize('tok_alice', 'generate_report')}")
print(f"  bob calls arxiv_search: {gateway_authorize('tok_bob', 'arxiv_search')}")
print(f"  bob calls generate_report: {gateway_authorize('tok_bob', 'generate_report')}")
```

### Trace hierarchy

```
agent.invoke_agent
 ├── llm.chat (kick off)
 ├── mcp.call -> tools/call arxiv_search
 ├── mcp.call -> resources/read notes://recent
 ├── mcp.call -> prompts/get research_topic
 ├── a2a.SendMessage -> writer-agent
 │    └── task transitions (opaque internals)
 ├── mcp.call -> tools/call generate_report (task-augmented)
 │    └── tasks/get polling
 │    └── tasks/result (completed, returns ui:// resource)
 └── llm.chat (final synthesis)
```

One trace id. Every span has the right `gen_ai.*` attributes.

Every example below shares this setup — run it once, then the rest reuse `lrn_llm`.

```python editable
import sys, json, types
lrn_llm = types.ModuleType("lrn_llm")
try:
    from pyodide.http import pyfetch as _pyfetch
    _IN_PYODIDE = True
except ImportError:
    import urllib.request as _urlreq
    _IN_PYODIDE = False
lrn_llm.API_BASE = "/api/llm"
lrn_llm.DEFAULT_MODEL = "azure/gpt-5.4-mini"
lrn_llm.API_KEY = ""

async def _lrn_call(messages, *, system=None, max_tokens=400, model=None):
    if system is not None:
        messages = [{"role": "system", "content": system}] + list(messages)
    payload = {"model": model or lrn_llm.DEFAULT_MODEL, "messages": messages,
               "max_completion_tokens": max_tokens}
    headers = {"content-type": "application/json"}
    _key = lrn_llm.API_KEY
    if _key:
        headers["Authorization"] = "Bearer " + _key
    url = lrn_llm.API_BASE.rstrip("/") + "/chat/completions"
    body = json.dumps(payload)
    if _IN_PYODIDE:
        r = await _pyfetch(url, method="POST", headers=headers, body=body)
        data = await r.json()
    else:
        req = _urlreq.Request(url, method="POST", headers=headers, data=body.encode("utf-8"))
        with _urlreq.urlopen(req, timeout=60) as r:
            data = json.loads(r.read())
    if "error" in data:
        raise RuntimeError("LLM error: " + str(data["error"]))
    return data

def _lrn_text(r):
    ch = (r or {}).get("choices") or []
    return (ch[0].get("message", {}) or {}).get("content", "") if ch else ""

async def _lrn_ping():
    r = await _lrn_call([{"role": "user", "content": "Reply with exactly: OK"}], max_tokens=5)
    return {"ok": _lrn_text(r).strip().upper().startswith("OK"), "model": r.get("model")}

lrn_llm.call = _lrn_call
lrn_llm.text = _lrn_text
lrn_llm.ping = _lrn_ping
r = await lrn_llm.ping()
print(f"LLM reachable: {r}")
```

The first `llm.chat` span in the diagram is the LLM deciding which tools to call. Ask it to plan the research query:

```python editable
user_query = "Search for papers on agent protocols and generate a summary report."

system_prompt = """You are a research assistant with access to tools:
- arxiv_search(query): Search arXiv papers
- generate_report(format): Generate a report

When the user asks you to research something, call arxiv_search first to find papers, then generate_report to compile results.
Respond with JSON: {"tool_calls": [{"tool": "...", "args": {...}}]}"""

response = await lrn_llm.call(
    [{"role": "user", "content": user_query}],
    system=system_prompt,
    max_tokens=300
)

llm_output = lrn_llm.text(response)
print(f"LLM decision:\n{llm_output}")
```

The `mcp.call` spans are each tool call routed through the gateway. Parse the LLM's decision and execute each call with real authorization:

```python editable
import re

# Parse the LLM's tool call decision
try:
    # Extract JSON from the response
    json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
    if json_match:
        tool_calls_obj = json.loads(json_match.group())
    else:
        tool_calls_obj = {"tool_calls": []}
except json.JSONDecodeError as e:
    print(f"⚠️ Could not parse tool_calls JSON from the LLM output: {e}")
    print(f"Raw LLM output was:\n{llm_output}")
    tool_calls_obj = {"tool_calls": []}

print(f"Parsed tool calls: {tool_calls_obj}")

# Execute tool calls as alice (has both read and write access)
token = "tok_alice"
results = []

for call in tool_calls_obj.get("tool_calls", []):
    tool_name = call.get("tool")
    args = call.get("args", {})

    # Step 1: Authorization via gateway
    auth_result = gateway_authorize(token, tool_name)
    if not auth_result["ok"]:
        print(f"  ❌ {tool_name}: {auth_result['error']}")
        results.append({"tool": tool_name, "error": auth_result["error"]})
        continue

    # Step 2: Execute tool
    print(f"  ✅ {tool_name} (authorized for {auth_result['user']})")
    if tool_name == "arxiv_search":
        result = arxiv_search_impl(args)
    elif tool_name == "generate_report":
        result = generate_report_impl(args)
    else:
        result = {"type": "text", "text": "Unknown tool", "is_error": True}

    results.append({"tool": tool_name, "result": result})
    print(f"    Result: {result['text'][:60]}...")

print(f"\nExecuted {len(results)} tools")
```

The final `llm.chat` span synthesizes the tool results into an answer:

```python editable
# Build the conversation with tool results
messages = [{"role": "user", "content": user_query}]

# Add tool results to context
tool_context = "\n\nTool execution results:\n"
for res in results:
    tool_context += f"\n{res['tool']}:\n{res['result']['text']}"

final_response = await lrn_llm.call(
    [{"role": "user", "content": user_query + tool_context}],
    system="You are a research assistant. Synthesize the tool results into a coherent summary.",
    max_tokens=400
)

final_text = lrn_llm.text(final_response)
print("Agent synthesis:")
print(final_text)
```

In production, every hop above (LLM call, tool call, gateway check) is traced with OpenTelemetry, all spans sharing one trace ID. Emit a simplified version of that same trace:

```python editable
import time
import uuid

def _hex(n):
    return uuid.uuid4().hex[:n*2]

# Single trace ID for the entire workflow
trace_id = _hex(16)

spans = []

def emit_span(name, kind, parent_id, attrs):
    span = {
        "name": name,
        "kind": kind,
        "traceId": trace_id,
        "spanId": _hex(8),
        "parentSpanId": parent_id,
        "attrs": attrs
    }
    spans.append(span)
    return span

# Simulate the trace hierarchy from main.py
root = emit_span(
    "agent.invoke_agent", "INTERNAL", None,
    {"gen_ai.operation.name": "invoke_agent", "gen_ai.agent.name": "research-orchestrator"}
)

llm1 = emit_span(
    "llm.chat", "CLIENT", root["spanId"],
    {"gen_ai.operation.name": "chat", "gen_ai.provider.name": "openai", "gen_ai.request.model": lrn_llm.DEFAULT_MODEL}
)

search_span = emit_span(
    "mcp.call", "CLIENT", root["spanId"],
    {"gen_ai.operation.name": "execute_tool", "gen_ai.tool.name": "arxiv_search", "gateway.user": "alice"}
)

report_span = emit_span(
    "mcp.call", "CLIENT", root["spanId"],
    {"gen_ai.operation.name": "execute_tool", "gen_ai.tool.name": "generate_report", "gateway.user": "alice"}
)

llm2 = emit_span(
    "llm.chat", "CLIENT", root["spanId"],
    {"gen_ai.operation.name": "chat", "gen_ai.provider.name": "openai", "gen_ai.request.model": lrn_llm.DEFAULT_MODEL}
)

print(f"Trace ID: {trace_id}\n")
print("Span hierarchy (single trace, multiple spans):")
for sp in spans:
    parent = sp["parentSpanId"][:6] if sp["parentSpanId"] else "ROOT"
    print(f"  [{sp['traceId'][:6]}] {sp['name']:20s} parent={parent} span={sp['spanId'][:6]}")
```

### Security posture

- OAuth 2.1 + PKCE with resource indicator pinning audience to gateway.
- Gateway holds upstream credentials; user never sees them.
- RBAC: `alice` has `research:read`, `research:write`, can call all tools. `bob` has `research:read`, cannot call `generate_report`.
- Pinned description manifest: dropped any server whose tool hashes changed.
- Rule of Two audit: no tool combines untrusted input, sensitive data, and consequential action.

Rerun the same tool calls as Bob, the read-only user, against the gateway defined above — this is why RBAC matters in practice, not just in theory:

```python editable
# Try the same query as bob (read-only user)
token_bob = "tok_bob"
print(f"Bob's permissions: {USERS[token_bob]['scopes']}\n")

for call in tool_calls_obj.get("tool_calls", []):
    tool_name = call.get("tool")
    auth_result = gateway_authorize(token_bob, tool_name)
    if auth_result["ok"]:
        print(f"  ✅ {tool_name}: ALLOWED")
    else:
        print(f"  ❌ {tool_name}: DENIED ({auth_result['error']})")
```

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

## Try It Yourself

Edit the query below and run a new research workflow. The agent decides which tools to call based on the query. Try "Find papers on tool security" (triggers `arxiv_search`), "Generate a report in markdown" (triggers `generate_report`), or "Search for papers on agents and make a report" (triggers both).

```python editable
# TODO: Try a new research query
# Change the query below to test the ecosystem with different inputs

custom_query = "Find recent papers on model evaluation and create a summary report."

print(f"Your query: {custom_query}\n")

# Use the same LLM-based decision flow
response = await lrn_llm.call(
    [{"role": "user", "content": custom_query}],
    system="""You are a research assistant with tools: arxiv_search(query), generate_report(format).
Respond with JSON: {"tool_calls": [{"tool": "...", "args": {...}}]}""",
    max_tokens=300
)

llm_output = lrn_llm.text(response)

# Parse and execute
try:
    json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
    if json_match:
        tool_calls_obj = json.loads(json_match.group())
    else:
        tool_calls_obj = {"tool_calls": []}
except json.JSONDecodeError as e:
    print(f"⚠️ Could not parse tool_calls JSON from the LLM output: {e}")
    print(f"Raw LLM output was:\n{llm_output}")
    tool_calls_obj = {"tool_calls": []}

print(f"LLM decided to call: {[c.get('tool') for c in tool_calls_obj.get('tool_calls', [])]}\n")

token = "tok_alice"
for call in tool_calls_obj.get("tool_calls", []):
    tool_name = call.get("tool")
    args = call.get("args", {})
    auth = gateway_authorize(token, tool_name)
    if auth["ok"]:
        print(f"✅ Executing {tool_name} for {auth['user']}")
        if tool_name == "arxiv_search":
            result = arxiv_search_impl(args)
        elif tool_name == "generate_report":
            result = generate_report_impl(args)
        else:
            result = {"type": "text", "text": "Unknown tool", "is_error": True}
        print(f"   {result['text']}\n")
    else:
        print(f"❌ {tool_name}: {auth['error']}\n")
```

## Further Reading

- [MCP — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — consolidated reference
- [MCP blog — 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — where the protocol is heading
- [a2a-protocol.org](https://a2a-protocol.org/latest/) — A2A v1.0 reference
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — canonical tracing conventions
- [Anthropic — Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) — production agent runtime patterns
