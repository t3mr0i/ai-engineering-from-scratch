# Entry point for phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md.
# Implements NumPy ROI Align, mask pasting, and mask-loss contracts without a detector dependency.
# Coordinates are absolute image-pixel xyxy boxes; feature maps are related by an explicit spatial scale.
# Run from this directory with: python3 main.py

from __future__ import annotations

from numbers import Integral, Real

import numpy as np


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _finite(value: np.ndarray, name: str) -> np.ndarray:
    array = np.asarray(value)
    if not np.issubdtype(array.dtype, np.number) or not np.isfinite(array).all():
        raise ValueError(f"{name} must contain finite numeric values")
    return array.astype(np.float64, copy=False)


def _output_size(value: int | tuple[int, int]) -> tuple[int, int]:
    if isinstance(value, Integral) and not isinstance(value, bool):
        side = _positive_int(value, "output_size")
        return side, side
    if isinstance(value, (tuple, list)) and len(value) == 2:
        return _positive_int(value[0], "output_height"), _positive_int(value[1], "output_width")
    raise ValueError("output_size must be a positive integer or a pair of integers")


def validate_boxes(boxes: np.ndarray | list[list[float]], image_shape: tuple[int, int]) -> np.ndarray:
    """Validate absolute ``(x1,y1,x2,y2)`` boxes inside an ``(H,W)`` image."""
    if len(image_shape) != 2:
        raise ValueError("image_shape must be (height,width)")
    height, width = (_positive_int(v, name) for v, name in zip(image_shape, ("height", "width")))
    value = np.asarray(boxes)
    if value.ndim == 1 and value.size == 4:
        value = value.reshape(1, 4)
    if value.ndim != 2 or value.shape[1] != 4 or value.shape[0] == 0:
        raise ValueError("boxes must have a non-empty shape (N,4)")
    value = _finite(value, "boxes")
    if np.any(value[:, 0] < 0) or np.any(value[:, 1] < 0):
        raise ValueError("box origins must be non-negative")
    if np.any(value[:, 2] <= value[:, 0]) or np.any(value[:, 3] <= value[:, 1]):
        raise ValueError("boxes must have positive width and height")
    if np.any(value[:, 2] > width) or np.any(value[:, 3] > height):
        raise ValueError("boxes must lie inside the image")
    return value


def _bilinear(feature: np.ndarray, y: float, x: float) -> np.ndarray:
    """Sample one CHW feature map at a clamped feature-pixel coordinate."""
    _, height, width = feature.shape
    y = float(np.clip(y, 0, height - 1))
    x = float(np.clip(x, 0, width - 1))
    y0, x0 = int(np.floor(y)), int(np.floor(x))
    y1, x1 = min(y0 + 1, height - 1), min(x0 + 1, width - 1)
    wy, wx = y - y0, x - x0
    top = (1 - wx) * feature[:, y0, x0] + wx * feature[:, y0, x1]
    bottom = (1 - wx) * feature[:, y1, x0] + wx * feature[:, y1, x1]
    return (1 - wy) * top + wy * bottom


def roi_align(
    feature: np.ndarray,
    boxes: np.ndarray | list[list[float]],
    output_size: int | tuple[int, int] = 7,
    spatial_scale: float = 1.0,
) -> np.ndarray:
    """Pool each image-space box onto a fixed CHW grid using bin-center bilinear samples."""
    fmap = _finite(feature, "feature")
    if fmap.ndim != 3 or 0 in fmap.shape:
        raise ValueError("feature must have a non-empty (C,H,W) shape")
    if not isinstance(spatial_scale, Real) or not np.isfinite(spatial_scale) or spatial_scale <= 0:
        raise ValueError("spatial_scale must be positive and finite")
    out_h, out_w = _output_size(output_size)
    image_shape = (fmap.shape[1] / float(spatial_scale), fmap.shape[2] / float(spatial_scale))
    if any(float(v) != int(v) for v in image_shape):
        raise ValueError("feature dimensions must be divisible by spatial_scale")
    image_shape = (int(image_shape[0]), int(image_shape[1]))
    image_boxes = validate_boxes(boxes, image_shape)
    pooled = np.empty((len(image_boxes), fmap.shape[0], out_h, out_w), dtype=np.float64)
    for index, (x1, y1, x2, y2) in enumerate(image_boxes):
        x1 *= spatial_scale
        x2 *= spatial_scale
        y1 *= spatial_scale
        y2 *= spatial_scale
        xs = x1 + (np.arange(out_w) + 0.5) * (x2 - x1) / out_w
        ys = y1 + (np.arange(out_h) + 0.5) * (y2 - y1) / out_h
        for oy, y in enumerate(ys):
            for ox, x in enumerate(xs):
                pooled[index, :, oy, ox] = _bilinear(fmap, y, x)
    return pooled


