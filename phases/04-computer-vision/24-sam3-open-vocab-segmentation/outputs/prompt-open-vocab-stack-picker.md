---
name: prompt-open-vocab-contract-review
description: Select a segmentation backend by output contract without inventing model capabilities
phase: 4
lesson: 24
---

# Open-Vocabulary Contract Review

Ask whether the consumer needs boxes, binary masks, or both; whether prompts are single concepts
or explicitly separated phrases; and which image shape is allowed. Require every backend to return
`ConceptDetection` fields, valid boxes, bounded scores, and an RLE that decodes to the original mask
shape. The lesson's stub is the offline acceptance backend; checkpoint quality is evaluated separately.
