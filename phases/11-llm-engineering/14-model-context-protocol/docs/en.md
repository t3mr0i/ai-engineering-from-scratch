# Model Context Protocol (MCP)

> Every LLM app built before 2025 invented its own tool schema. Then Anthropic shipped MCP, Claude adopted it, OpenAI adopted it, and by 2026 it is the default wire format for connecting any LLM to any tool, data source, or agent.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 03 (Structured Outputs)
**Time:** ~75 minutes

## Learning Objectives

- Explain the production problem addressed by Model Context Protocol (MCP)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## The Problem

You ship a chatbot that needs three tools: a database query, a calendar API, and a file reader. You write three JSON schemas for Claude. Then sales wants the same tools in ChatGPT — you rewrite them for OpenAI's `tools` parameter. Then you add Cursor, Zed, and Claude Code — three more rewrites, each with subtly different JSON conventions. A week later, Anthropic adds a new field; you update six schemas.

This was the pre-2025 reality. Every host (the thing running an LLM) and every server (the thing exposing tools and data) shipped bespoke protocols. Scaling meant an N×M integration matrix.

Model Context Protocol collapses that matrix. One JSON-RPC-based spec. One server exposes tools, resources, and prompts. Any compliant host — Claude Desktop, ChatGPT, Cursor, Claude Code, Zed, and a long tail of agent frameworks — can discover and call them without custom glue.

MCP is the default tool-and-context protocol across the big three (Anthropic, OpenAI, Google) and every major agent harness.

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

![MCP: one host, one server, three capabilities](../assets/mcp-architecture.svg)

**The three primitives.** An MCP server exposes exactly three things.

1. **Tools** — functions the model can call. Analog of OpenAI's `tools` or Anthropic's `tool_use`. Each has a name, description, JSON Schema input, and a handler.
2. **Resources** — read-only content the model or user can request (files, database rows, API responses). Addressed by URI.
3. **Prompts** — reusable templated prompts the user can invoke as shortcuts.

Here's a minimal in-memory MCP server implementing all three primitives as a pure Python class — no external `mcp` package needed:

```python editable
import queue
from dataclasses import dataclass
from typing import Any, Callable

PROTOCOL_VERSION = "2025-06-18"

@dataclass
class Tool:
    name: str
    description: str
    input_schema: dict[str, Any]
    handler: Callable[..., Any]
    destructive: bool = False

@dataclass
class Resource:
    uri: str
    description: str
    handler: Callable[[], str]

@dataclass
class Prompt:
    name: str
    description: str
    arguments: list[str]
    handler: Callable[..., str]

class MCPServer:
    """Minimal MCP server implementing the three primitives."""
    def __init__(self, name: str):
        self.name = name
        self.tools = {}
        self.resources = {}
        self.prompts = {}
    
    def tool(self, name: str, description: str, schema: dict, *, destructive=False):
        def decorator(fn):
            self.tools[name] = Tool(name, description, schema, fn, destructive)
            return fn
        return decorator
    
    def resource(self, uri: str, description: str):
        def decorator(fn):
            self.resources[uri] = Resource(uri, description, fn)
            return fn
        return decorator
    
    def prompt(self, name: str, description: str, arguments: list):
        def decorator(fn):
            self.prompts[name] = Prompt(name, description, arguments, fn)
            return fn
        return decorator
    
    def handle(self, message: dict) -> dict:
        method = message.get("method")
        params = message.get("params") or {}
        request_id = message.get("id")
        try:
            if method == "initialize":
                result = {
                    "protocolVersion": PROTOCOL_VERSION,
                    "serverInfo": {"name": self.name, "version": "0.1.0"},
                    "capabilities": {"tools": {}, "resources": {}, "prompts": {}},
                }
            elif method == "tools/list":
                result = {"tools": [
                    {"name": t.name, "description": t.description,
                     "inputSchema": t.input_schema,
                     "annotations": {"destructiveHint": t.destructive} if t.destructive else {}}
                    for t in self.tools.values()
                ]}
            elif method == "tools/call":
                tool = self.tools[params["name"]]
                output = tool.handler(**params.get("arguments", {}))
                result = {"content": [{"type": "text", "text": json.dumps(output)}]}
            elif method == "resources/list":
                result = {"resources": [
                    {"uri": r.uri, "description": r.description} for r in self.resources.values()
                ]}
            elif method == "resources/read":
                res = self.resources[params["uri"]]
                result = {"contents": [{"uri": res.uri, "mimeType": "text/plain", "text": res.handler()}]}
            elif method == "prompts/list":
                result = {"prompts": [
                    {"name": p.name, "description": p.description,
                     "arguments": [{"name": a, "required": True} for a in p.arguments]}
                    for p in self.prompts.values()
                ]}
            elif method == "prompts/get":
                p = self.prompts[params["name"]]
                rendered = p.handler(**params.get("arguments", {}))
                result = {"messages": [{"role": "user", "content": {"type": "text", "text": rendered}}]}
            else:
                return {"jsonrpc": "2.0", "id": request_id,
                        "error": {"code": -32601, "message": f"unknown method: {method}"}}
        except KeyError as e:
            return {"jsonrpc": "2.0", "id": request_id,
                    "error": {"code": -32602, "message": f"missing key: {e}"}}
        return {"jsonrpc": "2.0", "id": request_id, "result": result}

print("✅ MCPServer class defined")
```

