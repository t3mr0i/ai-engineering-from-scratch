# Building a Tokenizer from Scratch

> Lesson 01 gave you a toy. This lesson gives you a weapon.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 minutes

## Learning Objectives

- Build a production-grade BPE tokenizer that handles Unicode, whitespace normalization, and special tokens
- Implement byte-level fallback so the tokenizer can encode any input (including emoji, CJK, and code) without unknown tokens
- Add pre-tokenization regex patterns that split text at word boundaries before applying BPE merges
- Train a custom tokenizer on a corpus and evaluate its compression ratio against tiktoken on multilingual text

## The Problem

Your BPE tokenizer from Lesson 01 works on English text. Now throw Japanese at it. Or emoji. Or Python code with mixed tabs and spaces.

It breaks.

Not because BPE is wrong -- because the implementation is incomplete. A production tokenizer handles raw bytes in any encoding, normalizes Unicode before splitting, manages special tokens that never get merged, chains pre-tokenization with subword splitting, and does all of this fast enough to not bottleneck a training pipeline processing 15 trillion tokens.

GPT-2's tokenizer has 50,257 tokens. Llama 3 has 128,256. GPT-4 has roughly 100,000. These are not toy numbers. The merge tables behind those vocabularies were trained on hundreds of gigabytes of text, and the surrounding machinery -- normalization, pre-tokenization, special token injection, chat template formatting -- is what separates a tokenizer that handles "hello world" from one that handles the entire internet.

You are going to build that machinery.

## The Concept

### The Full Pipeline

A production tokenizer is not one algorithm. It is a pipeline of five stages, each solving a different problem.

```mermaid
graph LR
    A[Raw Text] --> B[Normalize]
    B --> C[Pre-Tokenize]
    C --> D[BPE Merge]
    D --> E[Special Tokens]
    E --> F[Token IDs]

    style A fill:#1a1a2e,stroke:#e94560,color:#fff
    style B fill:#1a1a2e,stroke:#e94560,color:#fff
    style C fill:#1a1a2e,stroke:#e94560,color:#fff
    style D fill:#1a1a2e,stroke:#e94560,color:#fff
    style E fill:#1a1a2e,stroke:#e94560,color:#fff
    style F fill:#1a1a2e,stroke:#e94560,color:#fff
```

Each stage has a specific job:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode, lowercase optional, strip accents optional | "fi" ligature (U+FB01) becomes "fi" (two chars). Without this, same word gets different tokens. |
| Pre-Tokenize | Split text into chunks before BPE | Prevents BPE from merging across word boundaries. "the cat" should never produce a token "e c". |
| BPE Merge | Apply learned merge rules to byte sequences | The core compression. Turns raw bytes into subword tokens. |
| Special Tokens | Inject [BOS], [EOS], [PAD], chat template markers | These tokens have fixed IDs. They never participate in BPE merges. The model needs them for structure. |
| ID Mapping | Convert token strings to integer IDs | The model sees integers, not strings. |

### Byte-Level BPE

Lesson 01's tokenizer operated on UTF-8 bytes. That was the right call. But we skipped something important: what happens when those bytes are not valid UTF-8?

Byte-level BPE solves this by treating every possible byte value (0-255) as a valid token. Your base vocabulary is exactly 256 entries. Any file -- text, binary, corrupted -- can be tokenized without producing an unknown token.

GPT-2 added a trick: map each byte to a printable Unicode character so the vocabulary stays human-readable. Byte 0x20 (space) becomes the character "G" in their mapping. This is purely cosmetic. The algorithm does not care.

The real power: byte-level BPE handles every language on earth. Chinese characters are 3 UTF-8 bytes each. Japanese can be 3-4 bytes. Arabic, Devanagari, emoji -- all just byte sequences. The BPE algorithm finds patterns in these byte sequences exactly the same way it finds patterns in English ASCII bytes.

### Pre-Tokenization

Before BPE touches your text, you need to split it into chunks. This prevents the merge algorithm from creating tokens that span word boundaries.

