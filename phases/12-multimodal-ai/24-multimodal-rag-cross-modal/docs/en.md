# Multimodal RAG and Cross-Modal Retrieval

> Vision-native document RAG is one slice. Production multimodal RAG goes wider — retrieving across text, images, audio, and video for workflows like trip planning ("find me a quiet vegan brunch with natural light"), medical triage ("what injury matches this photo + these notes"), e-commerce ("outfits similar to this selfie, in my size"), and field service ("diagnose this engine sound plus photo of the part"). Three 2025 surveys — Abootorabi et al., Mei et al., Zhao et al. — codified the sub-problems: cross-modal retrieval, retrieval fusion, generation grounding, multimodal evaluation. This lesson reads the surveys and designs a production pipeline.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 12 · 23 (ColPali), Phase 11 (RAG basics)
**Time:** ~180 minutes

## Learning Objectives

- Design cross-modal retrieval: text → image, image → text, audio → video, etc.
- Compare three fusion strategies: score fusion, attention-based fusion, MoE fusion.
- Explain generation grounding: what "cite your sources" looks like when sources are a mix of modalities.
- Name the three canonical multimodal RAG surveys of 2025 and their sub-problem taxonomy.

## The Problem

Single-modality RAG is a solved pattern: embed query, embed chunks, retrieve, stuff into LLM. Multimodal RAG requires:

1. Multiple retrieval heads (each modality needs embeddings in a compatible space).
2. Fusion of retrieval results across modalities.
3. Generation grounding that cites sources across modalities.
4. Evaluation metrics that cover cross-modal signal.

The 2025 surveys all arrive at the same taxonomy.

## The Concept

### Cross-modal retrieval

Retrieve documents of modality B given a query of modality A. Three patterns:

1. Shared embedding space. CLIP and CLAP produce text + image / text + audio embeddings in a shared space. Cosine similarity across modalities works directly. Limited to CLIP-trained pairs.

2. Per-modality encoder + translation. Text encoder + image encoder + a small translator module mapping between spaces. Sen2Sen by Gupta et al. and other 2024 designs. Flexible but adds complexity.

3. VLM as encoder. Use a VLM's hidden states as the retrieval representation. Any modality the VLM supports works. Higher quality, more expensive.

Choice: CLIP / SigLIP 2 for text+image; CLAP for text+audio; VLM-hidden-states for cross-modal at frontier quality.

### Fusion strategies

You retrieved 10 results: 5 images, 3 text passages, 2 audio clips. How do you merge?

Score fusion (cheapest). Each modality has its own retriever, each returns scores. Normalize scores within-modality then sum. Simple, often works.

Attention-based fusion. Concatenate all retrieved items, let a small attention network weight them. Needs training.

MoE fusion. Gating network routes to modality-specific experts. Different query types route differently — a visual question weights images higher.

Production default: score fusion with a slight bias toward the query's dominant modality. Upgrade to MoE if A/B shows clear wins on your domain.

### Generation grounding

The LLM should cite which retrieved item drove each claim. For multi-modal:

- Text source: standard citation `[1]`.
- Image source: `[img 3]` with a short caption.
- Audio: `[audio 2 at 0:34]`.

Train the generator with grounding-aware data: each claim in the training target is tagged with the source index. At inference, the model naturally emits citations.

### The 2025 surveys

Abootorabi et al. (arXiv:2502.08826, "Ask in Any Modality"): taxonomy for multimodal RAG. Covers retrieval, fusion, generation. Broadest coverage.

Mei et al. (arXiv:2504.08748, "A Survey of Multimodal RAG"): focuses on sub-task benchmarks and failure modes. Useful for evaluation design.

Zhao et al. (arXiv:2503.18016): vision-focused survey. Strong on ColPali-family work.

Reading all three gives you the state of the art as of spring 2025. Most of the sub-problems are still open.

### MuRAG — the foundational paper

MuRAG (Chen et al., 2022) was the first multimodal RAG. Retrieved image + text from a multimodal KB, generated answers. Showed feasibility before the VLM wave. Modern systems (REACT, VisRAG, M3DocRAG) build on it.

### A production trip-planner example

Query: "find me a quiet vegan brunch with natural light."

Pipeline:

1. Decompose query. "quiet" → audio/review keyword; "vegan brunch" → menu item; "natural light" → image feature.
2. Retrieve per modality:
   - Text retrieval on reviews: "vegan brunch, quiet ambiance."
   - Image retrieval on restaurant photos: "natural light, airy."
   - Audio retrieval on ambient-sound clips: "low decibel, no music."
3. Fuse scores. Each restaurant has a composite score.
4. Top-k restaurants → VLM generator with all evidence → answer with citations.

This is well beyond text-RAG. Each modality adds signal that text alone misses.

### Agentic multimodal RAG

Multi-hop: if the first retrieval does not return high-confidence answers, the LLM reformulates and retrieves again. Agentic RAG patterns from Phase 14 apply here. Examples:

- Retrieve initial top-10 → LLM asks "too noisy, filter for <40 dB" → re-retrieve.
- Retrieve images → LLM sees one has a menu → retrieve the menu text → answer.

Adds complexity but handles queries that single-shot retrieval cannot.

### Evaluation

Cross-modal evaluation is still immature. Common proxies:

- Recall@k per modality.
- Fused top-k accuracy.
- Human-judged end-to-end satisfaction.
- Task-specific (bookings completed, purchases made).

No standard benchmark spans all modalities. Most papers evaluate on domain-specific tasks.



## Build It

Reconstruct **Multimodal RAG and Cross-Modal Retrieval** by following `Restaurant` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `Restaurant` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-multimodal-rag-designer.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)

## Exercises

Use `Restaurant` as the trace: start from tokens=["red","fox"], keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `Restaurant`, `text_retrieve`, `image_retrieve`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Design cross-modal retrieval: text → image, image → text, audio → video, etc.**.
2. **Vary one named input.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Compare three fusion strategies: score fusion, attention-based fusion, MoE fusion.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain generation grounding: what "cite your sources" looks like when sources are a mix of modalities.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-multimodal-rag-designer.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Name the three canonical multimodal RAG surveys of 2025 and their sub-problem taxonomy.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Multimodal RAG and Cross-Modal Retrieval** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `Restaurant`, `text_retrieve`, `image_retrieve` traced to the value or shape that supports **Design cross-modal retrieval: text → image, image → text, audio → video, etc.**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Compare three fusion strategies: score fusion, attention-based fusion, MoE fusion.**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain generation grounding: what "cite your sources" looks like when sources are a mix of modalities.**; and
- an updated `outputs/skill-multimodal-rag-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Name the three canonical multimodal RAG surveys of 2025 and their sub-problem taxonomy.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
