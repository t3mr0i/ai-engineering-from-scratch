# GloVe, FastText, and Subword Embeddings

> Word2Vec trained one embedding per word. GloVe factorized the co-occurrence matrix. FastText embedded the pieces. BPE bridged to transformers.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec from Scratch)
**Time:** ~45 minutes

## The Problem

Word2Vec left two open questions.

First, there was a parallel line of research that factorized the co-occurrence matrix directly (LSA, HAL) rather than doing online skip-gram updates. Was Word2Vec's iterative approach fundamentally better, or was the difference an artifact of how the two methods handled counts? **GloVe** answered that: matrix factorization with a thoughtfully chosen loss matches or beats Word2Vec, and costs less to train.

Second, neither method had a story for words it had never seen. `Zoomer-approved`, `dogecoin`, any proper noun coined last week, every inflected form of a rare root. **FastText** fixed this by embedding character n-grams: a word is the sum of its parts, including morphemes, so even out-of-vocabulary words get a sensible vector.

Third, once transformers arrived, the question shifted again. Word-level vocabularies cap out around a million entries; real language is more open than that. **Byte-pair encoding (BPE)** and its relatives solved this by learning a vocabulary of frequent subword units that covers everything. Every modern tokenizer for every modern LLM is a subword tokenizer.

This lesson walks all three, then explains which to reach for when.

## The Concept

**GloVe (Global Vectors).** Build the word-word co-occurrence matrix `X` where `X[i][j]` is how often word `j` appears in the context of word `i`. Train vectors such that `v_i · v_j + b_i + b_j ≈ log(X[i][j])`. Weight the loss so frequent pairs do not dominate. Done.

**FastText.** A word is the sum of its character n-grams plus the word itself. `where` becomes `<wh, whe, her, ere, re>, <where>`. The word vector is the sum of those component vectors. Train as Word2Vec. Benefit: unseen words (`whereupon`) compose from known n-grams.

**BPE (Byte-Pair Encoding).** Start with a vocabulary of individual bytes (or characters). Count every adjacent pair in the corpus. Merge the most frequent pair into a new token. Repeat for `k` iterations. Result: a vocabulary of `k + 256` tokens where frequent sequences (`ing`, `tion`, `the`) are single tokens and rare words are broken into familiar pieces. Every sentence tokenizes into something.


## Use It

In practice, you rarely train any of these yourself. You load pre-trained checkpoints.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

For BPE-style subword tokenization in the transformer era:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

The `Ġ` prefix marks word boundaries (a GPT-2 convention). Every modern tokenizer is a BPE variant, WordPiece (BERT), or SentencePiece (T5, LLaMA).

### When to pick which

| Situation | Pick |
|-----------|------|
| Pretrained general-purpose word vectors, no OOV tolerance needed | GloVe 300d |
| Pretrained general-purpose word vectors, must handle misspellings / neologisms / morphologically rich languages | FastText |
| Anything going into a transformer (training or inference) | Whatever tokenizer the model shipped with. Never swap. |
| Training your own language model from scratch | Train a BPE or SentencePiece tokenizer on your corpus first |
| Production text classification with a linear model | Still TF-IDF. Lesson 02. |

## Ship It

Save as `outputs/skill-embeddings-picker.md`:

```markdown
---
name: tokenizer-picker
description: Pick a tokenization approach for a new language model or text pipeline.
version: 1.0.0
phase: 5
lesson: 04
tags: [nlp, tokenization, embeddings]
---

Given a task and dataset description, you output:

1. Tokenization strategy (word-level, BPE, WordPiece, SentencePiece, byte-level). One-sentence reason.
2. Vocabulary size target (e.g., 32k for an English-only LM, 64k-100k for multilingual).
3. Library call with the exact training command. Name the library. Quote the arguments.
4. One reproducibility pitfall. Tokenizer-model mismatch is the single most common silent production bug; call out which pair must be used together.

Refuse to recommend training a custom tokenizer when the user is fine-tuning a pretrained LLM. Refuse to recommend word-level tokenization for any model targeting production inference. Flag non-English / multi-script corpora as needing SentencePiece with byte fallback.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Co-occurrence matrix | Word-word frequency table | `X[i][j]` = how often word `j` appears in a window around word `i`. |
| Subword | Piece of a word | A character n-gram (FastText) or learned token (BPE/WordPiece/SentencePiece). |
| BPE | Byte-pair encoding | Iterative merging of most-frequent adjacent pairs until vocabulary hits target size. |
| OOV | Out of vocabulary | Word the model has never seen. Word2Vec/GloVe fail. FastText and BPE handle it. |
| Byte-level BPE | BPE on raw bytes | GPT-2's scheme. Vocabulary starts with 256 bytes, so nothing is ever OOV. |

## Further Reading

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) — the GloVe paper, seven pages, still the best derivation of the loss.
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) — FastText.
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — the paper that introduced BPE to modern NLP.
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) — how BPE, WordPiece, and SentencePiece actually differ in practice.