GPT-2 uses a regex pattern to split text:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

This pattern splits on contractions ("don't" becomes "don" + "'t"), words with optional leading spaces, numbers, punctuation, and whitespace. The leading space is kept attached to the word -- so "the cat" becomes [" the", " cat"], not ["the", " ", "cat"].

Llama uses SentencePiece, which skips regex entirely. It treats the raw byte stream as one long sequence and lets the BPE algorithm figure out the boundaries. This is simpler but gives BPE more freedom to create cross-word tokens.

The choice matters. GPT-2's regex prevents the tokenizer from learning that "the" at the end of one word and "the" at the start of the next should merge. SentencePiece allows it, which sometimes produces more efficient compression but less interpretable tokens.

### Special Tokens

Every production tokenizer reserves token IDs for structural markers:

| Token | Purpose | Used By |
|-------|---------|---------|
| `[BOS]` / `<s>` | Beginning of sequence | Llama 3, GPT |
| `[EOS]` / `</s>` | End of sequence | All models |
| `[PAD]` | Padding for batch alignment | BERT, T5 |
| `[UNK]` | Unknown token (byte-level BPE eliminates this) | BERT, WordPiece |
| `<\|im_start\|>` | Chat message boundary start | ChatGPT, Qwen |
| `<\|im_end\|>` | Chat message boundary end | ChatGPT, Qwen |
| `<\|user\|>` | User turn marker | Llama 3 |
| `<\|assistant\|>` | Assistant turn marker | Llama 3 |

Special tokens are never split by BPE. They are matched exactly before the merge algorithm runs, replaced with their fixed ID, and the surrounding text is tokenized normally.

### Chat Templates

This is where most people get confused and most implementations break.

When you send messages to a chat model, the API accepts a list of messages:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

The model does not see JSON. It sees a flat token sequence. The chat template converts messages into that flat sequence using special tokens. Every model does this differently:

```
Llama 3:
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are helpful.<|eot_id|><|start_header_id|>user<|end_header_id|>

Hello<|eot_id|><|start_header_id|>assistant<|end_header_id|>

Hi there!<|eot_id|>

ChatGPT:
<|im_start|>system
You are helpful.<|im_end|>
<|im_start|>user
Hello<|im_end|>
<|im_start|>assistant
Hi there!<|im_end|>
```

Get the template wrong and the model produces garbage. It was trained on one exact format. Any deviation -- a missing newline, a swapped token, an extra space -- puts the input outside the training distribution.

### Speed

Python is too slow for production tokenization.

tiktoken (OpenAI) is written in Rust with Python bindings. HuggingFace tokenizers is also Rust. SentencePiece is C++. These achieve 10-100x speedups over pure Python.

For perspective: tokenizing 15 trillion tokens for Llama 3 pre-training at 1 million tokens per second (fast Python) would take 174 days. At 100 million tokens per second (Rust), it takes 1.7 days.

You are building in Python to understand the algorithm. In production, you would use a compiled implementation and only touch the Python wrapper.




## Further Reading

- [OpenAI tiktoken source](https://github.com/openai/tiktoken) -- Rust BPE implementation used by GPT-3.5/4
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers) -- Rust tokenizer library supporting BPE, WordPiece, Unigram
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783) -- details on 128K vocabulary and tokenizer training
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226) -- language-agnostic tokenization
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py) -- the original byte-to-Unicode mapping

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Build a production-grade BPE tokenizer that handles Unicode, whitespace normalization, and special tokens.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement byte-level fallback so the tokenizer can encode any input (including emoji, CJK, and code) without unknown tokens.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Add pre-tokenization regex patterns that split text at word boundaries before applying BPE merges.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Build a production-grade BPE tokenizer that handles Unicode, whitespace normalization, and special tokens,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Add pre-tokenization regex patterns that split text at word boundaries before applying BPE merges,” and cite a repeatable check rather than relying on visual inspection alone.
