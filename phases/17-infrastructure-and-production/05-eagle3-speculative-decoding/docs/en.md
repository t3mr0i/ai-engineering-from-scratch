# EAGLE-3 Speculative Decoding in Production

> Speculative decoding pairs a fast draft model with the target model. The draft proposes K tokens; the target verifies in a single forward; accepted tokens are free. In 2026, EAGLE-3 is the production-grade variant — it trains a draft head on the target model's hidden states rather than on raw tokens, pushing acceptance rate alpha into the 0.6-0.8 band on general chat. The right question is not "how fast is the draft" but "what is alpha on my traffic?" If alpha drops below ~0.55, speculative decoding is net negative at high concurrency because every rejected draft costs a second target forward pass. This lesson teaches you to measure alpha first and flip the flag second.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 17 · 04 (vLLM Serving Internals), Phase 10 · 18 (Multi-Token Prediction)
**Time:** ~60 minutes

## Learning Objectives

- Name the three generations of speculative decoding and explain what EAGLE-3 changes from EAGLE-2 and from a classic draft model.
- Define acceptance rate alpha, compute expected speedup from alpha and K (draft length), and identify the break-even alpha for your target concurrency.
- Explain why speculative decoding is opt-in (not default) in vLLM 2026 and why turning it on without measuring alpha is a production anti-pattern.
- Write a measurement plan: which benchmark, which prompt distribution, which concurrency point, which metric to gate on.

## The Problem

Decode is memory-bound. On an H100 running Llama 3.3 70B FP8, each decoded token reads ~140 GB/s of weights and emits one token. The GPU compute is almost idle during decode — the bottleneck is HBM bandwidth, not matmul throughput.

Speculative decoding exploits the gap. Generate K candidate tokens with a cheap draft model, then ask the target model to verify all K in a single forward pass. Each verified token is effectively free (amortized into a batch-of-K forward the target would have had to do anyway).

The classic draft-model approach uses a smaller model of the same family (Llama 3.2 1B drafting for Llama 3.3 70B). It works but acceptance rate is mediocre — the smaller model distribution diverges from the target. EAGLE, then EAGLE-2, then EAGLE-3 train a light draft head directly on the target model's internal states, so the draft's distribution tracks the target much more closely. That is why alpha goes from 0.4 with draft-model to 0.6-0.8 with EAGLE-3.

The catch: EAGLE-3 is opt-in in vLLM 2026. `speculative_config` must be set explicitly. No flag, no acceleration. Teams that flip it on without measuring alpha on their real traffic often see tail latency get worse, not better.

## The Concept

### What speculative decoding actually buys

Without spec decode, per-token cost is one target forward. With spec decode at draft length K and acceptance alpha, expected tokens per target forward is `1 + K * alpha`. The speedup is `(1 + K * alpha) / (1 + epsilon)` where epsilon is draft-plus-verify overhead. For K=5, alpha=0.7: `(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`. Real-world numbers cluster around 2-3x because alpha is rarely that high on production traffic and epsilon grows at high batch size.

### Why alpha is the only metric that matters

Rejected tokens do not disappear — they force a second target forward for the first rejected token. On a workload where alpha drops to 0.4, you pay draft overhead plus verification plus re-roll. At high concurrency (say 256 concurrent), the decode batch is already large enough that the memory-bandwidth gap between "target alone" and "target with verify" shrinks. Below alpha 0.55 on most 2026 hardware, spec decode is net negative.

Alpha varies by workload. On ShareGPT-style general chat, EAGLE-3 trained on ShareGPT hits 0.6-0.8. On domain-specific traffic (code, medical, legal) the draft head trained on general data drops to 0.4-0.6. Training a domain-specific draft head recovers alpha — it is a light, quick training job compared to target finetuning.

### EAGLE generations at a glance

- **Classic draft model**: small model of same family. Alpha 0.3-0.5. Infrastructure simple — two models loaded, draft runs K forwards per target forward.
- **EAGLE-1 (2024)**: single draft head trained on target hidden states (last layer). Alpha ~0.5-0.6. Small param overhead on top of target.
- **EAGLE-2 (2025)**: adaptive draft length and tree-based drafts (verify multiple branches in one target pass). Alpha ~0.6-0.7. More complex draft scheduler.
- **EAGLE-3 (2025-2026)**: draft head trained on multiple target layers (not just last), better alignment. Alpha ~0.6-0.8 on general chat.