def sigmoid(value: np.ndarray | float) -> np.ndarray:
    array = _finite(value, "value")
    positive = array >= 0
    result = np.empty_like(array, dtype=np.float64)
    result[positive] = 1.0 / (1.0 + np.exp(-array[positive]))
    exp_value = np.exp(array[~positive])
    result[~positive] = exp_value / (1.0 + exp_value)
    return result


def mask_bce_with_logits(logits: np.ndarray, targets: np.ndarray) -> float:
    scores = _finite(logits, "logits")
    raw_labels = np.asarray(targets)
    labels = raw_labels.astype(np.float64) if raw_labels.dtype == np.bool_ else _finite(raw_labels, "targets")
    if scores.shape != labels.shape or scores.ndim != 3 or 0 in scores.shape:
        raise ValueError("logits and targets must have the same non-empty (N,H,W) shape")
    if np.any((labels < 0) | (labels > 1)):
        raise ValueError("targets must lie in [0,1]")
    loss = np.maximum(scores, 0) - scores * labels + np.log1p(np.exp(-np.abs(scores)))
    return float(loss.mean())


def paste_mask(
    mask_logits: np.ndarray,
    box: np.ndarray | list[float],
    image_shape: tuple[int, int],
    threshold: float = 0.5,
) -> np.ndarray:
    """Resize one mask logit grid into its integer-covered image box."""
    logits = _finite(mask_logits, "mask_logits")
    if logits.ndim != 2 or 0 in logits.shape:
        raise ValueError("mask_logits must have a non-empty (H,W) shape")
    if not isinstance(threshold, Real) or not np.isfinite(threshold) or not 0 <= threshold <= 1:
        raise ValueError("threshold must lie in [0,1]")
    validated = validate_boxes(np.asarray(box).reshape(1, 4), image_shape)[0]
    x1, y1 = int(np.floor(validated[0])), int(np.floor(validated[1]))
    x2, y2 = int(np.ceil(validated[2])), int(np.ceil(validated[3]))
    result = np.zeros(image_shape, dtype=bool)
    for y in range(y1, y2):
        source_y = ((y + 0.5 - validated[1]) / (validated[3] - validated[1])) * logits.shape[0] - 0.5
        for x in range(x1, x2):
            source_x = ((x + 0.5 - validated[0]) / (validated[2] - validated[0])) * logits.shape[1] - 0.5
            y_value = float(np.clip(source_y, 0, logits.shape[0] - 1))
            x_value = float(np.clip(source_x, 0, logits.shape[1] - 1))
            y0, x0 = int(np.floor(y_value)), int(np.floor(x_value))
            y1i, x1i = min(y0 + 1, logits.shape[0] - 1), min(x0 + 1, logits.shape[1] - 1)
            wy, wx = y_value - y0, x_value - x0
            value = ((1 - wy) * ((1 - wx) * logits[y0, x0] + wx * logits[y0, x1i])
                     + wy * ((1 - wx) * logits[y1i, x0] + wx * logits[y1i, x1i]))
            result[y, x] = bool(sigmoid(value) >= threshold)
    return result


def mask_iou(prediction: np.ndarray, target: np.ndarray) -> float:
    first, second = np.asarray(prediction, dtype=bool), np.asarray(target, dtype=bool)
    if first.shape != second.shape or first.ndim != 2 or 0 in first.shape:
        raise ValueError("masks must have the same non-empty 2-D shape")
    intersection = np.logical_and(first, second).sum()
    union = np.logical_or(first, second).sum()
    return 1.0 if union == 0 else float(intersection / union)


def synthetic_scene(height: int = 16, width: int = 20) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    height, width = _positive_int(height, "height"), _positive_int(width, "width")
    if height < 4 or width < 4:
        raise ValueError("scene must be at least 4x4")
    yy, xx = np.meshgrid(np.arange(height), np.arange(width), indexing="ij")
    feature = np.stack((xx / max(width - 1, 1), yy / max(height - 1, 1)), axis=0)
    boxes = np.array([[2, 3, width - 5, height - 4]], dtype=np.float64)
    masks = ((xx >= boxes[0, 0]) & (xx < boxes[0, 2]) & (yy >= boxes[0, 1]) & (yy < boxes[0, 3]))[None]
    return feature, boxes, masks


def main() -> int:
    feature, boxes, targets = synthetic_scene()
    pooled = roi_align(feature, boxes, output_size=(3, 4), spatial_scale=1.0)
    logits = np.full((4, 5), -2.0)
    pasted = paste_mask(logits, boxes[0], targets.shape[1:])
    loss = mask_bce_with_logits(logits[None], targets[:, 3:7, 2:7])
    print(f"feature={feature.shape} boxes={boxes.shape} roi={pooled.shape}")
    print(f"mask_logits={logits.shape} pasted_area={int(pasted.sum())} target_area={int(targets.sum())}")
    print(f"mask_bce={loss:.4f} pasted_iou={mask_iou(pasted, targets[0]):.3f}")
    print("note: this is a NumPy ROI/mask fixture, not a pretrained Mask R-CNN run")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
