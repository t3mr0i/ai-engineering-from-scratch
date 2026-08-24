# MCP Fundamentals — Primitives, Lifecycle, JSON-RPC Base

> Every integration before MCP was a one-off. The Model Context Protocol, first shipped by Anthropic in November 2024 and now stewarded by the Linux Foundation's Agentic AI Foundation, standardizes discovery and invocation so any client can speak to any server. The 2025-11-25 spec names six primitives (three server, three client), a three-phase lifecycle, and a JSON-RPC 2.0 wire format. Learn those and the rest of the MCP chapter of this phase becomes reading.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 01 through 05 (the tool interface and function calling)
**Time:** ~45 minutes

## Learning Objectives

- Name all six MCP primitives (tools, resources, prompts on the server; roots, sampling, elicitation on the client) and give one use case each.
- Walk through the three-phase lifecycle (initialize, operation, shutdown) and state who sends which message at each phase.
- Parse and emit JSON-RPC 2.0 request, response, and notification envelopes.
- Explain what capability negotiation at `initialize` is and what breaks without it.

## The Problem

Before MCP, every tool-using agent had its own protocol. Cursor had an MCP-shaped but incompatible tool system. Claude Desktop shipped with a different one. VS Code's Copilot extension had a third. A team that built a "Postgres query" tool wrote the same tool three times, each to a different host's API. Reusing it required copying code.

Each vendor published its own API, so every agent-host integration was a one-off.

MCP fixes this by standardizing the wire format. A single MCP server works in every MCP client: Claude Desktop, ChatGPT, Cursor, VS Code, Gemini, Goose, Zed, Windsurf, 300+ clients by April 2026. 110M monthly SDK downloads. 10,000+ public servers. The Linux Foundation took stewardship in December 2025 under the new Agentic AI Foundation.

The spec revision used in this phase is **2025-11-25**. It adds async Tasks (SEP-1686), URL-mode elicitation (SEP-1036), sampling with tools (SEP-1577), incremental scope consent (SEP-835), and OAuth 2.1 resource-indicator semantics. Phase 13 · 09 through 16 cover those extensions. This lesson stops at the base.

## The Concept

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

### Three server primitives

1. **Tools.** Callable actions. Same four-step loop from Phase 13 · 01.
2. **Resources.** Exposed data. Read-only content addressable by URI: `file:///path`, `db://query/...`, custom schemes.
3. **Prompts.** Reusable templates. Slash-commands in the host UI; server supplies the template, client fills arguments.

### Three client primitives

4. **Roots.** The set of URIs the server is allowed to touch. Client declares them; server respects them.
5. **Sampling.** Server requests the client's model to perform a completion. Enables server-hosted agent loops without server-side API keys.
6. **Elicitation.** Server asks the client's user for structured input mid-flight. Forms or URLs (SEP-1036).

Every capability in MCP belongs to exactly one of these six. Phase 13 · 10 through 14 cover each in depth.

### Wire format: JSON-RPC 2.0

Every message is a JSON object with these fields:

- Requests: `{jsonrpc: "2.0", id, method, params}`.
- Responses: `{jsonrpc: "2.0", id, result | error}`.
- Notifications: `{jsonrpc: "2.0", method, params}` — no `id`, no response expected.

The base spec has ~15 methods, grouped by primitive. The important ones:

- `initialize` / `initialized` (handshake)
- `tools/list`, `tools/call`
- `resources/list`, `resources/read`, `resources/subscribe`
- `prompts/list`, `prompts/get`
- `sampling/createMessage` (server-to-client)
- `notifications/tools/list_changed`, `notifications/resources/updated`, `notifications/progress`

Every message is a JSON object with a specific shape — code can classify one by its keys alone, without needing an LLM to describe it. A notification is a request with no `id` (no response expected):

