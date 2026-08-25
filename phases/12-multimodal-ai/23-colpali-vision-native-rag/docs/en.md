# ColPali and Vision-Native Document RAG

> Traditional RAG parses PDFs into text, splits into chunks, embeds chunks, stores vectors. Every step loses signal: OCR drops chart data, chunking breaks table rows, text embeddings ignore figures. ColPali (Faysse et al., July 2024) asked the simpler question: why extract text at all? Embed the page image directly via PaliGemma, use ColBERT-style late interaction for retrieval, and keep all the layout, figures, fonts, and formatting signal the document carries. Published benchmarks: 20-40% better end-to-end accuracy than text-RAG on visually-rich documents. ColQwen2, ColSmol, and VisRAG extended the pattern. This lesson reads the vision-native RAG thesis and builds a tiny ColPali-like indexer.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 (LLM Engineering — RAG basics), Phase 12 · 05 (LLaVA)
**Time:** ~180 minutes

## Learning Objectives

- Explain the difference between bi-encoder retrieval (one vector per document) and late-interaction retrieval (many vectors per document).
- Describe ColBERT's MaxSim operation and how ColPali generalizes it from text tokens to image patches.
- Build a tiny ColPali-like indexer: page → patch embeddings → MaxSim over query-term embeddings → top-k pages.
- Compare ColPali + Qwen2.5-VL generator vs text-RAG + GPT-4 on an invoices / financial reports use case.

## The Problem

Text-RAG on PDFs throws away most of the document. A financial report's Q3 revenue growth is usually in a chart; a medical report's findings are in annotated images; a legal contract's signature block is a layout fact, not a text fact.

The text-RAG pipeline:

1. PDF → text via OCR / pdftotext.
2. Text → 300-500 token chunks.
3. Chunk → bi-encoder embedding (one vector).
4. User query → embedding → cosine similarity → top-k chunks.
5. Chunks + query → LLM.

Five lossy steps. Charts not captured. Tables broken across chunks. Multi-column layout flattens. Figure annotations disappear.

ColPali's fix: skip OCR, embed the page image directly. Use ColBERT-style late interaction for retrieval so the model can attend to fine-grained patches at query time.

## The Concept

### ColBERT (2020)

ColBERT (Khattab & Zaharia, arXiv:2004.12832) is a text retrieval method. Instead of one vector per document, it produces one vector per token. At query time:

- Query tokens get their own embeddings (N_q vectors).
- Document tokens get embeddings (N_d vectors, typically cached).
- Score = sum over query tokens of max over document tokens of cosine similarity: Σ_i max_j cos(q_i, d_j).

This is the MaxSim operation. Each query token "picks" its best-matching document token. The final score is the sum.

Pros: strong recall, handles term-level semantics. Cons: N_d vectors per document, storage expensive.

### ColPali

ColPali (Faysse et al., arXiv:2407.01449) applies the ColBERT pattern to images.

- Each page is encoded by PaliGemma (ViT + language) into patch embeddings: N_p vectors per page.
- Each user query (text) is encoded into query-token embeddings: N_q vectors.
- Score = Σ_i max_j cos(q_i, p_j), i.e., MaxSim over query-text-tokens and page-image-patches.
- Retrieve top-k pages by total score.

At document-ingestion time: embed every page with PaliGemma, store all patch embeddings. At query time: embed the query tokens, compute MaxSim against all stored page embeddings, return top-k pages.

Pros: end-to-end beats text-RAG by 20-40% on visually rich documents. Each patch-vector captures local layout and content.

Cons: N_p patches × 4-byte floats × D-dim vectors per page = storage grows fast. Mitigated by PQ / OPQ quantization.

### ColQwen2 and ColSmol

ColQwen2 (illuin-tech, 2024-2025) swaps PaliGemma for Qwen2-VL. Better base encoder, better retrieval.

ColSmol is the smaller-scale variant for local / edge use. A ColSmol retriever at ~1B params runs on consumer GPU.

