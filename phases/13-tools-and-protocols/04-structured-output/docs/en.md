# Structured Output — JSON Schema, Pydantic, Zod, Constrained Decoding

> "Ask the model nicely to return JSON" fails 5 to 15 percent of the time, even on frontier models. Structured outputs close that gap with constrained decoding: the model is literally prevented from emitting a token that would violate the schema. OpenAI's strict mode, Anthropic's schema-typed tool use, Gemini's `responseSchema`, Pydantic AI's `output_type`, and Zod's `.parse` are five surface forms of the same idea. This lesson builds the schema validator and the strict-mode contract learners will use for every production extraction pipeline.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 02 (function calling deep dive)
**Time:** ~75 minutes

## Learning Objectives

- Write a JSON Schema 2020-12 for an extraction target using the right constraints (enum, min/max, required, pattern).
- Explain why strict mode and constrained decoding give different guarantees from "validate after generation".
- Distinguish the three failure modes: parse error, schema violation, model refusal.
- Ship an extraction pipeline with typed repair and typed refusal handling.

## The Problem

An agent reading a purchase-order email needs to turn free text into `{customer, line_items, total_usd}`. Three approaches.

**Approach one: prompt for JSON.** "Reply in JSON with fields customer, line_items, total_usd." Works 85 to 95 percent of the time on frontier models. Fails in six ways: missing brace, trailing comma, wrong types, hallucinated fields, truncated at token limit, leaked prose like "Here is your JSON:".

**Approach two: validate after generation.** Generate freely, parse, validate against schema, retry on failure. Reliable but expensive — you pay for every retry, and truncation bugs cost one extra turn per occurrence.

**Approach three: constrained decoding.** The provider enforces the schema at decode time. Invalid tokens are masked out of the sampling distribution. The output is guaranteed to parse and guaranteed to validate. Failure collapses to one mode: refusal (the model decides the input does not fit the schema).

Every 2026 frontier provider ships some form of approach three.

- **OpenAI.** `response_format: {type: "json_schema", strict: true}` plus `refusal` in the response if the model declines.
- **Anthropic.** Schema enforcement on `tool_use` inputs; a decline surfaces as `stop_reason: "refusal"` (Claude 4+ models), with `stop_details` carrying the policy category.
- **Gemini.** `responseSchema` at request level; in 2026 Gemini ships token-level grammar constraints for selected types.
- **Pydantic AI.** `output_type=InvoiceModel` emits a structured `RunResult` typed to `InvoiceModel`.
- **Zod (TypeScript).** Runtime parser that validates provider output against a Zod schema; pairs with OpenAI's `beta.chat.completions.parse`.

The common thread: declare the schema once, enforce it end to end.

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

### JSON Schema 2020-12 — the lingua franca

Every provider accepts JSON Schema 2020-12. The constructs you use most:

- `type`: one of `object`, `array`, `string`, `number`, `integer`, `boolean`, `null`.
- `properties`: map of field name to subschema.
- `required`: list of field names that must appear.
- `enum`: closed set of allowed values.
- `minimum` / `maximum` (numbers), `minLength` / `maxLength` / `pattern` (strings).
- `items`: subschema applied to every array element.
- `additionalProperties`: `false` forbids extra fields (default varies by mode).

OpenAI strict mode adds three requirements: every property must be listed in `required`, `additionalProperties: false` everywhere, and no unresolved `$ref`. If you break these, the API returns 400 at request time.

Here's a schema for an invoice: `customer` (a bounded string), `line_items` (an array of objects each with a pattern-constrained `sku`, an integer `qty`, and a non-negative `unit_usd`), a non-negative `total_usd`, a `currency` enum, and `additionalProperties: false` to forbid hallucinated fields:

```python editable
import re
from dataclasses import dataclass
from typing import Any

INVOICE_SCHEMA = {
    "type": "object",
    "properties": {
        "customer": {"type": "string", "minLength": 1, "maxLength": 200},
        "line_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "sku": {"type": "string", "pattern": "^[A-Z0-9-]+$"},
                    "qty": {"type": "integer", "minimum": 1},
                    "unit_usd": {"type": "number", "minimum": 0},
                },
                "required": ["sku", "qty", "unit_usd"],
                "additionalProperties": False,
            },
        },
        "total_usd": {"type": "number", "minimum": 0},
        "currency": {"type": "string", "enum": ["USD", "EUR", "INR"]},
    },
    "required": ["customer", "line_items", "total_usd", "currency"],
    "additionalProperties": False,
}

print("Invoice schema keys:", list(INVOICE_SCHEMA["properties"].keys()))
print("Required fields:", INVOICE_SCHEMA["required"])
```

