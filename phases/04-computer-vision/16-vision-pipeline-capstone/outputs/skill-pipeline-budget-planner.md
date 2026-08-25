---
name: skill-pipeline-budget-planner
description: Assign an evidence-based p95 budget to each stage of a vision pipeline
version: 1.1.0
phase: 4
lesson: 16
tags: [vision, pipeline, performance, deployment]
---

# Pipeline Budget Planner

Turn measured stage timings into a reviewable budget. Do not fill an unknown stage with a convenient estimate.

## Inputs

- `p95_target_ms`: end-to-end p95 target.
- `stages`: records with `name`, `p95_ms`, and the input shape/device used.
- `quality_gate`: task metric and held-out threshold.

## Procedure

1. Confirm every stage was measured on the same target shape and device.
2. Sum the stage p95 values as a conservative diagnostic; do not infer a percentile for the sum from separate medians.
3. Mark a stage `over` when its p95 exceeds its assigned budget.
4. Change one stage at a time and rerun the complete pipeline, including the quality gate.

```python
def gate(stage, budget_ms):
    if stage["p95_ms"] < 0 or budget_ms <= 0:
        raise ValueError("timings and budgets must be positive")
    return "pass" if stage["p95_ms"] <= budget_ms else "over"
```

## Report

```text
[budget plan]
  target p95: <ms>
  measured sum of stage p95 values: <ms>

| stage       | budget_ms | p95_ms | gate |
|-------------|-----------|--------|------|
| preprocess  | ...       | ...    | ...  |
| detect      | ...       | ...    | ...  |
| classify    | ...       | ...    | ...  |
| total       | ...       | ...    | ...  |

[caveat]
  <device, shape, quality, and concurrency assumptions>
```

The lesson's `benchmark` exposes `preprocess`, `detect`, `classify`, and `total`. Schema validation remains part of the boundary; removing it is not a performance optimization.
