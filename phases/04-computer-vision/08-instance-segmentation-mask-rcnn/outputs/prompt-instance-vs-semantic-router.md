---
name: prompt-instance-vs-semantic-router
description: Choose an instance or semantic mask contract from the required output
phase: 4
lesson: 8
---

# Segmentation task router

Ask whether the output must distinguish two objects of the same class. If yes, use one `xyxy` box and one mask per selected instance; record the RoI scale, mask resolution, paste region, and threshold. If no, a semantic `(H,W)` class mask may be enough and no per-object RoI alignment is needed.

For this lesson, verify `roi_align` output shape, `paste_mask` bounds, finite BCE, and mask IoU before discussing a framework model. A local fixture is geometry evidence, not a trained detector score.
