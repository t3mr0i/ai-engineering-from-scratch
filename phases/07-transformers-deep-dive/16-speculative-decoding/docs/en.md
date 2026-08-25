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




## Build It

Reconstruct **Speculative Decoding — Draft, Verify, Repeat** by following `sample` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `sample` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-spec-decode-picker.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

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

This lab follows `sample` and `residual` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `sample`, `residual`, `kl`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Derive the mechanism behind Speculative Decoding — Draft, Verify, Repeat from tensor operations**.
2. **Change the controlled parameter.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Implement the core component without relying on a transformer framework** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace tensor shapes and information flow through the implementation** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-spec-decode-picker.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Evaluate the computational and modeling trade-offs introduced by Speculative Decoding — Draft, Verify, Repeat**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Speculative Decoding — Draft, Verify, Repeat** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `sample`, `residual`, `kl` traced to the value or shape that supports **Derive the mechanism behind Speculative Decoding — Draft, Verify, Repeat from tensor operations**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Implement the core component without relying on a transformer framework**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace tensor shapes and information flow through the implementation**; and
- an updated `outputs/skill-spec-decode-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate the computational and modeling trade-offs introduced by Speculative Decoding — Draft, Verify, Repeat**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
