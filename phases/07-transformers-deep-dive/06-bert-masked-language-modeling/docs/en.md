# BERT — Masked Language Modeling

> GPT predicts the next word. BERT predicts a missing word. One sentence of difference — and half a decade of everything embedding-shaped.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 5 · 02 (Text Representation)
**Time:** ~45 minutes

## Learning Objectives

- Derive the mechanism behind BERT — Masked Language Modeling from tensor operations
- Implement the core component without relying on a transformer framework
- Trace tensor shapes and information flow through the implementation
- Evaluate the computational and modeling trade-offs introduced by BERT — Masked Language Modeling

## The Problem

In 2018 every NLP task — sentiment, NER, QA, entailment — trained its own model from scratch on its own labeled data. There was no pre-trained "understand English" checkpoint you could fine-tune. ELMo (2018) showed you could pre-train contextual embeddings with a bidirectional LSTM; it helped but did not generalize.

BERT (Devlin et al. 2018) asked: what if we took a transformer encoder, trained it on every sentence on the internet, and forced it to predict missing words from context on both sides? Then you fine-tune one head on your downstream task. Parameter efficiency was a revelation.

The result: within 18 months BERT and its variants (RoBERTa, ALBERT, ELECTRA) dominated every NLP leaderboard that existed. By 2020 every search engine, content moderation pipeline, and semantic-search system on earth had a BERT inside.

In 2026 encoder-only models are still the right tool for classification, retrieval, and structured extraction — they run 5–10× faster per token than decoders and their embeddings are the backbone of every modern retrieval stack. ModernBERT (Dec 2024) pushed the architecture to 8K context with Flash Attention + RoPE + GeGLU.

## The Concept

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### The training signal

Take a sentence: `the quick brown fox jumps over the lazy dog`.

Mask 15% of tokens randomly:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

Train the model to predict the original tokens at masked positions. Because the encoder is bidirectional, predicting `[MASK]` at position 1 can use `brown fox jumps` at positions 2+. That is the thing GPT cannot do.

### The BERT mask rules

Of the 15% of tokens selected for prediction:

- 80% are replaced with `[MASK]`.
- 10% are replaced with a random token.
- 10% are left unchanged.

Why not always `[MASK]`? Because `[MASK]` never appears at inference time. Training the model to expect `[MASK]` at 100% of masked positions would create a distribution shift between pretraining and fine-tuning. The 10% random + 10% unchanged keeps the model honest.

### Next Sentence Prediction (NSP) — and why it was dropped

Original BERT also trained on NSP: given two sentences A and B, predict if B follows A. RoBERTa (2019) ablated it and showed NSP hurt, not helped. Modern encoders skip it.

### What changed in 2026: ModernBERT

The 2024 ModernBERT paper rebuilt the block with 2026 primitives:

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

And unlike the 2018 stack, it is Flash-Attention-native. Inference is 2–3× faster at sequence length 8K than DeBERTa-v3 with better GLUE scores.

### Use cases that still pick an encoder in 2026

| Task | Why encoder beats decoder |
|------|---------------------------|
| Retrieval / semantic search embeddings | Bidirectional context = better embedding quality per token |
| Classification (sentiment, intent, toxicity) | One forward pass; no generation overhead |
| NER / token labeling | Per-position output, natively bidirectional |
| Zero-shot entailment (NLI) | Classifier head on top of encoder |
| Reranker for RAG | Cross-encoder scoring, 10x faster than LLM rerankers |




## Further Reading

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) — original paper.
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) — how to train BERT right; kills NSP.
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555) — replaced-token detection beats MLM at matched compute.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) — ModernBERT paper.
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) — canonical encoder reference.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Derive the mechanism behind BERT — Masked Language Modeling from tensor operations.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the core component without relying on a transformer framework.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace tensor shapes and information flow through the implementation.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Derive the mechanism behind BERT — Masked Language Modeling from tensor operations,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace tensor shapes and information flow through the implementation,” and cite a repeatable check rather than relying on visual inspection alone.
