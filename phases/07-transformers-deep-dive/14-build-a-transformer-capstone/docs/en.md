# Build a Transformer from Scratch — The Capstone

> Thirteen lessons. One model. No shortcuts.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 through 13. Don't skip.
**Time:** ~120 minutes

## The Problem

You've read every paper. You've implemented attention, multi-head splits, positional encodings, encoder and decoder blocks, BERT and GPT losses, MoE, KV cache. Now make them work together on a real task.

The capstone: train a small decoder-only transformer end-to-end on a character-level language modeling task. It reads Shakespeare. It generates new Shakespeare. It is small enough to train on a laptop in under 10 minutes. It is correct enough that swapping in a bigger dataset and longer training gets you a real LM.

This is the "nanoGPT" of the course. It is not original — Karpathy's 2023 nanoGPT tutorial is the reference implementation every student writes at least once. We lift the shape and retool it around what we've covered.

## The Concept

![Transformer-from-scratch block diagram](../assets/capstone.svg)

The architecture, annotated:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### What we ship

- `GPTConfig` — one place to configure all hyperparameters.
- `MultiHeadAttention` — causal, batched, with optional Flash-style pathway (PyTorch's `scaled_dot_product_attention`).
- `SwiGLUFFN` — modern FFN.
- `Block` — pre-norm, residual-wrapped attention + FFN.
- `GPT` — embeddings, stacked blocks, LM head, generate().
- Training loop with AdamW, cosine LR, gradient clipping.
- Char-level tokenizer on Shakespeare text.

### What we don't ship

- RoPE — implemented conceptually in Lesson 04. Here we use learned positional embeddings for simplicity. The exercises ask you to swap in RoPE.
- KV cache during generation — each generation step recomputes attention over the full prefix. Slower but simpler. The exercises ask you to add a KV cache.
- Flash Attention — PyTorch 2.0+ auto-dispatches if the inputs match; we use `F.scaled_dot_product_attention`.
- MoE — single FFN per block. You saw MoE in Lesson 11.

### Target metrics

On a Mac M2 laptop, a 4-layer, 4-head, d_model=128 GPT trained for 2,000 steps on `tinyshakespeare.txt`:

- Training loss converges from ~4.2 (random) to ~1.5 in about 6 minutes.
- Sampled output looks Shakespeare-shaped: archaic words, line breaks, proper names like "ROMEO:" emerge.
- Val loss (held-out final 10% of text) tracks training loss closely; no overfitting at this size/budget.




## Further Reading

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) — the classic annotated implementation.
