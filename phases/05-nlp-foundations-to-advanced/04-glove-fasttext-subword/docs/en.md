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




## Build It

Reconstruct **GloVe, FastText, and Subword Embeddings** by following `char_ngrams` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `char_ngrams` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/.gitkeep` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) — the GloVe paper, seven pages, still the best derivation of the loss.
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) — FastText.
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — the paper that introduced BPE to modern NLP.
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) — how BPE, WordPiece, and SentencePiece actually differ in practice.

## Exercises

This lab follows `char_ngrams` and `learn_bpe` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `char_ngrams`, `learn_bpe`, `apply_bpe`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in GloVe, FastText, and Subword Embeddings and place it in an NLP pipeline**.
2. **Change the controlled parameter.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind GloVe, FastText, and Subword Embeddings from first principles** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/.gitkeep` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for GloVe, FastText, and Subword Embeddings**; note what the demo cannot establish.

## Reference Solution

A checkable result for **GloVe, FastText, and Subword Embeddings** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `char_ngrams`, `learn_bpe`, `apply_bpe` traced to the value or shape that supports **Explain the core mechanism in GloVe, FastText, and Subword Embeddings and place it in an NLP pipeline**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Implement the central transformation behind GloVe, FastText, and Subword Embeddings from first principles**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/.gitkeep` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for GloVe, FastText, and Subword Embeddings**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
