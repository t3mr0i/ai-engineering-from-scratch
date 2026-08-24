# Machine Translation

> Translation is the task that paid for NLP research for thirty years and keeps paying now.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 10 (Attention Mechanism), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in Machine Translation and place it in an NLP pipeline
- Implement the central transformation behind Machine Translation from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Machine Translation

## The Problem

A model reads a sentence in one language and produces a sentence in another. Length varies. Word order varies. Some source words map to multiple target words and vice versa. Idioms refuse one-to-one mapping. "I miss you" in French is "tu me manques" — literally "you are lacking to me." No word-level alignment survives that.

Machine translation is the task that forced NLP to invent encoder-decoders, attention, transformers, and eventually the whole LLM paradigm. Every step forward arrived because translation quality was measurable and the gap between human and machine was stubborn.

This lesson skips the history lesson and teaches the working pipeline of 2026: pretrained multilingual encoder-decoder (NLLB-200 or mBART), subword tokenization, beam search, BLEU and chrF evaluation, and the handful of failure modes that still ship to production uncaught.

## The Concept

![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

Modern MT is a transformer encoder-decoder trained on parallel text. The encoder reads the source in its language's tokenization. The decoder generates the target, one subword at a time, using the encoder's output via cross-attention (lesson 10). Decoding uses beam search to avoid the greedy-decoding trap. The output is detokenized, detruecased, and scored against a reference.

Three operational choices drive real-world MT quality.

- **Tokenizer.** SentencePiece BPE trained on a mixed-language corpus. Shared vocabulary across languages is what enables zero-shot pairs in NLLB.
- **Model size.** NLLB-200 distilled 600M fits on a laptop. NLLB-200 3.3B is the published production default. 54.5B is the research ceiling.
- **Decoding.** Beam width 4-5 for general content. Length penalty to avoid too-short output. Constrained decoding when you need terminology consistency.




## Further Reading

- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) — the NLLB paper.
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/) — why `sacrebleu` is the only correct way to report BLEU.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) — the chrF paper.
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) — practical fine-tuning walkthrough.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Machine Translation and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Machine Translation from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Machine Translation and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
