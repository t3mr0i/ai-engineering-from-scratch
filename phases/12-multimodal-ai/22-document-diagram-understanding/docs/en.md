# Document and Diagram Understanding

> Documents are not photos. A PDF, scientific paper, invoice, or handwritten form has layout, tables, diagrams, footnotes, headers, and semantic structure that plain image understanding cannot capture. The pre-VLM stack was a pipeline: Tesseract OCR + LayoutLMv3 + table-extraction heuristics. The VLM wave replaced that with OCR-free models — Donut (2022), Nougat (2023), DocLLM (2023) — that emit structured markup directly. By 2026 the frontier is just "feed the page image to Claude Opus 4.7 at 2576px native," and the structured-markup output comes for free. This lesson reads the three-era arc of document AI.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## Learning Objectives

- Explain the three eras of document AI: OCR pipeline, OCR-free, VLM-native.
- Describe LayoutLMv3's three input streams: text, layout (bbox), image patches, with unified masking.
- Compare Donut (OCR-free, image → markup), Nougat (scientific paper → LaTeX), DocLLM (layout-aware generative), PaliGemma 2 (VLM-native).
- Pick a document model for a new task (invoices, scientific papers, handwritten forms, Chinese receipts).

## The Problem

"Understand this PDF" is deceptively hard. The information sits in:

- Text content (90% of the signal).
- Layout (headers, footnotes, sidebars, two-column format).
- Tables (rows, columns, merged cells).
- Figures and diagrams.
- Handwritten annotations.
- Fonts and typography (title vs body).

Raw OCR dumps the text and loses the rest. A system that cares about invoices needs to know "Total: $1,245" came from the bottom-right, not from a footnote.

## The Concept

### Era 1 — OCR pipeline (pre-2021)

The classic stack:

1. PDF → image per page.
2. Tesseract (or commercial OCR) extracts text with per-word bounding boxes.
3. Layout analyzer identifies blocks (header, table, paragraph).
4. Table structure recognizer parses tables.
5. Domain rules + regex extract fields.

Works for clean printed text. Breaks on handwriting, skewed scans, complex tables, non-English scripts. Every failure mode requires a custom exception path.

### TrOCR (2021)

TrOCR (Li et al., arXiv:2109.10282) replaced Tesseract's classic CNN-CTC with a transformer encoder-decoder trained on synthetic + real text images. Clean win on handwritten and multilingual text. Still a pipeline (detector then TrOCR then layout), but the OCR step improved dramatically.

### Era 2 — OCR-free (2022-2023)

The first OCR-free models said: skip detection entirely, map image pixels to structured output directly.

Donut (Kim et al., arXiv:2111.15664):
- Encoder-decoder transformer, encoder is Swin-B.
- Output is JSON for form understanding, markdown for summarization, or any task-specific schema.
- No OCR, no layout, no detection.

Nougat (Blecher et al., arXiv:2308.13418):
- Trained specifically on scientific papers.
- Output is LaTeX / markdown.
- Handles equations, multi-column layout, figures.
- The model every arXiv-parser calls.

These are specialists, not generalists. Donut on a scientific paper fails; Nougat on an invoice fails.

### LayoutLMv3 (2022)

A different track. LayoutLMv3 (Huang et al., arXiv:2204.08387) keeps OCR but adds layout understanding:

- Three input streams: OCR text tokens, per-token 2D bounding boxes, image patches.
- Masked training objective across all three modalities (masked text, masked patches, masked layout).
- Downstream: classification, entity extraction, table QA.

LayoutLMv3 is the peak of OCR-based document understanding. Strong on forms and invoices. Requires OCR upstream. Best pre-VLM accuracy on standardized document benchmarks.

### DocLLM (2023)

DocLLM (Wang et al., arXiv:2401.00908) is LayoutLM's generative sibling. Generates free-form answers conditioned on layout tokens. Better for QA on documents; still depends on OCR input.

### Era 3 — VLM-native (2024+)

2024 VLMs became good enough to replace the pipeline entirely. Feed the full page image at high resolution to a VLM, ask the question, get an answer.

- LLaVA-NeXT 336-tile AnyRes works for small documents.
- Qwen2.5-VL dynamic-resolution handles 2048+ pixels natively.
- Claude Opus 4.7 supports 2576px documents.
- PaliGemma 2 (April 2025) trains specifically for documents + handwriting.

The gap between VLM-native and OCR-pipeline closed rapidly. By 2026, VLM-native wins on:

- Scene text (hand-written + printed, mixed scripts).
- Complex tables with merged cells.
- Math equations embedded in text.
- Figures with text annotations.

OCR pipelines still win on:

