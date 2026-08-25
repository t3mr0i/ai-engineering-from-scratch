# Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece

> Word tokenizers choke on unseen words. Character tokenizers blow up sequence length. Subword tokenizers split the difference. Every modern LLM ships on one.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 5 · 04 (GloVe / FastText / Subword)
**Time:** ~60 minutes

## Learning Objectives

- Explain the core mechanism in Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece and place it in an NLP pipeline
- Implement the central transformation behind Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece

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




## Build It

Reconstruct **Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece** by following `word_counts` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `word_counts` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-bpe-vs-wordpiece.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Sennrich, Haddow, Birch (2015). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — the BPE paper.
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) — the Unigram paper.
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226) — the library.
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) — concise reference.
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) — cookbook + encoding list.

## Exercises

Keep two runs side by side for **Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `word_counts`, `init_vocab`, `pair_counts`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece and place it in an NLP pipeline**.
2. **Run a two-value comparison.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece from first principles** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-bpe-vs-wordpiece.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `word_counts`, `init_vocab`, `pair_counts` traced to the value or shape that supports **Explain the core mechanism in Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece and place it in an NLP pipeline**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Implement the central transformation behind Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece from first principles**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/skill-bpe-vs-wordpiece.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
