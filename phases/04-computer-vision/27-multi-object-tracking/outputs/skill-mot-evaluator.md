---
name: skill-mot-evaluator
description: Compute declared local MOTA and IDF1 checks from matched box timelines
version: 1.0.0
phase: 4
lesson: 27
tags: [mot, iou, mota, idf1, identity]
---

# MOT Evaluator

Keep ground-truth and tracker timelines at the same frame count. Declare the IoU threshold, count
true/false positives and false negatives, and count an identity switch only when one ground-truth ID
changes its matched tracker ID. Report MOTA and IDF1 with the fixture's matching policy; this compact
artifact is not a replacement for a full benchmark protocol.
