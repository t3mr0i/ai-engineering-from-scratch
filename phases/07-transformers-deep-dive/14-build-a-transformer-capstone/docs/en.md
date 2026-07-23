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


## Use It

This capstone is a reference architecture. Three extensions to ship it to something real:

1. **Swap the tokenizer.** Use BPE (e.g. `tiktoken.get_encoding("cl100k_base")`). Vocab size jumps from 65 to ~50,000. Model capacity needs to scale up to compensate.
2. **Train on a bigger corpus.** Use `OpenWebText` or `fineweb-edu` (HuggingFace). 10B tokens on a single A100 takes ~24 hours for a 125M-param GPT.
3. **Add RoPE + KV cache + Flash Attention.** The exercises below walk you through each.

This ends up as a 125M-parameter GPT that generates fluent English. Not a frontier model. But the same code path — just bigger — is what Karpathy, EleutherAI, and the Allen Institute use to train research checkpoints in 2026.

## Ship It

See `outputs/skill-transformer-review.md`. The skill reviews a transformer-from-scratch implementation for correctness across all 13 prior lessons.


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| nanoGPT | "Karpathy's tutorial repo" | Minimal decoder-only transformer training code, ~300 LOC; the canonical reference. |
| tinyshakespeare | "The standard toy corpus" | ~1.1 MB of text; every character-LM tutorial since 2015 uses it. |
| Tied embeddings | "Share input/output matrix" | LM head weight = transpose of token embedding matrix; saves parameters, improves quality. |
| bf16 autocast | "Training precision trick" | Run forward/back in bf16, keep optimizer state in fp32; standard since 2021. |
| Gradient clipping | "Stops spikes" | Cap global grad norm at 1.0; prevents training blowups. |
| Cosine LR schedule | "The 2020+ default" | LR ramps up linearly (warmup) then decays cosine-shaped to 10% of peak. |
| MFU | "Model FLOP Utilization" | Achieved FLOPs / theoretical peak; 40% dense, 30% MoE is strong in 2026. |
| Val loss | "Held-out loss" | Cross-entropy on data the model never saw; overfit detector. |

## Further Reading

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) — the classic annotated implementation.
