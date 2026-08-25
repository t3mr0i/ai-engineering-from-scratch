# Entry point for phases/04-computer-vision/04-image-classification/docs/en.md.
# Builds a small NumPy image-classification fixture with stable losses and reproducible augmentations.
# It demonstrates data contracts, mixup, and reporting without claiming CIFAR or framework benchmark scores.
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


def _labels(labels: np.ndarray, n: int, num_classes: int | None = None) -> np.ndarray:
    value = np.asarray(labels)
    if value.ndim != 1 or len(value) != n or not np.issubdtype(value.dtype, np.integer):
        raise ValueError("labels must be a one-dimensional integer array matching the data")
    if len(value) == 0:
        raise ValueError("labels must not be empty")
    if num_classes is not None and (value.min() < 0 or value.max() >= num_classes):
        raise ValueError("labels are outside the class range")
    return value.astype(np.int64, copy=False)


def synthetic_cifar(
    num_per_class: int = 30,
    num_classes: int = 3,
    size: int = 16,
    seed: int = 0,
) -> tuple[np.ndarray, np.ndarray]:
    """Create small HWC [0,1] color/texture classes; this is not the CIFAR dataset."""
    num_per_class = _positive_int(num_per_class, "num_per_class")
    num_classes = _positive_int(num_classes, "num_classes")
    size = _positive_int(size, "size")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    yy, xx = np.meshgrid(np.linspace(0, 1, size), np.linspace(0, 1, size), indexing="ij")
    images: list[np.ndarray] = []
    labels: list[int] = []
    for class_id in range(num_classes):
        angle = 2 * np.pi * class_id / max(num_classes, 1)
        center = np.clip(0.5 + 0.35 * np.array([np.cos(angle), np.sin(angle), np.cos(angle + 1.2)]), 0, 1)
        for _ in range(num_per_class):
            pattern = np.stack(
                [np.sin((class_id + 2) * np.pi * xx),
                 np.cos((class_id + 2) * np.pi * yy),
                 np.sin((class_id + 1) * np.pi * (xx + yy))], axis=-1
            ) * 0.08
            image = np.clip(center + pattern + rng.normal(0, 0.02, (size, size, 3)), 0, 1)
            images.append(image.astype(np.float32))
            labels.append(class_id)
    order = rng.permutation(len(images))
    return np.stack(images)[order], np.asarray(labels, dtype=np.int64)[order]


def standardize(images: np.ndarray, mean: np.ndarray | list[float], std: np.ndarray | list[float]) -> np.ndarray:
    value = _finite(images, "images")
    if value.ndim != 4 or value.shape[-1] != 3 or 0 in value.shape:
        raise ValueError("images must have non-empty NHWC shape with 3 channels")
    mean, std = _finite(mean, "mean"), _finite(std, "std")
    if mean.shape != (3,) or std.shape != (3,) or np.any(std <= 0):
        raise ValueError("mean and std must have shape (3,), with positive std")
    return ((value - mean.reshape(1, 1, 1, 3)) / std.reshape(1, 1, 1, 3)).astype(np.float32)


def _rng_or_default(rng: np.random.Generator | None) -> np.random.Generator:
    return np.random.default_rng() if rng is None else rng


def random_hflip(image: np.ndarray, p: float = 0.5, rng: np.random.Generator | None = None) -> np.ndarray:
    value = _finite(image, "image")
    if value.ndim != 3 or value.shape[2] != 3 or 0 in value.shape:
        raise ValueError("image must have non-empty HWC shape with 3 channels")
    if not isinstance(p, Real) or not np.isfinite(p) or not 0 <= p <= 1:
        raise ValueError("p must lie in [0,1]")
    return value[:, ::-1, :].copy() if _rng_or_default(rng).random() < p else value.copy()


