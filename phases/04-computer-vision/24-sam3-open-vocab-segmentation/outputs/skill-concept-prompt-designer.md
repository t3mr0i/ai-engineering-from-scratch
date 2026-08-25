---
name: skill-concept-prompt-designer
description: Turn explicit object lists into validated concepts for a segmentation backend
version: 1.0.0
phase: 4
lesson: 24
tags: [open-vocabulary, prompts, masks, rle]
---

# Concept Prompt Designer

Split only explicit separators such as commas, semicolons, `and`, `or`, and `&`. Preserve noun
phrases such as `yellow school bus`. Reject an empty segment. For each returned concept, retain the
image shape and validate that each mask RLE expands to exactly that many cells before sending a
record downstream.
