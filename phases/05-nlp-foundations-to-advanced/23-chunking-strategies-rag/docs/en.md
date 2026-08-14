# Chunking Strategies for RAG

> Chunking configuration influences retrieval quality as much as the choice of embedding model (Vectara NAACL 2025). Get chunking wrong and no amount of reranking saves you.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 14 (Information Retrieval), Phase 5 · 22 (Embedding Models)
**Time:** ~60 minutes

## The Problem

You put a 50-page contract into a RAG system. User asks: "What is the termination clause?" The retriever returns the cover page. Why? Because the model was trained on 512-token chunks and the termination clause sits 20 pages in, split across a page break, with no local keywords tying it to the query.

The fix is not "buy a better embedding model." The fix is chunking. How big? Overlap? Where to split? With surrounding context?

Feb 2026 benchmarks show surprising results:

- Vectara's 2026 study: recursive 512-token chunking beat semantic chunking 69% → 54% accuracy.
- SPLADE + Ministral-8B on Natural Questions: overlap provided zero measurable benefit.
- Context cliff: response quality drops sharply around 2,500 tokens of context.

The "obvious" answer (semantic chunking, 20% overlap, 1000 tokens) is often wrong. This lesson builds intuition for six strategies and tells you when to reach for which.

## The Concept

![Six chunking strategies visualized on one passage](../assets/chunking.svg)

**Fixed chunking.** Split every N characters or tokens. Simplest baseline. Breaks mid-sentence. Good compression, bad coherence.

**Recursive.** LangChain's `RecursiveCharacterTextSplitter`. Try splitting on `\n\n` first, then `\n`, then `.`, then space. Falls back cleanly. The 2026 default.

**Semantic.** Embed each sentence. Compute cosine similarity between adjacent sentences. Split where similarity drops below a threshold. Preserves topic coherence. Slower; sometimes produces tiny 40-token fragments that hurt retrieval.

**Sentence.** Split on sentence boundaries. One sentence per chunk or a window of N sentences. Matches semantic chunking up to ~5k tokens at a fraction of the cost.

**Parent-document.** Store small child chunks for retrieval *and* the larger parent chunk for context. Retrieve by child; return parent. Degrades gracefully: bad child chunks still return reasonable parents.

**Late chunking (2024).** Embed the whole document at the token level first, then pool token embeddings into chunk embeddings. Preserves cross-chunk context. Works with long-context embedders (BGE-M3, Jina v3). Higher compute.

**Contextual retrieval (Anthropic, 2024).** Prepend each chunk with an LLM-generated summary of its position in the document ("This chunk is section 3.2 of the termination clauses..."). 35-50% retrieval improvement in Anthropic's own benchmark. Expensive to index.

### The rule that beats every default

Match the chunk size to the query type:

| Query type | Chunk size |
|------------|-----------|
| Factoid ("what is the CEO's name?") | 256-512 tokens |
| Analytical / multi-hop | 512-1024 tokens |
| Whole-section comprehension | 1024-2048 tokens |

NVIDIA's 2026 benchmark. The chunk should be big enough to contain the answer plus local context, small enough that the retriever's top-K returns focus on the answer rather than context noise.




## Further Reading

- [Yepes et al. / LangChain — Recursive Character Splitting docs](https://python.langchain.com/docs/how_to/recursive_text_splitter/) — the default in production.
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070) — chunking matters as much as embedding choice.
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/) — the late chunking paper.
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — 35-50% retrieval improvement with LLM-generated context prefixes.
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) — chunk size by query type.