### The 2026 production recipe

1. Ship target model plain. Measure baseline TTFT, ITL, throughput at target concurrency.
2. Enable EAGLE-3 draft via vLLM `speculative_config`. Re-run the benchmark.
3. Log acceptance rate alpha. vLLM V1 reports this as `spec_decode_metrics.accepted_tokens_per_request`. Divide by requested draft length to get alpha.
4. If alpha < 0.55 on production traffic distribution, disable spec decode or train a domain-specific EAGLE-3 draft.
5. At production concurrency, re-run. Confirm P99 ITL did not get worse.

### The production pitfall: P99 tail

Mean ITL drops with spec decode. P99 can get worse if you do not tune. Rejected drafts trigger a two-pass sequence (draft + verify-fail + reroll). Under full batch, those two passes serialize. Watch P99 ITL, not P50.

### Where EAGLE-3 is already deployed

Google deployed speculative decoding in AI Overviews in 2025 (same quality, faster response). vLLM V1 ships `speculative_config` as the documented interface; N-gram GPU speculative decoding in V1 is the variant compatible with chunked prefill. SGLang supports EAGLE-3 as the recommended draft path for prefix-heavy workloads.

### Break-even math in one line

Expected speedup: `S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`. Setting `S = 1` solves for alpha: `alpha_breakeven = verify_overhead / K`. For typical verify_overhead ~0.15 and K=5: `alpha_breakeven = 0.03`. But that is the raw decode math. At high concurrency the verify overhead rises and the decode batch already amortizes memory reads across sequences, so effective alpha_breakeven climbs to ~0.45-0.55 in practice.

### When not to use speculative decoding

- Batch-1 offline generation where latency does not matter. Use plain target.
- Very short outputs (under 50 tokens). Draft overhead and verify cost dominate.
- Specialized domains without a domain-trained draft head. Alpha too low.
- vLLM v0.18.0 plus draft-model spec decode plus `--enable-chunked-prefill`. This combination does not compile. The documented exception is N-gram GPU spec decode in V1.



## Build It

Reconstruct **EAGLE-3 Speculative Decoding in Production** by following `SpecPoint` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `SpecPoint` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-eagle3-rollout.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/) — authoritative source on `speculative_config` and chunked-prefill compatibility in V1.
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) — the exact field set.
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) — original EAGLE draft-head formulation.
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) — adaptive drafts and trees.
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) — efficient LLM system with speculative decoding.
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) — production rollout checklist.

## Exercises

This lab follows `SpecPoint` and `expected_speedup` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `SpecPoint`, `expected_speedup`, `breakeven_alpha`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Name the three generations of speculative decoding and explain what EAGLE-3 changes from EAGLE-2 and from a classic draft model.**.
2. **Change the controlled parameter.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Define acceptance rate alpha, compute expected speedup from alpha and K (draft length), and identify the break-even alpha for your target concurrency.** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain why speculative decoding is opt-in (not default) in vLLM 2026 and why turning it on without measuring alpha is a production anti-pattern.** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-eagle3-rollout.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Write a measurement plan: which benchmark, which prompt distribution, which concurrency point, which metric to gate on.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **EAGLE-3 Speculative Decoding in Production** should contain:

- the `python3 main.py` output for the text "red fox", with `SpecPoint`, `expected_speedup`, `breakeven_alpha` traced to the value or shape that supports **Name the three generations of speculative decoding and explain what EAGLE-3 changes from EAGLE-2 and from a classic draft model.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Define acceptance rate alpha, compute expected speedup from alpha and K (draft length), and identify the break-even alpha for your target concurrency.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain why speculative decoding is opt-in (not default) in vLLM 2026 and why turning it on without measuring alpha is a production anti-pattern.**; and
- an updated `outputs/skill-eagle3-rollout.md` example with a concrete input, expected output field, and acceptance check tied to **Write a measurement plan: which benchmark, which prompt distribution, which concurrency point, which metric to gate on.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