```python editable
def classify_message(msg):
    """Classify a JSON-RPC 2.0 message by its keys, per the spec's own rule:
    a notification is a request with no 'id' (no response expected)."""
    if "method" in msg and "id" not in msg:
        return "notification"
    if "method" in msg:
        return "request"
    if "result" in msg or "error" in msg:
        return "response"
    return "unknown"

examples = {
    "request":      {"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
    "response":     {"jsonrpc": "2.0", "id": 1, "result": {"tools": []}},
    "notification": {"jsonrpc": "2.0", "method": "notifications/initialized"},
}
for expected_kind, msg in examples.items():
    actual_kind = classify_message(msg)
    assert actual_kind == expected_kind, f"{msg} classified as {actual_kind}, expected {expected_kind}"
    print(f"{expected_kind:14} -> {json.dumps(msg)}")
print("\n✅ all three envelope shapes classified correctly")
```

### Three-phase lifecycle

**Phase 1: initialize.**

Client sends `initialize` with its `capabilities` and `clientInfo`. Server responds with its own `capabilities`, `serverInfo`, and the spec version it speaks. Client sends `notifications/initialized` when it has digested the response. From here on, either side can send requests per the negotiated capabilities.

Let's construct the client's `initialize` request and validate it in code — not by asking the model whether it looks right:

```python editable
def validate_initialize_request(msg):
    """Real structural validation, not an LLM opinion: assert every field the MCP
    spec requires for an initialize request is present and correctly shaped."""
    assert msg.get("jsonrpc") == "2.0", "missing/wrong jsonrpc version"
    assert "id" in msg, "initialize is a request, must have an id"
    assert msg.get("method") == "initialize", "wrong method"
    params = msg.get("params", {})
    assert "protocolVersion" in params, "missing protocolVersion"
    assert "clientInfo" in params and "name" in params["clientInfo"], "missing/incomplete clientInfo"
    assert isinstance(params.get("capabilities"), dict), "capabilities must be an object"
    return True

# Build the initialize request as per the lesson domain (notes-server)
initialize_request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2025-11-25",
        "clientInfo": {"name": "learner-client", "version": "1.0.0"},
        "capabilities": {
            "roots": {"listChanged": True},
            "sampling": {},
            "elicitation": {},
        }
    }
}

print("Client initialize request:")
print(json.dumps(initialize_request, indent=2))
assert classify_message(initialize_request) == "request"
validate_initialize_request(initialize_request)
print("\n✅ valid initialize request (jsonrpc, id, method, protocolVersion, clientInfo, capabilities all present)")
```

The server responds with its own capabilities and info. Negotiated capabilities are whatever both sides declared — code computes that intersection directly. Note negotiation is per-direction, not a plain set overlap: server-declared capabilities (`tools`, `resources`, `prompts`) are what the client can now invoke, while client-declared capabilities (`sampling`, `elicitation`) are what the *server* may now request of the client:

```python editable
CLIENT_CAPS = initialize_request["params"]["capabilities"]

# Server's initialize response
server_response = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "protocolVersion": "2025-11-25",
        "serverInfo": {"name": "notes-server", "version": "1.0.0"},
        "capabilities": {
            "tools": {"listChanged": True},
            "resources": {"subscribe": True, "listChanged": True},
            "prompts": {"listChanged": True},
        }
    }
}

print("Server initialize response:")
print(json.dumps(server_response, indent=2))
assert classify_message(server_response) == "response"
assert server_response["id"] == initialize_request["id"], "response id must match the request it answers"

server_caps = server_response["result"]["capabilities"]
# Server-only capabilities (tools, resources, prompts) are what the client can now
# invoke. Client-only capabilities (sampling, elicitation) are what the *server* may
# now request of the client — negotiation is per-direction, not a plain set overlap.
print(f"\nOperations the client can now invoke on the server: {sorted(server_caps.keys())}")
print(f"Capabilities the server may now request of the client: {sorted(CLIENT_CAPS.keys())}")
assert "tools" in server_caps, "server must declare tools capability before tools/list is valid"
```

**Phase 2: operation.**

Bidirectional. Client calls `tools/list` to discover, then `tools/call` to invoke. Server may send `sampling/createMessage` if the client declared that capability. Server may send `notifications/tools/list_changed` when its tool set mutates. Client may send `notifications/roots/list_changed` when the user changes root scope.

After initialization, the client discovers tools. Here's a `tools/list` request and the server's response with a `notes_search` tool:

