# The Tool Interface — Why Agents Need Structured I/O

> A language model produces tokens. A program takes actions. The gap between those two is the tool interface: a contract that lets the model request an action and the host execute it. Every 2026 stack — function calling on OpenAI, Anthropic, and Gemini; MCP's `tools/call`; A2A's task parts — is a different encoding of the same four-step loop. This lesson names the loop and shows the minimum machinery to run it.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~95 minutes

## Learning Objectives

- Explain why an LLM that can only generate text cannot, on its own, take actions against the real world.
- Draw the four-step tool-call loop (describe → decide → execute → observe) and name who owns each step.
- Write a tool description as three parts: name, JSON Schema input, and a deterministic executor function.
- Distinguish pure and side-effecting tools and state why the split matters for safety.

## The Problem

An LLM emits a probability distribution over the next token. That is the entire output surface. If you ask a chat model "what is the weather in Bengaluru right now," it can write a plausible sentence, but it cannot dial into a weather API. The sentence might be right by coincidence or three days stale.

Closing that gap is the purpose of the tool interface. The host program — your agent runtime, Claude Desktop, ChatGPT, Cursor, or a custom script — advertises a list of callable tools to the model. The model, when it decides an action is needed, emits a structured payload naming a tool and its arguments. The host parses that payload, runs the tool for real, and feeds the result back. The loop continues until the model decides no more calls are needed.

The first version of this contract shipped in June 2023 as OpenAI's "functions" parameter. Anthropic followed with `tool_use` blocks in Claude 2.1. Gemini added `functionDeclarations` a few months later. Every provider now exposes the same shape: a JSON-Schema-typed tool list in, a JSON-payload tool call out. The Model Context Protocol (November 2024) generalized the contract so one tool registry serves every model. A2A (April 2026, v1.0) layered the same primitive for agent-to-agent delegation.

The four-step loop is the invariant underneath all of these. Everything else in Phase 13 is an elaboration.

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

### Step one: describe

The host declares each tool with three fields.

- **Name.** A stable, machine-readable identifier. `get_weather`, not "weather thing".
- **Description.** A one-paragraph natural-language brief. "Use when the user asks about current conditions for a specific city. Do not use for historical data."
- **Input schema.** A JSON Schema object (draft 2020-12) describing the tool's arguments.

The model receives the list. Modern providers serialize these declarations into the system prompt using a provider-specific template, so you as the caller only deal with the structured form.

Here's a registry of three pure, read-only tools — each with a name, description, JSON Schema input, and a deterministic executor function:

```python editable
import datetime as dt

def tool_add(args):
    return {"sum": args["a"] + args["b"]}

def tool_get_time(args):
    tz = args.get("timezone", "UTC")
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    return {"now": now, "timezone": tz}

def tool_get_weather(args):
    fake = {"Bengaluru": 28, "Tokyo": 12, "Zurich": 4, "Lagos": 31}
    city = args["city"]
    units = args.get("units", "celsius")
    temp = fake.get(city, 20)
    return {"city": city, "temp": temp, "units": units}

tools_registry = [
    {
        "name": "add",
        "description": "Use when the user asks for the sum of two numbers. Do not use for subtraction, product, or symbolic algebra.",
        "input_schema": {
            "type": "object",
            "properties": {
                "a": {"type": "number"},
                "b": {"type": "number"},
            },
            "required": ["a", "b"],
        },
        "executor": tool_add,
    },
    {
        "name": "get_time",
        "description": "Use when the user asks what time it is. Do not use for historical dates or future scheduling.",
        "input_schema": {
            "type": "object",
            "properties": {
                "timezone": {"type": "string"},
            },
            "required": [],
        },
        "executor": tool_get_time,
    },
    {
        "name": "get_weather",
        "description": "Use when the user asks about current conditions in a named city. Do not use for forecasts or historical weather data.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "units": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": ["city"],
        },
        "executor": tool_get_weather,
    },
]

print(f"✅ Registry initialized with {len(tools_registry)} tools")
for t in tools_registry:
    print(f"   - {t['name']}: {t['description'][:60]}...")
```

The **describe** step advertises all tools to the model. Each tool is formatted into a structured declaration:

