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

## The Concept

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**How constrained decoding works.** At each generation step, the LLM produces a logit vector over the full vocabulary (~100k tokens). A *logit processor* sits between the model and the sampler. It computes which tokens are valid given the current position in the target grammar — JSON Schema, regex, context-free grammar — and sets the logits of all invalid tokens to negative infinity. The softmax over the remaining logits puts probability mass only on valid continuations.

Implementations in 2026:

- **Outlines.** Compiles JSON Schema or regex into a finite-state machine. Every token gets an O(1) valid-next-token lookup. FSM-based, so recursive schemas need flattening.
- **XGrammar / llguidance.** Context-free grammar engines. Handle recursive JSON Schema. Near-zero decoding overhead. OpenAI credited llguidance in their 2025 structured output implementation.
- **vLLM guided decoding.** Built-in `guided_json`, `guided_regex`, `guided_choice`, `guided_grammar` via Outlines, XGrammar, or lm-format-enforcer backends.
- **Instructor.** Pydantic-based wrapper over any LLM. Retries on validation failure. Cross-provider, but does not modify logits — it relies on retries + structured-output-aware prompts.

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




## Further Reading

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) — the Outlines paper.
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) — fast CFG-based constrained decoding.
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) — inference server integration.
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) — API reference + gotchas.
- [Instructor library](https://python.useinstructor.com/) — Pydantic + retries across providers.
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) — benchmarking 6 constrained decoding frameworks.
