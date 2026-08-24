# Structured Outputs: JSON, Schema Validation, Constrained Decoding

> Your LLM returns a string. Your application needs JSON. That gap has crashed more production systems than any model hallucination. Structured output is the bridge between natural language and typed data. Get it right and your LLM becomes a reliable API. Get it wrong and you're parsing free-text with regex at 3am.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 10, Lessons 01-05 (LLMs from Scratch)
**Time:** ~90 minutes
**Related:** Phase 5 · 20 (Structured Outputs & Constrained Decoding) covers the decoder-level theory (FSM/CFG logit processors, Outlines, XGrammar). This lesson focuses on the production SDK surface (OpenAI `response_format`, Anthropic tool use, Instructor) — read Phase 5 · 20 first if you want to understand what is happening below the API.

## Learning Objectives

- Implement JSON-mode and schema-constrained outputs using OpenAI and Anthropic API parameters
- Build a Pydantic validation layer that rejects malformed LLM outputs and retries with error feedback
- Explain how constrained decoding forces valid JSON at the token level without post-processing
- Design robust extraction prompts that reliably convert unstructured text into typed data structures

## The Problem

You ask an LLM: "Extract the product name, price, and availability from this text." It responds:

```
The product is the Sony WH-1000XM5 headphones, which cost $348.00 and are currently in stock.
```

That is a perfectly correct answer. It is also completely useless to your application. Your inventory system needs `{"product": "Sony WH-1000XM5", "price": 348.00, "in_stock": true}`. You need a JSON object with specific keys, specific types, and specific value constraints. You do not need a sentence.

The naive solution: add "Respond in JSON" to your prompt. This works 90% of the time. The other 10% the model wraps the JSON in markdown code fences, or adds a preamble like "Here's the JSON:", or produces syntactically invalid JSON because it closed a bracket early. Your JSON parser crashes. Your pipeline breaks. You add try/except and a retry loop. The retry sometimes produces different data. Now you have a consistency problem on top of a parsing problem.

This is not a prompt engineering problem. It is a decoding problem. The model generates tokens left to right. At each position, it picks the most likely next token from a vocabulary of 100K+ options. Most of those options would produce invalid JSON at any given position. If the model just emitted `{"price":`, the next token must be a digit, a quote (for string), `null`, `true`, `false`, or a negative sign. Anything else produces invalid JSON. Without constraints, the model might pick a perfectly reasonable English word that is catastrophically wrong syntactically.

## The Concept

Every example below shares this setup — run it once, then the rest reuse `lrn_llm`:

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

### The Structured Output Spectrum

There are four levels of structured output control, each more reliable than the last.

```mermaid
graph LR
    subgraph Spectrum["Structured Output Spectrum"]
        direction LR
        A["Prompt-based\n'Return JSON'\n~90% valid"] --> B["JSON Mode\nGuaranteed valid JSON\nNo schema guarantee"]
        B --> C["Schema Mode\nJSON + matches schema\nGuaranteed compliance"]
        C --> D["Constrained Decoding\nToken-level enforcement\n100% compliance"]
    end

    style A fill:#1a1a2e,stroke:#ff6b6b,color:#fff
    style B fill:#1a1a2e,stroke:#ffa500,color:#fff
    style C fill:#1a1a2e,stroke:#51cf66,color:#fff
    style D fill:#1a1a2e,stroke:#0f3460,color:#fff
```

**Prompt-based** ("Respond in valid JSON"): no enforcement. The model usually complies but sometimes does not. Reliability: ~90%. Failure mode: markdown fences, preamble text, truncated output, wrong structure.

**JSON mode**: the API guarantees the output is valid JSON. OpenAI's `response_format: { type: "json_object" }` enables this. The output will parse without errors. But it may not match your expected schema -- extra keys, wrong types, missing fields.

