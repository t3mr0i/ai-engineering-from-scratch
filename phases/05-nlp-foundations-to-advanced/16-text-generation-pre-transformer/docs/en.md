# Text Generation Before Transformers — N-gram Language Models

> If a word is surprising, the model is bad. Perplexity makes surprise a number. Smoothing keeps it finite.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## Learning Objectives

- Explain the core mechanism in Text Generation Before Transformers — N-gram Language Models and place it in an NLP pipeline
- Implement the central transformation behind Text Generation Before Transformers — N-gram Language Models from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Text Generation Before Transformers — N-gram Language Models

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

**The zero-count problem.** Any n-gram not seen in training gets probability zero. Held-out text inevitably contains unseen higher-order n-grams, so an unsmoothed model can assign an entire sequence probability zero. You cannot evaluate robustly on real text without smoothing.

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




## Further Reading

- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) — the canonical treatment of n-gram LMs and smoothing.
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) — the paper that settled Kneser-Ney as the best n-gram smoother.
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) — the original KN paper.
- [KenLM](https://kheafield.com/code/kenlm/) — fast production n-gram LM, still used in 2026 for latency-sensitive applications.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Text Generation Before Transformers — N-gram Language Models and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Text Generation Before Transformers — N-gram Language Models from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Text Generation Before Transformers — N-gram Language Models and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
