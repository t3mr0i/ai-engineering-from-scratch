# GPT — Causal Language Modeling

> BERT sees both sides. GPT sees only the past. The triangle mask is the most consequential single line of code in modern AI.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 05 (Full Transformer), Phase 7 · 06 (BERT)
**Time:** ~75 minutes

## Learning Objectives

- Derive the mechanism behind GPT — Causal Language Modeling from tensor operations
- Implement the core component without relying on a transformer framework
- Trace tensor shapes and information flow through the implementation
- Evaluate the computational and modeling trade-offs introduced by GPT — Causal Language Modeling

## The Problem

A language model answers one question: given the first `t-1` tokens, what is the probability distribution over token `t`? Train on that signal — next-token prediction — and you get a model that can generate arbitrary text one token at a time.

To train it end-to-end on a whole sequence in parallel, you need each position's prediction to depend only on earlier positions. Otherwise the model trivially cheats by looking at the answer.

The causal mask does this. It is a single upper-triangular matrix of `-inf` values added to attention scores before softmax. After softmax, those positions become 0. Each position can attend only to itself and earlier positions. And because you apply it once to the whole sequence, you get N parallel next-token predictions in one forward pass.

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2024), Claude, Llama, Qwen, Mistral, DeepSeek, Kimi — they are all decoder-only causal transformers with the same core loop. Just bigger, better data, and better RLHF.

## The Concept

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### The mask

Given a sequence of length `N`, build an `N × N` matrix:

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

Add `M` to the raw attention scores before softmax. `exp(-inf) = 0`, so masked positions contribute zero weight. Each row of the attention matrix is a probability distribution over previous positions only.

Implementation cost: one `torch.tril()` call. Time to compute: nanoseconds. Impact on the field: everything.

### Parallel training, serial inference

Training: forward-pass the whole `(N, d_model)` sequence once, compute N cross-entropy losses (one per position), sum, backprop. Parallel along the sequence. This is why GPT training scales — you process 1M tokens in a batch in one GPU pass.

Inference: you generate token by token. Feed `[t1, t2, t3]`, get `t4`. Feed `[t1, t2, t3, t4]`, get `t5`. Feed `[t1, t2, t3, t4, t5]`, get `t6`. The KV cache (Lesson 12) saves the hidden states of `t1…tn` so you don't recompute them each step. But serial depth at inference = output length. That is the autoregressive tax and why decoding is the latency bottleneck of every LLM.

### The loss — shift-by-one

Given tokens `[t1, t2, t3, t4]`:

- Input: `[t1, t2, t3]`
- Targets: `[t2, t3, t4]`

For every position `i`, compute `-log P(target_i | inputs[:i+1])`. Sum. This is the cross-entropy for the whole sequence.

Every transformer LM you've heard of trains on this loss. Pre-training, fine-tuning, SFT — same loss, different data.

### Decoding strategies

After training, sampling choices matter more than people think.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | Argmax every step | Deterministic tasks, code completion |
| Temperature | Divide logits by T, sample | Creative tasks, higher T = more diversity |
| Top-k | Sample from top-k tokens only | Kills low-probability tails |
| Top-p (nucleus) | Sample from smallest set with cumulative prob ≥ p | 2020+ default; adapts to distribution shape |
| Min-p | Keep tokens with `p > min_p * max_p` | 2024+; better at rejecting long tails than top-p |
| Speculative decoding | Draft model proposes N tokens, big model verifies | 2–3× latency reduction at same quality |

In 2026, min-p + temperature 0.7 is a reasonable default for open-weights models. Speculative decoding is table stakes for any production inference stack.

### What made the "GPT recipe" work

1. **Decoder-only.** No encoder overhead. One pass of attention + FFN per layer.
2. **Scaling.** 124M → 1.5B → 175B → trillions. Chinchilla scaling laws (Lesson 13) tell you how to spend compute.
3. **In-context learning.** Emerged around 6B–13B. The model can follow few-shot examples without fine-tuning.
4. **RLHF.** Post-training on human preferences converted raw pretrained text into chat assistants.
5. **Pre-norm + RoPE + SwiGLU.** Stable training at scale.

The core architecture hasn't changed much since GPT-2. Everything interesting has happened in data, scale, and post-training.




## Further Reading

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) — GPT-1.
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) — GPT-2.
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) — GPT-3 and in-context learning.
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — spec decoding paper.
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) — canonical causal-LM reference code.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Derive the mechanism behind GPT — Causal Language Modeling from tensor operations.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the core component without relying on a transformer framework.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace tensor shapes and information flow through the implementation.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Derive the mechanism behind GPT — Causal Language Modeling from tensor operations,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace tensor shapes and information flow through the implementation,” and cite a repeatable check rather than relying on visual inspection alone.
