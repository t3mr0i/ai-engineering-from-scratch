# Entry point for phases/04-computer-vision/06-object-detection-yolo/docs/en.md.
# Implements a small NumPy YOLO-style geometry and loss contract; it does not train a current YOLO model.
# Boxes use absolute xyxy coordinates, raw heads use (tx,ty,tw,th,obj,class_logits), and NMS is deterministic.
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
    return array


def sigmoid(x: np.ndarray | float) -> np.ndarray | float:
    value = np.asarray(x, dtype=np.float64)
    if not np.isfinite(value).all():
        raise ValueError("x must contain finite values")
    result = np.empty_like(value)
    positive = value >= 0
    result[positive] = 1.0 / (1.0 + np.exp(-value[positive]))
    negative_exp = np.exp(value[~positive])
    result[~positive] = negative_exp / (1.0 + negative_exp)
    return float(result) if result.ndim == 0 else result


def validate_boxes(boxes: np.ndarray, name: str = "boxes") -> np.ndarray:
    value = np.asarray(boxes, dtype=np.float64)
    if value.ndim != 2 or value.shape[1] != 4:
        raise ValueError(f"{name} must have shape (N,4)")
    if not np.isfinite(value).all():
        raise ValueError(f"{name} must contain finite coordinates")
    if np.any(value[:, 2:] <= value[:, :2]):
        raise ValueError(f"{name} must use x1<x2 and y1<y2")
    return value


def _scores(scores: np.ndarray, n: int) -> np.ndarray:
    value = _finite(scores, "scores").astype(np.float64)
    if value.ndim != 1 or len(value) != n:
        raise ValueError("scores must be a vector matching boxes")
    return value


def box_iou(boxes_a: np.ndarray, boxes_b: np.ndarray) -> np.ndarray:
    left = validate_boxes(boxes_a, "boxes_a")
    right = validate_boxes(boxes_b, "boxes_b")
    if len(left) == 0 or len(right) == 0:
        return np.zeros((len(left), len(right)), dtype=np.float64)
    inter_left = np.maximum(left[:, None, :2], right[None, :, :2])
    inter_right = np.minimum(left[:, None, 2:], right[None, :, 2:])
    inter = np.prod(np.maximum(inter_right - inter_left, 0.0), axis=-1)
    areas_left = np.prod(left[:, 2:] - left[:, :2], axis=1)
    areas_right = np.prod(right[:, 2:] - right[:, :2], axis=1)
    union = areas_left[:, None] + areas_right[None, :] - inter
    return inter / union


def nms(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float = 0.45) -> np.ndarray:
    candidates = validate_boxes(boxes)
    values = _scores(scores, len(candidates))
    if not isinstance(iou_threshold, Real) or not np.isfinite(iou_threshold) or not 0 <= iou_threshold <= 1:
        raise ValueError("iou_threshold must lie in [0,1]")
    # lexsort gives a stable index tie-break while sorting scores descending.
    order = np.lexsort((np.arange(len(values)), -values))
    kept: list[int] = []
    while len(order):
        current = int(order[0])
        kept.append(current)
        if len(order) == 1:
            break
        overlap = box_iou(candidates[[current]], candidates[order[1:]])[0]
        order = order[1:][overlap <= float(iou_threshold)]
    return np.asarray(kept, dtype=np.int64)


def _anchor(anchor_wh: tuple[float, float] | list[float] | np.ndarray) -> np.ndarray:
    value = _finite(anchor_wh, "anchor_wh").reshape(-1)
    if value.shape != (2,) or np.any(value <= 0):
        raise ValueError("anchor_wh must contain two positive widths/heights")
    return value


def _stride(stride: int) -> int:
    return _positive_int(stride, "stride")


def encode(box_xyxy: np.ndarray | list[float] | tuple[float, ...], cell_x: int, cell_y: int,
           stride: int, anchor_wh: tuple[float, float] | list[float] | np.ndarray) -> np.ndarray:
    box = validate_boxes(np.asarray(box_xyxy, dtype=np.float64).reshape(1, 4), "box_xyxy")[0]
    cell_x, cell_y = _positive_or_zero(cell_x, "cell_x"), _positive_or_zero(cell_y, "cell_y")
    stride = _stride(stride)
    anchor = _anchor(anchor_wh)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    width, height = box[2] - box[0], box[3] - box[1]
    offset_x, offset_y = cx / stride - cell_x, cy / stride - cell_y
    if not 0 <= offset_x < 1 or not 0 <= offset_y < 1:
        raise ValueError("box center must lie in the selected half-open cell")
    offset_x, offset_y = np.clip([offset_x, offset_y], 1e-7, 1 - 1e-7)
    return np.array([
        np.log(offset_x / (1 - offset_x)),
        np.log(offset_y / (1 - offset_y)),
        np.log(width / anchor[0]),
        np.log(height / anchor[1]),
    ], dtype=np.float64)