### VisRAG

VisRAG (Yu et al., arXiv:2410.10594) is a different variant: instead of MaxSim on patches, pool each page into a single vector with a VLM then bi-encoder retrieve. Faster indexing + smaller storage, weaker recall.

The quality-vs-cost trade-off: ColPali for quality, VisRAG for scale.

### M3DocRAG

M3DocRAG (Cho et al., arXiv:2411.04952) extends multi-modal retrieval to multi-page multi-document reasoning. Retrieves pages across documents, composes a multi-page context for the VLM.

### ViDoRe — the benchmark

ColPali's companion benchmark. Visual Document Retrieval Evaluation. Tasks include financial reports, scientific papers, administrative documents, medical records, manuals. Metric: nDCG@5.

ColPali-v1 scores ~80% nDCG@5 on ViDoRe; text-RAG on the same documents scores ~50-60%.

### The end-to-end RAG pipeline

For a vision-native RAG:

1. Ingest: PDF → page images → PaliGemma encoding → store all patch embeddings.
2. Query: user text → query-token embeddings → MaxSim against all indexed pages → top-k pages.
3. Generate: top-k page images + query → VLM (Qwen2.5-VL or Claude) → answer.

No OCR anywhere. Figures, charts, fonts, layout all flow into the answer.

### Storage math

A 50-page financial report with 729 patches per page and 128-dim embeddings:

- ColPali: 50 * 729 * 128 * 4 bytes = ~18 MB raw, ~4 MB after PQ.
- Text-RAG: 50 chunks * 768-dim * 4 bytes = ~150 kB.

ColPali is ~30x more storage per document. At scale, OPQ / PQ brings it down to ~5-10x, usually tolerable.

### When text-RAG still wins

- Pure-text documents with no layout signal (wiki articles, chat logs). Text-RAG is simpler and storage-cheaper.
- Multi-million-page archives where storage dominates cost.
- Strict regulatory requirements demanding extractable OCR text alongside the retrieval.

For everything else in 2026 — financial reports, scientific papers, legal contracts, medical records, UX documentation — vision-native RAG wins.



## Build It

Reconstruct **ColPali and Vision-Native Document RAG** by following `Page` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `Page` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-vision-rag-designer.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Faysse et al. — ColPali (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449)
- [Khattab & Zaharia — ColBERT (arXiv:2004.12832)](https://arxiv.org/abs/2004.12832)
- [Yu et al. — VisRAG (arXiv:2410.10594)](https://arxiv.org/abs/2410.10594)
- [Cho et al. — M3DocRAG (arXiv:2411.04952)](https://arxiv.org/abs/2411.04952)
- [illuin-tech/colpali GitHub](https://github.com/illuin-tech/colpali)

## Exercises

Work from the smallest fixture that the ColPali and Vision-Native Document RAG demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `Page`, `Query`, `cosine`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the difference between bi-encoder retrieval (one vector per document) and late-interaction retrieval (many vectors per document).**.
2. **Perturb one field.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Describe ColBERT's MaxSim operation and how ColPali generalizes it from text tokens to image patches.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Build a tiny ColPali-like indexer: page → patch embeddings → MaxSim over query-term embeddings → top-k pages.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-vision-rag-designer.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Compare ColPali + Qwen2.5-VL generator vs text-RAG + GPT-4 on an invoices / financial reports use case.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **ColPali and Vision-Native Document RAG** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `Page`, `Query`, `cosine` traced to the value or shape that supports **Explain the difference between bi-encoder retrieval (one vector per document) and late-interaction retrieval (many vectors per document).**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Describe ColBERT's MaxSim operation and how ColPali generalizes it from text tokens to image patches.**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Build a tiny ColPali-like indexer: page → patch embeddings → MaxSim over query-term embeddings → top-k pages.**; and
- an updated `outputs/skill-vision-rag-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Compare ColPali + Qwen2.5-VL generator vs text-RAG + GPT-4 on an invoices / financial reports use case.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
