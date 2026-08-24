# Embedding Models — The 2026 Deep Dive

> Word2Vec gave you a vector per word. Modern embedding models give you a vector per passage, cross-lingual, with sparse, dense, and multi-vector views, sized to fit your index. Pick wrong and your RAG retrieves the wrong thing.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## Learning Objectives

- Explain the core mechanism in Embedding Models — The 2026 Deep Dive and place it in an NLP pipeline
- Implement the central transformation behind Embedding Models — The 2026 Deep Dive from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Embedding Models — The 2026 Deep Dive

## The Problem

Your RAG system retrieves the wrong passage 40% of the time. The culprit is rarely the vector database or the prompt. It is the embedding model.

Choosing an embedding in 2026 means picking across five axes:

1. **Dense vs sparse vs multi-vector.** One vector per passage, or one per token, or a sparse weighted bag of words.
2. **Language coverage.** Monolingual English models still win on English-only tasks. Multilingual models win when corpora are mixed.
3. **Context length.** 512 tokens vs 8,192 vs 32,768 — and real effective capacity is often 60-70% of the advertised max.
4. **Dimension budget.** 3,072 floats at full precision = 12 KB per vector. At 100M vectors, storage is $1,300/month. Matryoshka truncation cuts this 4×.
5. **Open vs hosted.** Open-weight means you control the stack and data. Hosted means you trade control for always-latest.

This lesson names the tradeoffs so you can pick on evidence, not on whatever was popular last quarter.

## The Concept

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings.** One vector per passage (usually 384-3,072 dimensions). Cosine similarity ranks passages by semantic proximity. OpenAI `text-embedding-3-large`, BGE-M3 dense mode, Voyage-3. Default choice.

**Sparse embeddings.** SPLADE-style. A transformer predicts a weight for every vocab token, then zeros out most of them. Result is a sparse vector of size |vocab|. Captures lexical matching (like BM25) but with learned term weights. Strong on keyword-heavy queries.

**Multi-vector (late interaction).** ColBERTv2, Jina-ColBERT. One vector per token. Scoring with MaxSim: for each query token, find the most similar document token, sum the scores. More expensive to store and score, but wins on long queries and domain-specific corpora.

**BGE-M3: all three at once.** Single model outputs dense, sparse, and multi-vector representations simultaneously. Each can be queried independently; scores fuse via weighted sum. The 2026 default when you want flexibility from one checkpoint.

**Matryoshka Representation Learning.** Trained so the first N dimensions of the vector form a useful standalone embedding. Truncate a 1,536-dim vector to 256 dim and pay ~1% accuracy for 6× storage savings. Supported by OpenAI text-3, Cohere v4, Voyage-4, Jina v5, Gemini Embedding 2, Nomic v1.5+.

> **Kernbotschaft:** "Truncatable" is a training-time property, not a truncation-time trick -- it comes from a nested loss computed at several prefix lengths during training (Phase 11 · 04 walks through why). Truncating a model that was never trained this way degrades far more sharply.

### The MTEB leaderboard tells a partial story

Massive Text Embedding Benchmark — 56 tasks across 8 task types at launch (2022), expanded to 100+ tasks in MTEB v2. In early 2026, Gemini Embedding 2 tops retrieval (67.71 MTEB-R). Cohere embed-v4 leads general (65.2 MTEB). BGE-M3 leads open-weight multilingual (63.0). The leaderboard is necessary but not sufficient — always benchmark on your domain.

### The three-tier pattern

| Use case | Pattern |
|----------|---------|
| Fast first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| Precision on top-50 | Multi-vector (ColBERTv2) or cross-encoder reranker |

Most production stacks use all three.




## Further Reading

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) — the bi-encoder paper.
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) — the leaderboard paper.
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) — the unified three-mode model.
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) — the dimension-ladder training objective.
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) — late interaction in production.
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) — live rankings.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Embedding Models — The 2026 Deep Dive and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Embedding Models — The 2026 Deep Dive from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Embedding Models — The 2026 Deep Dive and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
