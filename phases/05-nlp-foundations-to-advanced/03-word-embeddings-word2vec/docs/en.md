# Word Embeddings — Word2Vec from Scratch

> A word is the company it keeps. Train a shallow net on that idea and geometry falls out.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 3 · 03 (Backpropagation from Scratch)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in Word Embeddings — Word2Vec from Scratch and place it in an NLP pipeline
- Implement the central transformation behind Word Embeddings — Word2Vec from Scratch from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Word Embeddings — Word2Vec from Scratch

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




## Further Reading

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) — the negative-sampling paper. Short and readable.
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738) — the clearest derivation of the gradients, if the original paper's math feels dense.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) — production training settings that actually work.