```python editable
def build_tool_declarations(tools):
    """Build the tool declaration list for the LLM."""
    tools_json = []
    for tool in tools:
        tools_json.append({
            "name": tool["name"],
            "description": tool["description"],
            "input_schema": tool["input_schema"]
        })
    return tools_json

tool_declarations = build_tool_declarations(tools_registry)
print("Tools available to the model:")
for decl in tool_declarations:
    print(f"\n  {decl['name']}")
    print(f"    Description: {decl['description']}")
    print(f"    Input schema: {json.dumps(decl['input_schema'], indent=6)}")
```

### Step two: decide

Given the user's message and the available tools, the model chooses one of three behaviors.

1. **Answer directly** in text. No tool call.
2. **Call one or more tools.** Emit structured call objects. Under `parallel_tool_calls: true` (default on OpenAI and Gemini, opt-in on Anthropic) the model can emit multiple calls in one turn.
3. **Refuse.** Strict-mode structured outputs can produce a typed `refusal` block instead of a call.

A tool call payload has three stable fields: a call `id`, a tool `name`, and a JSON `arguments` object. The id exists so the host can correlate the later result with the specific call, which matters when parallel calls come back out of order.

The example below is deliberately the weak baseline, not the recommended solution: asking the model in a system prompt to "respond with a JSON object" and hoping it complies is exactly the prompt-and-pray pattern this lesson exists to move you past. Nothing validates that the model returns that shape, no API enforces a schema, and free-text JSON is trivially broken by the model adding a sentence before or after it. Production code uses the provider's native function-calling API instead — a structured `tools` parameter in, a typed `tool_calls` field out. The parse/execute/feed-back plumbing below is the same either way; only *how the model is asked* differs.

```python editable
user_query = "What is the weather in Bengaluru?"
print(f"User: {user_query}")
print("\n--- Sending to model with tool declarations (freeform JSON baseline) ---\n")

system_prompt = (
    "You are a helpful assistant with access to a set of tools. "
    "When the user asks a question that requires using a tool, "
    "respond with a JSON object containing the tool name and arguments. "
    "Format: {\"tool_name\": \"...\", \"arguments\": {...}}"
)

messages = [{"role": "user", "content": user_query}]
resp = await lrn_llm.call(messages, system=system_prompt, max_tokens=200)
model_reply = lrn_llm.text(resp)
print(f"Model response:\n{model_reply}")
```

On this freeform baseline, the host must parse the model's raw text into a structured call before it can validate and execute it — a real function-calling API skips this step and hands back an already-typed `tool_calls` field:

```python editable
import re

def parse_tool_call(model_reply):
    """Parse a model's freeform reply into a tool call dict, or None if it can't be parsed.

    Reused by the "Try It Yourself" cell below — keep this the single source
    of truth for parsing rather than re-implementing it there.
    """
    tool_call = None
    try:
        # Try to parse as JSON
        data = json.loads(model_reply)
        if "tool_name" in data and "arguments" in data:
            tool_call = data
    except:
        pass

    if not tool_call:
        # Fallback: extract from text
        match = re.search(r'get_weather.*?city.*?Bengaluru', model_reply, re.IGNORECASE | re.DOTALL)
        if match:
            tool_call = {"tool_name": "get_weather", "arguments": {"city": "Bengaluru"}}

    return tool_call

# Parse the model's response to extract tool call
tool_call = parse_tool_call(model_reply)

if tool_call:
    print(f"✅ Parsed tool call:")
    print(f"   Tool: {tool_call['tool_name']}")
    print(f"   Arguments: {tool_call['arguments']}")
else:
    print(f"⚠️  No tool call detected in model response")
```

### Step three: execute

The host receives the call, validates arguments against the declared schema, and runs the executor. Invalid arguments mean the model hallucinated a field or used the wrong type — a very common failure mode on weak models. Production hosts do one of three things on invalid arguments: fail fast and surface the error to the model, repair the JSON with a constrained parser, or retry the model with the validation error included in the prompt.

The executor itself is ordinary code. Python, TypeScript, a shell command, a database query. It produces a result, which is usually a string but can be any JSON value or a structured content block (text, image, or resource reference in MCP). The result must be serializable.