```python editable
# Client requests the tool list
tools_list_request = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
}

print("Client tools/list request:")
print(json.dumps(tools_list_request, indent=2))

# Server's response with the notes_search tool
tools_list_response = {
    "jsonrpc": "2.0",
    "id": 2,
    "result": {
        "tools": [
            {
                "name": "notes_search",
                "description": "Search for notes by keywords. Returns matching notes with their content.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "limit": {"type": "integer", "minimum": 1, "maximum": 50}
                    },
                    "required": ["query"]
                }
            }
        ]
    }
}

print("\nServer tools/list response:")
print(json.dumps(tools_list_response, indent=2))

def validate_tool_schema(tool):
    """Real JSON-Schema-shape check on a discovered tool, not an LLM opinion."""
    schema = tool["inputSchema"]
    assert schema.get("type") == "object", "tool inputSchema must be an object schema"
    props = schema.get("properties", {})
    for req_field in schema.get("required", []):
        assert req_field in props, f"required field {req_field!r} missing from properties"
    return True

for tool in tools_list_response["result"]["tools"]:
    validate_tool_schema(tool)
print(f"\n✅ {len(tools_list_response['result']['tools'])} tool(s) discovered, schema(s) valid")
```

Now invoke the `notes_search` tool. The server's response is what a real `notes_search` implementation would return for this query — deterministic code, not an LLM asked to improvise a protocol message:

```python editable
# Client calls the notes_search tool
tools_call_request = {
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
        "name": "notes_search",
        "arguments": {"query": "JSON-RPC", "limit": 5}
    }
}

print("Client tools/call request:")
print(json.dumps(tools_call_request, indent=2))
assert classify_message(tools_call_request) == "request"

# The server's response, built the way notes_search itself would build it — not
# fabricated by an LLM asked to "generate something realistic".
NOTES_DB = [
    {"id": "note-14", "title": "JSON-RPC 2.0 intro"},
    {"id": "note-22", "title": "MCP handshake walkthrough"},
]

def notes_search(query, limit=10):
    matches = [n for n in NOTES_DB if query.lower() in n["title"].lower()]
    return matches[:limit]

results = notes_search(**tools_call_request["params"]["arguments"])
tools_call_response = {
    "jsonrpc": "2.0",
    "id": tools_call_request["id"],
    "result": {
        "content": [{"type": "text", "text": f"Found {len(results)} notes matching 'JSON-RPC':"}]
                   + [{"type": "text", "text": f"- {n['id']} {n['title']}"} for n in results],
        "isError": False,
    }
}

print("\nServer tools/call response:")
print(json.dumps(tools_call_response, indent=2))
assert classify_message(tools_call_response) == "response"
assert tools_call_response["id"] == tools_call_request["id"]
assert all(block["type"] == "text" and "text" in block for block in tools_call_response["result"]["content"])
print(f"\n✅ response validated: {len(tools_call_response['result']['content'])} content block(s), isError=False")
```

While operation is in progress, either side can send notifications. A client that actually handles this dispatches on the method name and reacts — it doesn't just read a description of what the notification means:

```python editable
# Server sends a notification (no id, no response expected)
tools_changed_notification = {
    "jsonrpc": "2.0",
    "method": "notifications/tools/list_changed"
}

print("Server sends notification (no response expected):")
print(json.dumps(tools_changed_notification, indent=2))
assert classify_message(tools_changed_notification) == "notification"
assert "id" not in tools_changed_notification, "a notification must not have an id — no response is expected"

# A minimal client-side dispatch table: real handling, not a description of handling.
client_state = {"tool_list_stale": False}

def handle_notification(msg):
    handlers = {
        "notifications/tools/list_changed": lambda: client_state.__setitem__("tool_list_stale", True),
    }
    handler = handlers.get(msg["method"])
    if handler is None:
        raise ValueError(f"no handler registered for notification: {msg['method']}")
    handler()

handle_notification(tools_changed_notification)
assert client_state["tool_list_stale"] is True
print("\n✅ client marked its cached tool list stale — next tools/list will be re-fetched, not reused")
```

**Phase 3: shutdown.**