def random_crop(image: np.ndarray, pad: int = 2, rng: np.random.Generator | None = None) -> np.ndarray:
    value = _finite(image, "image")
    if value.ndim != 3 or value.shape[2] != 3 or 0 in value.shape:
        raise ValueError("image must have non-empty HWC shape with 3 channels")
    if isinstance(pad, bool) or not isinstance(pad, Integral) or int(pad) < 0:
        raise ValueError("pad must be a non-negative integer")
    pad = int(pad)
    if pad == 0:
        return value.copy()
    padded = np.pad(value, ((pad, pad), (pad, pad), (0, 0)), mode="reflect")
    generator = _rng_or_default(rng)
    top = int(generator.integers(0, 2 * pad + 1))
    left = int(generator.integers(0, 2 * pad + 1))
    return padded[top:top + value.shape[0], left:left + value.shape[1]].copy()


def compose(*transforms):
    if not transforms or any(not callable(transform) for transform in transforms):
        raise ValueError("compose needs at least one callable transform")

    def apply(image: np.ndarray) -> np.ndarray:
        result = image
        for transform in transforms:
            result = transform(result)
        return result

    return apply


def softmax(logits: np.ndarray, axis: int = -1) -> np.ndarray:
    value = _finite(logits, "logits")
    if value.ndim == 0:
        raise ValueError("logits must have at least one dimension")
    if not isinstance(axis, Integral) or axis < -value.ndim or axis >= value.ndim:
        raise ValueError("axis is outside logits dimensions")
    shifted = value - np.max(value, axis=axis, keepdims=True)
    exp = np.exp(shifted)
    return (exp / exp.sum(axis=axis, keepdims=True)).astype(np.float64)


def cross_entropy(logits: np.ndarray, targets: np.ndarray) -> float:
    value = _finite(logits, "logits")
    if value.ndim != 2 or value.shape[0] == 0 or value.shape[1] == 0:
        raise ValueError("logits must have non-empty (N,C) shape")
    target = np.asarray(targets)
    if target.ndim == 1:
        labels = _labels(target, value.shape[0], value.shape[1])
        log_z = np.logaddexp.reduce(value, axis=1)
        return float(np.mean(log_z - value[np.arange(len(labels)), labels]))
    if target.shape != value.shape or not np.issubdtype(target.dtype, np.number) or not np.isfinite(target).all():
        raise ValueError("soft targets must have the same finite (N,C) shape")
    if np.any(target < 0) or not np.allclose(target.sum(axis=1), 1.0):
        raise ValueError("each soft target row must be non-negative and sum to one")
    log_probs = value - np.logaddexp.reduce(value, axis=1, keepdims=True)
    return float(-np.mean(np.sum(target * log_probs, axis=1)))


