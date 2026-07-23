# Embedding Models — The 2026 Deep Dive

> Word2Vec gave you a vector per word. Modern embedding models give you a vector per passage, cross-lingual, with sparse, dense, and multi-vector views, sized to fit your index. Pick wrong and your RAG retrieves the wrong thing.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

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


## Use It

The 2026 stack:

| Situation | Pick |
|-----------|------|
| English-only, fast, API | `text-embedding-3-large` or `voyage-3-large` |
| Open-weight, English | `BAAI/bge-large-en-v1.5` |
| Open-weight, multilingual | `BAAI/bge-m3` or `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | Add SPLADE sparse, RRF-fuse with dense |

2026 pattern: start with BGE-M3 or text-3-large, evaluate on your domain with MTEB, swap if a domain-specific model wins by more than 3 points.

## Ship It

Save as `outputs/skill-embedding-picker.md`:

```markdown
---
name: embedding-picker
description: Pick embedding model, dimension, and retrieval mode for a given corpus and deployment.
version: 1.0.0
phase: 5
lesson: 22
tags: [nlp, embeddings, retrieval]
---

Given a corpus (size, languages, domain, avg length), deployment target (cloud / edge / on-prem), latency budget, and storage budget, output:

1. Model. Named checkpoint or API. One-sentence reason.
2. Dimension. Full / Matryoshka-truncated / int8-quantized. Reason tied to storage budget.
3. Mode. Dense / sparse / multi-vector / hybrid. Reason.
4. Query prefix / template if required by the model card.
5. Evaluation plan. MTEB tasks relevant to domain + held-out domain eval with nDCG@10.

Refuse recommendations that truncate Matryoshka to <64 dims without domain validation. Refuse ColBERTv2 for corpora under 10k passages (overhead not justified). Flag long-document corpora (>8k tokens) routed to models with 512-token windows.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Dense embedding | The vector | One fixed-size vector per text. Cosine similarity for ranking. |
| Sparse embedding | Learned BM25 | One weight per vocab token; mostly zeros; trained end-to-end. |
| Multi-vector | ColBERT-style | One vector per token; MaxSim scoring; bigger index, better recall. |
| Matryoshka | Russian doll trick | First N dims are a valid smaller embedding on their own. |
| MTEB | The benchmark | Massive Text Embedding Benchmark — 56 tasks at launch, 100+ in v2. |
| BEIR | The retrieval benchmark | 18 zero-shot retrieval tasks; often cited for cross-domain robustness. |
| Asymmetric encoding | Query ≠ doc path | Model uses different projections for queries and documents. |

## Further Reading

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) — the bi-encoder paper.
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) — the leaderboard paper.
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) — the unified three-mode model.
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) — the dimension-ladder training objective.
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) — late interaction in production.
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) — live rankings.
