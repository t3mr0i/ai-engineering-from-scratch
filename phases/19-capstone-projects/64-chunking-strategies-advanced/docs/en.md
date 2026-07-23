# Chunking Strategies, Compared

> Chunking decides what your retriever can ever surface. Get the boundaries wrong and no embedding model, no reranker, no LLM can repair the damage downstream.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 lessons 04 (embeddings), 06 (RAG), 07 (advanced RAG); Phase 19 Track B foundations (lessons 20-29)
**Time:** ~90 minutes

## Learning Objectives
- Implement five chunking strategies from scratch: fixed-window, sentence, recursive-split, semantic clustering, and structural markdown headers.
- Measure recall@k on a fixture corpus with gold-labeled answer spans and explain why one strategy wins on prose and a different strategy wins on technical documents.
- Read a chunk-length distribution and recognize the failure modes each strategy injects: orphan sentences, mid-symbol cuts, header-only chunks, semantic drift.
- Pick a default for a new corpus without running the benchmark by inspecting three properties: document type, average paragraph length, and whether the format carries explicit structure.

## The Problem

Every RAG pipeline starts by cutting source documents into pieces small enough that an embedding model fits them and large enough that each piece carries a self-contained idea. The choice of where to cut is not a hyperparameter. It is the upper bound on what the retriever can ever return.

A query that asks "what does the budget abort threshold look like" can only succeed if the chunk that holds the abort threshold is reachable. If the fixed-window splitter cut the threshold value from the surrounding context, the embedding moves to a different cluster, the BM25 score drops, the rerankers see noise, and the answer the LLM generates is wrong. The 2024 paper "LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs" measured a 35 percent absolute swing in retrieval recall purely from the chunking choice. The follow-up work in 2025 on contextual chunk headers narrowed the gap but did not close it.

This lesson builds five strategies side by side, runs them against a fixture corpus with gold-labeled answer spans, and lets you read the recall numbers yourself.

## The Concept

```mermaid
flowchart LR
  Doc[Source Document] --> S1[Fixed Window]
  Doc --> S2[Sentence]
  Doc --> S3[Recursive Split]
  Doc --> S4[Semantic Cluster]
  Doc --> S5[Structural Markdown]
  S1 --> Chunks1[Chunks]
  S2 --> Chunks2[Chunks]
  S3 --> Chunks3[Chunks]
  S4 --> Chunks4[Chunks]
  S5 --> Chunks5[Chunks]
  Chunks1 --> Index[Embedding Index]
  Chunks2 --> Index
  Chunks3 --> Index
  Chunks4 --> Index
  Chunks5 --> Index
  Index --> Eval[Recall@k vs Gold Spans]
```

### Fixed-window

The brute-force baseline. Cut every N characters. Optionally overlap so a sentence cut at position N appears whole inside the chunk that starts at position N - overlap. Fast, deterministic, terrible at boundaries. Use it as a control, not a default.

### Sentence

Split on sentence boundaries with a regex or a simple state machine. Pack one or more sentences into a chunk up to a target character budget. Stops cutting mid-word. Still cuts mid-paragraph and mid-section. The default in many early RAG pipelines and a reasonable choice for prose with no other structure.

### Recursive split

The hierarchy strategy popularized by 2023-era libraries. Try to split on the strongest separator first (double newline, paragraph), fall back to the next (single newline), then to sentences, then to characters. The recursion terminates when the chunk fits the budget. Strong on documents that have inconsistent structure because it adapts per region.

### Semantic clustering

Embed every sentence. Cluster contiguous sentences that share a topic centroid. Cut whenever the running similarity to the centroid drops below a threshold. The boundaries reflect meaning, not characters. Slower to build and dependent on the embedding model, but resilient against documents that switch topics inside a paragraph.

### Structural markdown headers

For documents that carry explicit structure (markdown, reStructuredText, RFC-style numbered sections), cut at heading boundaries. Each chunk becomes the heading plus everything underneath it down to the next heading at the same or higher level. Smallest chunks per topic, but only available when the corpus is well-formed.

### How recall@k measures the boundary choice

A gold-labeled query carries the exact character offsets of the answer span inside the source document. After chunking, you ask: does any of the top-k chunks the retriever returned overlap the gold span? If yes, recall@k for that query is 1. If no, it is 0. Average across the query set. Run the same evaluation for each strategy and the spread shows you which boundary policy survives the corpus you have.


## Use It

Production patterns:

- Run the eval before you ship a new pipeline; do not trust the strategy your library defaults to.
- Re-run the eval whenever you change the embedding model or the corpus mix; the winner is corpus-dependent.
- Persist the strategy name in each chunk's metadata so you can attribute regressions later.

## Ship It

The Track F end-to-end RAG system in lesson 69 uses the chunker selected here as its first stage. The eval harness in lesson 68 reads recall@k from the same shape that `eval_recall` returns in this lesson. Pick the strategy that wins on your corpus and feed it forward.


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Recall@k | "Did we get the right chunk?" | Fraction of queries where any of the top-k chunks overlaps the gold answer span |
| Chunk overlap | "Sliding window" | Re-include the last N characters of the previous chunk in the next chunk |
| Structural splitter | "Header-aware chunks" | Cut at H1/H2/H3 boundaries; the heading text is part of the chunk |
| Semantic chunker | "Topic-aware chunks" | Embed sentences, cluster by centroid similarity, cut on drift |
| Centroid drift | "Topic shift" | Cosine similarity between the running mean and the next sentence drops past a threshold |

## Further Reading

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [Anthropic, Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex, Chunking strategies for production RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- Phase 11 lesson 06 - RAG fundamentals
- Phase 11 lesson 07 - advanced RAG
- Phase 19 lesson 65 - hybrid retrieval that ranks the chunks produced here
- Phase 19 lesson 68 - the eval harness that scores the strategy choice in production