def mixup_batch(
    x: np.ndarray,
    y: np.ndarray,
    num_classes: int,
    alpha: float = 0.2,
    rng: np.random.Generator | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    features = _finite(x, "x")
    if features.ndim < 2 or features.shape[0] == 0:
        raise ValueError("x must have a non-empty batch dimension")
    num_classes = _positive_int(num_classes, "num_classes")
    labels = _labels(y, features.shape[0], num_classes)
    if not isinstance(alpha, Real) or not np.isfinite(alpha) or alpha <= 0:
        raise ValueError("alpha must be positive and finite")
    generator = _rng_or_default(rng)
    lam = float(generator.beta(alpha, alpha))
    permutation = generator.permutation(features.shape[0])
    one_hot = np.eye(num_classes, dtype=np.float64)[labels]
    mixed_x = lam * features + (1.0 - lam) * features[permutation]
    mixed_y = lam * one_hot + (1.0 - lam) * one_hot[permutation]
    return mixed_x.astype(np.float32), mixed_y.astype(np.float32)


def image_features(images: np.ndarray) -> np.ndarray:
    value = _finite(images, "images")
    if value.ndim != 4 or value.shape[-1] != 3 or 0 in value.shape:
        raise ValueError("images must have non-empty NHWC shape with 3 channels")
    means = value.mean(axis=(1, 2))
    stds = value.std(axis=(1, 2))
    return np.concatenate((means, stds), axis=1).astype(np.float64)


def train_linear_classifier(
    features: np.ndarray,
    labels: np.ndarray,
    num_classes: int,
    epochs: int = 80,
    lr: float = 0.5,
    seed: int = 0,
) -> tuple[np.ndarray, np.ndarray, list[float]]:
    x = _finite(features, "features")
    if x.ndim != 2 or x.shape[0] == 0 or x.shape[1] == 0:
        raise ValueError("features must have non-empty (N,F) shape")
    num_classes = _positive_int(num_classes, "num_classes")
    y = _labels(labels, x.shape[0], num_classes)
    epochs = _positive_int(epochs, "epochs")
    if not isinstance(lr, Real) or not np.isfinite(lr) or lr <= 0:
        raise ValueError("lr must be positive and finite")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    weights = rng.normal(0, 0.01, (num_classes, x.shape[1]))
    bias = np.zeros(num_classes, dtype=np.float64)
    history: list[float] = []
    one_hot = np.eye(num_classes)[y]
    for _ in range(epochs):
        logits = x @ weights.T + bias
        probabilities = softmax(logits)
        history.append(cross_entropy(logits, y))
        gradient = (probabilities - one_hot) / x.shape[0]
        weights -= float(lr) * gradient.T @ x
        bias -= float(lr) * gradient.sum(axis=0)
    return weights, bias, history


def confusion_matrix(targets: np.ndarray, predictions: np.ndarray, num_classes: int) -> np.ndarray:
    target = np.asarray(targets)
    pred = np.asarray(predictions)
    num_classes = _positive_int(num_classes, "num_classes")
    if target.ndim != 1 or pred.ndim != 1 or target.size == 0 or target.size != pred.size:
        raise ValueError("targets and predictions must be non-empty, equal-length vectors")
    target = _labels(target, len(target), num_classes)
    pred = _labels(pred, len(pred), num_classes)
    matrix = np.zeros((num_classes, num_classes), dtype=np.int64)
    np.add.at(matrix, (target, pred), 1)
    return matrix


def per_class_report(matrix: np.ndarray) -> dict[str, np.ndarray]:
    cm = np.asarray(matrix)
    if cm.ndim != 2 or cm.shape[0] == 0 or cm.shape[0] != cm.shape[1]:
        raise ValueError("matrix must be a non-empty square confusion matrix")
    if cm.dtype == np.bool_ or not np.issubdtype(cm.dtype, np.integer):
        raise ValueError("matrix must contain integer counts, not booleans or fractions")
    if not np.isfinite(cm).all() or np.any(cm < 0):
        raise ValueError("matrix counts must be finite and non-negative")
    cm = cm.astype(np.float64)
    tp = np.diag(cm)
    precision = np.divide(tp, cm.sum(axis=0), out=np.zeros_like(tp), where=cm.sum(axis=0) > 0)
    recall = np.divide(tp, cm.sum(axis=1), out=np.zeros_like(tp), where=cm.sum(axis=1) > 0)
    f1 = np.divide(2 * precision * recall, precision + recall,
                   out=np.zeros_like(tp), where=(precision + recall) > 0)
    return {"precision": precision, "recall": recall, "f1": f1}


def main() -> int:
    images, labels = synthetic_cifar(num_per_class=24, num_classes=3, size=12, seed=4)
    features = image_features(images)
    weights, bias, history = train_linear_classifier(features, labels, 3, epochs=60, lr=0.8, seed=2)
    predictions = np.argmax(features @ weights.T + bias, axis=1)
    matrix = confusion_matrix(labels, predictions, 3)
    report = per_class_report(matrix)
    print(f"fixture NHWC={images.shape} features={features.shape} classes={np.unique(labels).tolist()}")
    print(f"linear loss: first={history[0]:.4f} last={history[-1]:.4f} accuracy={np.mean(predictions == labels):.3f}")
    print("confusion_matrix=\n", matrix)
    print("macro_f1=", float(report["f1"].mean()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
