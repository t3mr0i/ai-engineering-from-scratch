# GloVe, FastText, and Subword Embeddings

> Word2Vec trained one embedding per word. GloVe factorized the co-occurrence matrix. FastText embedded the pieces. BPE bridged to transformers.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec from Scratch)
**Time:** ~45 minutes

## Learning Objectives

- Explain the core mechanism in GloVe, FastText, and Subword Embeddings and place it in an NLP pipeline
- Implement the central transformation behind GloVe, FastText, and Subword Embeddings from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for GloVe, FastText, and Subword Embeddings

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




## Further Reading

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) — the GloVe paper, seven pages, still the best derivation of the loss.
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) — FastText.
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — the paper that introduced BPE to modern NLP.
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) — how BPE, WordPiece, and SentencePiece actually differ in practice.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in GloVe, FastText, and Subword Embeddings and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind GloVe, FastText, and Subword Embeddings from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in GloVe, FastText, and Subword Embeddings and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
