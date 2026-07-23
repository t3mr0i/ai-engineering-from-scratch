# Machine Translation

> Translation is the task that paid for NLP research for thirty years and keeps paying now.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 10 (Attention Mechanism), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

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


## Use It

The 2026 production stack for MT:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M` (laptop) or `nllb-200-3.3B` (production) |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian (~50 MB) |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

LLMs now outperform specialized MT models on several language pairs as of 2026, particularly on idiomatic content and long context. The tradeoff is per-token cost and latency. Pick an LLM when context length, stylistic consistency, or domain adaptation via prompting matters more than throughput.

## Ship It

Save as `outputs/skill-mt-evaluator.md`:

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

Given a source text and a candidate translation, output:

1. Automatic score estimate. BLEU and chrF ranges you would expect. State whether a reference is available.
2. Five-point human-verifiable check list: (a) content preservation (no hallucinations), (b) correct language, (c) register / formality match, (d) terminology consistency with glossary if provided, (e) no truncation or length explosion.
3. One domain-specific issue to probe. E.g., for legal: named entities and statute citations. For medical: drug names and dosages. For UI: placeholder variables `{name}`.
4. Confidence flag. "Ship" / "Ship with review" / "Do not ship". Tie to the severity of issues found in step 2.

Refuse to ship a translation without a language-ID check on output. Refuse to evaluate without a reference unless the user explicitly opts in to reference-free scoring (COMET-QE, BLEURT-QE). Flag any content over 1000 tokens as likely needing chunked translation.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BLEU | Translation score | N-gram precision with brevity penalty. [0, 100]. |
| chrF | Character F-score | Character-level F-score. More sensitive for morphologically rich languages. |
| NMT | Neural MT | Transformer encoder-decoder trained on parallel text. The 2017+ default. |
| NLLB | No Language Left Behind | Meta's 200-language MT model family. |
| Constrained decoding | Controlled output | Force specific tokens or n-grams to appear / not appear in the output. |
| Hallucination | Invented content | Model output that is not supported by the source. |

## Further Reading

- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) — the NLLB paper.
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/) — why `sacrebleu` is the only correct way to report BLEU.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) — the chrF paper.
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) — practical fine-tuning walkthrough.
