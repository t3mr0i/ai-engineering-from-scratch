# Word Embeddings — Word2Vec from Scratch

> A word is the company it keeps. Train a shallow net on that idea and geometry falls out.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 3 · 03 (Backpropagation from Scratch)
**Time:** ~75 minutes

## The Problem

TF-IDF knows `dog` and `puppy` are different words. It does not know they mean nearly the same thing. A classifier trained on `dog` cannot generalize to a review about `puppy`. You can paper over this by listing synonyms, but that fails on rare terms, domain jargon, and every language you did not anticipate.

You want a representation where `dog` and `puppy` land close together in space. Where `king - man + woman` lands near `queen`. Where a model trained on `dog` transfers some signal to `puppy` for free.

Word2Vec gave us that space. Two layer neural network, trillion-token training runs, published in 2013. The architecture is almost embarrassingly simple. The results reshaped NLP for a decade.

## The Concept

**Distributional hypothesis** (Firth, 1957): "You shall know a word by the company it keeps." If two words appear in similar contexts, they probably mean similar things.

Word2Vec comes in two flavors, both exploiting that idea.

- **Skip-gram.** Given a center word, predict the surrounding words. `cat -> (the, sat, on)` with window size 2.
- **CBOW (continuous bag of words).** Given surrounding words, predict the center. `(the, sat, on) -> cat`.

Skip-gram is slower to train but handles rare words better. It became the default.

The network has one hidden layer with no nonlinearity. Input is a one-hot vector over the vocabulary. Output is a softmax over the vocabulary. After training, you throw away the output layer. The hidden layer weights are the embeddings.

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

The trick: softmax over 100k words is prohibitively expensive. Word2Vec uses **negative sampling** to turn it into a binary classification task. Predict "did this context word appear near this center word, yes or no". Sample a handful of negative (non-co-occurring) words per training pair instead of computing softmax over the whole vocabulary.

> **Kernbotschaft:** Negative sampling is not an approximation of the "real" objective -- it replaces a 100,000-way softmax with a handful of yes/no questions. That's the whole reason Word2Vec could train on billions of words on 2013 hardware.


## Use It

Writing Word2Vec from scratch is teaching. Production NLP uses `gensim`.

```python
from gensim.models import Word2Vec

sentences = [
    ["the", "cat", "sat", "on", "the", "mat"],
    ["the", "dog", "ran", "across", "the", "room"],
]

model = Word2Vec(
    sentences,
    vector_size=100,
    window=5,
    min_count=1,
    sg=1,
    negative=5,
    workers=4,
    epochs=30,
)

print(model.wv["cat"])
print(model.wv.most_similar("cat", topn=3))
```

For real work, you almost never train Word2Vec yourself. You download pre-trained vectors.

- **GloVe** — Stanford's co-occurrence-matrix factorization approach. 50d, 100d, 200d, 300d checkpoints. Good general coverage. Lesson 04 covers GloVe specifically.
- **fastText** — Facebook's Word2Vec extension that embeds character n-grams. Handles out-of-vocabulary words by composing subwords. Lesson 04.
- **Pretrained Word2Vec on Google News** — 300d, 3M word vocabulary, published 2013. Still downloaded daily.

### When Word2Vec still wins in 2026

- Lightweight domain-specific retrieval. Train on medical abstracts in an hour on a laptop, get specialized vectors no general model captures.
- Analogy-style feature engineering. `gender_vector = mean(man - woman pairs)`. Subtract it from other words to get a gender-neutral axis. Still used in fairness research.
- Interpretability. 100d is small enough to plot via PCA or t-SNE and actually see clusters form.
- Anywhere inference has to run on-device with no GPU. Word2Vec lookup is a single row fetch.

### Where Word2Vec fails

The polysemy wall. `bank` has one vector. `river bank` and `financial bank` share it. `table` (spreadsheet vs. furniture) shares it. A classifier downstream cannot distinguish the senses from the vector.

Contextual embeddings (ELMo, BERT, every transformer since) solved this by producing a different vector for each occurrence of the word based on surrounding context. That is the jump from Word2Vec to BERT: from static to contextual. Phase 7 covers the transformer half.

The out-of-vocabulary problem is the other failure. Word2Vec has never seen `Zoomer-approved` if it was not in training data. No fallback. fastText fixes this with subword composition (lesson 04).

## Ship It

Save as `outputs/skill-embedding-probe.md`:

```markdown
---
name: embedding-probe
description: Inspect a word2vec model. Run analogies, find neighbors, diagnose quality.
version: 1.0.0
phase: 5
lesson: 03
tags: [nlp, embeddings, debugging]
---

You probe trained word embeddings to verify they are working. Given a `gensim.models.KeyedVectors` object and a vocabulary, you run:

1. Three canonical analogy tests. `king : man :: queen : woman`. `paris : france :: tokyo : japan`. `walking : walked :: swimming : ?`. Report the top-1 result and its cosine.
2. Five nearest-neighbor tests on domain-specific words the user supplies. Print top-5 neighbors with cosines.
3. One symmetry check. `similarity(a, b) == similarity(b, a)` to within float precision.
4. One degenerate check. If any embedding has a norm below 0.01 or above 100, the model has a training bug. Flag it.

Refuse to declare a model good on analogy accuracy alone. Analogy benchmarks are gameable and do not transfer to downstream tasks. Recommend intrinsic + downstream evaluation together.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Word embedding | Word as a vector | A dense, low-dim (typically 100-300) representation learned from context. |
| Skip-gram | Word2Vec trick | Predict context words from center word. Slower than CBOW, better for rare words. |
| Negative sampling | Training shortcut | Replace softmax over full vocab with binary classification against `k` random words. |
| Static embedding | One vector per word | Same vector regardless of context. Fails on polysemy. |
| Contextual embedding | Context-sensitive vector | Different vector for each occurrence based on surrounding words. What transformers produce. |
| OOV | Out of vocabulary | Word not seen in training. Word2Vec cannot produce a vector for these. |

## Further Reading

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) — the negative-sampling paper. Short and readable.
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738) — the clearest derivation of the gradients, if the original paper's math feels dense.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) — production training settings that actually work.
