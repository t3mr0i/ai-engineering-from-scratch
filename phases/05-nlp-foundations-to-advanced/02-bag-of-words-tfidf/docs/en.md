# Bag of Words, TF-IDF, and Text Representation

> Count first, think later. TF-IDF still beats embeddings on well-defined tasks in 2026.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 02 (Linear Regression from Scratch)
**Time:** ~75 minutes

## The Problem

The model needs numbers. You have strings.

Every NLP pipeline has to answer the same question. How do we turn a variable-length stream of tokens into a fixed-size vector that a classifier can consume. The first answer the field landed on was the dumbest one that works. Count the words. Make a vector.

That vector has carried more production NLP than any embedding model. Spam filters, topic classifiers, log anomaly detection, search ranking (before BM25), the first wave of sentiment analysis, the first decade of academic NLP benchmarks. 2026 practitioners still reach for it first on narrow classification tasks. It is fast, interpretable, and often indistinguishable from a 400M-parameter embedding model on tasks where word presence is what matters.

This lesson builds bag of words, then TF-IDF, from scratch. Then shows scikit-learn doing the same in three lines. Then names the failure mode that makes you reach for embeddings.

## The Concept

**Bag of Words (BoW)** throws away order. For each document, count how many times each vocabulary word appears. Vector length is the vocabulary size. Position `i` is the count of word `i`.

**TF-IDF** reweights BoW. A word that appears in every document is uninformative, so scale it down. A word rare across the corpus but frequent in a single document is signal, so scale it up.

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

Where `TF` is term frequency in the document, `df` is document frequency (how many docs contain the word), `N` is total documents. The `log` keeps the weight bounded for ubiquitous words.

Key property: both produce sparse vectors with interpretable axes. You can look at a trained classifier's weights and read which words push a document toward each class. You cannot do this with a 768-dimensional BERT embedding.


## Use It

scikit-learn ships the production version.

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

docs = ["the cat sat on the mat", "the dog sat on the mat", "the cat ran"]

bow_vectorizer = CountVectorizer()
bow = bow_vectorizer.fit_transform(docs)
print(bow_vectorizer.get_feature_names_out())
print(bow.toarray())

tfidf_vectorizer = TfidfVectorizer()
tfidf = tfidf_vectorizer.fit_transform(docs)
print(tfidf.toarray().round(3))
```

`CountVectorizer` does tokenization, vocabulary, and BoW in one call. `TfidfVectorizer` adds IDF weighting and L2 normalization. Both return sparse matrices. For 100k documents, the dense version does not fit in memory; stay sparse until the classifier demands dense.

Knobs that change everything:

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | Include bigrams. Usually boosts classification. |
| `min_df=2` | Drop words in fewer than 2 docs. Trims vocabulary on noisy data. |
| `max_df=0.95` | Drop words in more than 95% of docs. Approximates stopword removal without a hardcoded list. |
| `stop_words="english"` | scikit-learn's builtin stopword list. Task-dependent — sentiment analysis should *not* drop negations. |
| `sublinear_tf=True` | Use `1 + log(tf)` instead of raw `tf`. Helps when a term repeats many times in one doc. |

### When TF-IDF still wins (as of 2026)

- Spam detection, topic labeling, log anomaly flagging. Word presence is what matters; semantic nuance does not.
- Low-data regimes (hundreds of labeled examples). TF-IDF plus logistic regression has no pretraining cost.
- Anywhere latency matters. TF-IDF plus a linear model answers in microseconds. Embedding a document through a transformer takes 10-100ms.
- Systems that must explain their predictions. Inspect the classifier's coefficients. Top positive words are the reason.

### When TF-IDF fails

The semantic blindness failure. Consider these two documents:

- "The movie was not good at all."
- "The movie was excellent."

One is a negative review. One is positive. Their TF-IDF overlap is exactly `{the, movie, was}`. A bag-of-words classifier has to memorize that the word `not` near `good` flips the label. It can learn this on enough data, but never as gracefully as a model that understands syntax.

The other failure: out-of-vocabulary words at inference. A BoW model trained on IMDb reviews has no idea what to do with `Zoomer-approved` if that token never appeared in training. Subword embeddings (lesson 04) handle this. TF-IDF cannot.

### Hybrid: TF-IDF weighted embeddings

The 2026 pragmatic default for medium-data classification: use TF-IDF weights as attention over word embeddings.

```python
def tfidf_weighted_embedding(doc, tfidf_scores, embedding_table, dim):
    vec = [0.0] * dim
    total_weight = 0.0
    for token in doc:
        if token not in embedding_table or token not in tfidf_scores:
            continue
        weight = tfidf_scores[token]
        emb = embedding_table[token]
        for i in range(dim):
            vec[i] += weight * emb[i]
        total_weight += weight
    if total_weight == 0:
        return vec
    return [v / total_weight for v in vec]
```

You get semantic capacity from embeddings, and rare-word emphasis from TF-IDF. Classifier trains on the pooled vector. This outperforms either on its own for sentiment, topic, and intent classification below about 50k labeled examples.

## Ship It

Save as `outputs/prompt-vectorization-picker.md`:

```markdown
---
name: vectorization-picker
description: Given a text-classification task, recommend BoW, TF-IDF, embeddings, or a hybrid.
phase: 5
lesson: 02
---

You recommend a text-vectorization strategy. Given a task description, output:

1. Representation (BoW, TF-IDF, transformer embeddings, or a hybrid). Explain why in one sentence.
2. Specific vectorizer configuration. Name the library. Quote the arguments (`ngram_range`, `min_df`, `max_df`, `sublinear_tf`, `stop_words`).
3. One failure mode to test before shipping.

Refuse to recommend embeddings when the user has under 500 labeled examples unless they show evidence of semantic failure in a TF-IDF baseline. Refuse to remove stopwords for sentiment analysis (negations carry signal). Flag class imbalance as needing more than a vectorizer change.

Example input: "Classifying 30k customer support tickets into 12 categories. Most tickets are 2-3 sentences. English only. Need explainability for audit logs."

Example output:

- Representation: TF-IDF. 30k examples is not small; explainability requirement rules out dense embeddings.
- Config: `TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_df=0.95, sublinear_tf=True, stop_words=None)`. Keep stopwords because category keywords sometimes are stopwords ("not working" vs "working").
- Failure to test: verify `min_df=3` does not drop rare category keywords. Run `get_feature_names_out` filtered by class and eyeball.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BoW | Word frequency vector | Counts of vocabulary words in one document. Throws away order. |
| TF | Term frequency | Count of a word in a document, optionally normalized by document length. |
| DF | Document frequency | Count of documents containing the word at least once. |
| IDF | Inverse document frequency | `log(N / df)` smoothed. Downweights words that appear everywhere. |
| Sparse vector | Mostly zeros | Vocabulary is typically 10k-100k words; most are absent from any given document. |
| Cosine similarity | Vector angle | Dot product of L2-normalized vectors. 1 is identical, 0 is orthogonal. |

## Further Reading

- [scikit-learn — feature extraction from text](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) — the canonical API reference, plus notes on every knob.
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) — the paper that made TF-IDF the default for a decade.
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) — 2026 take on when the old method wins and why.
