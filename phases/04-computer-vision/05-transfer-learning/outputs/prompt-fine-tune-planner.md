---
name: prompt-fine-tune-planner
description: Plan a freeze boundary and staged learning rates from local feature and head accounting
phase: 4
lesson: 5
---

# Fine-tune plan

For a local run, record the NHWC input shape (both spatial axes must be at least `2`), `backbone_features` shape, `parameter_counts(backbone, head, freeze_backbone)`, and `discriminative_lrs(stages, base_lr, decay)`. State which values are illustrative and which are enforced by code. The canonical smoke test is:

```bash
python3 main.py
```

Require a finite decreasing `train_head` loss before discussing a broader training schedule. Do not infer the quality or provenance of a pretrained model from this offline fixture.
