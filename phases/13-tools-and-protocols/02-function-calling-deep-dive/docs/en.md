# Function Calling Deep Dive — OpenAI, Anthropic, Gemini

> The three frontier providers converged on the same tool-call loop in 2024 and then diverged on everything else. OpenAI uses `tools` and `tool_calls`. Anthropic uses `tool_use` and `tool_result` blocks. Gemini uses `functionDeclarations` and unique-id correlation. This lesson diffs the three side by side so code that ships on one provider does not break when you port it.

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01 (the tool interface)
**Time:** ~75 minutes

## Learning Objectives

- State the three shape differences between OpenAI, Anthropic, and Gemini function-calling payloads (declaration, call, result).
- Translate one tool declaration across all three provider formats and predict where strict-mode constraints will differ.
- Use `tool_choice` in each provider to force, forbid, or auto-pick tool calls.
- Know the per-provider hard limits (tool count, schema depth, argument length) and the error signatures each one emits when limits are violated.

## The Problem

The shape of a function-calling request differs by provider. Three concrete examples from 2026 production stacks:

**OpenAI Chat Completions / Responses API.** You pass `tools: [{type: "function", function: {name, description, parameters, strict}}]`. The model's response contains `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]` where `arguments` is a JSON string you must parse. Strict mode (`strict: true`) enforces schema compliance via constrained decoding.

**Anthropic Messages API.** You pass `tools: [{name, description, input_schema}]`. The response comes back as `content: [{type: "text"}, {type: "tool_use", id, name, input}]`. `input` is already parsed (an object, not a string). You reply with a new `user` message containing a `{type: "tool_result", tool_use_id, content}` block.

**Google Gemini API.** You pass `tools: [{functionDeclarations: [{name, description, parameters}]}]` (nested under `functionDeclarations`). The response arrives as `candidates[0].content.parts: [{functionCall: {name, args, id}}]` where `id` is unique in Gemini 3 and up for parallel-call correlation. You reply with `{functionResponse: {name, id, response}}`.

Same loop. Different field names, different nesting, different string-vs-object conventions, different correlation mechanisms. A team that writes a weather agent on OpenAI pays a two-day port to Anthropic and another day to Gemini just for the plumbing.

This lesson builds a translator that unifies the three formats into one canonical tool declaration and routes at the edge. Phase 13 · 17 generalizes the same pattern into an LLM gateway.

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

### The common structure

Every provider needs five things:

1. **Tool list.** Per-tool name, description, and input schema.
2. **Tool choice.** Force a specific tool, forbid tools, or let the model decide.
3. **Call emission.** Structured output naming the tool and arguments.
4. **Call id.** Correlate the response to the right call (matters for parallel).
5. **Result injection.** A message or block that ties the result back to the call.

Here's one canonical tool declaration that represents a weather lookup — the rest of this section translates it into each provider's shape:

```python editable
from dataclasses import dataclass, asdict

@dataclass
class Tool:
    name: str
    description: str
    input_schema: dict
    strict: bool = True

# The canonical weather tool
WEATHER = Tool(
    name="get_weather",
    description="Use when the user asks about current conditions in a named city. Do not use for forecasts or historical weather data.",
    input_schema={
        "type": "object",
        "properties": {
            "city": {"type": "string"},
            "units": {"type": ["string", "null"], "enum": ["celsius", "fahrenheit"]},
        },
        "required": ["city", "units"],
        "additionalProperties": False,
    },
)

print("📋 Canonical Weather Tool:")
print(json.dumps(asdict(WEATHER), indent=2))
```

### Shape diffs, field by field

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | `tool_calls[]` on assistant message | `content[]` of type `tool_use` | `parts[]` of type `functionCall` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...` (OpenAI generates) | `toolu_...` (Anthropic) | UUID (Gemini 3+) |
| Result block | role `tool`, `tool_call_id` | `user` with `tool_result`, `tool_use_id` | `functionResponse` with matching `id` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema (always enforced) | `responseSchema` at request level |

OpenAI wraps the tool in a `type: "function"` envelope, with the schema field called `parameters` and strict mode explicit:

```python editable
def to_openai(tool: Tool) -> dict:
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.input_schema,
            "strict": tool.strict,
        },
    }

openai_decl = to_openai(WEATHER)
print("🔧 OpenAI Declaration:")
print(json.dumps(openai_decl, indent=2))
```

Anthropic flattens the structure: no envelope, the schema field is called `input_schema`, and strict mode is always on because the schema is treated as a contract:

```python editable
def to_anthropic(tool: Tool) -> dict:
    return {
        "name": tool.name,
        "description": tool.description,
        "input_schema": tool.input_schema,
    }