**The wire format.** JSON-RPC 2.0 over stdio or streamable HTTP. Every message is `{"jsonrpc": "2.0", "method": "...", "params": {...}, "id": N}`. Discovery methods are `tools/list`, `resources/list`, `prompts/list`. Invocation methods are `tools/call`, `resources/read`, `prompts/get`.

Populate the server with a demo domain: a read-only `add` tool, a destructive `delete_user` tool, an `app_config` resource, and a `code_review` prompt.

```python editable
# Create the server instance
server = MCPServer("demo-server")

# Register a read-only tool
@server.tool(
    name="add",
    description="Add two integers and return the sum.",
    schema={"type": "object",
            "properties": {"a": {"type": "integer"}, "b": {"type": "integer"}},
            "required": ["a", "b"]}
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}

# Register a destructive (mutation) tool
@server.tool(
    name="delete_user",
    description="Delete a user by id. Mutating; requires approval.",
    schema={"type": "object",
            "properties": {"user_id": {"type": "integer"}},
            "required": ["user_id"]},
    destructive=True
)
def delete_user(user_id: int) -> dict:
    return {"deleted": user_id, "note": "simulated; real impl would hit DB"}

# Register a resource (read-only data)
@server.resource(
    uri="config://app",
    description="Application config as JSON text."
)
def app_config() -> str:
    return json.dumps({"env": "prod", "region": "us-east-1"})

# Register a prompt template
@server.prompt(
    name="code_review",
    description="Prompt the model to review code in a language.",
    arguments=["language", "code"]
)
def code_review(language: str, code: str) -> str:
    return f"You are a senior {language} reviewer. Review for correctness and style:\n\n{code}"

print(f"✅ Server '{server.name}' initialized with {len(server.tools)} tools, {len(server.resources)} resource(s), {len(server.prompts)} prompt(s)")
```

When a client connects, it calls `tools/list` to see what tools the server offers — this is what the LLM host uses to populate its tool budget:

```python editable
# Simulate a client discovery request
message = {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
response = server.handle(message)
tools_list = response["result"]["tools"]
print(f"\n📋 {len(tools_list)} tool(s) available:\n")
for t in tools_list:
    flag = " [DESTRUCTIVE]" if t.get("annotations", {}).get("destructiveHint") else ""
    print(f"  • {t['name']}{flag}")
    print(f"    {t['description']}")
    print(f"    Input: {json.dumps(t['inputSchema'], indent=6)}")
    print()
```

The client calls a tool by name with arguments. The server executes the handler and returns the result as JSON:

```python editable
# Simulate a client tool call
message = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {"name": "add", "arguments": {"a": 40, "b": 2}}
}
response = server.handle(message)
result_text = response["result"]["content"][0]["text"]
print(f"\nCalled: add(40, 2)")
print(f"Result: {result_text}")
```

Resources are read-only data the LLM can request by URI. Unlike tools, they cannot mutate state:

