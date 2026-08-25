---
name: skill-heatmap-to-coords
description: Decode finite (N,K,H,W) heatmaps into integer and bounded sub-pixel coordinates
version: 1.1.0
phase: 4
lesson: 21
tags: [keypoint, pose, subpixel, inference]
---

# Heatmap to Coords

## Input contract

- `heatmaps`: finite, non-empty `(N,K,H,W)` tensor.
- Coordinates are pixel indices with x in `[0,W-1]` and y in `[0,H-1]`.
- Border peaks have no neighbor on one axis and therefore receive zero offset.

## Procedure

1. Flatten each heatmap and take its argmax.
2. Recover `x = idx % W` and `y = idx // W`.
3. For an interior peak, compare immediate left/right and up/down values.
4. Add `0.25 * sign(neighbor_difference)` on each interior axis; keep border coordinates unchanged.
5. Return coordinates and let the caller apply a confidence threshold from the peak values.

```python
import numpy as np

def decode(heatmaps):
    if heatmaps.ndim != 4 or min(heatmaps.shape) < 1 or not np.isfinite(heatmaps).all():
        raise ValueError("expected a non-empty (N,K,H,W) tensor")
    flat = heatmaps.reshape(heatmaps.shape[0], heatmaps.shape[1], -1)
    index = flat.argmax(axis=-1)
    y, x = index // heatmaps.shape[-1], index % heatmaps.shape[-1]
    return np.stack([x.astype(float), y.astype(float)], axis=-1)
```

The phase-04 implementation adds the bounded neighbor offset and explicitly validates empty/non-finite tensors. It does not estimate confidence calibration or OKS.
