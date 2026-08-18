# Structured Outputs & Constrained Decoding

> Ask an LLM for JSON. Get JSON most of the time. In production, "most" is the problem. Constrained decoding turns "most" into "always" by editing the logits before sampling.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## The Problem

A classifier prompts an LLM: "Return one of {positive, negative, neutral}." The model returns "The sentiment is positive — this review is overwhelmingly favorable because the customer explicitly states that they ...". Your parser crashes. Your classifier's F1 is 0.0.

Free-form generation is not a contract. It is a suggestion. A production system needs a contract.

Three layers exist in 2026.

1. **Prompting.** Ask nicely. "Return only the JSON object." Works ~80% on frontier models, less on smaller ones.
2. **Native structured output APIs.** OpenAI `response_format`, Anthropic tool use, Gemini JSON mode. Reliable on supported schemas. Vendor-locked.
3. **Constrained decoding.** Modify the logits at every generation step so the model *cannot* emit invalid tokens. 100% valid by construction. Works on any local model.

This lesson builds intuition for all three and names when to reach for which.

Every call below reuses this `lrn_llm` setup — run it once:

```python editable
import sys, json, types
lrn_llm = types.ModuleType("lrn_llm")
try:
    from pyodide.http import pyfetch as _pyfetch
    _IN_PYODIDE = True
except ImportError:
    import urllib.request as _urlreq
    _IN_PYODIDE = False
lrn_llm.API_BASE = "/api/llm"  # same-origin proxy; server injects the gateway key
lrn_llm.DEFAULT_MODEL = "azure/gpt-5.4-mini"
lrn_llm.API_KEY = ""  # optional; set in Step 0a

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
print("✅ notebook ready · endpoint:", lrn_llm.API_BASE)
```

Ask an LLM to classify sentiment as one of three labels, and free-form generation is exactly what comes back:

```python editable
review_text = "The wait staff was attentive and the food arrived hot."

prompt = f"""Classify the sentiment of this review as one of: positive, negative, neutral.
Review: '{review_text}'"""

r = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=100)
response = lrn_llm.text(r)
print("Unconstrained response:")
print(response)
print("\n⚠️  Not a simple enum value — hard to parse!")
```

Layer 1 gets you most of the way there — be explicit that you want only JSON, nothing else:

```python editable
import json as json_lib

review_text = "The wait staff was attentive and the food arrived hot."

prompt = f"""Classify the review. Return ONLY a JSON object with keys: sentiment (string, one of: positive/negative/neutral), confidence (float 0-1), evidence_span (string).
Review: '{review_text}'
Return the JSON object, nothing else:"""

r = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=150)
response = lrn_llm.text(r)
print("Prompting approach (Layer 1):")
print(response)

try:
    obj = json_lib.loads(response)
    print("\n✅ Valid JSON parsed")
    print(json_lib.dumps(obj, indent=2))
except json_lib.JSONDecodeError as e:
    print(f"\n❌ JSON parse error: {e}")
```

Handing the model an explicit JSON Schema in the prompt tightens this further:

```python editable
review_text = "The wait staff was attentive and the food arrived hot."
schema = {
    "type": "object",
    "properties": {
        "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
        "confidence": {"type": "number"},
        "evidence_span": {"type": "string"}
    },
    "required": ["sentiment", "confidence", "evidence_span"]
}

prompt = f"""Classify the review using this JSON schema:
{json_lib.dumps(schema, indent=2)}

Review: '{review_text}'

Respond with ONLY the JSON object matching the schema, no other text:"""

r = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=200)
response = lrn_llm.text(r)
print("Schema-guided prompt (Layer 2):")
print(response)

try:
    obj = json_lib.loads(response)
    print("\n✅ Structured output parsed")
    print(json_lib.dumps(obj, indent=2))
except json_lib.JSONDecodeError as e:
    print(f"\n❌ Parse failed: {e}")
```

Run the same schema-guided prompt over a batch of reviews to see how close "~80%" comes in practice:

