# Capstone 04 — Multimodal Document QA (Vision-First PDF, Tables, Charts)

> The 2026 document-QA frontier moved away from OCR-then-text and toward vision-first late interaction. ColPali, ColQwen2.5, and ColQwen3-omni treat each PDF page as an image, embed it with multi-vector late interaction, and let the query attend to patches directly. On financial 10-Ks, scientific papers, and handwritten notes this pattern beats OCR-first by a large margin. Build the pipeline end to end on 10k pages and publish the side-by-side against OCR-then-text.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:** P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 hours

## Learning Objectives

- Define measurable acceptance criteria for Capstone 04 — Multimodal Document QA (Vision-First PDF, Tables, Charts)
- Integrate the required components into one self-terminating workflow
- Exercise happy paths, edge cases, and failure recovery with reproducible fixtures
- Package the verified result as a reusable curriculum artifact

## Problem

Enterprises sit on PDFs that OCR pipelines mangle: scanned 10-Ks with rotated tables, scientific papers dense with equations, charts that only make sense as images, handwritten annotations. Treating these as text-first means losing half the signal. The 2026 answer is late-interaction multi-vector retrieval on raw page images. ColPali (Illuin Tech) introduced it; ColQwen2.5-v0.2 and ColQwen3-omni pushed accuracy. On ViDoRe v3, vision-first retrieval scores above OCR-then-text by meaningful margins — and the gap widens on charts, tables, and handwriting.

The trade-off is storage and latency. A ColQwen embedding is ~2048 patch vectors per page, not a single 1024-dim vector. Raw storage balloons. DocPruner (2026) brings 50% pruning without measurable accuracy loss. You will index 10k pages, measure ViDoRe v3 nDCG@5, serve answers under 2s, and compare directly against an OCR-then-text baseline.

## Concept

Late interaction means every query token scores against every patch token, and the maximum score per query token is summed. You get fine-grained matching without needing a single pooled vector. A multi-vector index (Vespa, Qdrant multi-vector, or AstraDB) stores the per-patch embeddings and runs MaxSim at retrieval time.

The answerer is a vision-language model that takes the query plus the top-k retrieved pages as images and writes an answer with evidence regions (bounding boxes or page references). Qwen3-VL-30B, Gemini 2.5 Pro, and InternVL3 are the 2026 frontier choices. For equations and scientific notation, an OCR fallback (Nougat, dots.ocr) is spliced in as an optional text channel.

Evaluation is a two-dimensional matrix. One axis: content type (plain text paragraphs, dense tables, bar/line charts, handwritten notes, equations). Other axis: retrieval approach (vision-first late interaction vs OCR-then-text vs hybrid). Each cell gets nDCG@5 and answer accuracy. The report is the deliverable.

## Architecture

```
PDFs -> page renderer (PyMuPDF, 180 DPI)
           |
           v
  ColQwen2.5-v0.2 embed (multi-vector per page, ~2048 patches)
           |
           +------> DocPruner 50% compression
           |
           v
   multi-vector index (Vespa or Qdrant multi-vector)
           |
query ----+----> retrieve top-k pages (MaxSim)
           |
           v
  VLM answerer: Qwen3-VL-30B | Gemini 2.5 Pro | InternVL3
    inputs: query + top-k page images + optional OCR text
           |
           v
  answer with cited page numbers + evidence regions
           |
           v
  Streamlit / Next.js viewer: highlighted boxes on source page
```

## Stack

- Page rendering: PyMuPDF (fitz) at 180 DPI, portrait-normalized
- Late-interaction model: ColQwen2.5-v0.2 or ColQwen3-omni (vidore team on Hugging Face)
- Index: Vespa with multi-vector field, or Qdrant multi-vector, or AstraDB with MaxSim
- Pruning: DocPruner 2026 policy (keep high-variance patches, 50% compression at < 0.5% accuracy loss)
- OCR fallback (equations / dense tables): dots.ocr or Nougat
- VLM answerer: Qwen3-VL-30B self-hosted or Gemini 2.5 Pro hosted; InternVL3 as fallback
- Evaluation: ViDoRe v3 benchmark, M3DocVQA for multi-page reasoning
- Viewer UI: Next.js 15 with canvas overlay for evidence regions




## Further Reading

- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) — reference late-interaction doc retrieval
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) — the foundational method paper
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) — production-ready checkpoints
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) — multi-page multimodal RAG baseline
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) — reference serving stack
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) — alternate index
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) — alternate managed index
- [Nougat OCR](https://github.com/facebookresearch/nougat) — equation-capable OCR fallback

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Define measurable acceptance criteria for Capstone 04 — Multimodal Document QA (Vision-First PDF, Tables, Charts).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Integrate the required components into one self-terminating workflow.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Exercise happy paths, edge cases, and failure recovery with reproducible fixtures.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Define measurable acceptance criteria for Capstone 04 — Multimodal Document QA (Vision-First PDF, Tables, Charts),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Exercise happy paths, edge cases, and failure recovery with reproducible fixtures,” and cite a repeatable check rather than relying on visual inspection alone.
