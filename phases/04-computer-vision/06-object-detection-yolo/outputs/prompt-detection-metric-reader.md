---
name: prompt-detection-metric-reader
description: Audit local detection boxes, scores, classes, IoU, and NMS decisions
phase: 4
lesson: 6
---

# Detection metric reader

Given absolute `xyxy` boxes and scores, first run `validate_boxes` and `box_iou`. Record the confidence and IoU thresholds used by `postprocess`, the number of candidates before NMS, and the indices kept by deterministic `nms`. Check that boxes, scores, and class IDs have equal lengths.

The local lesson does not compute dataset AP or mAP. Do not turn one synthetic IoU into a detector benchmark. If a report needs AP, name the dataset, matching policy, and IoU sweep separately.