def _positive_or_zero(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) < 0:
        raise ValueError(f"{name} must be a non-negative integer")
    return int(value)


def decode(raw: np.ndarray | list[float], cell_x: int, cell_y: int, stride: int,
           anchor_wh: tuple[float, float] | list[float] | np.ndarray) -> np.ndarray:
    values = _finite(raw, "raw").reshape(-1)
    if values.shape != (4,):
        raise ValueError("raw must have four encoded values")
    cell_x, cell_y = _positive_or_zero(cell_x, "cell_x"), _positive_or_zero(cell_y, "cell_y")
    stride = _stride(stride)
    anchor = _anchor(anchor_wh)
    cx = (float(sigmoid(values[0])) + cell_x) * stride
    cy = (float(sigmoid(values[1])) + cell_y) * stride
    width, height = anchor * np.exp(np.clip(values[2:], -20, 20))
    return np.array([cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2])


def _anchors(anchors: np.ndarray | list[tuple[float, float]]) -> np.ndarray:
    value = _finite(anchors, "anchors").reshape(-1, 2)
    if value.ndim != 2 or len(value) == 0 or np.any(value <= 0):
        raise ValueError("anchors must be a non-empty (A,2) array of positive widths/heights")
    return value


def assign_targets(
    boxes_xyxy: np.ndarray | list[list[float]],
    classes: np.ndarray | list[int],
    anchors: np.ndarray | list[tuple[float, float]],
    stride: int,
    grid_size: int | tuple[int, int],
    num_classes: int,
) -> tuple[np.ndarray, np.ndarray]:
    boxes = validate_boxes(np.asarray(boxes_xyxy, dtype=np.float64).reshape(-1, 4))
    labels = np.asarray(classes)
    if labels.ndim != 1 or len(labels) != len(boxes) or not np.issubdtype(labels.dtype, np.integer):
        raise ValueError("classes must be an integer vector matching boxes")
    num_classes = _positive_int(num_classes, "num_classes")
    if len(labels) and (labels.min() < 0 or labels.max() >= num_classes):
        raise ValueError("class is outside num_classes")
    anchor_values = _anchors(anchors)
    stride = _stride(stride)
    if isinstance(grid_size, Integral) and not isinstance(grid_size, bool):
        grid_h = grid_w = int(grid_size)
    elif isinstance(grid_size, (tuple, list)) and len(grid_size) == 2:
        grid_h, grid_w = grid_size
    else:
        raise ValueError("grid_size must be an integer or (height,width)")
    grid_h, grid_w = _positive_int(grid_h, "grid_h"), _positive_int(grid_w, "grid_w")
    target = np.zeros((grid_h, grid_w, len(anchor_values), 5 + num_classes), dtype=np.float64)
    has_object = np.zeros((grid_h, grid_w, len(anchor_values)), dtype=bool)
    for box, class_id in zip(boxes, labels):
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        gx, gy = int(cx // stride), int(cy // stride)
        if not (0 <= gx < grid_w and 0 <= gy < grid_h):
            raise ValueError("box center lies outside the target grid")
        width, height = box[2] - box[0], box[3] - box[1]
        intersection = np.minimum(anchor_values[:, 0], width) * np.minimum(anchor_values[:, 1], height)
        union = anchor_values[:, 0] * anchor_values[:, 1] + width * height - intersection
        best = int(np.argmax(intersection / union))
        if has_object[gy, gx, best]:
            raise ValueError("two boxes map to the same cell/anchor target slot")
        target[gy, gx, best, :4] = encode(box, gx, gy, stride, anchor_values[best])
        target[gy, gx, best, 4] = 1.0
        target[gy, gx, best, 5 + int(class_id)] = 1.0
        has_object[gy, gx, best] = True
    return target, has_object


def _bce_with_logits(logits: np.ndarray, targets: np.ndarray) -> float:
    return float(np.mean(np.maximum(logits, 0) - logits * targets + np.log1p(np.exp(-np.abs(logits))))) if logits.size else 0.0


def yolo_loss(
    pred: np.ndarray,
    target: np.ndarray,
    has_object: np.ndarray,
    lambda_coord: float = 5.0,
    lambda_obj: float = 1.0,
    lambda_noobj: float = 0.5,
    lambda_cls: float = 1.0,
) -> tuple[float, dict[str, float]]:
    prediction = _finite(pred, "pred")
    truth = _finite(target, "target")
    mask = np.asarray(has_object, dtype=bool)
    if prediction.ndim != 4 or truth.shape != prediction.shape or prediction.shape[-1] < 6:
        raise ValueError("pred and target must have matching (Gh,Gw,A,5+C) shape")
    if mask.shape != prediction.shape[:3]:
        raise ValueError("has_object must have shape (Gh,Gw,A)")
    weights = [lambda_coord, lambda_obj, lambda_noobj, lambda_cls]
    if any(not isinstance(value, Real) or not np.isfinite(value) or value < 0 for value in weights):
        raise ValueError("loss weights must be finite and non-negative")
    box = float(np.mean((prediction[..., :4][mask] - truth[..., :4][mask]) ** 2)) if mask.any() else 0.0
    positive_object = _bce_with_logits(prediction[..., 4][mask], truth[..., 4][mask])
    negative_object = _bce_with_logits(prediction[..., 4][~mask], truth[..., 4][~mask])
    classification = _bce_with_logits(prediction[..., 5:][mask], truth[..., 5:][mask])
    parts = {"box": box, "obj": positive_object, "noobj": negative_object, "class": classification}
    total = float(lambda_coord * box + lambda_obj * positive_object + lambda_noobj * negative_object + lambda_cls * classification)
    return total, parts


def postprocess(
    pred: np.ndarray,
    anchors: np.ndarray | list[tuple[float, float]],
    stride: int,
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.45,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    raw = _finite(pred, "pred")
    if raw.ndim != 5 or raw.shape[0] != 1 or raw.shape[-1] < 6:
        raise ValueError("pred must have shape (1,Gh,Gw,A,5+C)")
    anchor_values = _anchors(anchors)
    if raw.shape[3] != len(anchor_values):
        raise ValueError("prediction anchor axis must match anchors")
    stride = _stride(stride)
    if not isinstance(conf_threshold, Real) or not np.isfinite(conf_threshold) or not 0 <= conf_threshold <= 1:
        raise ValueError("conf_threshold must lie in [0,1]")
    if not isinstance(iou_threshold, Real) or not np.isfinite(iou_threshold) or not 0 <= iou_threshold <= 1:
        raise ValueError("iou_threshold must lie in [0,1]")
    candidates, scores, classes = [], [], []
    for gy in range(raw.shape[1]):
        for gx in range(raw.shape[2]):
            for anchor_id, anchor in enumerate(anchor_values):
                row = raw[0, gy, gx, anchor_id]
                class_probabilities = np.asarray(sigmoid(row[5:]))
                score = float(sigmoid(row[4]) * class_probabilities.max())
                if score < float(conf_threshold):
                    continue
                center_x = (float(sigmoid(row[0])) + gx) * stride
                center_y = (float(sigmoid(row[1])) + gy) * stride
                width, height = anchor * np.exp(np.clip(row[2:4], -20, 20))
                candidates.append([center_x - width / 2, center_y - height / 2, center_x + width / 2, center_y + height / 2])
                scores.append(score)
                classes.append(int(np.argmax(class_probabilities)))
    if not candidates:
        return np.zeros((0, 4)), np.zeros(0), np.zeros(0, dtype=np.int64)
    boxes = np.asarray(candidates)
    score_array = np.asarray(scores)
    keep = nms(boxes, score_array, iou_threshold)
    return boxes[keep], score_array[keep], np.asarray(classes, dtype=np.int64)[keep]


def main() -> int:
    anchors = np.asarray([(16, 24), (32, 48), (64, 96)], dtype=np.float64)
    boxes = np.asarray([[18, 20, 50, 68]], dtype=np.float64)
    print(f"IoU identical={box_iou(boxes, boxes)[0, 0]:.3f}")
    encoded = encode(boxes[0], 1, 1, 32, anchors[1])
    decoded = decode(encoded, 1, 1, 32, anchors[1])
    print(f"encode/decode max_abs_error={np.max(np.abs(boxes[0] - decoded)):.2e}")
    target, mask = assign_targets(boxes, [1], anchors, 32, (4, 4), 3)
    prediction = np.zeros_like(target)
    total, parts = yolo_loss(prediction, target, mask)
    print(f"target_shape={target.shape} positive_cells={int(mask.sum())} loss={total:.4f} parts={parts}")
    prediction[1, 1, 1, 4] = 5.0
    prediction[1, 1, 1, 6] = 5.0
    decoded_boxes, scores, classes = postprocess(prediction[None], anchors, 32, conf_threshold=0.3)
    print(f"postprocess detections={len(decoded_boxes)} scores={scores.round(3).tolist()} classes={classes.tolist()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