anthropic_decl = to_anthropic(WEATHER)
print("🔧 Anthropic Declaration:")
print(json.dumps(anthropic_decl, indent=2))
```

Gemini nests tools under `functionDeclarations` and converts JSON Schema to its OpenAPI 3.0 subset — notice `"string"` becomes `"STRING"`:

```python editable
def _gemini_schema(node):
    """Recursively convert JSON Schema to Gemini's OpenAPI 3.0 subset."""
    if isinstance(node, dict):
        out = {}
        for k, v in node.items():
            if k == "additionalProperties":
                continue  # Gemini doesn't support this
            if k == "type" and isinstance(v, str):
                out["type"] = v.upper()  # "string" -> "STRING"
                continue
            out[k] = _gemini_schema(v)
        return out
    if isinstance(node, list):
        return [_gemini_schema(x) for x in node]
    return node

def to_gemini(tool: Tool) -> dict:
    return {
        "functionDeclarations": [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": _gemini_schema(tool.input_schema),
            }
        ]
    }

gemini_decl = to_gemini(WEATHER)
print("🔧 Gemini Declaration:")
print(json.dumps(gemini_decl, indent=2))
```

Once the model returns a tool call, each provider shapes it differently — same semantics, different envelope. Extract `id`, `name`, and `args` from each shape into one canonical `Call` object, starting with a hand-crafted OpenAI response as if the model had called `get_weather`:

```python editable
@dataclass
class Call:
    id: str
    name: str
    args: dict

# Hand-crafted OpenAI response (as if the model called get_weather)
OPENAI_RESPONSE = {
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": None,
                "tool_calls": [
                    {
                        "id": "call_abc123",
                        "type": "function",
                        "function": {
                            "name": "get_weather",
                            "arguments": '{"city":"Bengaluru","units":"celsius"}',
                        },
                    }
                ],
            },
            "finish_reason": "tool_calls",
        }
    ]
}

def parse_openai(resp: dict):
    msg = resp["choices"][0]["message"]
    calls = []
    for tc in msg.get("tool_calls", []):
        fn = tc["function"]
        calls.append(Call(id=tc["id"], name=fn["name"], args=json.loads(fn["arguments"])))
    return calls

openai_call = parse_openai(OPENAI_RESPONSE)[0]
print(f"📤 OpenAI Call: {openai_call}")
print(f"  - Arguments were JSON STRING: {repr(OPENAI_RESPONSE['choices'][0]['message']['tool_calls'][0]['function']['arguments'])}")
```

Anthropic returns tool calls as `content[]` blocks of type `tool_use`. Arguments come pre-parsed as a Python dict, not a string:

```python editable
# Hand-crafted Anthropic response
ANTHROPIC_RESPONSE = {
    "id": "msg_01",
    "type": "message",
    "role": "assistant",
    "content": [
        {"type": "text", "text": "Looking that up."},
        {
            "type": "tool_use",
            "id": "toolu_xyz789",
            "name": "get_weather",
            "input": {"city": "Bengaluru", "units": "celsius"},
        },
    ],
    "stop_reason": "tool_use",
}

def parse_anthropic(resp: dict):
    calls = []
    for block in resp.get("content", []):
        if block.get("type") == "tool_use":
            calls.append(Call(id=block["id"], name=block["name"], args=block["input"]))
    return calls

anthropic_call = parse_anthropic(ANTHROPIC_RESPONSE)[0]
print(f"📤 Anthropic Call: {anthropic_call}")
print(f"  - Arguments were already OBJECT: {type(ANTHROPIC_RESPONSE['content'][1]['input']).__name__}")
```

Gemini nests tool calls in `candidates[0].content.parts[]`. The id is a unique correlator for parallel calls since Gemini 3:

```python editable
# Hand-crafted Gemini response
GEMINI_RESPONSE = {
    "candidates": [
        {
            "content": {
                "role": "model",
                "parts": [
                    {
                        "functionCall": {
                            "id": "fc-9a3d",
                            "name": "get_weather",
                            "args": {"city": "Bengaluru", "units": "celsius"},
                        }
                    }
                ],
            },
            "finishReason": "STOP",
        }
    ]
}

def parse_gemini(resp: dict):
    calls = []
    for part in resp["candidates"][0]["content"].get("parts", []):
        if "functionCall" in part:
            fc = part["functionCall"]
            calls.append(Call(id=fc.get("id", ""), name=fc["name"], args=fc["args"]))
    return calls

