# Building an MCP Server — Python + TypeScript SDKs

> Most MCP tutorials show only stdio hello-worlds. A real server exposes tools plus resources plus prompts, handles capability negotiation, emits structured errors, and works the same across SDKs. This lesson builds a notes server end-to-end: stdlib stdio transport, JSON-RPC dispatch, the three server primitives, and a pure-function style that drops into either the Python SDK's FastMCP or the TypeScript SDK when you graduate.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13 · 06 (MCP fundamentals)
**Time:** ~75 minutes

## Learning Objectives

- Implement `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, and `prompts/get` methods.
- Write a dispatch loop that reads JSON-RPC messages from stdin and writes responses to stdout.
- Emit structured error responses per the JSON-RPC 2.0 spec and MCP's additional codes.
- Graduate a stdlib implementation to FastMCP (Python SDK) or the TypeScript SDK without rewriting tool logic.

## The Problem

Before you can use a remote transport (Phase 13 · 09) or an auth layer (Phase 13 · 16), you need a clean local server. Local means stdio: the server is spawned by the client as a child process, messages flow over stdin/stdout newline-delimited.

The 2025-11-25 spec prescribes that stdio messages are encoded as JSON objects with an explicit `\n` separator. No SSE here; SSE was the old remote mode and is being removed in mid-2026 (Atlassian's Rovo MCP server deprecated it on June 30, 2026; Keboola on April 1, 2026). For stdio, one JSON object per line is the whole wire format.

A notes server is a good shape because it exercises all three server primitives. Tools do mutations (`notes_create`). Resources expose data (`notes://{id}`). Prompts ship templates (`review_note`). The shape of this lesson generalizes to any domain.

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

### Dispatch loop

```
loop:
  line = stdin.readline()
  msg = json.loads(line)
  if has id:
    handle request -> write response
  else:
    handle notification -> no response
```

Three rules:

- Do not print anything to stdout that is not a JSON-RPC envelope. Debug logs go to stderr.
- Every request MUST be matched with a response carrying the same `id`.
- Notifications MUST NOT be responded to.

### Implementing `initialize`

```python
def initialize(params):
    return {
        "protocolVersion": "2025-11-25",
        "capabilities": {
            "tools": {"listChanged": True},
            "resources": {"listChanged": True, "subscribe": False},
            "prompts": {"listChanged": False},
        },
        "serverInfo": {"name": "notes", "version": "1.0.0"},
    }
```

Declare only what you support. The client relies on the capability set to gate features.

### Implementing `tools/list` and `tools/call`

`tools/list` returns `{tools: [...]}` with each entry having `name`, `description`, `inputSchema`. `tools/call` takes `{name, arguments}` and returns `{content: [blocks], isError: bool}`.

Content blocks are typed. The most common:

```json
{"type": "text", "text": "Found 2 notes"}
{"type": "resource", "resource": {"uri": "notes://14", "text": "..."}}
{"type": "image", "data": "<base64>", "mimeType": "image/png"}
```

Tool errors come in two shapes. Protocol-level errors (unknown method, bad params) are JSON-RPC errors. Tool-level errors (valid call but the tool failed) are returned as `{content: [...], isError: true}`. That lets the model see the failure in its context.

The rest of this section builds a working notes server end to end: an in-memory store, three tool executors (`notes_list`, `notes_search`, `notes_create`), the dispatcher that routes JSON-RPC methods to them, and a live LLM deciding which tool to call.

```python editable
import uuid

# In-memory note store
NOTES = {
    "note-1": {"title": "MCP overview", "body": "Primitives: tools, resources, prompts. JSON-RPC over stdio.", "tag": "mcp"},
    "note-2": {"title": "Function calling", "body": "Tools let models invoke external logic.", "tag": "api"},
}

# Tool executors
def exec_notes_list(args):
    tag = args.get("tag")
    items = []
    for nid, note in NOTES.items():
        if tag and note.get("tag") != tag:
            continue
        items.append({"id": nid, "title": note["title"], "tag": note.get("tag", "")})
    return [{"type": "text", "text": json.dumps(items)}]

def exec_notes_search(args):
    q = args["query"].lower()
    limit = args.get("limit", 10)
    hits = []
    for nid, n in NOTES.items():
        if q in n["title"].lower() or q in n["body"].lower():
            hits.append({"id": nid, "title": n["title"]})
    return [{"type": "text", "text": json.dumps(hits[:limit])}]

def exec_notes_create(args):
    nid = f"note-{uuid.uuid4().hex[:6]}"
    NOTES[nid] = {"title": args["title"], "body": args["body"], "tag": args.get("tag", "")}
    return [
        {"type": "text", "text": f"Created {nid}"},
        {"type": "resource", "resource": {"uri": f"notes://{nid}", "text": args["body"]}},
    ]

TOOL_EXECUTORS = {
    "notes_list": exec_notes_list,
    "notes_search": exec_notes_search,
    "notes_create": exec_notes_create,
}

print("✅ Notes server initialized with 2 notes")
```

