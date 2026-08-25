---
name: skill-point-cloud-loader
description: Validate and normalize a small NumPy point-cloud batch before 3D work
version: 1.0.0
phase: 4
lesson: 13
tags: [3d-vision, point-cloud, numpy, validation]
---

# Point-cloud fixture loader

This skill describes the input contract for a local experiment. It does not
parse PLY/PCD files and it does not provide a PyTorch dataset. Keep file
decoding as a separate, reviewed boundary, then hand this routine a finite
`(points, 3)` NumPy array.

## Contract

- Require a two-dimensional, non-empty array with exactly three columns.
- Reject NaN and infinite coordinates before centering.
- Subtract the centroid and divide by the largest centered Euclidean norm.
- If every point is identical, return a centered all-zero cloud rather than
  dividing by an epsilon and hiding the degenerate geometry.
- Preserve point count and row order; sampling or augmentation belongs to the
  caller and must be recorded separately.

## Reference implementation sketch

```python
import numpy as np


def normalize_points(points: np.ndarray) -> np.ndarray:
    values = np.asarray(points, dtype=float)
    if values.ndim != 2 or values.shape[1] != 3 or values.shape[0] == 0:
        raise ValueError("points must have shape (N, 3) with N > 0")
    if not np.isfinite(values).all():
        raise ValueError("points must be finite")
    centered = values - values.mean(axis=0, keepdims=True)
    radius = float(np.linalg.norm(centered, axis=1).max())
    return centered if radius == 0.0 else centered / radius
```

## Handoff fields

Store `input_shape`, `output_shape`, `centroid`, `radius`, and a boolean
`finite_before_normalization`. These fields make a downstream ray or geometry
experiment auditable without implying that a model has learned a 3D scene.