```python editable
reviews = [
    "The service was lightning-fast and the food was delicious!",
    "Cold food, rude waiters, never going back.",
    "It was okay, nothing special."
]

schema = {
    "type": "object",
    "properties": {
        "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
        "confidence": {"type": "number"},
        "evidence_span": {"type": "string"}
    },
    "required": ["sentiment", "confidence", "evidence_span"]
}

results = []
for i, review in enumerate(reviews, 1):
    prompt = f"""Classify the review using this schema: {json_lib.dumps(schema)}
Review: '{review}'
Return only the JSON:"""
    r = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=150)
    response = lrn_llm.text(r)
    try:
        obj = json_lib.loads(response)
        results.append({"review": review, "result": obj, "valid": True})
    except json_lib.JSONDecodeError:
        results.append({"review": review, "result": response, "valid": False})

print("Classification Results:")
for i, res in enumerate(results, 1):
    print(f"\n{i}. {res['review'][:50]}...")
    if res['valid']:
        print(f"   Sentiment: {res['result']['sentiment']} (confidence: {res['result']['confidence']})")
        print(f"   Evidence: {res['result']['evidence_span']}")
    else:
        print(f"   ❌ Parse failed: {res['result'][:80]}...")

valid_count = sum(1 for r in results if r['valid'])
print(f"\n✅ Valid outputs: {valid_count}/{len(results)} ({100*valid_count//len(results)}%)")
```

## The Concept

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**How constrained decoding works.** At each generation step, the LLM produces a logit vector over the full vocabulary (~100k tokens). A *logit processor* sits between the model and the sampler. It computes which tokens are valid given the current position in the target grammar — JSON Schema, regex, context-free grammar — and sets the logits of all invalid tokens to negative infinity. The softmax over the remaining logits puts probability mass only on valid continuations.

A tiny finite-state machine makes the idea concrete — at each state, only a fixed set of next characters is legal, and everything else is masked out:

```python editable
# Conceptual FSM for sentiment classification
class SimpleSentimentFSM:
    """Finite-state machine for {positive, negative, neutral}"""
    def __init__(self):
        self.states = {
            0: "START",
            1: "p", 2: "po", 3: "pos", 4: "posi", 5: "posit", 6: "positiv", 7: "positive",
            8: "n", 9: "ne", 10: "neg", 11: "nega", 12: "negat", 13: "negati", 14: "negativ", 15: "negative",
            16: "n", 17: "ne", 18: "neu", 19: "neut", 20: "neutr", 21: "neutra", 22: "neutral"
        }
    
    def valid_continuations(self, state):
        """Return characters that can follow this state without breaking the grammar."""
        if state == 0:  # START
            return {"p", "n"}  # Can start with 'p' (positive) or 'n' (negative/neutral)
        elif state in [1, 8, 16]:  # After 'p' or 'n'
            return {"o", "e"}  # 'po...' or 'ne...' or 'ne...'
        # ... and so on
        return set()

fsm = SimpleSentimentFSM()
print("FSM concept: at each generation step, mask tokens that don't match the grammar.")
print("Valid continuations from START:", fsm.valid_continuations(0))
print("\nResult: the model cannot generate 'good', 'bad', or any invalid token.")
print("Guarantees: 100% of outputs parse as {positive, negative, neutral}.")
```

Implementations in 2026:

- **Outlines.** Compiles JSON Schema or regex into a finite-state machine. Every token gets an O(1) valid-next-token lookup. FSM-based, so recursive schemas need flattening.
- **XGrammar / llguidance.** Context-free grammar engines. Handle recursive JSON Schema. Near-zero decoding overhead. OpenAI credited llguidance in their 2025 structured output implementation.
- **vLLM guided decoding.** Built-in `guided_json`, `guided_regex`, `guided_choice`, `guided_grammar` via Outlines, XGrammar, or lm-format-enforcer backends.
- **Instructor.** Pydantic-based wrapper over any LLM. Retries on validation failure. Cross-provider, but does not modify logits — it relies on retries + structured-output-aware prompts.

Put together, the decision comes down to what you're calling and what reliability you need:

```python editable
decision_tree = """
Structured Output Decision Tree (2026):

1. Using a proprietary API (OpenAI, Anthropic, Google)?
   → Use native structured output (Anthropic tool use, OpenAI response_format, etc.)
   → Fastest + most reliable for vendor's supported schemas
   → Cost: locked to vendor

2. Using a third-party provider, need retries acceptable?
   → Use Instructor (Pydantic-based wrapper)
   → Works cross-provider, schema validation with retries
   → Cost: extra latency per retry

3. Running a local model, need 100% reliability?
   → Use Outlines (FSM-based)
   → Zero invalid outputs, often faster due to token skipping
   → Limitation: flat schemas only (no deep recursion)

4. Local model, recursive schema (nested JSON)?
   → Use XGrammar or llguidance (CFG-based)
   → Handles recursion, near-zero overhead
   → Most complex setup

For this notebook: We're using a cloud API + simple schema → Native structured output (prompting) is sufficient.
"""
print(decision_tree)
```