The tool and prompt definitions — each tool carries the `annotations` described later in this lesson (`readOnlyHint`, `idempotentHint`, `destructiveHint`):

```python editable
# Tool and prompt definitions
TOOLS = [
    {
        "name": "notes_list",
        "description": "List all notes, optionally filtered by tag.",
        "inputSchema": {"type": "object", "properties": {"tag": {"type": "string"}}, "required": []},
        "annotations": {"readOnlyHint": True, "idempotentHint": True},
    },
    {
        "name": "notes_search",
        "description": "Search notes by keyword in title or body.",
        "inputSchema": {
            "type": "object",
            "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}},
            "required": ["query"],
        },
        "annotations": {"readOnlyHint": True},
    },
    {
        "name": "notes_create",
        "description": "Create a new note with title, body, and optional tag.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "body": {"type": "string"},
                "tag": {"type": "string"},
            },
            "required": ["title", "body"],
        },
        "annotations": {"destructiveHint": False},
    },
]

PROMPTS = [
    {
        "name": "review_note",
        "description": "Produce a critique of a note with improvements.",
        "arguments": [{"name": "note_id", "description": "The id of the note to review", "required": True}],
    }
]

print(f"✅ Tool registry: {len(TOOLS)} tools, {len(PROMPTS)} prompt template")
```

The handlers process `initialize`, `tools/list`, `tools/call`, and `resources/list` requests, dispatched from a single `HANDLERS` table:

```python editable
def handle_initialize(params):
    return {
        "protocolVersion": "2025-11-25",
        "capabilities": {
            "tools": {"listChanged": False},
            "resources": {"listChanged": False, "subscribe": False},
            "prompts": {"listChanged": False},
        },
        "serverInfo": {"name": "notes-notebook", "version": "1.0.0"},
    }

def handle_tools_list(params):
    return {"tools": TOOLS}

def handle_tools_call(params):
    name = params["name"]
    args = params.get("arguments", {})
    if name not in TOOL_EXECUTORS:
        return {"content": [{"type": "text", "text": f"unknown tool {name}"}], "isError": True}
    try:
        content = TOOL_EXECUTORS[name](args)
        return {"content": content, "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": str(e)}], "isError": True}

def handle_resources_list(params):
    items = [{"uri": f"notes://{nid}", "name": n["title"], "mimeType": "text/markdown"} for nid, n in NOTES.items()]
    return {"resources": items}

HANDLERS = {
    "initialize": handle_initialize,
    "tools/list": handle_tools_list,
    "tools/call": handle_tools_call,
    "resources/list": handle_resources_list,
}

print(f"✅ Handlers registered: {list(HANDLERS.keys())}")
```

Before bringing an LLM into the loop, test the server by calling handlers directly with JSON-RPC method calls:

```python editable
# Test: initialize
msg = {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
result = HANDLERS["initialize"](msg.get("params", {}))
print(f"initialize → protocolVersion: {result['protocolVersion']}, serverInfo: {result['serverInfo']['name']}")
```

```python editable
# Test: tools/list
msg = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}
result = HANDLERS["tools/list"](msg.get("params", {}))
print(f"tools/list → {len(result['tools'])} tools:")
for t in result["tools"]:
    print(f"  - {t['name']}: {t['description'][:50]}...")
```

```python editable
# Test: tools/call with notes_search
msg = {
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {"name": "notes_search", "arguments": {"query": "MCP"}},
}
result = HANDLERS["tools/call"](msg.get("params", {}))
print(f"notes_search('MCP') → {result['content'][0]['text']}")
```

Now ask an LLM to interact with the notes server by calling tools. The LLM sees the tool definitions and decides which one to invoke:

