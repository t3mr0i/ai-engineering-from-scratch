# Topic Modeling — LDA and BERTopic

> LDA: documents are mixtures of topics, topics are distributions over words. BERTopic: documents cluster in embedding space, clusters are topics. Same goal, different decompositions.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 minutes

## The Problem

You have 10,000 customer support tickets, 50,000 news articles, or 200,000 tweets. You need to know what the collection is about without reading it. You do not have labeled categories. You do not even know how many categories exist.

Topic modeling answers that without supervision. Give it a corpus, get back a small set of coherent topics and, for each document, a distribution over those topics.

Two algorithmic families dominate. LDA (2003) treats each document as a mixture of latent topics and each topic as a distribution over words. Inference is Bayesian. It still ships in production where you need mixed-membership topic assignments and explainable word-level probability distributions.

BERTopic (2020) encodes documents with BERT, reduces dimensionality with UMAP, clusters with HDBSCAN, and extracts topic words via class-based TF-IDF. It wins on short text, social media, and anything where semantic similarity matters more than word overlap. One document gets one topic, which is a limitation for long-form content.

This lesson builds intuition for both and names which one to pick for a given corpus.

## The Concept

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story.** Each topic is a distribution over words. Each document is a mixture of topics. To generate a word in a document, sample a topic from the document's mixture, then sample a word from that topic's distribution. Inference reverses this: given observed words, infer the topic distribution per document and the word distribution per topic. Collapsed Gibbs sampling or variational Bayes does the math.

Key LDA output:

- `doc_topic`: matrix `(n_docs, n_topics)`, each row sums to 1 (document's topic mixture).
- `topic_word`: matrix `(n_topics, vocab_size)`, each row sums to 1 (topic's word distribution).

**BERTopic pipeline.**

1. Encode each document with a sentence transformer (e.g., `all-MiniLM-L6-v2`). 384-dim vectors.
2. Reduce dimensionality with UMAP to ~5 dimensions. BERT embeddings are too high-dim for clustering.
3. Cluster with HDBSCAN. Density-based, produces variable-size clusters and an "outlier" label.
4. For each cluster, compute class-based TF-IDF over the cluster's documents to extract top words.

Output is one topic per document (plus a -1 outlier label). Optionally, a soft membership via HDBSCAN's probability vector.


## Use It

The 2026 stack:

- **BERTopic.** Default for short text and anything where semantics matter.
- **`gensim.models.LdaModel`.** Classic LDA for production, mature, battle-tested.
- **`sklearn.decomposition.LatentDirichletAllocation`.** Easy LDA for experiments.
- **NMF.** Non-negative matrix factorization. Fast alternative to LDA, comparable quality on short text.
- **Top2Vec.** Similar design to BERTopic. Smaller community but good on some benchmarks.
- **FASTopic.** Newer, faster than BERTopic on very large corpora.
- **LLM-based labeling.** Run any clustering, then prompt a model to name each cluster.

## Ship It

Save as `outputs/skill-topic-picker.md`:

```markdown
---
name: topic-picker
description: Pick LDA or BERTopic for a corpus. Specify library, knobs, evaluation.
version: 1.0.0
phase: 5
lesson: 15
tags: [nlp, topic-modeling]
---

Given a corpus description (document count, avg length, domain, language, compute budget), output:

1. Algorithm. LDA / NMF / BERTopic / Top2Vec / FASTopic. One-sentence reason.
2. Configuration. Number of topics: `recommended = max(5, round(sqrt(n_docs)))`, clamped to 200 for corpora under 40,000 docs; permit >200 only when the corpus is genuinely large (>40k) and note the increased compute cost. `min_df` / `max_df` filters and embedding model for neural approaches also belong here.
3. Evaluation. Topic coherence (c_v) via `gensim.models.CoherenceModel`, topic diversity, and a 20-sample human read.
4. Failure mode to probe. For LDA, "junk topics" absorbing stopwords and frequent terms. For BERTopic, the -1 outlier cluster swallowing ambiguous documents.

Refuse BERTopic on documents longer than the embedding model's context window without a chunking strategy. Refuse LDA on very short text (tweets, reviews under 10 tokens) as coherence collapses. Flag any n_topics choice below 5 as likely wrong; flag >200 on corpora under 40k docs as likely over-splitting.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | A thing the corpus is about | A probability distribution over words (LDA) or a cluster of similar documents (BERTopic). |
| Mixed membership | Doc is multiple topics | LDA assigns each document a distribution over all topics. |
| UMAP | Dimensionality reduction | Manifold learning that preserves local structure; used in BERTopic. |
| HDBSCAN | Density clustering | Finds variable-size clusters; produces "noise" label (-1) for outliers. |
| c_v coherence | Topic quality metric | Average pointwise mutual information of top topic words within sliding windows. |

## Further Reading

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) — the LDA paper.
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) — the BERTopic paper.
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) — the paper that introduced c_v and friends.
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) — the production reference. Excellent examples.