gemini_call = parse_gemini(GEMINI_RESPONSE)[0]
print(f"📤 Gemini Call: {gemini_call}")
print(f"  - Arguments were OBJECT (like Anthropic)")
```

Despite different wire formats, all three calls *should* carry the same semantic payload: the tool name, arguments, and a correlation id. But "should" isn't "does" — a real equivalence check needs to actually catch it when they don't. Run the check twice: once on three fixtures that genuinely agree (should PASS), and once on a fixture set where Gemini's call has been deliberately corrupted to return Fahrenheit instead of Celsius (should FAIL):

```python editable
def check_equivalence(label, calls):
    print(f"🔎 {label}")
    for c in calls:
        print(f"   {c}")
    names = {c.name for c in calls}
    print(f"   Same tool name?  {names} → unique: {len(names) == 1}")
    args_json = [json.dumps(c.args, sort_keys=True) for c in calls]
    for c, aj in zip(calls, args_json):
        print(f"     {c.id}: {aj}")
    args_unique = len(set(args_json)) == 1
    print(f"   Same arguments?  → unique: {args_unique}")
    return len(names) == 1 and args_unique

# Case A: OpenAI, Anthropic, and Gemini fixtures from above — genuinely agree
agree_ok = check_equivalence(
    "Case A — three providers, same request (expected: agree)",
    [openai_call, anthropic_call, gemini_call],
)
assert agree_ok, "Expected all three providers to agree on this request"
print("   ✅ PASS: equivalence check correctly confirms matching semantics\n")

# Hand-crafted Gemini response, deliberately corrupted: Fahrenheit instead of Celsius
GEMINI_RESPONSE_MISMATCH = {
    "candidates": [
        {
            "content": {
                "role": "model",
                "parts": [
                    {
                        "functionCall": {
                            "id": "fc-77bad",
                            "name": "get_weather",
                            "args": {"city": "Bengaluru", "units": "fahrenheit"},
                        }
                    }
                ],
            },
            "finishReason": "STOP",
        }
    ]
}
gemini_call_mismatch = parse_gemini(GEMINI_RESPONSE_MISMATCH)[0]

# Case B: same OpenAI/Anthropic fixtures, but Gemini's units disagree
mismatch_ok = check_equivalence(
    "Case B — three providers, Gemini's units disagree (expected: FAIL)",
    [openai_call, anthropic_call, gemini_call_mismatch],
)
assert not mismatch_ok, "Equivalence check failed to catch a genuine mismatch"
print("   ❌ FAIL (as expected): equivalence check correctly catches the mismatch")
```

### Limits you will actually hit

- **OpenAI.** 128 tools per request. Schema depth 5. Argument string <= 8192 bytes. Strict mode requires no `$ref`, no `oneOf`/`anyOf`/`allOf` with overlap, every property listed in `required`.
- **Anthropic.** 64 tools per request. Schema depth effectively unbounded but practical limit 10. No strict-mode flag; schema is a contract and the model tends to comply.
- **Gemini.** 64 functions per request. Schema types are OpenAPI 3.0 subset (slight divergence from JSON Schema 2020-12). Parallel calls unique-id since Gemini 3.

```python editable
print("⚠️  Provider Limits (2026 spec):\n")
print("OpenAI:")
print("  - Max tools per request: 128")
print("  - Schema depth: 5")
print("  - Argument string: ≤ 8192 bytes")
print("  - Strict mode: no $ref, no oneOf/anyOf/allOf overlap, every property in required")
print()
print("Anthropic:")
print("  - Max tools per request: 64")
print("  - Schema depth: ~10 practical limit (unbounded spec)")
print("  - No strict-mode flag; schema is always a contract")
print("  - disable_parallel_tool_use flag controls single vs multi-call")
print()
print("Gemini:")
print("  - Max functions per request: 64")
print("  - Uses OpenAPI 3.0 subset (enum on objects silently ignored)")
print("  - Gemini 3+: parallel calls with unique UUIDs for correlation")
print("  - responseSchema at request level, not per-tool")
```

### `tool_choice` behavior

Three modes everyone supports, named differently.

- **Auto.** Model picks tool or text. Default.
- **Required / Any.** Model must call at least one tool.
- **None.** Model must not call tools.

Plus one mode unique to each provider:

- **OpenAI.** Force a specific tool by name.
- **Anthropic.** Force a specific tool by name; `disable_parallel_tool_use` flag separates single vs multi.
- **Gemini.** `mode: "VALIDATED"` routes every response through a schema validator regardless of model intent.

```python editable
from dataclasses import dataclass