```python editable
# Ask LLM to decide on a new note to create
messages = [{"role": "user", "content": (
    "We just finished setting up an MCP notes server. Create a note that captures "
    "what MCP servers are for, so future readers have a quick reference. Decide on "
    "a good title and body yourself, and call notes_create with your chosen values."
)}]
system = f"""You are a helpful assistant. You have access to an MCP server with these tools:
{json.dumps([{'name': t['name'], 'description': t['description'], 'inputSchema': t['inputSchema']} for t in TOOLS], indent=2)}

When you want to call a tool, respond with ONLY a JSON object of the form:
{{"name": "<tool_name>", "arguments": {{...}}}}
Do not include any other text."""

r = await lrn_llm.call(messages, system=system, max_tokens=150)
response = lrn_llm.text(r)
print(f"LLM: {response}")

def parse_tool_call(model_reply):
    """Parse a model's freeform reply into an MCP tools/call params dict
    ({"name": ..., "arguments": {...}}), or None if it can't be parsed.

    Reused by the "Try It Yourself" cell below — keep this the single source
    of truth for parsing rather than re-implementing it there.
    """
    try:
        data = json.loads(model_reply)
        if isinstance(data, dict) and "name" in data and "arguments" in data:
            return data
    except Exception:
        pass
    return None

tool_call = parse_tool_call(response)
if tool_call:
    print(f"✅ Parsed tool call: name={tool_call['name']}, arguments={tool_call['arguments']}")
else:
    print("⚠️  Could not parse a tool call from the LLM response")
```

Create a new note through the server, using the tool call the LLM actually decided on — falling back to a clearly-labeled default if parsing failed or the model didn't call `notes_create`:

```python editable
# Create a note using the LLM's parsed decision (or a labeled fallback)
DEFAULT_NOTE_ARGS = {
    "title": "LLM Integration",
    "body": "Connecting language models to tool-calling servers enables dynamic reasoning.",
    "tag": "llm",
}

if (
    tool_call
    and tool_call.get("name") == "notes_create"
    and isinstance(tool_call.get("arguments"), dict)
    and "title" in tool_call["arguments"]
    and "body" in tool_call["arguments"]
):
    create_args = tool_call["arguments"]
    print("✅ Using the LLM's parsed notes_create arguments")
else:
    create_args = DEFAULT_NOTE_ARGS
    print("⚠️  Could not parse a valid notes_create tool call from the LLM — falling back to a clearly-labeled default note")

msg = {
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
        "name": "notes_create",
        "arguments": create_args,
    },
}
result = HANDLERS["tools/call"](msg.get("params", {}))
print(f"notes_create → {result['content'][0]['text']}")
print(f"Total notes now: {len(NOTES)}")
```

Ask the LLM to search for notes and summarize what it finds:

```python editable
# Ask LLM to search and summarize
all_notes = json.dumps([{"id": nid, "title": n["title"], "body": n["body"][:60]} for nid, n in NOTES.items()], indent=2)
messages = [{"role": "user", "content": f"Here are our current notes:\n{all_notes}\n\nWhat themes do you see across them?"}]

r = await lrn_llm.call(messages, system="You are a note analyst. Analyze the themes and patterns.", max_tokens=200)
response = lrn_llm.text(r)
print(f"LLM Analysis:\n{response}")
```

Here's the full workflow end to end — human intent, LLM reasoning, tool execution:

```python editable
# Simulate a full workflow: user request → LLM decides tools → server executes
print("\n=== Full Workflow ===")
print("1. User: 'Create a note about JSON-RPC and then list all mcp-tagged notes.'")
print("2. LLM reasons: 'I need to call notes_create, then notes_list with tag=mcp.'")
print("3. Server executes:")

# Step 1: Create
create_result = TOOL_EXECUTORS["notes_create"]({"title": "JSON-RPC Protocol", "body": "JSON-RPC 2.0 spec defines request/response/notification semantics.", "tag": "mcp"})
print(f"   - notes_create: {create_result[0]['text']}")

# Step 2: List with filter
list_result = TOOL_EXECUTORS["notes_list"]({"tag": "mcp"})
print(f"   - notes_list(tag='mcp'): {list_result[0]['text']}")
print(f"\n4. Result: Now {len(NOTES)} total notes, {len(json.loads(list_result[0]['text']))} tagged 'mcp'")
```

MCP returns results as content blocks — typed elements in the `content` array. Tools can return text, resources, images, or errors:

```python editable
# Demonstrate content block structure
block_types = {
    "text": {"type": "text", "text": "Plain text result"},
    "resource": {"type": "resource", "resource": {"uri": "notes://example", "text": "Resource body"}},
    "error": {"type": "text", "text": "Error message (set isError: true)"},
}

print("MCP Content Block Types:")
for name, block in block_types.items():
    print(f"  {name}: {json.dumps(block)}")

print(f"\nExample: notes_create returns {len(create_result)} blocks:")
for i, b in enumerate(create_result, 1):
    print(f"  Block {i}: type={b.get('type')}, keys={list(b.keys())}")
```

