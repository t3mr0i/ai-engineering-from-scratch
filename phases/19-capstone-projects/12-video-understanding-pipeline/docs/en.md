# Capstone 12 — Video Understanding Pipeline (Scene, QA, Search)

> Twelve Labs productized Marengo + Pegasus. VideoDB shipped the CRUD-for-video API. AI2's Molmo 2 published open VLM checkpoints. Gemini long-context handles hours of video natively. TimeLens-100K defined temporal grounding at scale. The 2026 pipeline is settled: scene segmentation, per-scene caption + embedding, transcript alignment, multi-vector index, and a query that answers with (start, end) timestamps plus frame previews. The capstone is ingesting 100 hours, hitting public benchmarks, and measuring hallucination on counting and action questions.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:** P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 hours

## Learning Objectives

- Define measurable acceptance criteria for Capstone 12 — Video Understanding Pipeline (Scene, QA, Search)
- Integrate the required components into one self-terminating workflow
- Exercise happy paths, edge cases, and failure recovery with reproducible fixtures
- Package the verified result as a reusable curriculum artifact

## Problem

Long-form video QA is the most bandwidth-hungry multimodal problem at 2026 scale. Gemini 2.5 Pro can read a 2-hour video natively, but ingesting 100 hours of video into a queryable corpus still requires a scene-level index. The production shape combines scene segmentation (TransNetV2 or PySceneDetect), per-scene captioning with a VLM (Gemini 2.5, Qwen3-VL-Max, or Molmo 2), transcript alignment (Whisper-v3-turbo with word timestamps), and a multi-vector index that stores caption, frame embedding, and transcript side by side. The query pipeline answers with (start, end) timestamps plus frame previews.

Benchmarks are public (ActivityNet-QA, NeXT-GQA) plus your own 100-query custom set. Hallucination on counting and action-type questions is the known-hard failure class; the capstone explicitly measures it.

## Concept

Three pipelines run in parallel at ingest. **Scene segmentation** cuts the video into scenes. **VLM captioning** generates a caption per scene and a frame embedding from a keyframe. **ASR alignment** produces word-level timestamps. The three streams are joined by (scene_id, time range). Each scene gets three vector types in a multi-vector index (Qdrant): caption embedding, keyframe embedding, transcript embedding.

At query time, the natural-language question fires against all three vectors; results merge with RRF; a temporal-grounding adapter (TimeLens-style) refines the (start, end) window within the top scene. The VLM synthesizer (Gemini 2.5 Pro or Qwen3-VL-Max) takes query + top scenes + cropped frames and answers with cited timestamps and a frame preview.

The hallucination measurement matters. Counting ("how many people enter the room?") and action-type ("does the chef pour before stirring?") questions are notoriously unreliable. Report accuracy separately from descriptive questions.

## Architecture

```
video file / URL
      |
      v
PySceneDetect / TransNetV2  (scene segmentation)
      |
      +--- per-scene keyframe --- VLM caption + frame embedding
      |                            (Gemini 2.5 Pro / Qwen3-VL-Max / Molmo 2)
      |
      +--- audio channel --- Whisper-v3-turbo ASR + word timestamps
      |
      v
multi-vector Qdrant: {caption_emb, keyframe_emb, transcript_emb}
      |
query:
  dense queries against all three -> RRF merge -> top-k scenes
      |
      v
TimeLens / VideoITG temporal grounding (refine start/end within scene)
      |
      v
VLM synth: query + top scenes + frame previews
      |
      v
answer + (start, end) timestamps + frame thumbs + citations
```

## Stack

- Scene segmentation: TransNetV2 (state-of-the-art 2024-26) or PySceneDetect
- ASR: Whisper-v3-turbo via faster-whisper with word timestamps
- VLM captioner + answerer: Gemini 2.5 Pro or Qwen3-VL-Max or Molmo 2
- Temporal grounding: TimeLens-100K-trained adapter or VideoITG
- Index: Qdrant with multi-vector support (caption / frame / transcript)
- UI: Next.js 15 with HTML5 video player and scene thumbnails
- Eval: ActivityNet-QA, NeXT-GQA, custom 100-question hand-labeled set
- Hallucination benchmark: counting and action-type subsets with hand labels




## Further Reading

- [AI2 Molmo 2](https://allenai.org/blog/molmo2) — open VLM checkpoints
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) — temporal grounding at scale
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) — the hosted reference
- [VideoDB](https://videodb.io) — CRUD-for-video API reference
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) — commercial reference
- [TransNetV2](https://github.com/soCzech/TransNetV2) — scene segmentation model
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) — classic open alternative
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) — reference eval benchmark

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Define measurable acceptance criteria for Capstone 12 — Video Understanding Pipeline (Scene, QA, Search).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Integrate the required components into one self-terminating workflow.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Exercise happy paths, edge cases, and failure recovery with reproducible fixtures.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Define measurable acceptance criteria for Capstone 12 — Video Understanding Pipeline (Scene, QA, Search),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Exercise happy paths, edge cases, and failure recovery with reproducible fixtures,” and cite a repeatable check rather than relying on visual inspection alone.
