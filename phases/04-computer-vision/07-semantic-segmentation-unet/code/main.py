# Entry point for phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md.
# Provides NumPy segmentation losses, mask metrics, and a U-Net shape trace on a deterministic shape fixture.
# It teaches the tensor contracts without pretending to train a PyTorch U-Net or a medical benchmark.
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


def synthetic_segmentation(
    num_samples: int = 12,
    size: int = 32,
    num_classes: int = 3,
    seed: int = 0,
) -> tuple[np.ndarray, np.ndarray]:
    num_samples, size, num_classes = (_positive_int(num_samples, "num_samples"), _positive_int(size, "size"), _positive_int(num_classes, "num_classes"))
    if num_classes < 2 or size < 12:
        raise ValueError("num_classes must be at least 2 and size at least 12")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    images = np.empty((num_samples, size, size, 3), dtype=np.float32)
    masks = np.zeros((num_samples, size, size), dtype=np.int64)
    yy, xx = np.meshgrid(np.arange(size), np.arange(size), indexing="ij")
    for index in range(num_samples):
        background = np.array([0.25, 0.65, 0.3], dtype=np.float32)
        image = np.broadcast_to(background, (size, size, 3)).copy()
        class_id = 1 + index % (num_classes - 1)
        cx = int(rng.integers(size // 3, size - size // 3))
        cy = int(rng.integers(size // 3, size - size // 3))
        radius = max(3, size // 6)
        if class_id % 2:
            shape = (xx - cx) ** 2 + (yy - cy) ** 2 <= radius ** 2
        else:
            shape = (np.abs(xx - cx) <= radius) & (np.abs(yy - cy) <= radius)
        color = np.zeros(3, dtype=np.float32)
        color[(class_id - 1) % 3] = 0.9
        image[shape] = color
        masks[index, shape] = class_id
        images[index] = np.clip(image + rng.normal(0, 0.02, image.shape), 0, 1)
    return images, masks


def softmax(logits: np.ndarray, axis: int = 1) -> np.ndarray:
    value = _finite(logits, "logits")
    if value.ndim < 2 or not isinstance(axis, Integral) or axis < -value.ndim or axis >= value.ndim or value.shape[axis] == 0:
        raise ValueError("logits must have a non-empty class axis")
    shifted = value - np.max(value, axis=axis, keepdims=True)
    exponent = np.exp(shifted)
    return (exponent / exponent.sum(axis=axis, keepdims=True)).astype(np.float64)


def _targets(targets: np.ndarray, n: int, height: int, width: int, num_classes: int) -> np.ndarray:
    value = np.asarray(targets)
    if value.shape != (n, height, width) or not np.issubdtype(value.dtype, np.integer):
        raise ValueError("targets must have integer shape (N,H,W)")
    if value.size == 0 or value.min() < 0 or value.max() >= num_classes:
        raise ValueError("target labels are outside num_classes")
    return value.astype(np.int64, copy=False)


def pixel_cross_entropy(logits: np.ndarray, targets: np.ndarray) -> float:
    value = _finite(logits, "logits")
    if value.ndim != 4 or value.shape[0] == 0 or value.shape[1] == 0 or value.shape[2] == 0 or value.shape[3] == 0:
        raise ValueError("logits must have non-empty NCHW shape")
    truth = _targets(targets, value.shape[0], value.shape[2], value.shape[3], value.shape[1])
    log_z = np.logaddexp.reduce(value, axis=1)
    picked = np.take_along_axis(value, truth[:, None], axis=1)[:, 0]
    return float(np.mean(log_z - picked))


def dice_loss(logits: np.ndarray, targets: np.ndarray, num_classes: int, eps: float = 1e-7) -> float:
    value = _finite(logits, "logits")
    if value.ndim != 4 or value.shape[1] != num_classes:
        raise ValueError("logits must have shape (N,num_classes,H,W)")
    num_classes = _positive_int(num_classes, "num_classes")
    if not isinstance(eps, Real) or not np.isfinite(eps) or eps <= 0:
        raise ValueError("eps must be positive and finite")
    truth = _targets(targets, value.shape[0], value.shape[2], value.shape[3], num_classes)
    probabilities = softmax(value, axis=1)
    one_hot = np.eye(num_classes, dtype=np.float64)[truth].transpose(0, 3, 1, 2)
    intersection = (probabilities * one_hot).sum(axis=(0, 2, 3))
    denominator = probabilities.sum(axis=(0, 2, 3)) + one_hot.sum(axis=(0, 2, 3))
    dice = (2 * intersection + float(eps)) / (denominator + float(eps))
    return float(1.0 - dice.mean())


def combined_loss(logits: np.ndarray, targets: np.ndarray, num_classes: int, lam: float = 1.0) -> tuple[float, dict[str, float]]:
    if not isinstance(lam, Real) or not np.isfinite(lam) or lam < 0:
        raise ValueError("lam must be finite and non-negative")
    ce = pixel_cross_entropy(logits, targets)
    dice = dice_loss(logits, targets, num_classes)
    return float(ce + float(lam) * dice), {"cross_entropy": ce, "dice_loss": dice}


def iou_per_class(predictions: np.ndarray, targets: np.ndarray, num_classes: int) -> np.ndarray:
    pred = _finite(predictions, "predictions")
    num_classes = _positive_int(num_classes, "num_classes")
    if pred.ndim == 4:
        if pred.shape[1] != num_classes:
            raise ValueError("logits class axis must equal num_classes")
        predicted = pred.argmax(axis=1)
    elif pred.ndim == 3:
        if not np.issubdtype(pred.dtype, np.integer):
            raise ValueError("integer masks or NCHW logits are required")
        predicted = pred.astype(np.int64)
    else:
        raise ValueError("predictions must be NCHW logits or NHW integer masks")
    truth = np.asarray(targets)
    if truth.shape != predicted.shape or not np.issubdtype(truth.dtype, np.integer):
        raise ValueError("targets must be an integer mask matching predictions")
    if predicted.size == 0 or predicted.min() < 0 or predicted.max() >= num_classes or truth.min() < 0 or truth.max() >= num_classes:
        raise ValueError("mask labels are outside num_classes")
    result = np.full(num_classes, np.nan, dtype=np.float64)
    for class_id in range(num_classes):
        predicted_class = predicted == class_id
        truth_class = truth == class_id
        union = np.logical_or(predicted_class, truth_class).sum()
        if union:
            result[class_id] = np.logical_and(predicted_class, truth_class).sum() / union
    return result


def _mean_filter(x: np.ndarray) -> np.ndarray:
    padded = np.pad(x, ((0, 0), (0, 0), (1, 1), (1, 1)), mode="edge")
    output = np.zeros_like(x, dtype=np.float64)
    for dy in range(3):
        for dx in range(3):
            output += padded[:, :, dy:dy + x.shape[2], dx:dx + x.shape[3]]
    return output / 9.0


def double_conv(x: np.ndarray) -> np.ndarray:
    """Shape-preserving two 3x3 local averages followed by ReLU; a tiny U-Net block analogue."""
    value = _finite(x, "x")
    if value.ndim != 4 or 0 in value.shape:
        raise ValueError("x must have a non-empty NCHW shape")
    return np.maximum(_mean_filter(np.maximum(_mean_filter(value), 0)), 0).astype(np.float32)


def unet_shape_trace(input_shape: tuple[int, int, int, int] = (1, 3, 64, 64), levels: int = 2, base: int = 16) -> list[tuple[str, tuple[int, ...]]]:
    if len(input_shape) != 4 or any(_positive_int(v, "input dimension") <= 0 for v in input_shape):
        raise ValueError("input_shape must be a non-empty NCHW tuple")
    levels = _positive_int(levels, "levels")
    base = _positive_int(base, "base")
    if input_shape[2] % (2 ** levels) or input_shape[3] % (2 ** levels):
        raise ValueError("height and width must be divisible by 2**levels")
    n, channels, height, width = input_shape
    trace = [("input", tuple(input_shape))]
    skips = []
    for level in range(levels):
        channels = base * (2 ** level)
        skips.append((channels, height, width))
        trace.append((f"encoder_{level + 1}", (n, channels, height, width)))
        height //= 2
        width //= 2
    trace.append(("bottleneck", (n, base * (2 ** levels), height, width)))
    for level in reversed(range(levels)):
        height *= 2
        width *= 2
        channels = base * (2 ** level)
        trace.append((f"decoder_{level + 1}_with_skip", (n, channels, height, width)))
    return trace


def main() -> int:
    images, masks = synthetic_segmentation(num_samples=4, size=32, seed=7)
    n, height, width, _ = images.shape
    logits = np.zeros((n, 3, height, width), dtype=np.float64)
    logits[:, 0] = 0.4
    logits[:, 1] = images[..., 0]
    logits[:, 2] = images[..., 2]
    total, parts = combined_loss(logits, masks, 3, lam=1.0)
    ious = iou_per_class(logits, masks, 3)
    print(f"fixture images={images.shape} masks={masks.shape} logits={logits.shape}")
    print(f"loss={total:.4f} parts={parts} iou={np.round(ious, 3).tolist()}")
    print("double_conv shape=", double_conv(logits).shape)
    print("shape trace=", unet_shape_trace((1, 3, 64, 64), levels=2, base=8))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