**Schema mode**: the API takes a JSON Schema and guarantees the output matches it. In 2026 every major provider supports this natively: OpenAI's `response_format: { type: "json_schema", json_schema: {...} }` (also as `tool_choice="required"`), Anthropic's tool use with `input_schema`, and Gemini's `response_schema` + `response_mime_type: "application/json"`. The output has the exact keys, types, and constraints you specified.

**Constrained decoding**: at each token position during generation, the decoder masks out all tokens that would produce invalid output. If the schema requires a number and the model is about to emit a letter, that token is set to probability zero. The model can only produce tokens that lead to valid output. This is what OpenAI's structured output mode and libraries like Outlines and Guidance implement under the hood.

### JSON Schema: The Contract Language

JSON Schema is how you tell the model (or validation layer) what shape the output must have. Every major structured output system uses it.

```json
{
  "type": "object",
  "properties": {
    "product": { "type": "string" },
    "price": { "type": "number", "minimum": 0 },
    "in_stock": { "type": "boolean" },
    "categories": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["product", "price", "in_stock"]
}
```

This schema says: the output must be an object with a string `product`, a non-negative number `price`, a boolean `in_stock`, and an optional array of strings `categories`. Any output that does not match gets rejected.

Schemas handle the hard cases: nested objects, arrays with typed items, enums (constrain a string to specific values), pattern matching (regex on strings), and combinators (oneOf, anyOf, allOf for polymorphic outputs).

Here's a second schema in the same style, built for a different extraction task: turning a raw IT-helpdesk response into a typed `TriageTicket`.

```python editable
# Example raw helpdesk responses
raw_responses = [
    """The issue is with the employee's VPN connection. They're unable to authenticate using their corporate credentials. We've verified the account is active and the VPN gateway is responding. Recommend resetting their VPN certificate and checking firewall rules. This is urgent as they cannot access critical project resources.""",
    """User reported their laptop will not boot. We've confirmed the SSD is functioning and there are no obvious hardware failures. The Windows bootloader appears corrupted. This is not blocking critical operations but the user needs a working device soon. Recommend a clean OS reinstall or sending to hardware repair.""",
]

for i, response in enumerate(raw_responses, 1):
    print(f"Response {i}:")
    print(response)
    print("-" * 60)

ticket_schema = {
    "type": "object",
    "properties": {
        "category": {
            "type": "string",
            "enum": ["network", "hardware", "software", "account"]
        },
        "priority": {
            "type": "string",
            "enum": ["high", "medium", "low"]
        },
        "summary": {"type": "string"},
        "requires_escalation": {"type": "boolean"}
    },
    "required": ["category", "priority", "summary", "requires_escalation"]
}

print("TriageTicket Schema:")
print(json.dumps(ticket_schema, indent=2))
```

Now put the schema to work: a hand-rolled validator checks the shape, and a real call to the model fills it in from one of the raw responses above.

