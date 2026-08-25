# KV Cache, Flash Attention & Inference Optimization

> Training is parallel and FLOP-bound. Inference is serial and memory-bound. Different bottleneck, different tricks.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 05 (Full Transformer), Phase 7 · 07 (GPT)
**Time:** ~75 minutes

## Learning Objectives

- Derive the mechanism behind KV Cache, Flash Attention & Inference Optimization from tensor operations
- Implement the core component without relying on a transformer framework
- Trace tensor shapes and information flow through the implementation
- Evaluate the computational and modeling trade-offs introduced by KV Cache, Flash Attention & Inference Optimization

## The Problem

A naive autoregressive decoder does `O(N²)` work to generate `N` tokens: at each step it recomputes attention over the full prefix. For a 4K-token response that is 16M attention operations, most of them redundant. Every hidden state of a prefix token is deterministic once computed — you only need to run the new token's query against the cached keys and values of everything before.

On top of that, attention itself moves a lot of data. Standard attention materializes an N×N score matrix, N×d softmax output, N×d final output — too many reads and writes to HBM. For N≥2K, attention becomes memory-bound before it becomes FLOP-bound. Classic attention kernels underuse modern GPUs by 4–10×.

Two optimizations, both from Dao et al., pushed frontier inference from "slow" to "fast":

1. **KV cache.** Store the K and V vectors of every prefix token. Each new token's attention is one query against the cached keys. Inference reduces from `O(N²)` to `O(N)` per generation step.
2. **Flash Attention.** Tile the attention computation so the full N×N matrix never hits HBM. All of softmax + matmul happens in SRAM. 2–4× wall-clock speedup on A100; 5–10× on H100 with FP8.

By 2026 both are universal. Every production inference stack (vLLM, TensorRT-LLM, SGLang, llama.cpp) assumes them. Every frontier model ships with Flash Attention enabled.

## The Concept

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### KV cache math

Per decoder layer, per token, per head:

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

For a 7B model with 32 layers, 32 heads, d_head=128, fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

For Llama 3 70B (80 layers, d_head=128, GQA with 8 KV heads):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

That 10 GB is why Llama 3 70B at 128K context needs most of a 40 GB A100 just for KV cache at batch size 1.

**GQA is the KV-cache win.** MHA with 64 heads would be 32 GB. MLA compresses even further.

Drag the dimensions and watch the cache size move. Push the sequence length or batch up and see how fast it blows past a single GPU:

```figure
kv-cache-sizer
```

### Flash Attention — the tiling trick

Standard attention:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

Three HBM round trips. On H100, HBM bandwidth is 3 TB/s; SRAM is 30 TB/s. Every HBM trip is a factor-of-10 slowdown vs keeping everything on-chip.

Flash Attention:

```
for each block of Q (tile size ~128 × 128):
    load Q_tile into SRAM
    for each block of K, V:
        load K_tile, V_tile into SRAM
        compute S_tile = Q_tile @ K_tile^T     (SRAM)
        running softmax aggregation             (SRAM)
        accumulate into O_tile                  (SRAM)
    write O_tile to HBM
```

One HBM trip per tile. Total memory footprint drops from `O(N²)` to `O(N)`. Backward pass recomputes some values from the forward pass instead of storing them — another memory win.

**Numerical trick.** Running softmax maintains `(max, sum)` across tiles so the final normalization is exact. Not an approximation — Flash Attention computes bit-identical output to standard attention (modulo fp16 non-associativity).

**Version evolution:**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | 2× on A100 |
| Flash 2 | 2023 | Better parallelism, causal-first ordering | 3× on A100 |
| Flash 3 | 2024 | Hopper asynchrony, FP8 | 1.5–2× on H100 (~740 TFLOPs FP16) |
| Flash 4 | 2026 | Blackwell 5-stage pipeline, software exp2 | Inference-first (forward only initially) |

Flash 4 is forward-pass only at launch. Training still uses Flash 3. GQA and varlen support for Flash 4 is pending (mid-2026).

### Speculative decoding — the other latency win

Cheap model proposes N tokens. Big model verifies all N in parallel. If verification accepts k tokens, you paid 1 big-model forward pass for k generations. Typical k=3–5 on code and prose.

2026 defaults:
- **EAGLE 2 / Medusa.** Integrated draft heads that share the verifier's hidden states. 2–3× speedup with no quality loss.
- **Speculative decoding with draft model.** 2–4× speedup on consumer hardware.
- **Lookahead decoding.** Jacobi iteration; no draft model needed. Niche but free.

### Continuous batching

Classic batched inference: wait for the slowest sequence to finish, then start a new batch. Wastes GPU when short responses finish early.

Continuous batching (first shipped in Orca, now in vLLM, TensorRT-LLM, SGLang): swap new requests into the batch as soon as old ones finish. 5–10× throughput gain for typical chat workloads.

### PagedAttention — KV cache as virtual memory

vLLM's headline feature. KV cache is allocated in 16-token blocks; a page table maps logical positions to physical blocks. Lets you share KV across parallel samples (beam search, parallel sampling), hot-swap prefixes for prompt caching, and defragment memory. 4× throughput improvement over naive contiguous allocation.




## Build It

Reconstruct **KV Cache, Flash Attention & Inference Optimization** by following `dot` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `dot` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-inference-optimizer.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) — Flash 1.
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) — Flash 2.
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608) — Flash 3.
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) — Blackwell 5-stage pipeline and the software-exp2 trick; read the repo README for the forward-only launch caveats this lesson mentions.
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) — vLLM paper.
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — spec decoding.
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) — EAGLE-1/2 paper for the integrated-draft approach the lesson cites.
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) — the Medusa approach referenced alongside EAGLE.
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) — the canonical deep dive on the 16-token block and page-table design.

## Exercises

This lab follows `dot` and `softmax` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `dot`, `softmax`, `attention_full`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Derive the mechanism behind KV Cache, Flash Attention & Inference Optimization from tensor operations**.
2. **Change the controlled parameter.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Implement the core component without relying on a transformer framework** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace tensor shapes and information flow through the implementation** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-inference-optimizer.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Evaluate the computational and modeling trade-offs introduced by KV Cache, Flash Attention & Inference Optimization**; note what the demo cannot establish.

## Reference Solution

A checkable result for **KV Cache, Flash Attention & Inference Optimization** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `dot`, `softmax`, `attention_full` traced to the value or shape that supports **Derive the mechanism behind KV Cache, Flash Attention & Inference Optimization from tensor operations**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Implement the core component without relying on a transformer framework**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace tensor shapes and information flow through the implementation**; and
- an updated `outputs/skill-inference-optimizer.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate the computational and modeling trade-offs introduced by KV Cache, Flash Attention & Inference Optimization**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