@dataclass
class ToolChoice:
    mode: str  # "auto", "none", "required", "force"
    tool_name: str | None = None

def tool_choice_openai(tc: ToolChoice):
    if tc.mode == "auto":
        return "auto"
    if tc.mode == "none":
        return "none"
    if tc.mode == "required":
        return "required"
    if tc.mode == "force":
        return {"type": "function", "function": {"name": tc.tool_name}}
    raise ValueError(tc.mode)

def tool_choice_anthropic(tc: ToolChoice):
    if tc.mode == "auto":
        return {"type": "auto"}
    if tc.mode == "none":
        return {"type": "none"}
    if tc.mode == "required":
        return {"type": "any"}
    if tc.mode == "force":
        return {"type": "tool", "name": tc.tool_name}
    raise ValueError(tc.mode)

def tool_choice_gemini(tc: ToolChoice):
    mode_map = {"auto": "AUTO", "none": "NONE", "required": "ANY"}
    if tc.mode in mode_map:
        return {"function_calling_config": {"mode": mode_map[tc.mode]}}
    if tc.mode == "force":
        return {
            "function_calling_config": {
                "mode": "ANY",
                "allowed_function_names": [tc.tool_name],
            }
        }
    raise ValueError(tc.mode)

print("🎛️  tool_choice: Force the model to call get_weather\n")
tc = ToolChoice(mode="force", tool_name="get_weather")
print(f"OpenAI:")
print(f"  {json.dumps(tool_choice_openai(tc))}")
print(f"\nAnthropic:")
print(f"  {json.dumps(tool_choice_anthropic(tc))}")
print(f"\nGemini:")
print(f"  {json.dumps(tool_choice_gemini(tc))}")
```

Here's the full portability checklist this section has been building toward:

```python editable
print("🎯 Three-Provider Portability Checklist:\n")
print("1️⃣  DECLARATION (shape differences):")
print("   OpenAI:    {'type': 'function', 'function': {...}}")
print("   Anthropic: {'name': ..., 'input_schema': ...}")
print("   Gemini:    {'functionDeclarations': [...]} with uppercase types")
print()
print("2️⃣  RESPONSE PARSING (where the call lives):")
print("   OpenAI:    choices[0].message.tool_calls[].function")
print("   Anthropic: content[].tool_use.input (args already parsed)")
print("   Gemini:    candidates[0].content.parts[].functionCall")
print()
print("3️⃣  ARGUMENTS FORMAT:")
print("   OpenAI:    JSON STRING → must parse")
print("   Anthropic: Python dict (pre-parsed)")
print("   Gemini:    Python dict (pre-parsed)")
print()
print("4️⃣  ID PREFIXES (for correlation):")
print("   OpenAI:    call_...")
print("   Anthropic: toolu_...")
print("   Gemini:    UUID or fc-...")
print()
print("5️⃣  FORCE A TOOL (tool_choice modes):")
print("   OpenAI:    {type: 'function', function: {name: ...}}")
print("   Anthropic: {type: 'tool', name: ...}")
print("   Gemini:    {function_calling_config: {mode: 'ANY', allowed_function_names: [...]}}")
```

### Parallel calls

OpenAI's `parallel_tool_calls: true` (default) emits multiple calls in one assistant message. You run them all and reply with a batched tool-role message containing one entry per `tool_call_id`. Anthropic historically did single-call; `disable_parallel_tool_use: false` (default as of Claude 3.5) enables multi. Gemini 2 allowed parallel calls but did not give stable ids; Gemini 3 adds UUIDs so out-of-order responses correlate cleanly.

### Streaming

All three support streamed tool calls. The wire format differs:

- **OpenAI.** Delta chunks of `tool_calls[i].function.arguments` arrive incrementally. You accumulate until `finish_reason: "tool_calls"`.
- **Anthropic.** Block-start / block-delta / block-stop events. `input_json_delta` chunks carry partial arguments.
- **Gemini.** `streamFunctionCallArguments` (new in Gemini 3) emits chunks with a `functionCallId` so multiple parallel calls can interleave.

Phase 13 · 03 goes deep on parallel + streaming reassembly. This lesson focuses on the declaration and single-call shapes.

### Errors and repair

Invalid-argument errors look different too.

- **OpenAI (non-strict).** Model returns `arguments: "{bad json}"`, your JSON parse fails, you inject an error message and re-call.
- **OpenAI (strict).** Validation happens during decoding; invalid JSON is impossible but `refusal` can appear.
- **Anthropic.** `input` may contain unexpected fields; schema is advisory. Validate server-side.
- **Gemini.** OpenAPI 3.0 quirk: `enum` on object fields silently ignored; validate yourself.

### The translator pattern

A canonical tool declaration in your code looks like this (you pick the shape):

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

Three tiny functions translate it to the three provider shapes. The harness in `code/main.py` does exactly this, then round-trips a fake tool call through each provider's response shape. No network required — this lesson teaches the shapes, not the HTTP.

Going one step further than `main.py`'s fake round-trip, here's a real call to the LLM using the OpenAI-shaped declaration — asking it about the weather and parsing whatever tool call comes back:

```python editable
# Real LLM call with tools in OpenAI format
messages = [{"role": "user", "content": "What is the current weather in Paris? Use Celsius."}]

