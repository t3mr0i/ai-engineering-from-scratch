---
name: prompt-vlm-interface-review
description: Review the shape and monitoring contract around a vision-language bridge
phase: 4
lesson: 25
---

# VLM Interface Review

Record vision token shape `(N,P,Dv)`, projected width `Dl`, class mapping, and the confidence and
similarity thresholds used for review. Require stable finite logits and integer targets for local
classification. If a pretrained VLM is selected later, keep its tokenizer, checkpoint, and license
as explicit external inputs rather than silently treating the seeded fixture as a model.
