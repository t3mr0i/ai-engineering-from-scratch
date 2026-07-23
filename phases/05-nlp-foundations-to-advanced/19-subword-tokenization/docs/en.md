# Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece

> Word tokenizers choke on unseen words. Character tokenizers blow up sequence length. Subword tokenizers split the difference. Every modern LLM ships on one.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 5 · 04 (GloVe / FastText / Subword)
**Time:** ~60 minutes

## The Problem

Your vocabulary has 50,000 words. A user types "untokenizable". Your tokenizer returns `[UNK]`. The model now has no signal about the word. Worse: the 90th-percentile document in your corpus has 40 rare words, which means 40 bits of dropped information per document.

Subword tokenization solves this. Common words stay single tokens. Rare words decompose into meaningful pieces: `untokenizable` → `un`, `token`, `izable`. Training data covers everything because any string is ultimately a sequence of bytes.

Every frontier LLM in 2026 ships on one of three algorithms (BPE, Unigram, WordPiece), wrapped in one of three libraries (tiktoken, SentencePiece, HF Tokenizers). You cannot ship a language model without picking one.

## The Concept

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding).** Start with a character-level vocabulary. Count every adjacent pair. Merge the most frequent pair into a new token. Repeat until you hit the target vocabulary size. Dominant algorithm: GPT-2/3/4, Llama, Gemma, Qwen2, Mistral.

**Byte-level BPE.** Same algorithm but over raw bytes (256 base tokens) instead of Unicode characters. Guarantees zero `[UNK]` tokens — any byte sequence encodes. GPT-2 uses 50,257 tokens (256 bytes + 50,000 merges + 1 special).

**Unigram.** Start with a huge vocabulary. Assign each token a unigram probability. Iteratively prune tokens whose removal least increases the corpus log-likelihood. Probabilistic at inference: can sample tokenizations (useful for data augmentation via subword regularization). Used by T5, mBART, ALBERT, XLNet, Gemma.

**WordPiece.** Merge pairs that maximize likelihood of the training corpus rather than raw frequency. Used by BERT, DistilBERT, ELECTRA.

**SentencePiece vs tiktoken.** SentencePiece is the library that *trains* vocabularies (BPE or Unigram) directly on raw Unicode text, encoding whitespace as `▁`. tiktoken is OpenAI's fast *encoder* against pre-built vocabularies; it does not train.

Rule of thumb:

- **Training a new vocabulary:** SentencePiece (multilingual, no pre-tokenization) or HF Tokenizers.
- **Fast inference against GPT vocab:** tiktoken (cl100k_base, o200k_base).
- **Both:** HF Tokenizers — one library, training + serving.


## Use It

The 2026 stack:

| Situation | Pick |
|-----------|------|
| Training a monolingual model from scratch | HF Tokenizers (BPE) |
| Training a multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving an OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab (code, math, protein) | Train custom BPE on domain corpus, merge with base vocab |
| Edge inference, small model | Unigram (smaller vocabularies work better) |

Vocabulary size is a scaling decision, not a constant. Rough heuristic: 32k for <1B params, 50-100k for 1-10B, 200k+ for multilingual/frontier.

## Ship It

Save as `outputs/skill-bpe-vs-wordpiece.md`:

```markdown
---
name: tokenizer-picker
description: Pick tokenizer algorithm, vocab size, library for a given corpus and deployment target.
version: 1.0.0
phase: 5
lesson: 19
tags: [nlp, tokenization]
---

Given a corpus (size, languages, domain) and deployment target (training from scratch / fine-tuning / API-compatible inference), output:

1. Algorithm. BPE, Unigram, or WordPiece. One-sentence reason.
2. Library. SentencePiece, HF Tokenizers, or tiktoken. Reason.
3. Vocab size. Rounded to nearest 1k. Reason tied to model size and language coverage.
4. Coverage settings. `character_coverage`, `byte_fallback`, special-token list.
5. Validation plan. Average tokens-per-word on held-out set, OOV rate, compression ratio, round-trip decode equality.

Refuse to train a character-coverage <0.995 tokenizer on corpora with rare-script content. Refuse to ship a vocab without a frozen `tokenizer.json` hash check in CI. Flag any monolingual tokenizer under 16k vocab as likely under-spec.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BPE | Byte-Pair Encoding | Greedy merge of most-frequent character pairs until target vocab size hit. |
| Byte-level BPE | No unknown tokens ever | BPE over raw 256 bytes; GPT-2 / Llama use this. |
| Unigram | Probabilistic tokenizer | Prunes from a large candidate set using log-likelihood; used by T5, Gemma. |
| SentencePiece | The whitespace one | Library that trains BPE/Unigram on raw text; space encoded as `▁`. |
| tiktoken | The fast one | OpenAI's Rust-backed BPE encoder for pre-built vocabs. No training. |
| Merge list | The magic numbers | Ordered list of `(a, b) → ab` merges; inference applies in order. |
| Character coverage | How rare is too rare? | Fraction of characters in training corpus the tokenizer must cover; ~0.9995 typical. |

## Further Reading

- [Sennrich, Haddow, Birch (2015). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — the BPE paper.
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) — the Unigram paper.
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226) — the library.
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) — concise reference.
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) — cookbook + encoding list.