Finally, ask the LLM to reflect on the server's architecture and suggest improvements:

```python editable
# Ask LLM to critique the server
server_spec = f"""MCP Notes Server:
- Tools: notes_list (filter by tag), notes_search (keyword), notes_create (title+body+tag)
- Resources: notes:// URIs for individual notes
- Prompts: review_note (critique a note)
- Storage: in-memory dict
- Annotations: readOnlyHint, destructiveHint for tool safety

Current implementation: {len(NOTES)} notes, pure function style."""

messages = [{"role": "user", "content": f"Design critique: what are 2 limitations of this server, and 1 way to extend it?\n\n{server_spec}"}]

r = await lrn_llm.call(messages, system="You are a software architect reviewing MCP server design.", max_tokens=250)
response = lrn_llm.text(r)
print(f"Architect Review:\n{response}")
```

### Implementing resources

Resources are read-only by design. `resources/list` returns a manifest; `resources/read` returns the content. URIs can be `file://...`, `http://...`, or a custom scheme like `notes://`.

When you expose data as a resource instead of a tool:

- The model does not "call" it; the client can inject it into context on user request.
- Subscriptions let the server push updates when the resource changes (Phase 13 · 10).
- Phase 13 · 14 extends this with `ui://` for interactive resources.

### Implementing prompts

Prompts are templates with named arguments. The host surfaces them as slash-commands. A `review_note` prompt might take a `note_id` argument and produce a multi-message prompt template the client feeds to its model.

### Stdio transport subtleties

- Newline-delimited JSON. No length-prefixed framing.
- Do not buffer. `sys.stdout.flush()` after each write.
- The client controls the lifetime. When stdin closes (EOF), exit cleanly.
- Do not handle SIGPIPE silently; log and exit.

### Annotations

Each tool can carry `annotations` describing safety properties:

- `readOnlyHint: true` — pure read, safe to retry.
- `destructiveHint: true` — irreversible side effects; client should confirm.
- `idempotentHint: true` — calling the tool repeatedly with the same arguments has no additional effect on the environment beyond the first call; safe to retry.
- `openWorldHint: true` — interacts with external systems.

The client uses these to decide UX (confirmation dialogs, status indicators) and routing (Phase 13 · 17).

### Graduation path

The stdlib server in `code/main.py` is about 180 lines. FastMCP (Python) collapses the same logic to decorator-style:

```python
from fastmcp import FastMCP
app = FastMCP("notes")

@app.tool()
def notes_search(query: str, limit: int = 10) -> list[dict]:
    ...
```

The TypeScript SDK has an equivalent shape. The graduation path is drop-in when you are ready; the concepts (capabilities, dispatch, content blocks) are the same.

Here's a summary of what the stdlib implementation above already supports, before it graduates to FastMCP:

```python editable
# Summarize the server capabilities
print("\n=== MCP Server Summary ===")
print(f"Protocol: {HANDLERS['initialize']({}).get('protocolVersion')}")
print(f"Server: {HANDLERS['initialize']({}).get('serverInfo')}")
print(f"Primitives supported:")
for method in HANDLERS:
    print(f"  - {method}")
print(f"\nTools: {', '.join(t['name'] for t in TOOLS)}")
print(f"Stored notes: {list(NOTES.keys())}")
print(f"\nKey insight: This pure-function server can be wrapped by FastMCP for production use.")
```

## Try It Yourself

Create a tool that works with the notes server and ask the LLM to use it. Define a new tool (e.g., `notes_tag_rename` to rename a tag across all notes, or `notes_export` to return notes as markdown). Then add it to `TOOL_EXECUTORS`, call the LLM with the updated tool definition, and invoke it. Below is a worked example that renames a tag — start by editing it.

