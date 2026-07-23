# Text Generation Before Transformers — N-gram Language Models

> If a word is surprising, the model is bad. Perplexity makes surprise a number. Smoothing keeps it finite.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## The Problem

Before transformers, before RNNs, before word embeddings, a language model predicted the next word by counting how often it followed the previous `n-1` words. Count "the cat" → "sat" 47 times, "the cat" → "jumped" 12 times, "the cat" → "refrigerator" 0 times. Normalize to get a probability distribution.

That is an n-gram language model. It ran every speech recognizer, every spell checker, and every phrase-based machine translation system from 1980 through 2015. It still runs when you need cheap on-device language modeling.

The interesting problem is what to do about unseen n-grams. A raw count-based model assigns zero probability to anything it has not seen, which is catastrophic because sentences are long and almost every long sentence contains at least one unseen sequence. Fifty years of smoothing research fixed that. Kneser-Ney smoothing is the result, and modern deep learning inherited its empirical tradition.

## The Concept

![N-gram model: count, smooth, generate](../assets/ngram.svg)

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`. Fix `n` (typically 3 for trigrams, 4 for 4-grams). Compute from counts:

```text
P(w | context) = count(context, w) / count(context)
```

**The zero-count problem.** Any n-gram not seen in training gets probability zero. A 2007 study on the Brown corpus found that even a 4-gram model had 30% of held-out 4-grams unseen in training. You cannot evaluate on any real text without smoothing.

**Smoothing approaches, in order of sophistication:**

1. **Laplace (add-one).** Add 1 to every count. Simple, terrible on rare events.
2. **Good-Turing.** Reallocate probability mass from higher-frequency events to unseen ones based on frequency-of-frequencies.
3. **Interpolation.** Combine n-gram, (n-1)-gram, etc., estimates with tunable weights.
4. **Backoff.** If n-gram has count zero, fall back to (n-1)-gram. Katz backoff normalizes this.
5. **Absolute discounting.** Subtract a fixed discount `D` from all counts, redistribute to unseen.
6. **Kneser-Ney.** Absolute discounting plus a clever choice for the lower-order model: use *continuation probability* (how many contexts a word appears in) instead of raw frequency.

The Kneser-Ney insight is deep. "San Francisco" is a common bigram. Unigram "Francisco" appears mostly after "San." Naive absolute discounting gives "Francisco" high unigram probability (because the count is high). Kneser-Ney notices that "Francisco" appears in only one context and lowers its continuation probability accordingly. Result: a novel bigram ending in "Francisco" gets the appropriate low probability.

**Evaluation: perplexity.** The exponent of the average negative log-likelihood per word on a held-out test set. Lower is better. A perplexity of 100 means the model is as confused as it would be choosing uniformly among 100 words.

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```


## Use It

- **Classical NLP teaching.** The clearest exposure to smoothing, MLE, and perplexity you can get.
- **KenLM.** Production n-gram library. Used as a rescorer in speech and MT systems where low latency matters.
- **On-device autocomplete.** Trigram models in keyboards. Still.
- **Baselines.** Always compute an n-gram LM perplexity before declaring your neural LM good. If your transformer does not beat KN by a wide margin, something is wrong.

## Ship It

Save as `outputs/prompt-lm-baseline.md`:

```markdown
---
name: lm-baseline
description: Build a reproducible n-gram language model baseline before training a neural LM.
phase: 5
lesson: 16
---

Given a corpus and target use (next-word prediction, rescoring, perplexity baseline), output:

1. N-gram order. Trigram for general English, 4-gram if corpus is large, 5-gram for speech rescoring.
2. Smoothing. Modified Kneser-Ney is the default; Laplace only for teaching.
3. Library. `kenlm` for production, `nltk.lm` for teaching, roll your own only to learn.
4. Evaluation. Held-out perplexity with consistent tokenization between train and test sets.

Refuse to report perplexity computed with different tokenization between systems being compared — perplexity numbers are comparable only under identical tokenization. Flag OOV rate in test set; KN handles OOV poorly unless you reserve a special <UNK> token during training.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| N-gram | Word sequence | Sequence of `n` consecutive tokens. |
| Smoothing | Avoiding zeros | Reallocating probability mass so unseen events get non-zero probability. |
| Perplexity | LM quality metric | `exp(-average log-prob)` on held-out data. Lower is better. |
| Backoff | Fallback to shorter context | If trigram count is zero, use bigram. Katz backoff formalizes this. |
| Kneser-Ney | Best smoothing for n-grams | Absolute discounting + continuation probability for the lower-order model. |
| Continuation probability | KN-specific | `P(w)` weighted by number of contexts `w` appears in, not by raw count. |

## Further Reading

- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) — the canonical treatment of n-gram LMs and smoothing.
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) — the paper that settled Kneser-Ney as the best n-gram smoother.
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) — the original KN paper.
- [KenLM](https://kheafield.com/code/kenlm/) — fast production n-gram LM, still used in 2026 for latency-sensitive applications.
