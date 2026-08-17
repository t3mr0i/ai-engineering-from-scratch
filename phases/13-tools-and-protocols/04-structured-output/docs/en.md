# Structured Output — JSON Schema, Pydantic, Zod, Constrained Decoding

> "Ask the model nicely to return JSON" fails 5 to 15 percent of the time, even on frontier models. Structured outputs close that gap with constrained decoding: the model is literally prevented from emitting a token that would violate the schema. OpenAI's strict mode, Anthropic's schema-typed tool use, Gemini's `responseSchema`, Pydantic AI's `output_type`, and Zod's `.parse` are five surface forms of the same idea. This lesson builds the schema validator and the strict-mode contract learners will use for every production extraction pipeline.

**Type:** Build
**Languages:** Python (stdlib, JSON Schema 2020-12 subset)
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

### Retry strategy

When you are outside strict mode (Anthropic tool use, non-strict OpenAI, older Gemini), the recovery pattern is:

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

One retry is usually enough. Three retries catches weak-model flakes. Beyond three is a sign of a bad schema: the model cannot satisfy it for some inputs, and the prompt or the schema needs fixing.

### Small-model support

Constrained decoding works on small models. A 3B-parameter open model with grammar enforcement out-performs a 70B-parameter model with raw prompting on structured tasks. This is the main reason structured outputs matter for production: it decouples reliability from model size.

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
