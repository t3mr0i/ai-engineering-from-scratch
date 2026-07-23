# Prompt Caching and Context Caching

> Your system prompt is 4,000 tokens. Your RAG context is 20,000 tokens. You send both with every request. You also pay for both — every time. Prompt caching lets the provider keep that prefix warm on their side and bill you 10% of the normal rate on reuse. Used correctly, it cuts inference cost by 50–90% and first-token latency by 40–85%.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 01 (Prompt Engineering), Phase 11 · 05 (Context Engineering), Phase 11 · 11 (Caching and Cost)
**Time:** ~60 minutes

## The Problem

A coding agent sends the same 15,000-token system prompt to Claude on every turn of a conversation. Twenty turns at $3/M input tokens is $0.90 in input cost alone — before any of the user's actual messages. Multiply by 10,000 daily conversations and the bill hits $9,000/day for text that never changes.

You cannot shrink the prompt without hurting quality. You cannot avoid sending it — the model needs it on every turn. The only move is to stop paying full price for a prefix the provider has already seen.

That move is prompt caching. Anthropic shipped it in August 2024 (with a 1-hour extended-TTL variant in 2025), OpenAI automated it later that year, Google shipped explicit context caching alongside Gemini 1.5, and all three now offer it as a first-class feature on their frontier models.

## The Concept

![Prompt caching: write once, read cheap](../assets/prompt-caching.svg)

**The mechanic.** When a request's prefix matches one from a recent request, the provider serves the KV-cache from the previous run instead of re-encoding the tokens. You pay a small write premium the first time and a large read discount every time after.

**Three provider flavors in 2026.**

| Provider | API style | Hit discount | Write premium | Default TTL | Min cacheable |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | Explicit `cache_control` markers on content blocks | 90% off input | 25% surcharge | 5 min (extendable to 1 hour) | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | Automatic prefix detection | 50% off input | none | Up to 1 hour (best-effort) | 1,024 tokens |
| Google (Gemini) | Explicit `CachedContent` API | Storage-billed; read at ~25% of normal | Storage fee per token·hour | User-set (default 1 hour) | 4,096 tokens (Flash), 32,768 (Pro) |

**The invariant.** All three cache prefixes only. If any token differs between requests, everything after the first differing token is a miss. Put the *stable* parts at the top, the *variable* parts at the bottom.

### The cache-friendly layout

```
[system prompt]          <-- cache this
[tool definitions]       <-- cache this
[few-shot examples]      <-- cache this
[retrieved documents]    <-- cache if reused, else don't
[conversation history]   <-- cache up to last turn
[current user message]   <-- never cache (different every time)
```

Violate the order — put the user message above the system prompt, interleave dynamic retrievals between few-shots — and the cache never hits.

### The break-even calculation

Anthropic's 25% write premium means a cached block has to be read at least twice to net-save money. 1 write + 1 read averages 0.675x cost per request (saves 32%); 1 write + 10 reads averages 0.205x (saves 80%). Rule of thumb: cache anything you expect to reuse at least 3 times within the TTL.


## Use It

The 2026 caching stack:

| Situation | Pick |
|-----------|------|
| Agent with stable 10k+ system prompt, many turns | Anthropic `cache_control` with 5-min TTL |
| Batch job reusing a prefix for 30+ minutes | Anthropic with `ttl: "1h"` |
| Serverless endpoints on GPT-5, no custom infra | OpenAI automatic (just make your prefix stable and long) |
| Multi-day reuse of a giant code/doc corpus | Gemini explicit `CachedContent` |
| Cross-provider fallback | Keep the cacheable prefix layout identical across providers so any hit works |

Combine with semantic caching (Phase 11 · 11) for the user-message layer: prompt caching handles *token-identical* reuse, semantic caching handles *meaning-identical* reuse.

## Ship It

Save `outputs/skill-prompt-caching-planner.md`:

```markdown
---
name: prompt-caching-planner
description: Design a cache-friendly prompt layout and pick the right provider caching mode.
version: 1.0.0
phase: 11
lesson: 15
tags: [llm-engineering, caching, cost]
---

Given a prompt (system + tools + few-shot + retrieval + history + user) and a usage profile (requests per hour, TTL needed, provider), output:

1. Layout. Reordered sections with a single cache breakpoint marked; explain which sections are stable, which are volatile.
2. Provider mode. Anthropic cache_control, OpenAI automatic, or Gemini CachedContent. Justify from TTL and reuse pattern.
3. Break-even. Expected reads per write within TTL; net cost vs no-cache with math.
4. Verification plan. CI assertion that cache_read_input_tokens > 0 on the second identical request; dashboard split by cached vs uncached tokens.
5. Failure modes. List the three most likely reasons the cache will miss in this setup (dynamic timestamp, tool reorder, near-duplicate text) and how you will prevent each.

Refuse to ship a cache plan that places a dynamic field above the breakpoint. Refuse to enable 1h TTL without a reuse count that makes the 2x write premium pay back.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Prompt caching | "Makes long prompts cheap" | Reusing a provider-side KV-cache for matching prefixes; 50-90% discount on repeated input tokens. |
| `cache_control` | "The Anthropic marker" | Content-block attribute that declares "everything up to here is cacheable"; `{"type": "ephemeral"}`. |
| Cache write | "Paying the premium" | The first request that populates the cache; billed at ~1.25x input rate on Anthropic, free on OpenAI. |
| Cache read | "The discount" | Subsequent requests matching the prefix; billed at 10% (Anthropic), 50% (OpenAI), ~25% (Gemini). |
| TTL | "How long it lives" | Seconds the cache stays warm; Anthropic 5m default (extendable 1h), OpenAI best-effort up to 1h, Gemini user-set. |
| Extended TTL | "1-hour Anthropic cache" | `{"type": "ephemeral", "ttl": "1h"}`; 2x write premium but worth it for batch reuse. |
| Prefix match | "Why my cache missed" | Caches only hit when every token from the start up to the breakpoint is byte-identical. |
| Context caching (Gemini) | "The explicit one" | Google's named, storage-billed cache object; best for multi-day reuse of large corpora. |

## Further Reading

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — `cache_control`, 1h TTL, break-even tables.
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) — automatic prefix matching.
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching) — `CachedContent` API and storage pricing.
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) — original launch post with latency numbers.
- Phase 11 · 05 (Context Engineering) — where to slice the prompt so the cache can land.
- Phase 11 · 11 (Caching and Cost) — pair prompt caching with a semantic cache on user messages.
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) — the KV-cache memory model that prompt caching exposes to users; explains why a cached prefix is ~10× cheaper to reread than to recompute.
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) — prefill is the phase prompt caching shortcuts; this paper explains why TTFT drops dramatically on cache hit while TPOT is unaffected.
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) — prompt caching sits alongside speculative decoding, Flash Attention, and MQA/GQA as levers that bend the inference cost curve; read this for the other three.