### The counterintuitive result

Constrained decoding is often *faster* than unconstrained generation. Two reasons. First, it shrinks the next-token search space. Second, clever implementations skip token generation entirely for forced tokens (scaffolding like `{"name": "` — every byte is determined).

### The pitfall that costs you

Field order matters. Put `answer` before `reasoning`, and the model commits to an answer before it thinks. JSON is valid. Answer is wrong. No validation catches it.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

Schema field order is logic, not formatting.

See the pitfall itself: put the same review through a bad schema (answer before reasoning) and a good one (reasoning before answer):

```python editable
review_text = "This product broke after two days. Waste of money."

# BAD: answer first
bad_schema = {
    "type": "object",
    "properties": {
        "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
        "reasoning": {"type": "string"},
        "confidence": {"type": "number"}
    },
    "required": ["sentiment", "reasoning", "confidence"]
}

# GOOD: reasoning first
good_schema = {
    "type": "object",
    "properties": {
        "reasoning": {"type": "string"},
        "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
        "confidence": {"type": "number"}
    },
    "required": ["reasoning", "sentiment", "confidence"]
}

print("Demonstrating field order effect on schema design...")
print(f"Review: '{review_text}'")

print("\nWith BAD schema (answer before reasoning):")
prompt_bad = f"""Classify the review with schema: {json_lib.dumps(bad_schema)}
Review: '{review_text}'
Return only the JSON:"""
r_bad = await lrn_llm.call([{"role": "user", "content": prompt_bad}], max_tokens=200)
response_bad = lrn_llm.text(r_bad)
print(response_bad)

print("\nWith GOOD schema (reasoning first):")
prompt_good = f"""Classify the review with schema: {json_lib.dumps(good_schema)}
Review: '{review_text}'
Return only the JSON:"""
r = await lrn_llm.call([{"role": "user", "content": prompt_good}], max_tokens=200)
response = lrn_llm.text(r)
print(response)

# Soft self-check: does the bad-schema output actually show the failure mode?
# (LLM output varies, so this is a print-based nudge, not a hard assert.)
print("\n--- Self-check: compare the two outputs above ---")
try:
    obj_bad = json_lib.loads(response_bad)
    reasoning_bad = obj_bad.get("reasoning", "")
    sentiment_bad = obj_bad.get("sentiment", "")
    if reasoning_bad and sentiment_bad.lower() not in reasoning_bad.lower():
        print("⚠️  BAD schema: 'reasoning' doesn't clearly support 'sentiment' —")
        print("    look for a mismatch between the committed answer and the reasoning that follows it.")
    else:
        print("ℹ️  BAD schema output looks consistent this run — the failure mode isn't always visible,")
        print("    since the model may still 'plan ahead' internally before emitting the answer token.")
except json_lib.JSONDecodeError:
    print("⚠️  BAD schema output didn't even parse as JSON — that's the failure mode in action.")

try:
    obj_good = json_lib.loads(response)
    print("✅ GOOD schema output parsed cleanly, reasoning was generated before the answer:")
    print(f"   sentiment={obj_good.get('sentiment')!r}, reasoning={obj_good.get('reasoning', '')[:80]!r}")
except json_lib.JSONDecodeError:
    print("❌ GOOD schema output failed to parse — unexpected, re-run to check for a fluke.")
```

Now try it yourself — edit the review below and re-run to classify your own text:

```python editable
# TODO: Modify this review text and re-run to test the classifier
my_review = "The food was decent but the prices are way too high for the portion size."

schema = {
    "type": "object",
    "properties": {
        "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
        "confidence": {"type": "number"},
        "reasoning": {"type": "string"}
    },
    "required": ["sentiment", "confidence", "reasoning"]
}

prompt = f"""Classify the sentiment of this review.
Schema: {json_lib.dumps(schema)}
Review: '{my_review}'
Return only the JSON object:"""

print(f"Classifying: {my_review}\n")
r = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=200)
response = lrn_llm.text(r)

try:
    result = json_lib.loads(response)
    print("Classification Result:")
    print(json_lib.dumps(result, indent=2))
except json_lib.JSONDecodeError as e:
    print(f"❌ Failed to parse: {response}")
    print(f"Error: {e}")
```

## Further Reading

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) — the Outlines paper.
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) — fast CFG-based constrained decoding.
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) — inference server integration.
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) — API reference + gotchas.
- [Instructor library](https://python.useinstructor.com/) — Pydantic + retries across providers.
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) — benchmarking 6 constrained decoding frameworks.
