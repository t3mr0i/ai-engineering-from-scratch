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




## Build It

Reconstruct **Chunking Strategies, Compared** by following `Chunk` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `Chunk` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/artifact-card.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [Anthropic, Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex, Chunking strategies for production RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- Phase 11 lesson 06 - RAG fundamentals
- Phase 11 lesson 07 - advanced RAG
- Phase 19 lesson 65 - hybrid retrieval that ranks the chunks produced here
- Phase 19 lesson 68 - the eval harness that scores the strategy choice in production

## Exercises

Use `Chunk` as the trace: start from the text "red fox", keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the text "red fox". Follow `Chunk`, `overlaps`, `fixed_window`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Implement five chunking strategies from scratch: fixed-window, sentence, recursive-split, semantic clustering, and structural markdown headers.**.
2. **Vary one named input.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Measure recall@k on a fixture corpus with gold-labeled answer spans and explain why one strategy wins on prose and a different strategy wins on technical documents.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Read a chunk-length distribution and recognize the failure modes each strategy injects: orphan sentences, mid-symbol cuts, header-only chunks, semantic drift.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/artifact-card.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Pick a default for a new corpus without running the benchmark by inspecting three properties: document type, average paragraph length, and whether the format carries explicit structure.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Chunking Strategies, Compared** should contain:

- the `python3 main.py` output for the text "red fox", with `Chunk`, `overlaps`, `fixed_window` traced to the value or shape that supports **Implement five chunking strategies from scratch: fixed-window, sentence, recursive-split, semantic clustering, and structural markdown headers.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Measure recall@k on a fixture corpus with gold-labeled answer spans and explain why one strategy wins on prose and a different strategy wins on technical documents.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Read a chunk-length distribution and recognize the failure modes each strategy injects: orphan sentences, mid-symbol cuts, header-only chunks, semantic drift.**; and
- an updated `outputs/artifact-card.md` example with a concrete input, expected output field, and acceptance check tied to **Pick a default for a new corpus without running the benchmark by inspecting three properties: document type, average paragraph length, and whether the format carries explicit structure.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
