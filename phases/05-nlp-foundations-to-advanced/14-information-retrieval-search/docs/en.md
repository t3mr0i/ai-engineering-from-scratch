# Information Retrieval and Search

> BM25 is precise but brittle. Dense casts a wide net but misses keywords. Hybrid is the 2026 default. Everything else is tuning.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in Information Retrieval and Search and place it in an NLP pipeline
- Implement the central transformation behind Information Retrieval and Search from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Information Retrieval and Search

## The Problem

The user types "what happens if someone lies to get money" and expects to find the statute that actually covers that: "Section 420 IPC." A keyword search misses it entirely (no shared vocabulary). A semantic search misses it if the embeddings were not trained on legal text. Real search has to handle both.

IR is the pipeline under every RAG system, every search bar, every docs site's fuzzy lookup. The 2026 architecture that works in production is not a single method. It is a chain of complementary methods, each catching the failures of the one before.

This lesson builds each piece and names which failures each catches.

## The Concept

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

Four layers. Pick the ones you need.

1. **Sparse retrieval (BM25).** Fast, precise on exact matches, terrible on semantics. Run over an inverted index. Sub-10ms per query on millions of documents. Gets you statute references, product codes, error messages, named entities right.
2. **Dense retrieval.** Encode query and documents into vectors. Nearest neighbor search. Captures paraphrases and semantic similarity. Misses exact keyword matches that differ by one character. 50-200ms per query with FAISS or a vector DB.
3. **Fusion.** Merge the ranked lists from sparse and dense. Reciprocal Rank Fusion (RRF) is the easy default because it ignores raw scores (which live in different scales) and only uses rank positions. Weighted fusion is an option when you know one signal dominates for your domain.
4. **Cross-encoder rerank.** Take the top-30 from fusion. Run a cross-encoder (query + document together, scoring each pair). Keep the top-5. Cross-encoders are slower per pair than bi-encoders but far more accurate. You amortize by only running them on the top-30.

Three-way retrieval (BM25 + dense + learned-sparse like SPLADE) outperforms two-way in 2026 benchmarks but needs infrastructure for learned-sparse indexes. For most teams, two-way plus cross-encoder rerank is the sweet spot.




## Further Reading

- [Robertson and Zaragoza (2009). The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf) — the definitive BM25 treatment.
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) — DPR, the canonical bi-encoder.
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720) — the learned-sparse retriever that closes the gap with dense.
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) — RRF paper.
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) — late-interaction retrieval.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Information Retrieval and Search and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Information Retrieval and Search from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Information Retrieval and Search and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