A minimal JSON Schema validator checks type, required fields, enum values, min/max constraints, patterns, and array items, and returns typed errors with path and message:

```python editable
@dataclass
class ValidationError:
    path: str
    message: str
    def __str__(self) -> str:
        return f"{self.path}: {self.message}"

def validate(schema: dict, value: Any, path: str = "$") -> list[ValidationError]:
    errors: list[ValidationError] = []
    t = schema.get("type")
    if t == "object":
        if not isinstance(value, dict):
            return [ValidationError(path, f"expected object, got {type(value).__name__}")]
        required = schema.get("required", [])
        props = schema.get("properties", {})
        for field in required:
            if field not in value:
                errors.append(ValidationError(f"{path}.{field}", "missing required field"))
        if schema.get("additionalProperties") is False:
            extras = set(value) - set(props)
            for extra in extras:
                errors.append(ValidationError(f"{path}.{extra}", "additional property not allowed"))
        for key, sub in props.items():
            if key in value:
                errors.extend(validate(sub, value[key], f"{path}.{key}"))
        return errors
    if t == "array":
        if not isinstance(value, list):
            return [ValidationError(path, f"expected array, got {type(value).__name__}")]
        item_schema = schema.get("items")
        if item_schema is not None:
            for i, item in enumerate(value):
                errors.extend(validate(item_schema, item, f"{path}[{i}]"))
        return errors
    if t == "string":
        if not isinstance(value, str):
            errors.append(ValidationError(path, f"expected string, got {type(value).__name__}"))
            return errors
        if "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(ValidationError(path, f"shorter than minLength {schema['minLength']}"))
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            errors.append(ValidationError(path, f"longer than maxLength {schema['maxLength']}"))
        if "pattern" in schema and not re.match(schema["pattern"], value):
            errors.append(ValidationError(path, f"does not match pattern {schema['pattern']!r}"))
    elif t == "number":
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            errors.append(ValidationError(path, f"expected number, got {type(value).__name__}"))
            return errors
    elif t == "integer":
        if not isinstance(value, int) or isinstance(value, bool):
            errors.append(ValidationError(path, f"expected integer, got {type(value).__name__}"))
            return errors
    if "minimum" in schema and isinstance(value, (int, float)) and value < schema["minimum"]:
        errors.append(ValidationError(path, f"below minimum {schema['minimum']}"))
    if "maximum" in schema and isinstance(value, (int, float)) and value > schema["maximum"]:
        errors.append(ValidationError(path, f"above maximum {schema['maximum']}"))
    if "enum" in schema and value not in schema["enum"]:
        errors.append(ValidationError(path, f"value {value!r} not in enum {schema['enum']}"))
    return errors

print("✅ Validator ready")
```

### Pydantic, the Python binding

Pydantic v2 generates JSON Schema from dataclass-shaped models via `model_json_schema()`. Pydantic AI wraps this so you write:

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

and the agent framework translates the schema into OpenAI strict mode, Anthropic `input_schema`, or Gemini `responseSchema` at the edge. The model's output comes back as a typed `Invoice` instance. Validation errors raise `ValidationError` with typed error paths.

### Zod, the TypeScript binding

Zod (`z.object({customer: z.string(), ...})`) is the TS equivalent. OpenAI's Node SDK exposes `zodResponseFormat(Invoice)` which translates to the API's JSON Schema payload.

### Refusals

Strict mode cannot force the model to answer. If the input cannot fit the schema ("the email was a poem, not an invoice"), the model emits a `refusal` field containing the reason. Your code must handle this as a first-class outcome, not a failure. The refusal is also useful as a safety signal: a model asked to extract a credit card number from a protected-content email returns a refusal with the safety reason attached.

### Constrained decoding in the open

Open-weights implementations use three techniques.

1. **Grammar-based decoding** (`outlines`, `guidance`, `lm-format-enforcer`): build a deterministic finite automaton from the schema; at every step, mask the logits of tokens that would violate the FSM.
2. **Logit masking with a JSON parser**: run a streaming JSON parser in lockstep with the model; at every step, compute the valid-next-token set.
3. **Speculative decoding with a verifier**: cheap draft model proposes tokens, verifier enforces the schema.

Commercial providers pick one of these behind the scenes. The 2026 state of the art is faster than plain generation for short structured outputs and roughly the same speed for long ones.

### The three failure modes

1. **Parse error.** The output is not valid JSON. Cannot happen under strict mode. Can still happen on non-strict providers.
2. **Schema violation.** The output parses but violates the schema. Cannot happen under strict mode. Common outside it.
3. **Refusal.** The model declines. Must be handled as a typed outcome.

