# Multi-Head Attention

> One attention head learns one relation at a time. Eight heads learn eight. Heads are free. Take more of them.

**Type:** Build
**Languages:** Python, Rust
**Prerequisites:** Phase 7 · 02 (Self-Attention from Scratch)
**Time:** ~75 minutes

## Learning Objectives

- Derive the mechanism behind Multi-Head Attention from tensor operations
- Implement the core component without relying on a transformer framework
- Trace tensor shapes and information flow through the implementation
- Evaluate the computational and modeling trade-offs introduced by Multi-Head Attention

## The Problem

A single self-attention head computes one attention matrix. That matrix captures one kind of relationship — usually the one that minimizes loss on whatever the training signal is. If your data has subject-verb agreement, co-reference, long-range discourse, and syntactic chunking all tangled together, a single head smears them into a single soft-max distribution and loses half the signal.

The fix from the 2017 Vaswani paper: run several attention functions in parallel, each with its own Q, K, V projections, and concatenate the outputs. Each head operates in a smaller subspace of dimension `d_model / n_heads`. Total parameters stay the same. Expressive power goes up.

Multi-head attention is the default every transformer in 2026 ships with. The only argument is about *how many* heads and whether keys and values share projections (Grouped-Query Attention, Multi-Query Attention, Multi-head Latent Attention).

## The Concept

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split.** Take `X` of shape `(N, d_model)`. Project to Q, K, V each of shape `(N, d_model)`. Reshape to `(N, n_heads, d_head)` where `d_head = d_model / n_heads`. Transpose to `(n_heads, N, d_head)`.

**Attend in parallel.** Run scaled dot-product attention inside each head. Each head produces `(N, d_head)`. The heads operate on different subspaces of the embedding and never talk during the attention computation itself.

**Concatenate and project.** Stack heads back to `(N, d_model)` and multiply by a learned output matrix `W_o` of shape `(d_model, d_model)`. `W_o` is where heads get to mix.

**Why it works.** Each head can specialize without competing with the others for representational budget. Probing studies from 2019–2024 show distinct head roles: positional heads, head that attends to the previous token, copy heads, named-entity heads, induction heads (which underlie in-context learning).

**The 2026 lineage of variations:**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

GQA is the modern default because it cuts KV-cache memory by a factor of `N/G` while keeping nearly full quality. MLA goes further by compressing K/V into a latent space, then projecting back at compute time — costs FLOPs, saves a lot more memory.




## Further Reading

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) — the original multi-head spec.
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) — the MQA paper.
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) — how to convert MHA to GQA after training.
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) — MLA and why it beats MHA/GQA on cache memory.
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) — mechanistic look at what heads actually do.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Derive the mechanism behind Multi-Head Attention from tensor operations.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the core component without relying on a transformer framework.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace tensor shapes and information flow through the implementation.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Derive the mechanism behind Multi-Head Attention from tensor operations,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace tensor shapes and information flow through the implementation,” and cite a repeatable check rather than relying on visual inspection alone.
