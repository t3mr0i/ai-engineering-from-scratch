# Capstone 02 — RAG over Codebase (Cross-Repo Semantic Search)

> Every serious engineering org in 2026 runs an internal code search that understands meaning, not just strings. Sourcegraph Amp, Cursor's codebase answers, Augment's enterprise graph, Aider's repomap, Pinterest's internal MCP — same shape. Ingest many repos, parse with tree-sitter, embed function- and class-level chunks, hybrid-search, re-rank, answer with citations. This capstone asks you to build one that handles 2M lines of code across 10 repos and survives incremental re-indexing on every git push.

**Type:** Capstone
**Languages:** Python (ingestion), TypeScript (API + UI)
**Prerequisites:** Phase 5 (NLP foundations), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure)
**Phases exercised:** P5 · P7 · P11 · P13 · P17
**Time:** 30 hours

## Problem

By 2026 every frontier coding agent ships with a codebase retrieval layer because context windows alone do not solve cross-repo questions. Claude's 1M-token context helps; it does not eliminate the need for ranked retrieval. Naive cosine search over raw chunks poisons results on generated code, on monorepo duplication, and on the long tail of rarely-imported symbols. The production answer is a hybrid (dense + BM25) search over AST-aware chunks with a re-ranker, backed by a graph of symbol references.

You learn this by indexing a real fleet — not one tutorial repo — and measuring MRR@10, citation faithfulness, and incremental freshness. The failure modes are infrastructural: a 100k-file monorepo, a push that retouches half the files, a query that needs to cross four repos to answer correctly.

## Concept

An AST-aware ingestion pipeline parses each file with tree-sitter, extracts function and class nodes, and chunks at node boundaries rather than fixed token windows. Each chunk gets three representations: a dense embedding (Voyage-code-3 or nomic-embed-code), sparse BM25 terms, and a short natural-language summary. The summary adds a third retrievable modality — users ask "how is X authorized" and the summary mentions "authz", even if the code only has `check_permission`.

Retrieval is hybrid. A query fires both dense and BM25 searches, merges top-k, and hands the union to a cross-encoder re-ranker (Cohere rerank-3 or bge-reranker-v2-gemma-2b). The re-ranked list goes to a long-context synthesizer (Claude Sonnet 4.7 with prompt caching, or Llama 3.3 70B self-hosted) with instructions to cite every claim by file and line range. Answers without citations are rejected by a post-filter.

Incremental freshness is the infrastructure problem. Git push triggers a diff: which files changed, which symbols changed. Only affected chunks re-embed. Affected cross-file symbol edges (imports, method calls) get recomputed. The index stays consistent without reprocessing 2M lines each commit.

## Architecture

```
git push --> webhook --> ingest worker (LlamaIndex Workflow)
                           |
                           v
             tree-sitter parse + AST chunk
                           |
            +--------------+----------------+
            v              v                v
          dense        BM25 index       summary (LLM)
        (Voyage / bge)  (Tantivy)        (Haiku 4.5)
            |              |                |
            +------> Qdrant / pgvector <----+
                            |
                            v
                      symbol graph (Neo4j / kuzu)
                            |
  query --> LangGraph agent (retrieve -> rerank -> synth)
                            |
                            v
                 Claude Sonnet 4.7 1M context
                            |
                            v
                 answer + file:line citations
```

## Stack

- Parsing: tree-sitter with 17 language grammars (Python, TS, Rust, Go, Java, C++, etc.)
- Dense embeddings: Voyage-code-3 (hosted) or nomic-embed-code-v1.5 (self-host), bge-code-v1 fallback
- Sparse index: Tantivy (Rust) with BM25F, field-weighted on symbol name vs body
- Vector DB: Qdrant 1.12 with hybrid search, or pgvector + pgvectorscale for teams under 50M vectors
- Chunk summary model: Claude Haiku 4.5 or Gemini 2.5 Flash, prompt-cached
- Re-ranker: Cohere rerank-3 or bge-reranker-v2-gemma-2b self-hosted
- Orchestration: LlamaIndex Workflows for ingestion, LangGraph for query agent
- Synthesizer: Claude Sonnet 4.7 (1M context) with prompt caching
- Symbol graph: Neo4j (managed) or kuzu (embedded) for import and call edges
- Observability: Langfuse spans per retrieval + synthesis step




## Further Reading

- [Sourcegraph Amp](https://ampcode.com) — production cross-repo code intelligence
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) — the reference deep-dive for this capstone
- [Aider repo-map](https://aider.chat/docs/repomap.html) — tree-sitter ranked repo view
- [Augment Code enterprise graph](https://www.augmentcode.com) — commercial symbol-graph RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) — reference implementation
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) — Voyage-code-3 details
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) — cross-encoder reference
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) — internal-platform reference