```python editable
# List resources
message = {"jsonrpc": "2.0", "id": 3, "method": "resources/list", "params": {}}
response = server.handle(message)
resources = response["result"]["resources"]
print(f"📦 {len(resources)} resource(s):\n")
for r in resources:
    print(f"  • {r['uri']}: {r['description']}")

# Read one resource
message = {"jsonrpc": "2.0", "id": 4, "method": "resources/read", "params": {"uri": "config://app"}}
response = server.handle(message)
config_text = response["result"]["contents"][0]["text"]
print(f"\nRead config://app:")
print(f"  {config_text}")
```

Prompts are user-invoked templates that can have arguments. The model never calls them directly; the user asks for a prompt via slash-command, the client renders it, and sends the result to the model:

```python editable
# List prompts
message = {"jsonrpc": "2.0", "id": 5, "method": "prompts/list", "params": {}}
response = server.handle(message)
prompts = response["result"]["prompts"]
print(f"🎯 {len(prompts)} prompt(s):\n")
for p in prompts:
    args_str = ", ".join([a["name"] for a in p["arguments"]])
    print(f"  • {p['name']}({args_str})")
    print(f"    {p['description']}")

# Render a prompt with arguments
message = {
    "jsonrpc": "2.0",
    "id": 6,
    "method": "prompts/get",
    "params": {"name": "code_review", "arguments": {"language": "Python", "code": "x = 1\n"}}
}
response = server.handle(message)
rendered = response["result"]["messages"][0]["content"]["text"]
print(f"\nRender code_review(language='Python', code='x = 1\\n'):")
print(f"---")
print(rendered)
print(f"---")
```

**Host vs client vs server.** The host is the LLM application (Claude Desktop). The client is a sub-component of the host that speaks to exactly one server. The server is your code. One host can mount many servers simultaneously.

Now pair this MCP server with a real LLM: send the tool schemas from `tools/list` to the model, ask it a question, and let it decide which tool to call. This is what a real MCP host like Claude Desktop would do:

```python editable
# Get the tool schemas from the server
message = {"jsonrpc": "2.0", "id": 7, "method": "tools/list", "params": {}}
response = server.handle(message)
tool_schemas = response["result"]["tools"]

# Build the tools parameter for the LLM
# (This is what a real MCP host like Claude Desktop would do)
tools_for_llm = [
    {
        "type": "function",
        "function": {
            "name": t["name"],
            "description": t["description"],
            "parameters": t["inputSchema"]
        }
    }
    for t in tool_schemas
]

# Ask the LLM to perform a calculation using the add tool
messages = [{"role": "user", "content": "What is the sum of 100 and 50? Use the add tool to compute it."}]
system_prompt = "You are a helpful assistant with access to these tools. When the user asks you to compute something, use the appropriate tool. After you call a tool, wait for the result and respond naturally."

response = await lrn_llm.call(messages, system=system_prompt, max_tokens=300)
response_text = lrn_llm.text(response)
print("User: What is the sum of 100 and 50? Use the add tool to compute it.")
print(f"\nModel: {response_text}")
```

### The handshake

Every session opens with `initialize`. The client sends protocol version and its capabilities (which include `roots`, since roots are a client-side primitive). The server responds with its version, name, and the capability set it supports (`tools`, `resources`, `prompts`, `logging`). Everything after is negotiated against those capabilities.

### What MCP is not

- Not a retrieval API. RAG (Phase 11 · 06) still decides what to pull; MCP is the transport for exposing retrieval results as resources.
- Not an agent framework. MCP is the plumbing; frameworks like LangGraph, PydanticAI, and OpenAI Agents SDK sit above it.
- Not tied to Anthropic. The spec and reference implementations are open source under the `modelcontextprotocol` org.

### Destructive Tools and Approval

In a real agentic flow, the model emits a tool_use block rather than free text. Here's a simulation of that: ask the model to describe what tool it would call for a mutating operation, then a host would execute it:

```python editable
# Ask the model what operation it would perform
messages = [
    {"role": "user", "content": "I want to delete user 42. Which tool would you use, and what arguments?"}
]
system = "You are a helpful assistant. When the user asks about a tool operation, name the tool and list the arguments as JSON."
response = await lrn_llm.call(messages, system=system, max_tokens=150)
model_plan = lrn_llm.text(response)
print("User: I want to delete user 42. Which tool would you use, and what arguments?")
print(f"\nModel: {model_plan}")
print(f"\n[In a real agentic loop, the host would now call the tool with the model-suggested parameters...]")
```

When a tool is marked `destructiveHint: true`, the host surfaces an approval UI before calling it — this metadata flows straight through the `tools/list` response:

```python editable
# Show the destructive hint for delete_user
message = {"jsonrpc": "2.0", "id": 8, "method": "tools/list", "params": {}}
response = server.handle(message)
tools_list = response["result"]["tools"]
destructive_tools = [t for t in tools_list if t.get("annotations", {}).get("destructiveHint")]

print(f"🚨 {len(destructive_tools)} destructive tool(s) found:\n")
for t in destructive_tools:
    print(f"  ⚠️  {t['name']}")
    print(f"     {t['description']}")
    print(f"     Requires: human approval before execution")
    print()
```

### The Agentic Loop in Practice

MCP itself is stateless — each request is independent. An agentic host wraps it in a loop: get tools, ask the model, model calls a tool, execute the tool, inject the result back into the conversation, loop:

```python editable
# Simulate a multi-turn loop: user query → model thinks → tool call → result → model responds
query = "What is 15 + 8? Then check our app config."
conversation = [{"role": "user", "content": query}]

# Step 1: Ask the model what it needs
system = (
    "You are a helpful assistant. When asked to compute or fetch data, describe what tools you would call.\n"
    "Available tools: add (adds two integers), config (gets app config). Keep responses under 100 words."
)
response = await lrn_llm.call(conversation, system=system, max_tokens=100)
model_reply = lrn_llm.text(response)
print(f"🔄 Turn 1: Model Planning")
print(f"User: {query}")
print(f"Model: {model_reply}")
print()

# Step 2: Execute tools (simulated)
print(f"🔧 Turn 2: Tool Execution (simulated)")
add_result = {"sum": 23}  # 15 + 8
config_result = {"env": "prod", "region": "us-east-1"}
print(f"  Executed add(15, 8) → {add_result}")
print(f"  Executed read(config://app) → {config_result}")
print()

# Step 3: Send results back to model for synthesis
conversation.append({"role": "assistant", "content": model_reply})
conversation.append({"role": "user", "content": f"Tool results: add(15,8)={add_result['sum']}, config={json.dumps(config_result)}"})
response = await lrn_llm.call(conversation, system=system, max_tokens=150)
final_reply = lrn_llm.text(response)
print(f"💬 Turn 3: Final Response")
print(f"Model: {final_reply}")
```

## Try It Yourself

Design your own MCP tool. What domain would benefit from a tool server? Define a tool, resource, or prompt using the `server` from above.

```python editable
# TODO: Create your own MCP tool
# Example domains: weather API, note-taking, expense tracking, ticket system

# Uncomment and edit this example:
# @server.tool(
#     name="fetch_weather",
#     description="Get the current weather for a city.",
#     schema={
#         "type": "object",
#         "properties": {"city": {"type": "string"}},
#         "required": ["city"]
#     }
# )
# def fetch_weather(city: str) -> dict:
#     # In reality, this would call an API
#     return {"city": city, "temp_c": 22, "condition": "sunny"}

print("🎯 Define your tool above and test it!")
print("\nExample: Add a weather tool, then:")
print("  msg = {'jsonrpc': '2.0', 'id': 99, 'method': 'tools/call',")
print("         'params': {'name': 'fetch_weather', 'arguments': {'city': 'Berlin'}}}")
print("  result = server.handle(msg)")
print("  print(result['result']['content'][0]['text'])")
```

## Further Reading

- [Model Context Protocol specification](https://modelcontextprotocol.io/specification) — canonical reference, versioned by date.
- [Anthropic — Introducing MCP (Nov 2024)](https://www.anthropic.com/news/model-context-protocol) — launch post with design rationale.
- [Security considerations for MCP](https://modelcontextprotocol.io/docs/concepts/security) — roots, destructive hints, tool poisoning.
