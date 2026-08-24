# Attention Mechanism — The Breakthrough

> The decoder stops squinting at a compressed summary and starts looking at the whole source. Everything after this is attention plus engineering.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 09 (Sequence-to-Sequence Models)
**Time:** ~45 minutes

## Learning Objectives

- Explain the core mechanism in Attention Mechanism — The Breakthrough and place it in an NLP pipeline
- Implement the central transformation behind Attention Mechanism — The Breakthrough from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Attention Mechanism — The Breakthrough

## The Problem

Lesson 09 ended on a measured failure. A GRU encoder-decoder trained on a toy copy task goes from 89% accuracy at length 5 to near-chance at length 80. The reason is structural, not a training bug: every bit of information the encoder gleaned has to fit in one fixed-size hidden state, and the decoder never sees anything else.

Bahdanau, Cho, and Bengio published a three-line fix in 2014. Instead of giving the decoder only the final encoder state, keep every encoder state. At each decoder step, compute a weighted average of encoder states where the weights say "how much does the decoder need to look at encoder position `i` right now?" That weighted average is the context, and it changes every decoder step.

That is the whole idea. Transformers extended it. Self-attention applied it to a single sequence. Multi-head attention ran it in parallel. But the 2014 version already broke the bottleneck, and once you have it, the pivot to transformers is engineering, not conceptual.

## The Concept

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

At each decoder step `t`:

1. Use the previous decoder hidden state `s_{t-1}` as a **query**.
2. Score it against every encoder hidden state `h_1, ..., h_T`. One scalar per encoder position.
3. Softmax the scores to get attention weights `α_{t,1}, ..., α_{t,T}` that sum to 1.
4. Context vector `c_t = Σ α_{t,i} * h_i`. Weighted average of encoder states.
5. Decoder takes `c_t` plus the previous output token, produces the next token.

The weighted average is the point. When the decoder needs to translate "Je" to "I", it weights the encoder state over "Je" high and the others low. When it needs "not", it weights "pas" high. The context vector reshapes each step.

## Shapes (the thing that bites everyone)

This is where every attention implementation goes wrong the first time. Read slowly.

| Thing | Shape | Notes |
|-------|-------|-------|
| Encoder hidden states `H` | `(T_enc, d_h)` | If BiLSTM, `d_h = 2 * d_hidden` |
| Decoder hidden state `s_{t-1}` | `(d_s,)` | One vector |
| Attention score `e_{t,i}` | scalar | One per encoder position |
| Attention weight `α_{t,i}` | scalar | After softmax over all `i` |
| Context vector `c_t` | `(d_h,)` | Same shape as an encoder state |

**Bahdanau (additive) score.** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`.

- `s_{t-1}` has shape `(d_s,)`, `h_i` has shape `(d_h,)`.
- `W_a` has shape `(d_attn, d_s)`. `U_a` has shape `(d_attn, d_h)`.
- Their sum inside the tanh has shape `(d_attn,)`.
- `v_α` has shape `(d_attn,)`. The inner product with `v_α` collapses to a scalar. **This is what `v_α` does.** It is not magic. It is the projection that turns an attention-dim vector into a scalar score.

**Luong (multiplicative) score.** Three variants:

- `dot`: `e_{t,i} = s_t^T * h_i`. Requires `d_s == d_h`. Hard constraint. Skip if your encoder is bidirectional.
- `general`: `e_{t,i} = s_t^T * W * h_i` with `W` shape `(d_s, d_h)`. Removes the equal-dim constraint.
- `concat`: essentially the Bahdanau form. Rarely used since the first two are cheaper.

**One Bahdanau / Luong gotcha worth naming.** Bahdanau uses `s_{t-1}` (the decoder state *before* generating the current word). Luong uses `s_t` (the state *after*). Mixing them up produces subtly wrong gradients that are extremely hard to debug. Pick one paper and stick to its convention.




## Further Reading

- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) — the paper.
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) — the three score variants and their comparison.
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186) — the interpretability caveat.
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html) — runnable walkthrough with PyTorch.