response = await lrn_llm.call(
    messages,
    system="You are a helpful assistant with access to a weather tool. When asked about weather, use the get_weather function.",
    max_tokens=400,
)

print("📨 Full LLM Response:")
print(json.dumps(response, indent=2)[:500] + "...")
print()
print("📤 Extracted Call (OpenAI parse):")
if response.get("choices") and response["choices"][0].get("message", {}).get("tool_calls"):
    calls = parse_openai(response)
    if calls:
        print(f"  {calls[0]}")
    else:
        print("  (no tool calls returned)")
else:
    print("  (no tool_calls in response; model may not have called the tool)")
```

Production teams wrap this translator in `AbstractToolset` (Pydantic AI), `UniversalToolNode` (LangGraph), or `BaseTool` (LlamaIndex). Phase 13 · 17 ships a gateway that exposes an OpenAI-shaped API in front of any of the three.

## Use It

The "Arguments type" row of the shape-diff table is the bug that actually
ships: OpenAI's `arguments` field is a JSON *string*, Anthropic's `input` and
Gemini's `args` are already parsed objects. Code that treats them the same
breaks on exactly one of the three providers.

```python fillin
import json

openai_call = {"type": "function", "function": {"name": "get_weather", "arguments": '{"city": "Tokyo"}'}}
anthropic_call = {"type": "tool_use", "name": "get_weather", "input": {"city": "Tokyo"}}
gemini_call = {"functionCall": {"name": "get_weather", "args": {"city": "Tokyo"}}}

naive_arguments = openai_call["function"]["arguments"]
print("naive:", type(naive_arguments).__name__, naive_arguments)  # str, not dict -- **naive_arguments would TypeError

def normalize(call):
    if call.get("type") == "function":
        return {"name": call["function"]["name"], "arguments": {{blank:json.loads}}(call["function"]["arguments"])}
    if call.get("type") == "tool_use":
        return {"name": call["name"], "arguments": call[{{blank:"input"}}]}
    if "functionCall" in call:
        return {"name": call["functionCall"]["name"], "arguments": call["functionCall"][{{blank:"args"}}]}
    raise ValueError("unknown call shape")

results = [normalize(c) for c in (openai_call, anthropic_call, gemini_call)]
expected = [{"name": "get_weather", "arguments": {"city": "Tokyo"}}] * 3
if results == expected:
    print("PASS")
else:
    print("WRONG:", results)
```

## Try It Yourself

Edit the code below to experiment with different tool declarations or prompts. Try adding another tool (e.g., `forecast_weather`) and see how each provider would represent both tools.

```python editable
# TODO: Extend the weather tool or add a new tool
# Example: add a 'forecast_weather' tool with date parameter
# Then translate it to OpenAI, Anthropic, and Gemini formats

# Uncomment and modify:
# FORECAST = Tool(
#     name="forecast_weather",
#     description="Get a 7-day forecast for a city.",
#     input_schema={
#         "type": "object",
#         "properties": {
#             "city": {"type": "string"},
#             "days": {"type": "integer", "minimum": 1, "maximum": 7},
#         },
#         "required": ["city", "days"],
#     },
# )
# print("OpenAI Forecast:")
# print(json.dumps(to_openai(FORECAST), indent=2))

print("(Try adding another tool and translating it to all three formats!)")
```

## Further Reading

- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) — canonical reference including strict mode and parallel calls
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) — `tool_use` and `tool_result` block semantics
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) — parallel calls, unique ids, and OpenAPI subset
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) — Gemini's enterprise surface
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) — strict-mode schema enforcement details