```python editable
def validate_schema(schema, value):
    """Simple JSON Schema validator (types, required, enum)."""
    errors = []
    t = schema.get("type")
    if t == "object":
        if not isinstance(value, dict):
            return [f"expected object, got {type(value).__name__}"]
        for field in schema.get("required", []):
            if field not in value:
                errors.append(f"missing required field '{field}'")
        for key, sub in schema.get("properties", {}).items():
            if key in value:
                errors.extend(validate_schema(sub, value[key]))
        return errors
    if t == "number" and not isinstance(value, (int, float)):
        errors.append(f"expected number, got {type(value).__name__}")
    if t == "string" and not isinstance(value, str):
        errors.append(f"expected string, got {type(value).__name__}")
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"value {value!r} not in enum {schema['enum']}")
    return errors

def execute_tool_call(tool_call):
    """Find the tool in registry, validate arguments, and execute it.

    Returns (tool, result) — either may be None if the tool wasn't found or
    validation failed. Reused by the "Try It Yourself" cell below.
    """
    tool_to_call = None
    for t in tools_registry:
        if t["name"] == tool_call["tool_name"]:
            tool_to_call = t
            break

    if not tool_to_call:
        print(f"❌ Tool '{tool_call['tool_name']}' not found in registry")
        return None, None

    print(f"Validating arguments against schema...")
    errs = validate_schema(tool_to_call["input_schema"], tool_call["arguments"])
    if errs:
        print(f"❌ Validation failed: {errs}")
        return tool_to_call, None

    print(f"✅ Arguments valid")
    print(f"\nExecuting {tool_to_call['name']}...")
    result = tool_to_call["executor"](tool_call["arguments"])
    print(f"✅ Tool result: {json.dumps(result, indent=2)}")
    return tool_to_call, result

# Find the tool in registry and execute
if tool_call:
    tool_to_call, result = execute_tool_call(tool_call)
else:
    print("⚠️  Nothing to execute — no tool call was parsed in Step 5")
    tool_to_call, result = None, None
```

### Step four: observe

The host appends the tool result to the conversation (as a `tool` role message with matching `id`) and re-invokes the model. The model now has the tool output in context and can produce a final answer or request more calls. This continues until the model stops emitting calls or the host hits a safety limit on iteration count.

```python editable
# Append tool result to conversation
if tool_call:
    history = [
        {"role": "user", "content": user_query},
        {"role": "assistant", "content": f"I'll check the weather for Bengaluru using the get_weather tool."},
        {"role": "tool", "content": json.dumps(result), "name": tool_to_call["name"]}
    ]

    print("Conversation history with tool result appended:")
    for msg in history:
        print(f"\n  {msg['role'].upper()}: {msg.get('content', '')[:80]}...")

    print("\n--- Asking model for final answer ---\n")
    final_resp = await lrn_llm.call(history, system=system_prompt, max_tokens=150)
    final_answer = lrn_llm.text(final_resp)
    print(f"Final Answer:\n{final_answer}")
else:
    print("⚠️  Nothing to observe — no tool call was executed in Step 6")
```

### The trust split

Tools come in two flavors that matter for safety.

- **Pure.** Read-only, deterministic, no side effects. `get_weather`, `search_docs`, `get_current_time`. Safe to call speculatively.
- **Consequential.** Mutates state, spends money, touches user data. `send_email`, `delete_file`, `execute_trade`. Must be gated.

Meta's 2026 "Rule of Two" for agent security says a single turn may combine at most two of: untrusted input, sensitive data, consequential action. The tool interface is where you enforce that rule — by rejecting calls, requiring user confirmation, or escalating scopes. See Phase 13 · 15 for the full security chapter and Phase 14 · 09 for agent-level permission policies.

### Where the loop lives

| Context | Who describes | Who decides | Who executes |
|---------|---------------|-------------|--------------|
| Single-turn function calling (OpenAI/Anthropic/Gemini) | App developer | LLM | App developer |
| MCP | MCP server | LLM via MCP client | MCP server |
| A2A | Agent Card publisher | Calling agent | Called agent |
| Web browser (function-calling agent) | Browser extension / WebMCP | LLM | Browser runtime |

Everywhere, the same four steps. The column names change; the structure does not.

### Why not just prompt the model to emit JSON?

"Ask the model to reply in JSON" was the pre-function-calling pattern. It fails ~5 to 15 percent of the time on frontier models and far more on smaller models. Failure modes include missing braces, trailing commas, hallucinated fields, and wrong types. You then need a JSON repair pass, a retry, or a constrained decoder.

