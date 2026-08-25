---
name: skill-evidence-first-debugging
description: A compact checklist for numerical and shape diagnostics in neural-network experiments
version: 1.0.0
phase: 03
lesson: 13
tags: [debugging, numerical-stability, gradients, diagnostics]
---

## Evidence checklist

1. **Inputs:** record shape, dtype, range, and whether every value is finite.
2. **Loss:** keep a bounded trace; call `loss_health` and preserve its status.
3. **Activations:** record zero fraction, mean, standard deviation, and extrema per named layer.
4. **Gradients:** record absolute mean and compare it with the local `1e-7` and `100` thresholds.
5. **Derivative:** compare one `central_difference` result with an analytic derivative when available.
6. **Boundary:** record whether an optional framework was available; never fabricate a training metric.

## Acceptance record

```text
fixture: four finite losses and named activation/gradient vectors
loss_status: HEALTHY | NOT_ENOUGH_DATA | NAN_OR_INF | NOT_DECREASING | OSCILLATING
first_issue: <field, observed value, threshold>
follow_up: one bounded change and one expected output field
runtime: stdlib bridge | optional framework adapter
```

## Reading the local labels

- `NAN_OR_INF` means a non-finite value entered the loss trace; find that value before tuning.
- `NOT_DECREASING` compares first/last ten-point means once 20 points exist; shorter traces compare their first and last values, so a constant short trace is not called healthy.
- `OSCILLATING` has priority when recent loss differences alternate often enough; a strictly falling short trace can be `HEALTHY`.
- `DEAD_NEURONS`, `EXPLODING_ACTIVATIONS`, and `COLLAPSED_ACTIVATIONS` can coexist for one vector.
- `VANISHING_GRADIENT` and `EXPLODING_GRADIENT` describe magnitude, not accuracy or generalization.

## Handoff rule

Send the exact command, evidence fields, threshold, one proposed change, and the observed result. Keep data preparation, model architecture, and optimizer changes separate so the next run remains interpretable.