Either side closes the transport. No structured shutdown method in MCP; the transport (stdio or Streamable HTTP, Phase 13 · 09) carries the end-of-connection signal.

Here's a recap of the three phases, plus proof in code of what breaks if a client skips the initialize handshake — instead of asking an LLM to explain why it would matter:

```python editable
lifecycle = {
    "Phase 1: initialize": "Client and server exchange capabilities; no operations until both have acknowledged",
    "Phase 2: operation": "Bidirectional requests, responses, and notifications. Client discovers and invokes tools; server may send sampling or mutation notifications",
    "Phase 3: shutdown": "Transport closes (no JSON-RPC shutdown method). Either side can initiate."
}

for phase, desc in lifecycle.items():
    print(f"{phase}")
    print(f"  {desc}")
    print()

class MCPClient:
    """Enforces the handshake instead of describing it: tools/call before a
    completed initialize/initialized handshake is a protocol violation, not just
    bad practice."""
    def __init__(self):
        self.initialized = False

    def initialize(self, request, response):
        assert classify_message(request) == "request" and request["method"] == "initialize"
        assert classify_message(response) == "response" and response["id"] == request["id"]
        self.initialized = True

    def call_tool(self, request):
        if not self.initialized:
            raise RuntimeError(
                "protocol violation: tools/call sent before initialize/initialized "
                "completed — the client doesn't yet know what capabilities the "
                "server supports, or even that the server accepted this protocol version"
            )
        return {"dispatched": request["params"]["name"]}

# What breaks if a client skips the handshake: a real exception, not a description.
client = MCPClient()
try:
    client.call_tool(tools_call_request)
    raise AssertionError("expected a RuntimeError — handshake was skipped")
except RuntimeError as e:
    print(f"❌ skipping the handshake: {e}")

# Completing it first makes the same call legal.
client.initialize(initialize_request, server_response)
result = client.call_tool(tools_call_request)
print(f"\n✅ after initialize/initialized: {result}")
```

### Capability negotiation

`capabilities` in the `initialize` handshake is the contract. Example from a server:

```json
{
  "tools": {"listChanged": true},
  "resources": {"subscribe": true, "listChanged": true},
  "prompts": {"listChanged": true}
}
```

The server declares it can emit `tools/list_changed` notifications and supports `resources/subscribe`. The client agrees by declaring its own:

```json
{
  "roots": {"listChanged": true},
  "sampling": {},
  "elicitation": {}
}
```

If the client does not declare `sampling`, the server must not call `sampling/createMessage`. Symmetric: if the server does not declare `resources.subscribe`, the client must not try to subscribe.

This is what prevents ecosystem drift. A client that does not support sampling is still a valid MCP client; a server that does not call `sampling` is still a valid MCP server. They just do not use that feature together.

### Structured content and error shapes

`tools/call` returns a `content` array of typed blocks: `text`, `image`, `resource`. Phase 13 · 14 adds MCP Apps (`ui://` interactive UI) to that list.

Errors use JSON-RPC error codes. The spec-defined additions: `-32002` "Resource not found", `-32603` "Internal error", plus MCP-specific error data as `error.data`.

If the client requests a tool that doesn't exist, the server responds with a JSON-RPC error. A real client branches on `"error" in response`, not on an LLM's description of what an error code means:

```python editable
# JSON-RPC 2.0 standard error codes actually used across this lesson's examples.
JSONRPC_ERROR_CODES = {
    -32700: "Parse error",
    -32600: "Invalid Request",
    -32601: "Method not found",
    -32602: "Invalid params",
    -32603: "Internal error",
}

# Client tries to call a non-existent tool
error_request = {
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
        "name": "notes_delete",
        "arguments": {"id": "unknown"}
    }
}

print("Client request for non-existent tool:")
print(json.dumps(error_request, indent=2))

# Server's error response
error_response = {
    "jsonrpc": "2.0",
    "id": 4,
    "error": {
        "code": -32601,
        "message": "Method not found",
        "data": {"tool": "notes_delete"}
    }
}

print("\nServer error response:")
print(json.dumps(error_response, indent=2))
assert classify_message(error_response) == "response"
assert error_response["error"]["code"] == -32601
assert JSONRPC_ERROR_CODES[error_response["error"]["code"]] == error_response["error"]["message"], \
    "response message doesn't match the standard meaning of this error code"

def handle_response(response):
    """A real client branches on this, rather than reading an LLM's prose about it."""
    if "error" in response:
        code = response["error"]["code"]
        return {"ok": False, "code": code, "meaning": JSONRPC_ERROR_CODES.get(code, "unknown"),
                "message": response["error"]["message"]}
    return {"ok": True, "result": response["result"]}

outcome = handle_response(error_response)
print(f"\n✅ client-side handling: ok={outcome['ok']}, "
      f"{outcome['code']} = {outcome['meaning']!r} (not a made-up description)")
```