A three-branch handler dispatches raw model output into exactly these outcomes — under strict mode only `refusal` is reachable; outside it, all three are real:

```python editable
@dataclass
class ParsedResult:
    kind: str  # "ok", "refusal", "parse_error", "violation"
    payload: Any
    errors: list[ValidationError]

def process_model_output(raw: str, schema: dict) -> ParsedResult:
    """Handle three branches: parse error, refusal, success/violation."""
    if raw.startswith("__REFUSAL__"):
        return ParsedResult("refusal", raw.removeprefix("__REFUSAL__").strip(), [])
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        return ParsedResult("parse_error", None, [ValidationError("$", str(e))])
    errs = validate(schema, parsed)
    if errs:
        return ParsedResult("violation", parsed, errs)
    return ParsedResult("ok", parsed, [])

print("✅ Handler ready")
```

Now ask the model to extract invoice fields from a realistic purchase-order email — it must return valid JSON matching the invoice schema:

```python editable
email_text = """Subject: Order confirmation for Acme Corp

Dear vendor,

Please process this order:
- Item ABC-123 (qty 2, $49.99 each)
- Item XYZ-9 (qty 1, $120.00)

Total: $219.98
Currency: USD
Customer: Acme Corp

Thanks!"""

prompt = f"""Extract the invoice from this email. Reply ONLY with valid JSON matching the schema:
{json.dumps(INVOICE_SCHEMA, indent=2)}

Email:
{email_text}"""

response = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=200)
raw_output = lrn_llm.text(response)
print("Raw LLM output:")
print(raw_output)
```

Parse and validate the model's response. If valid, the result is a typed invoice. If violated, the error list says exactly what to fix:

```python editable
result = process_model_output(raw_output, INVOICE_SCHEMA)
print(f"Outcome: {result.kind}")
if result.kind == "ok":
    print(f"✅ Success!")
    print(f"  Customer: {result.payload['customer']}")
    print(f"  Line items: {len(result.payload['line_items'])}")
    print(f"  Total: ${result.payload['total_usd']} {result.payload['currency']}")
elif result.kind == "refusal":
    print(f"⚠️  Model declined: {result.payload}")
else:
    print(f"❌ {result.kind}:")
    for err in result.errors:
        print(f"    {err}")
```

Here's what all three failure modes look like against fixed, hand-crafted inputs — a trailing comma (parse error), a lowercase SKU plus an extra field (schema violation), and a missing required field:

```python editable
# Test 1: Parse error (trailing comma in JSON)
print("\n" + "="*60)
print("Test 1: Parse error (invalid JSON)")
print("="*60)
bad_json = '{"customer": "Acme", "line_items": [], "total_usd": 0, "currency": "USD",}'
result1 = process_model_output(bad_json, INVOICE_SCHEMA)
print(f"Outcome: {result1.kind}")
for err in result1.errors:
    print(f"  {err}")

# Test 2: Schema violation (lowercase SKU, extra field)
print("\n" + "="*60)
print("Test 2: Schema violation (SKU pattern fails, extra field)")
print("="*60)
violated_json = json.dumps({
    "customer": "Acme",
    "line_items": [{"sku": "abc_123", "qty": 1, "unit_usd": 10, "discount": 0.1}],
    "total_usd": 10,
    "currency": "USD",
})
result2 = process_model_output(violated_json, INVOICE_SCHEMA)
print(f"Outcome: {result2.kind}")
for err in result2.errors:
    print(f"  {err}")

# Test 3: Missing required field
print("\n" + "="*60)
print("Test 3: Missing required field (total_usd)")
print("="*60)
missing_json = json.dumps({
    "customer": "Acme",
    "line_items": [{"sku": "ABC-123", "qty": 1, "unit_usd": 10}],
    "currency": "USD",
})
result3 = process_model_output(missing_json, INVOICE_SCHEMA)
print(f"Outcome: {result3.kind}")
for err in result3.errors:
    print(f"  {err}")
```

### Retry strategy

When you are outside strict mode (Anthropic tool use, non-strict OpenAI, older Gemini), the recovery pattern is:

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

One retry is usually enough. Three retries catches weak-model flakes. Beyond three is a sign of a bad schema: the model cannot satisfy it for some inputs, and the prompt or the schema needs fixing.