```python editable
def validate_schema(data, schema):
    """Check if data matches schema. Returns list of errors (empty = valid)."""
    errors = []

    if schema.get("type") == "object":
        if not isinstance(data, dict):
            return [f"Expected object, got {type(data).__name__}"]

        # Check required fields
        for field in schema.get("required", []):
            if field not in data:
                errors.append(f"Required field missing: {field}")

        # Validate each field
        for key, value in data.items():
            if key in schema.get("properties", {}):
                prop_schema = schema["properties"][key]
                prop_errors = _validate_value(value, prop_schema, key)
                errors.extend(prop_errors)

    return errors

def _validate_value(value, schema, path=""):
    """Recursively validate a single value against a schema."""
    errors = []
    schema_type = schema.get("type")

    if schema_type == "string":
        if not isinstance(value, str):
            errors.append(f"{path}: expected string, got {type(value).__name__}")
        elif "enum" in schema and value not in schema["enum"]:
            errors.append(f"{path}: '{value}' not in {schema['enum']}")

    elif schema_type == "boolean":
        if not isinstance(value, bool):
            errors.append(f"{path}: expected boolean, got {type(value).__name__}")

    return errors

# Test the validator
test_ticket = {"category": "network", "priority": "high", "summary": "VPN auth failed", "requires_escalation": True}
errors = validate_schema(test_ticket, ticket_schema)
print(f"Valid ticket: {errors}")

invalid_ticket = {"category": "INVALID", "priority": "high", "summary": "Test"}
errors = validate_schema(invalid_ticket, ticket_schema)
print(f"Invalid ticket errors: {errors}")

response_to_extract = raw_responses[0]

system_prompt = """You are an IT support triage expert. Extract ticket information from a support agent's response.
Respond ONLY with valid JSON matching this schema:
{
  "category": one of [network, hardware, software, account],
  "priority": one of [high, medium, low],
  "summary": a 1-2 sentence summary of the issue and recommended action,
  "requires_escalation": true if urgent or requires senior engineer, false otherwise
}
No preamble. No markdown. Only JSON."""

user_message = f"Extract ticket information from this support response:\n\n{response_to_extract}"

resp = await lrn_llm.call(
    [{"role": "user", "content": user_message}],
    system=system_prompt,
    max_tokens=200
)

raw_response = lrn_llm.text(resp)
print("LLM Response:")
print(raw_response)
print()

# Parse and validate
try:
    ticket = json.loads(raw_response)
    errors = validate_schema(ticket, ticket_schema)
    if errors:
        print(f"Validation errors: {errors}")
    else:
        print("✅ Ticket is valid!")
        print(json.dumps(ticket, indent=2))
except json.JSONDecodeError as e:
    print(f"❌ Failed to parse JSON: {e}")
```

### The Pydantic Pattern

In Python, you do not write JSON Schema by hand. You define a Pydantic model and it generates the schema for you.

```python
from pydantic import BaseModel

class Product(BaseModel):
    product: str
    price: float
    in_stock: bool
    categories: list[str] = []
```

