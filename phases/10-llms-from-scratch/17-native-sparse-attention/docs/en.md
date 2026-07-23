# Native Sparse Attention (DeepSeek NSA)

> At 64k tokens, attention eats 70-80% of decode latency. Every open-model lab has a plan to fix it. DeepSeek's NSA (ACL 2025 best paper) is the one that stuck: three parallel attention branches — compressed coarse-grained tokens, selectively retained fine-grained tokens, and sliding windows for local context — combined through a learned gate. It is hardware-aligned (kernel-friendly), natively trainable (works in pre-training, not bolted on at inference), and on 64k decodes it runs faster than FlashAttention while matching or beating full attention quality. This lesson builds the three branches end-to-end and shows why the sparsity is end-to-end differentiable.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## Learning Objectives

- State the three NSA attention branches and what each one captures.
- Explain why NSA is "natively trainable" where prior sparse-attention methods were inference-only.
- Compute the attention compute savings of NSA versus full attention at 64k context as a function of compression block size and selection top-k.
- Implement the three-branch combination in stdlib Python on a short synthetic sequence and verify the gating weights behave.

## The Problem

Full attention at sequence length N costs `O(N^2)` time and `O(N)` KV cache per layer. At 64k tokens, the compute and memory bandwidth numbers are catastrophic. Measured theoretical estimate from the NSA paper: attention accounts for 70-80% of total decode latency at 64k. Everything downstream — TTFT, tokens/sec, cost per million tokens — is dominated by attention cost.

Sparse attention is the obvious answer. Prior attempts fall into two buckets. Fixed-pattern sparsity (sliding-window, strided, block-local) throws information away and fails on long-range recall tasks. Inference-time sparsity (KV cache pruning, H2O, StreamingLLM) is applied to a model pre-trained on dense attention and recovers only a fraction of the potential speedup because the model was never asked to route information through the sparse pattern.

Native Sparse Attention (Yuan et al., DeepSeek + PKU + UW, ACL 2025 best paper, arXiv:2502.11089) does both: a sparsity pattern the model learns during pre-training, implemented as a kernel-aligned algorithm that actually delivers the compute savings at inference. Two years from now, NSA or a direct descendant is the default attention on every frontier long-context model.

## The Concept

### Three parallel branches

For each query, NSA runs attention three times, against three different views of the KV cache:

1. **Compressed branch.** Tokens are grouped into blocks of size `l` (typically 32 or 64). Each block is compressed into a single summary token via a small learned MLP. The query attends over these compressed tokens, getting a coarse-grained view of the whole sequence.

2. **Selected branch.** Using attention scores from the compressed branch, the top-k blocks most relevant to the current query are identified. Fine-grained (uncompressed) tokens from those blocks are read and the query attends over all of them. Think of compressed-branch attention as the routing signal for the selection.

3. **Sliding-window branch.** The query attends to the most recent `W` tokens (typically 512) for local context. This branch captures the structure-heavy short-range patterns (syntax, local coreference) that the other two might miss.

The three branch outputs are combined via a learned per-position gate:

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win` are gate weights from a small MLP on the query. They do not have to sum to 1 — they can weight branches independently.

### Why this is "natively trainable"

The selection step (top-k blocks) is discrete. Discrete operations break gradient flow. Prior sparse-attention work either skipped backprop through selection (limiting training) or used continuous relaxations that did not give real sparsity at inference.

NSA sidesteps this: the compressed-branch attention IS a differentiable coarse-grained attention on the whole sequence. The top-k operation just reuses the top attention scores from the compressed branch to pick which fine-grained blocks to load. Gradients flow through the compressed-branch scores (which influence both the compressed output AND the selection logic), and the selected blocks' contribution to the final output is also differentiable. The non-differentiable `top_k` operation is a no-op on the forward computational graph — it only controls which blocks get loaded from memory.

This is why NSA can be used in pre-training end to end. The model learns to route information through the three branches jointly, producing a sparse pattern that at inference actually delivers the promised speedup.

### Hardware-aligned kernel

NSA's kernel is designed for modern GPU memory hierarchies. The kernel loads queries by GQA groups (outer loop), fetches the corresponding sparse KV blocks per group (inner loop), and runs attention on SRAM. Because each query group sees the same selected blocks (selection is per-query-group, not per-query-head), the KV loads are amortized across the group. Arithmetic intensity stays high.

The paper reports Triton kernels running 9x faster than FlashAttention on 64k decodes, with the speedup ratio growing with sequence length. Forward and backward kernels are both provided.

### The compute budget

Let `N` be sequence length, `l` the compression block size, `k` the top-k selection count, `w` the sliding window, `b` the selected block size (typically equals `l`).

- Compressed branch: `O(N/l)` keys per query, so `O(N * N / l)` total.
- Selected branch: `O(k * b)` keys per query, so `O(N * k * b)`.
- Sliding branch: `O(w)` keys per query, so `O(N * w)`.

Total: `O(N * (N/l + k*b + w))`.

With `N = 64k, l = 64, k = 16, b = 64, w = 512`: per-query cost is `1000 + 1024 + 512 = 2536 keys`. Full attention is `64000 keys`. 25x compute reduction.

With `N = 128k, l = 64, k = 16, b = 64, w = 512`: per-query cost is `2000 + 1024 + 512 = 3536 keys`. Full attention is `128000 keys`. 36x reduction. The benefit grows with sequence length, which is the whole point.

### How does it compare

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

MoBA (Moonshot, arXiv:2502.13189) was concurrently published and takes a similar three-is-better-than-one approach, applying the MoE principle to attention blocks. NSA and MoBA are the two architectures to know for 2026 long-context pre-training.




## Further Reading

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) — the paper
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) — the architecture family NSA targets
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) — concurrent work, MoE-style attention over blocks
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) — sliding-window origins
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) — inference-time sparsity baseline NSA improves on
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691) — the full-attention baseline NSA kernels beat at 64k