```python editable
# TODO: Implement a new tool for the notes server
# Example: notes_tag_rename(old_tag: str, new_tag: str) -> str

# Step 1: Define the executor
def exec_notes_tag_rename(args):
    """Rename a tag across all notes."""
    old_tag = args["old_tag"]
    new_tag = args["new_tag"]
    count = 0
    for note in NOTES.values():
        if note.get("tag") == old_tag:
            note["tag"] = new_tag
            count += 1
    return [{"type": "text", "text": f"Renamed tag '{old_tag}' to '{new_tag}' in {count} notes"}]

# Step 2: Add to registry
TOOL_EXECUTORS["notes_tag_rename"] = exec_notes_tag_rename

# Step 3: Add to tool definitions
TOOLS.append({
    "name": "notes_tag_rename",
    "description": "Rename a tag across all notes.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "old_tag": {"type": "string"},
            "new_tag": {"type": "string"},
        },
        "required": ["old_tag", "new_tag"],
    },
    "annotations": {"destructiveHint": True},
})

print(f"✅ Added notes_tag_rename tool")
print(f"Total tools: {len(TOOLS)}")

# Step 4: Ask LLM to use it
messages = [{"role": "user", "content": "Rename the 'api' tag to 'function-calling' in all notes. Show me the result."}]
system = f"""You have access to tools: {json.dumps([{'name': t['name'], 'description': t['description'], 'inputSchema': t['inputSchema']} for t in TOOLS], indent=2)}

When you want to call a tool, respond with ONLY a JSON object of the form:
{{"name": "<tool_name>", "arguments": {{...}}}}
Do not include any other text."""

r = await lrn_llm.call(messages, system=system, max_tokens=150)
response = lrn_llm.text(r)
print(f"\nLLM Response: {response}")

# Step 5: Parse the tool call the LLM actually chose (reuses parse_tool_call from above)
DEFAULT_RENAME_ARGS = {"old_tag": "api", "new_tag": "function-calling"}
rename_call = parse_tool_call(response)
if (
    rename_call
    and rename_call.get("name") == "notes_tag_rename"
    and isinstance(rename_call.get("arguments"), dict)
    and "old_tag" in rename_call["arguments"]
    and "new_tag" in rename_call["arguments"]
):
    rename_args = rename_call["arguments"]
    print("✅ Using the LLM's parsed notes_tag_rename arguments")
else:
    rename_args = DEFAULT_RENAME_ARGS
    print("⚠️  Could not parse a valid notes_tag_rename tool call from the LLM — falling back to a clearly-labeled default")

# Step 6: Execute using the parsed (or default) arguments
result = TOOL_EXECUTORS["notes_tag_rename"](rename_args)
print(f"Execute: {result[0]['text']}")
print(f"Updated notes: {json.dumps({nid: n['tag'] for nid, n in NOTES.items()}, indent=2)}")
```

## Use It

The dispatch loop's core rule — every request gets a response with the same
`id`, notifications never get one — is easy to get wrong by responding to
everything that comes off the wire.

```python fillin
messages = [
    {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}},
    {"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}},  # no id -> notification
    {"jsonrpc": "2.0", "id": 2, "method": "unknown/method", "params": {}},
]

def handle(msg):
    if msg["method"] == "tools/list":
        return {"tools": []}
    raise KeyError(msg["method"])

def naive_dispatch(messages):
    return [{"jsonrpc": "2.0", "id": msg.get("id"), "note": "responded"} for msg in messages]

print("naive:", len(naive_dispatch(messages)), "responses")  # 3 -- one for the notification too, spec violation

def dispatch(messages):
    responses = []
    for msg in messages:
        is_request = {{blank:"id" in msg}}
        if not is_request:
            continue  # notifications MUST NOT be responded to
        try:
            result = handle(msg)
            responses.append({"jsonrpc": "2.0", "id": msg["id"], "result": result})
        except KeyError:
            responses.append({
                "jsonrpc": "2.0",
                "id": msg["id"],
                "error": {"code": {{blank:-32601}}, "message": "Method not found"},
            })
    return responses

results = dispatch(messages)
expected = [
    {"jsonrpc": "2.0", "id": 1, "result": {"tools": []}},
    {"jsonrpc": "2.0", "id": 2, "error": {"code": -32601, "message": "Method not found"}},
]
if results == expected:
    print("PASS")
else:
    print("WRONG:", results)
```


## Further Reading

- [Model Context Protocol — Python SDK](https://github.com/modelcontextprotocol/python-sdk) — the reference Python implementation
- [Model Context Protocol — TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — parallel TS implementation
- [FastMCP — server framework](https://gofastmcp.com/) — decorator-style Python API for MCP servers
- [MCP — Quickstart server guide](https://modelcontextprotocol.io/quickstart/server) — end-to-end tutorial using either SDK
- [MCP — Server tools spec](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) — complete reference for tools/* messages

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Implement `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, and `prompts/get` methods.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Write a dispatch loop that reads JSON-RPC messages from stdin and writes responses to stdout.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Emit structured error responses per the JSON-RPC 2.0 spec and MCP's additional codes.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Implement `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, and `prompts/get` methods,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Emit structured error responses per the JSON-RPC 2.0 spec and MCP's additional codes,” and cite a repeatable check rather than relying on visual inspection alone.