This produces the same JSON Schema as above. The Instructor library (and OpenAI's SDK) accept Pydantic models directly: pass the model class, get back a validated instance. If the LLM output does not match, Instructor retries automatically.

Pydantic isn't available here, but the checks it runs are just typed
comparisons — rebuild two of the failure modes from below (hallucinated type,
array length) without it:

```python fillin
schema = {
    "product": {"type": "string", "required": True},
    "price": {"type": "number", "minimum": 0, "required": True},
    "categories": {"type": "array", "maxItems": 3, "required": True},
}

def naive_validate(payload, schema):
    return [f for f in schema if schema[f]["required"] and f not in payload]

payload = {"product": 12345, "price": -10, "categories": ["a", "b", "c", "d"]}
print("naive:", naive_validate(payload, schema))  # [] -- all fields present, none of the violations caught

def strict_validate(payload, schema):
    errors = naive_validate(payload, schema)
    for field, sub in schema.items():
        if field not in payload:
            continue
        value = payload[field]
        if sub["type"] == "string" and not isinstance(value, {{blank:str}}):
            errors.append(f"{field}: expected string")
        if sub["type"] == "number" and value {{blank:<}} sub["minimum"]:
            errors.append(f"{field}: below minimum")
        if sub["type"] == "array" and len(value) {{blank:>}} sub["maxItems"]:
            errors.append(f"{field}: more than maxItems ({sub['maxItems']})")
    return errors

errors = strict_validate(payload, schema)
expected = ["product: expected string", "price: below minimum", "categories: more than maxItems (3)"]
if errors == expected:
    print("PASS")
else:
    print("WRONG:", errors)
```

### Function Calling / Tool Use

An alternative interface for the same problem. Instead of asking the model to produce JSON directly, you define "tools" (functions) with typed parameters. The model outputs a function call with structured arguments. OpenAI calls this "function calling." Anthropic calls it "tool use." The result is the same: structured data.

```mermaid
graph TD
    subgraph ToolUse["Tool Use Flow"]
        U["User: Extract product info\nfrom this review text"] --> M["Model processes input"]
        M --> TC["Tool Call:\nextract_product(\n  product='Sony WH-1000XM5',\n  price=348.00,\n  in_stock=true\n)"]
        TC --> V["Validate against\nfunction schema"]
        V --> R["Structured Result:\n{product, price, in_stock}"]
    end

    style U fill:#1a1a2e,stroke:#0f3460,color:#fff
    style TC fill:#1a1a2e,stroke:#e94560,color:#fff
    style V fill:#1a1a2e,stroke:#ffa500,color:#fff
    style R fill:#1a1a2e,stroke:#51cf66,color:#fff
```

Tool use is preferred when the model needs to choose which function to call, not just fill in parameters. If you have 10 different extraction schemas and the model must pick the right one based on the input, tool use gives you both the schema selection and the structured output.

### Common Failure Modes

Even with schema enforcement, structured outputs can fail in subtle ways.

**Hallucinated values**: the output matches the schema but contains invented data. The model produces `{"price": 299.99}` when the text says $348. Schema validation cannot catch this -- the type is correct, the value is wrong.

**Enum confusion**: you constrain a field to `["in_stock", "out_of_stock", "preorder"]`. The model outputs `"available"` -- semantically correct, but not in the allowed set. Good constrained decoding prevents this. Prompt-based approaches do not.

**Nested object depth**: deeply nested schemas (4+ levels) produce more errors. Each level of nesting is another place where the model can lose track of structure.

**Array length**: the model may produce too many or too few items in an array. Schemas support `minItems` and `maxItems` but not all providers enforce them at the decoding level.

**Optional field omission**: the model omits fields that are technically optional but semantically important for your use case. Set them as required in the schema even if the data is sometimes missing -- force the model to produce `null` explicitly.

Here's the refusal failure mode in practice: feed the same triage pipeline something that isn't a support ticket at all and see how the model (and your validator) reacts.

```python editable
# Off-topic message that is not a valid support response
invalid_input = """This is just a random chat message. Please tell me a joke about cats and tell me what your favorite color is."""

user_message = f"Extract ticket information from this support response:\n\n{invalid_input}"

resp = await lrn_llm.call(
    [{"role": "user", "content": user_message}],
    system=system_prompt,
    max_tokens=200
)

raw_response = lrn_llm.text(resp)
print("LLM Response to invalid input:")
print(raw_response)
print()

try:
    ticket = json.loads(raw_response)
    errors = validate_schema(ticket, ticket_schema)
    if errors:
        print(f"❌ Validation errors (expected for invalid input): {errors}")
    else:
        print("✅ Ticket is valid (LLM interpreted input)")
        print(json.dumps(ticket, indent=2))
except json.JSONDecodeError as e:
    print(f"❌ Failed to parse JSON (LLM refused): {e}")
    print("This is OK — the LLM sensed invalid input and refused to produce JSON.")
```

The production fix for these failure modes is retry-with-feedback: send the validation errors back to the model and ask it to correct itself.

```python editable
async def extract_ticket_with_retry(response_text, max_retries=2):
    """Extract a ticket from a support response with automatic retry on validation failure."""
    system_prompt = """You are an IT support triage expert. Extract ticket information from a support agent's response.
Respond ONLY with valid JSON matching this schema:
{
  "category": one of [network, hardware, software, account],
  "priority": one of [high, medium, low],
  "summary": a 1-2 sentence summary of the issue and recommended action,
  "requires_escalation": true if urgent or requires senior engineer, false otherwise
}
No preamble. No markdown. Only JSON."""

    messages = [{"role": "user", "content": f"Extract ticket information from this support response:\n\n{response_text}"}]

    for attempt in range(max_retries):
        resp = await lrn_llm.call(messages, system=system_prompt, max_tokens=200)
        raw_response = lrn_llm.text(resp)

        try:
            ticket = json.loads(raw_response)
        except json.JSONDecodeError as e:
            print(f"Attempt {attempt + 1}: JSON parse error -- {e}")
            continue

        errors = validate_schema(ticket, ticket_schema)
        if not errors:
            return ticket

        print(f"Attempt {attempt + 1}: Schema validation failed -- {errors}")
        if attempt < max_retries - 1:
            messages.append({"role": "assistant", "content": raw_response})
            messages.append({
                "role": "user",
                "content": f"Fix these validation errors: {errors}. Return valid JSON only."
            })

    return None

# Test with the second response
ticket = await extract_ticket_with_retry(raw_responses[1])
if ticket:
    print("✅ Extracted ticket:")
    print(json.dumps(ticket, indent=2))
else:
    print("❌ Failed to extract ticket after retries")
```

Try it yourself: edit the support response below and rerun the retry pipeline.

```python editable
# TODO: Replace this with your own IT support response
custom_response = """User's email client is not syncing. We've checked the mailbox configuration and the server connection is stable. The issue appears to be a caching problem in Outlook. They can still access email via the web portal. This is mildly annoying but not critical. We recommend clearing the local cache and reconnecting the account, which should resolve it."""

print("Processing support response:")
print(custom_response)
print()

ticket = await extract_ticket_with_retry(custom_response)
if ticket:
    print("✅ Extracted ticket:")
    print(json.dumps(ticket, indent=2))
    print()
    print(f"Action: Route to {ticket['category'].upper()} team (priority: {ticket['priority']})")
    if ticket['requires_escalation']:
        print("⚠️  Flag for escalation to senior engineer")
    else:
        print("✓ Standard priority")
else:
    print("❌ Could not extract structured ticket")
```

## Further Reading

- [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs) -- official documentation for JSON Schema-based constrained decoding in the OpenAI API
- [Willard & Louf, 2023 -- "Efficient Guided Generation for Large Language Models"](https://arxiv.org/abs/2307.09702) -- the Outlines paper, describing how to compile JSON Schemas into finite state machines for token-level constraints
- [Instructor documentation](https://python.useinstructor.com/) -- the standard library for getting structured outputs from any LLM with Pydantic validation and retries
- [Anthropic Tool Use Guide](https://docs.anthropic.com/en/docs/tool-use) -- how Claude implements structured output via tool use with JSON Schema input_schema
- [JSON Schema specification](https://json-schema.org/) -- the full spec for the schema language used by every major structured output system
- [Outlines library](https://github.com/outlines-dev/outlines) -- open-source constrained generation using regex and JSON Schema compiled to finite state machines
- [Dong et al., "XGrammar: Flexible and Efficient Structured Generation Engine for Large Language Models" (MLSys 2025)](https://arxiv.org/abs/2411.15100) -- the current state-of-the-art grammar engine; pushdown-automaton compilation that masks tokens at ~100 ns / token.
- [Beurer-Kellner et al., "Prompting Is Programming: A Query Language for Large Language Models" (LMQL)](https://arxiv.org/abs/2212.06094) -- the LMQL paper framing constrained decoding as a query language with type and value constraints.
- [Microsoft Guidance (framework docs)](https://github.com/guidance-ai/guidance) -- template-driven constrained generation; vendor-agnostic complement to Outlines and XGrammar.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Implement JSON-mode and schema-constrained outputs using OpenAI and Anthropic API parameters.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a Pydantic validation layer that rejects malformed LLM outputs and retries with error feedback.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Explain how constrained decoding forces valid JSON at the token level without post-processing.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Implement JSON-mode and schema-constrained outputs using OpenAI and Anthropic API parameters,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Explain how constrained decoding forces valid JSON at the token level without post-processing,” and cite a repeatable check rather than relying on visual inspection alone.