```python editable
async def extract_invoice_with_retry(email: str, max_retries: int = 2) -> ParsedResult:
    """Extract invoice with typed error feedback."""
    for attempt in range(max_retries):
        prompt = f"""Extract invoice from this email. Reply ONLY with valid JSON.
Schema: {json.dumps(INVOICE_SCHEMA)}

Email:
{email}"""
        if attempt > 0:
            prompt += f"\n\nPrevious attempt failed. Fix the JSON to match the schema exactly."
        
        response = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=300)
        raw_output = lrn_llm.text(response)
        result = process_model_output(raw_output, INVOICE_SCHEMA)
        
        print(f"Attempt {attempt + 1}: {result.kind}")
        if result.kind == "ok":
            return result
        if result.kind == "refusal":
            print(f"  Model declined: {result.payload}")
            return result
        # Violation or parse error: show errors and retry
        for err in result.errors:
            print(f"  Error: {err}")
    
    return result

print("✅ Retry function ready")
```

```python editable
# Try extraction with retry on a clean email
test_email = """Subject: Order from Widget Inc

We need:
- 5x SKU PROD-001 at $29.99 each
- 2x SKU WIDGET-99 at $149.00 each

Total: $449.95 USD
Customer name: Widget Inc
"""

final_result = await extract_invoice_with_retry(test_email, max_retries=2)
if final_result.kind == "ok":
    print("\n✅ Final invoice:")
    print(json.dumps(final_result.payload, indent=2))
else:
    print(f"\n⚠️ Final outcome: {final_result.kind}")
```

### Small-model support

Constrained decoding works on small models. A 3B-parameter open model with grammar enforcement out-performs a 70B-parameter model with raw prompting on structured tasks. This is the main reason structured outputs matter for production: it decouples reliability from model size.

## Try It Yourself

Extract from a custom email. Replace the email text below to match your own domain — the same `extract_invoice_with_retry` pipeline from above handles it.

```python editable
# TODO: Replace with your own email and schema
custom_email = """Subject: Urgent: Fix server issue

Our main server (SKU SERV-MAINT) had a 2-hour outage.
Labor: 2 hours @ $150/hour = $300
Parts: none

Customer: CloudTech Inc
Total: $300 USD
"""

custom_result = await extract_invoice_with_retry(custom_email, max_retries=1)
if custom_result.kind == "ok":
    print("✅ Extracted:")
    print(json.dumps(custom_result.payload, indent=2))
else:
    print(f"Outcome: {custom_result.kind}")
    if custom_result.errors:
        for err in custom_result.errors:
            print(f"  {err}")
    elif custom_result.payload:
        print(f"Reason: {custom_result.payload}")
```

## Use It

"Validate after generation" (approach two) is exactly as reliable as the checks
you write. A validator that only confirms required fields are present misses
every violation of type, range, and enum — the three constraints strict mode
enforces for you.

```python fillin
schema = {
    "properties": {
        "customer": {"type": "string"},
        "total_usd": {"type": "number", "minimum": 0},
        "status": {"type": "string", "enum": ["paid", "unpaid", "refunded"]},
    },
    "required": ["customer", "total_usd", "status"],
}

payload = {"customer": 12345, "total_usd": -50, "status": "cancelled"}

def naive_validate(payload, schema):
    return [f"missing: {f}" for f in schema["required"] if f not in payload]

print("naive:", naive_validate(payload, schema))  # [] -- looks fine, isn't

def strict_validate(payload, schema):
    errors = naive_validate(payload, schema)
    for field, sub in schema["properties"].items():
        if field not in payload:
            continue
        value = payload[field]
        if sub["type"] == "string" and not isinstance(value, {{blank:str}}):
            errors.append(f"{field}: expected string")
        if "minimum" in sub and value {{blank:<}} sub["minimum"]:
            errors.append(f"{field}: below minimum")
        if "enum" in sub and value {{blank:not in}} sub["enum"]:
            errors.append(f"{field}: not in enum")
    return errors

errors = strict_validate(payload, schema)
expected = ["customer: expected string", "total_usd: below minimum", "status: not in enum"]
if errors == expected:
    print("PASS")
else:
    print("WRONG:", errors)
```

This is the gap between approach two and approach three from the problem
section: `strict_validate` catches what `naive_validate` misses, but a
provider's strict mode catches all three *before* the tokens are even
emitted — no retry needed.


## Further Reading

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) — strict mode, refusals, and schema requirements
- [Anthropic — Handle streaming refusals](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/handle-streaming-refusals) — `stop_reason: "refusal"` and the `stop_details` object (`category`, `explanation`)
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) — August 2024 launch post explaining the decoding guarantee
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) — typed output_type bindings that serialize to each provider
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) — the canonical spec
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) — enterprise deployment notes and strict-mode caveats