Native function calling is better for three reasons. First, the provider trains the model end-to-end on the exact call shape, so valid-JSON rate climbs to 98 to 99 percent on strict mode. Second, the call payload sits in its own protocol slot, not inside free-text — so a tool call never leaks into the user-visible reply. Third, providers enforce schema compliance with constrained decoding (OpenAI's strict mode, Anthropic's `tool_use`, Gemini's `responseSchema`). The output is guaranteed to validate.

Phase 13 · 02 walks the three provider APIs side by side. Phase 13 · 04 goes deep on structured outputs.

### Circuit breakers

The loop terminates when the model stops emitting calls or the host hits a maximum turn count. Production hosts set this to between 5 and 20 turns. Beyond that, you are almost certainly in a loop the model cannot exit. Claude Code defaults to 20; OpenAI Assistants to 10; Cursor's agent mode to 25.

The alternative — unbounded loops — shows up every six months as "agent spent $400 in API calls overnight" post-mortems. Do not ship without a bound.

Phase 14 · 12 covers error recovery and self-healing in depth; Phase 17 covers production rate limits.

### Where Phase 13 goes from here

- Lessons 02 through 05 polish the provider-level tool-call surface.
- Lessons 06 through 14 generalize the loop into MCP.
- Lessons 15 through 18 defend the loop against hostile servers, adversarial users, and unauthenticated remote auth surfaces.
- Lessons 19 through 22 extend the pattern to agent-to-agent collaboration, observability, routing, and packaging.
- Lesson 23 ships a complete ecosystem using every primitive.

Every remaining lesson is an elaboration of this four-step loop. Hold it in mind as the invariant.

## Try It Yourself

Edit the query below and re-run the cell. Try different questions: "Please add 42 and 58", "What time is it?", "Tell me the weather in Tokyo", or "Write me a haiku about tea" (this should NOT trigger a tool; the model should answer directly). This cell runs the same parse → validate → execute pipeline as the describe/decide/execute/observe steps above, then checks the result against what "Please add 42 and 58" should produce — change `custom_query` and `expected_result` together if you try a different question.

```python editable
# TODO: Edit this query (and expected_result below) and re-run the cell
custom_query = "Please add 42 and 58"
expected_result = {"sum": 100}

print(f"User: {custom_query}")
print("\n--- Step 2: Decide (model chooses tool) ---\n")

messages = [{"role": "user", "content": custom_query}]
resp = await lrn_llm.call(messages, system=system_prompt, max_tokens=200)
model_reply = lrn_llm.text(resp)
print(f"Model: {model_reply}")

print("\n--- Step 5: Parse the tool call ---\n")
custom_tool_call = parse_tool_call(model_reply)
if custom_tool_call:
    print(f"✅ Parsed tool call:")
    print(f"   Tool: {custom_tool_call['tool_name']}")
    print(f"   Arguments: {custom_tool_call['arguments']}")

    print("\n--- Step 6: Execute the tool call ---\n")
    custom_tool, custom_result = execute_tool_call(custom_tool_call)
else:
    print(f"⚠️  No tool call detected in model response")
    custom_result = None

print("\n--- Self-check ---")
if custom_result == expected_result:
    print(f"✅ PASS — got {custom_result}, expected {expected_result}")
else:
    print(f"❌ WRONG — got {custom_result}, expected {expected_result}")
assert custom_result == expected_result, f"expected {expected_result}, got {custom_result}"
```

## Further Reading

- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) — canonical reference for OpenAI-style tool declarations and call shapes
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) — Claude's `tool_use` / `tool_result` block format
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) — `functionDeclarations` and parallel-call semantics in Gemini
- [Model Context Protocol — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — the provider-agnostic generalization of the tool interface
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) — the schema dialect every modern tool API speaks

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain why an LLM that can only generate text cannot, on its own, take actions against the real world.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Draw the four-step tool-call loop (describe → decide → execute → observe) and name who owns each step.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Write a tool description as three parts: name, JSON Schema input, and a deterministic executor function.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain why an LLM that can only generate text cannot, on its own, take actions against the real world,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Write a tool description as three parts: name, JSON Schema input, and a deterministic executor function,” and cite a repeatable check rather than relying on visual inspection alone.

## Guided Demo

Use the [10–15 minute guided demo](demo.md) to predict an invariant, run the canonical entrypoint, change one variable, and probe a failure case.
