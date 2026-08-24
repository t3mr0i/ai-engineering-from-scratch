# Speculative Decoding — Draft, Verify, Repeat

> Autoregressive decoding is serial. Each token waits for the previous one. Speculative decoding breaks the chain: a cheap model drafts N tokens, the expensive model verifies all N in one forward pass. When the draft is right you paid one big forward for N generations.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 07 (GPT Causal LM), Phase 7 · 12 (KV Cache & Flash Attention)
**Time:** ~60 minutes

## Learning Objectives

- Derive the mechanism behind Speculative Decoding — Draft, Verify, Repeat from tensor operations
- Implement the core component without relying on a transformer framework
- Trace tensor shapes and information flow through the implementation
- Evaluate the computational and modeling trade-offs introduced by Speculative Decoding — Draft, Verify, Repeat

## The Problem

A 70B LLM sampling one token takes ~30 ms on an H100. A 3B draft model takes ~3 ms. If we let the 3B draft 5 tokens ahead, then run the 70B *once* to verify all 5, the total is `5×3 + 30 = 45 ms` for up to 5 accepted tokens — versus `5×30 = 150 ms` for straight-line generation. That is the full speculative-decoding pitch: trade a small amount of extra GPU memory (draft model) for 2–4× lower decode latency.

The trick has to preserve the distribution. Speculative sampling, introduced by Leviathan et al. (2023) and by Chen et al. concurrently, guarantees that the output sequence is **identically distributed** to what the big model would have produced on its own. No quality tradeoff. Just faster.

Four families of draft-verifier pairs dominate 2026 inference:

1. **Vanilla speculative (Leviathan 2023).** Separate draft model (e.g., Llama 3 1B) + verifier (e.g., Llama 3 70B).
2. **Medusa (Cai 2024).** Multiple decoding heads on the verifier predict positions `t+1..t+k` in parallel. No separate draft model.
3. **EAGLE family (Li 2024, 2025).** Lightweight draft that reuses the verifier's hidden states; closer acceptance rate than vanilla; 3–4× typical.
4. **Lookahead decoding (Fu 2024).** Jacobi iteration; no draft model required at all. Self-speculation. Niche but dependency-free.

Every production inference stack in 2026 ships speculative decoding by default. vLLM, TensorRT-LLM, SGLang, and llama.cpp all support at least vanilla + EAGLE-2.

## The Concept

### The core algorithm

Given a verifier `M_q` and a cheaper draft `M_p`:

1. Let `x_1..x_k` be the prefix already decoded.
2. **Draft**: use `M_p` to autoregressively propose `d_{k+1}, d_{k+2}, ..., d_{k+N}` with draft probabilities `p_1..p_N`.
3. **Verify in parallel**: run `M_q` once on `x_1..x_k, d_{k+1}, ..., d_{k+N}`, getting verifier probabilities `q_1..q_{N+1}` for positions `k+1..k+N+1`.
4. **Accept/reject each draft token left to right**: for each `i`, accept with probability `min(1, q_i(d_i) / p_i(d_i))`.
5. On first rejection at position `j`: sample `t_j` from the "residual" distribution `(q_j - p_j)_+` normalized. All drafts after `j` are discarded.
6. On accepting all `N`: sample one extra token `t_{N+1}` from `q_{N+1}` (the free bonus token).

The residual distribution trick is the mathematical insight that keeps the output distributed exactly as if `M_q` had sampled from scratch.

### What determines speedup

Let `α` = expected acceptance rate per draft token. Let `c` = draft-to-verifier cost ratio. Per step:

- Naive generation makes 1 big-model call per token.
- Speculative makes 1 big-model call per `(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)` tokens when `α` is high.

Typical rule of thumb at `α = 0.75` and `N = 5`: 3× fewer big-model calls. Draft cost is 5× cheap. Total wall-clock drops ~2.5×.

**α depends on:**

- How well the draft approximates the verifier. Same family / same training data boosts α significantly.
- Decoding strategy. Greedy draft against greedy verifier: high α. Temperature sampling: harder to match; acceptance drops.
- Task type. Code and structured output accept more (predictable); free-form creative writing accepts less.

### Medusa — drafts without a draft model

Medusa replaces the draft model with extra output heads on the verifier. At position `t`:

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

Each head outputs its own logits. At inference you sample from each head to get a candidate sequence, then verify with one forward pass using a tree-attention scheme that considers all candidate continuations at once.

Pros: no second model. Cons: adds trainable parameters; needs a supervised fine-tuning stage (~1B tokens); acceptance rate is a bit lower than vanilla speculative with a good draft.

### EAGLE — better draft by reusing hidden states

EAGLE-1/2/3 (Li et al., 2024–2025) makes the draft model a tiny transformer (typically 1 layer) that ingests the verifier's last-layer hidden states. Because the draft sees the verifier's feature representation, its predictions correlate strongly with the verifier's output distribution. Acceptance rates climb from ~0.6 (vanilla) to 0.85+.

EAGLE-3 (2025) added tree search over candidate continuations. vLLM and SGLang ship EAGLE-2/3 as the default spec pathway for Llama 3/4 and Qwen 3.

### The KV cache dance

Verification feeds `N` draft tokens into the verifier in one forward pass. This extends the verifier's KV cache by `N` entries. If some drafts are rejected, you must roll the cache back to the accepted prefix length.

Production implementations (vLLM's `--speculative-model`, TensorRT-LLM's LookaheadDecoder) handle this with scratch KV buffers. Write first, commit on acceptance. It's not conceptually hard, but it is fiddly.




## Further Reading

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — the core algorithm and the equivalence theorem.
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) — concurrent introduction; clean Bernoulli-rejection proof.
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) — Medusa paper; tree-attention verification.
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) — EAGLE-1; hidden-state-conditioned draft.
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) — EAGLE-2; dynamic tree depth.
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) — EAGLE-3.
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057) — lookahead, no-draft approach.
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html) — canonical production reference with all four strategies wired up.
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) — the reference code for EAGLE-1/2/3.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Derive the mechanism behind Speculative Decoding — Draft, Verify, Repeat from tensor operations.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the core component without relying on a transformer framework.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace tensor shapes and information flow through the implementation.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Derive the mechanism behind Speculative Decoding — Draft, Verify, Repeat from tensor operations,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace tensor shapes and information flow through the implementation,” and cite a repeatable check rather than relying on visual inspection alone.
