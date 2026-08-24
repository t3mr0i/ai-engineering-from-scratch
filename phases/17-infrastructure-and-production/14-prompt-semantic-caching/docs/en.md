# Prompt Caching and Semantic Caching Economics

> **Pricing snapshot dated 2026-04.** Numeric claims below reflect vendor rate cards captured at this lesson's publication; verify against the linked docs before quoting them downstream.

> Caching happens at two layers. Provider-level prompt caching reuses repeated prefixes; [Anthropic documents](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) its cache-write and cache-read multipliers, while [OpenAI's guide](https://platform.openai.com/docs/guides/prompt-caching) explains automatic prefix matching and usage reporting. Exact prices and retention options are model-specific and change over time, so read the live rate card. Application-level semantic caching skips the LLM entirely on a sufficiently similar hit. Neither mechanism guarantees a hit rate: measure hit correctness, hit rate, latency, and saved tokens separately.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 17 · 04 (vLLM Serving Internals), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## Learning Objectives

- Distinguish L2 prompt/prefix caching (KV reuse at provider) from L1 semantic caching (LLM bypass on similar prompts).
- Explain Anthropic's `cache_control` explicit marking and the two TTL options (5-min vs 1-hour) with their price multipliers.
- Compute expected monthly savings given hit rate, prompt/response mix, and token prices.
- Name the parallelization anti-pattern that inflates bills by 5-10x and the dynamic-content anti-pattern that collapses hit rate.

## The Problem

You add prompt caching to your RAG service. The bill stays flat. You measure the hit rate; it is 7%. Your prompts look static but they are not — the system prompt includes the current date formatted to the minute, a request ID, and a randomized example reorder for diversity. Every request writes a new cache entry, reads zero.

Separately, your agent runs ten parallel tool calls per user question. All ten arrive at the provider before the first cache write completes. Ten writes, zero reads. Your bill is 5-10x what "with caching" was supposed to cost.

Caching is a protocol, not a flag. Two layers, two different failure modes.

## The Concept

### L2 — provider prompt/prefix caching

Provider stores the attention KV for a cacheable prefix and reuses it on the next request that matches the prefix. You pay a write cost once, reads nearly free.

**Anthropic (Claude 3.5 / 3.7 / 4 series)**: explicit `cache_control` marker in the request. You tag which blocks are cacheable. TTL: 5-minute (write costs 1.25x base) or 1-hour (write costs 2x base). Cache reads: $0.30/M on Claude 3.5 Sonnet vs $3.00/M fresh — 10x cheaper (docs.anthropic.com, as of 2026-04). Rates differ per model (Opus/Haiku published separately); always cross-check the live pricing page.

**OpenAI**: prompt caching is automatic for eligible repeated prefixes. The discount and minimum cacheable prefix depend on the model; consult the [current prompt-caching guide](https://platform.openai.com/docs/guides/prompt-caching) and [live pricing table](https://platform.openai.com/pricing), then monitor cached-token usage in your own responses instead of assuming a benchmark hit rate.

**Google (Gemini)**: context caching via explicit API; 1M-token context means caching pays even more.

**Self-hosted (vLLM, SGLang)**: Phase 17 · 06 covers RadixAttention — same pattern at your own compute.

### L1 — app-level semantic caching

Before calling the LLM at all, hash the prompt, embed it, and look for a similar cached request (cosine similarity above threshold, typically 0.95+). On hit, return the cached response. On miss, call LLM and cache the result.

Open-source: Redis Vector Similarity, GPTCache, Qdrant. Commercial: Portkey Cache, Helicone Cache.

Vendor accuracy claims refer to how often the returned cached response was semantically appropriate — not how often you hit. Production hit rates:

- Open-ended chat: 10-15%.
- Structured FAQ / support: 40-70%.
- Code questions: 20-30% (small variants kill hits).
- Voice agents repeating prompts: 50-80% (voice normalization fixed set).

### The parallelization anti-pattern

Your agent makes 10 tool calls in parallel. All 10 have the same 4K-token system prompt. Anthropic cache writes are per-request; the first cache-write completes around 300 ms after the provider sees the prompt. Requests 2-10 arrive in the same millisecond window and each sees cache miss. You pay 10 write premiums, 0 read discounts.

Fix: batch with sequential-first — make request 1 alone, then fire 2-10 once 1's cache has populated. Adds 300 ms to the first tool call; saves 5-10x the bill.

### The dynamic content anti-pattern

Your system prompt looks like:

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

Every request is unique. Every request writes. Zero hits.

Fix: move everything truly static to the cacheable prefix; append dynamic content after the cache boundary:

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

ProjectDiscovery moved from 7% to 74% cache hit rate this way and published the anatomy.

### Stack batch + cache for overnight workloads

[OpenAI's Batch API](https://platform.openai.com/docs/api-reference/batch) documents a 50% discount with a 24-hour completion window. Whether cached-input pricing can be combined with a provider's batch tier is provider- and model-specific; verify the live rate card before projecting savings for overnight classification or report generation.

### Numbers you should remember

Pricing points are captured 2026-04 from the linked vendor docs and drift every few months — re-check before relying on them.

- Anthropic cache writes and reads use model-specific price multipliers and retention options ([official guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)).
- OpenAI prompt caching is automatic for eligible prefixes, with model-specific cached-input rates ([official guide](https://platform.openai.com/docs/guides/prompt-caching)).
- Semantic-cache hit rate has no universal baseline; report your measured hit rate and false-hit rate.
- Dynamic content placed early in a prefix reduces exact-prefix reuse; normalize stable instructions before variable content.
- Concurrent identical misses can duplicate work before the first result is cached; use request coalescing where latency permits.



## Further Reading

- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — official `cache_control` semantics and TTLs.
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) — automatic caching behavior and eligibility.
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