### Client capabilities vs tool call details

A common confusion: `capabilities.tools` is whether the server supports tool-list-changed notifications. Whether the client WILL call specific tools is a runtime choice driven by its model, not a capability flag. The capability flag is the spec-level contract. The model's choice is orthogonal.

### Why JSON-RPC and not REST?

JSON-RPC 2.0 (2010) is a lightweight bidirectional protocol. REST is client-initiated. MCP needed server-initiated messages (sampling, notifications), so JSON-RPC with its symmetric request/response shape was a natural fit. JSON-RPC also composes cleanly over stdio and Streamable HTTP without re-inventing HTTP's request shape.

## Try It Yourself

Build your own JSON-RPC envelope (request, response, or notification), classify it with `classify_message` and check it against the spec in code, and — if it's a tool definition — validate its schema with `validate_tool_schema`. Some ideas: build a `prompts/list` request (MCP has three server primitives: tools, resources, prompts), construct a `resources/read` request for a file URI, modify the `notes_search` tool's `inputSchema` and run it through `validate_tool_schema`, or build your own tool definition and validate it the same way.

```python editable
# TODO: Try building your own MCP message!
# Uncomment and modify one of the examples below:

# Example 1: Build a prompts/list request
# your_request = {
#     "jsonrpc": "2.0",
#     "id": 5,
#     "method": "prompts/list"
# }

# Example 2: Build a resources/read request
# your_request = {
#     "jsonrpc": "2.0",
#     "id": 6,
#     "method": "resources/read",
#     "params": {
#         "uri": "file:///notes/personal.txt"
#     }
# }

# Example 3: Create your own tool definition
# your_tool = {
#     "name": "notes_create",
#     "description": "Create a new note with a title and content.",
#     "inputSchema": {
#         "type": "object",
#         "properties": {
#             "title": {"type": "string"},
#             "content": {"type": "string"}
#         },
#         "required": ["title", "content"]
#     }
# }
# your_request = your_tool

print("Modify this cell to build and validate your own MCP message!")
print()
print("Once you've built 'your_request' (or 'your_tool'), uncomment and run this:")
print()
print("""# print(json.dumps(your_request, indent=2))
# print("kind:", classify_message(your_request))
# # if it's a tool definition instead of an envelope:
# # validate_tool_schema(your_tool)
""")
```

## Further Reading

- [Model Context Protocol — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — the canonical spec document
- [Model Context Protocol — Architecture concepts](https://modelcontextprotocol.io/docs/concepts/architecture) — the six-primitive mental model
- [Anthropic — Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) — November 2024 launch post
- [MCP blog — First MCP anniversary](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/) — one-year retrospective and the 2025-11-25 spec changes
- [WorkOS — MCP 2025-11-25 spec update](https://workos.com/blog/mcp-2025-11-25-spec-update) — summary of SEP-1686, 1036, 1577, 835, and 1724

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Name all six MCP primitives (tools, resources, prompts on the server; roots, sampling, elicitation on the client) and give one use case each.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Walk through the three-phase lifecycle (initialize, operation, shutdown) and state who sends which message at each phase.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Parse and emit JSON-RPC 2.0 request, response, and notification envelopes.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Name all six MCP primitives (tools, resources, prompts on the server; roots, sampling, elicitation on the client) and give one use case each,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Parse and emit JSON-RPC 2.0 request, response, and notification envelopes,” and cite a repeatable check rather than relying on visual inspection alone.