- Pure-scan workloads at massive scale where per-page latency matters.
- Pipeline reliability (deterministic failures vs VLM hallucinations).
- Regulated environments requiring auditable OCR output.

### The Claude 4.7 / GPT-5 frontier

At 2576-pixel native input, frontier VLMs do document understanding at near-human accuracy. The benchmark numbers from early 2026:

- DocVQA: Claude 4.7 ~95.1, PaliGemma 2 ~88.4, Nougat ~77.3, pipelined LayoutLMv3 ~83.
- ChartQA: Claude 4.7 ~92.2, GPT-4V ~78.
- VisualMRC: Claude 4.7 ~94.

The closed-model gap is mostly resolution and base-LLM scale. Open models at 7B are a few points behind but catching up.

### Math equations and LaTeX output

Scientific papers need exact LaTeX output for equations. Nougat was trained on this. VLMs trained with LaTeX targets (Qwen2.5-VL-Math, Nougat derivatives) produce usable LaTeX. Without explicit LaTeX training, VLMs produce readable but imprecise transcriptions.

For scientific-paper pipelines in 2026: chain Nougat on the PDF, then a VLM on tricky pages.

### Handwriting

Still the hardest sub-task. Mixed printed + handwritten (doctors' notes, filled forms) is where OCR pipelines still beat VLMs for cost. Handwritten-only VLMs are improving (Claude 4.7, PaliGemma 2).

### 2026 recipe

For a new document-AI project:

- Pure-printed invoices at scale: LayoutLMv3 + rules, cost-efficient.
- Mixed documents (scientific + handwritten + forms): VLM-native (PaliGemma 2 or Qwen2.5-VL).
- Full arXiv ingestion: Nougat for math, VLM for figures.
- Regulatory: OCR pipeline + VLM validator for cross-check.



## Build It

Reconstruct **Document and Diagram Understanding** by following `Token` on an 8x8 synthetic image. Run `python3 main.py` and verify that the reported height/width or feature-map shape changes predictably, without inventing pixels.

## Use It

Call `Token` from a small caller with an 8x8 synthetic image. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-document-ai-stack-picker.md` with the command `python3 main.py`, the accepted input shape (an 8x8 synthetic image), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Li et al. — TrOCR (arXiv:2109.10282)](https://arxiv.org/abs/2109.10282)
- [Blecher et al. — Nougat (arXiv:2308.13418)](https://arxiv.org/abs/2308.13418)
- [Huang et al. — LayoutLMv3 (arXiv:2204.08387)](https://arxiv.org/abs/2204.08387)
- [Kim et al. — Donut (arXiv:2111.15664)](https://arxiv.org/abs/2111.15664)
- [Wang et al. — DocLLM (arXiv:2401.00908)](https://arxiv.org/abs/2401.00908)

## Exercises

Keep two runs side by side for **Document and Diagram Understanding**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using an 8x8 synthetic image. Follow `Token`, `mock_page`, `layoutlm_input`. Expect the reported height/width or feature-map shape changes predictably, without inventing pixels; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the three eras of document AI: OCR pipeline, OCR-free, VLM-native.**.
2. **Run a two-value comparison.** Repeat the command after changing only the center-pixel value: use the same image with one bright center pixel. Predict the direction of the change, then compare the two output values. Explain why **Describe LayoutLMv3's three input streams: text, layout (bbox), image patches, with unified masking.** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation a 1x1 image with all values zero. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Compare Donut (OCR-free, image → markup), Nougat (scientific paper → LaTeX), DocLLM (layout-aware generative), PaliGemma 2 (VLM-native).** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-document-ai-stack-picker.md` and add a worked example using an 8x8 synthetic image. Include the input contract, one expected output field, and a named acceptance check for **Pick a document model for a new task (invoices, scientific papers, handwritten forms, Chinese receipts).**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Document and Diagram Understanding** should contain:

- the `python3 main.py` output for an 8x8 synthetic image, with `Token`, `mock_page`, `layoutlm_input` traced to the value or shape that supports **Explain the three eras of document AI: OCR pipeline, OCR-free, VLM-native.**;
- a before/after comparison for the center-pixel value, where the same image with one bright center pixel changes the observation in the direction predicted by **Describe LayoutLMv3's three input streams: text, layout (bbox), image patches, with unified masking.**;
- a recorded result for a 1x1 image with all values zero that matches the implementation’s validation or empty-result contract and explains the evidence for **Compare Donut (OCR-free, image → markup), Nougat (scientific paper → LaTeX), DocLLM (layout-aware generative), PaliGemma 2 (VLM-native).**; and
- an updated `outputs/skill-document-ai-stack-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Pick a document model for a new task (invoices, scientific papers, handwritten forms, Chinese receipts).**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
