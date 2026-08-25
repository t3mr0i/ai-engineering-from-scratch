# Entry point for phases/04-computer-vision/05-transfer-learning/docs/en.md.
# Uses a deterministic NumPy feature extractor to make freeze-the-backbone and train-the-head contracts concrete.
# It deliberately downloads no weights: the feature vector is a local stand-in, not an ImageNet benchmark.
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


def synthetic_dataset(
    num_per_class: int = 20,
    num_classes: int = 3,
    size: int = 16,
    seed: int = 0,
) -> tuple[np.ndarray, np.ndarray]:
    num_per_class = _positive_int(num_per_class, "num_per_class")
    num_classes = _positive_int(num_classes, "num_classes")
    size = _positive_int(size, "size")
    if size < 2:
        raise ValueError("size must be at least 2 so both edge-feature axes are non-empty")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    yy, xx = np.meshgrid(np.linspace(0, 1, size), np.linspace(0, 1, size), indexing="ij")
    images, labels = [], []
    for class_id in range(num_classes):
        center = np.zeros(3, dtype=np.float64)
        center[class_id % 3] = 0.75
        center[(class_id + 1) % 3] = 0.2
        for _ in range(num_per_class):
            texture = 0.08 * np.stack((xx, yy, xx - yy), axis=-1)
            image = np.clip(center + texture + rng.normal(0, 0.015, (size, size, 3)), 0, 1)
            images.append(image.astype(np.float32))
            labels.append(class_id)
    order = rng.permutation(len(images))
    return np.stack(images)[order], np.asarray(labels, dtype=np.int64)[order]


def backbone_features(images: np.ndarray) -> np.ndarray:
    """Extract fixed features a frozen vision backbone could expose."""
    value = _finite(images, "images")
    if (value.ndim != 4 or value.shape[-1] != 3 or 0 in value.shape
            or value.shape[1] < 2 or value.shape[2] < 2):
        raise ValueError("images must have non-empty NHWC shape with H and W at least 2")
    means = value.mean(axis=(1, 2))
    stds = value.std(axis=(1, 2))
    horizontal = np.abs(np.diff(value, axis=2)).mean(axis=(1, 2))
    vertical = np.abs(np.diff(value, axis=1)).mean(axis=(1, 2))
    return np.concatenate((means, stds, horizontal, vertical), axis=1).astype(np.float64)


def init_head(in_features: int, num_classes: int, seed: int = 0) -> tuple[np.ndarray, np.ndarray]:
    in_features = _positive_int(in_features, "in_features")
    num_classes = _positive_int(num_classes, "num_classes")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    return rng.normal(0, 0.01, (num_classes, in_features)), np.zeros(num_classes, dtype=np.float64)


def linear_logits(features: np.ndarray, weights: np.ndarray, bias: np.ndarray) -> np.ndarray:
    x = _finite(features, "features")
    w = _finite(weights, "weights")
    b = _finite(bias, "bias")
    if x.ndim != 2 or w.ndim != 2 or b.shape != (w.shape[0],) or x.shape[1] != w.shape[1]:
        raise ValueError("features, weights, and bias have incompatible shapes")
    return (x @ w.T + b).astype(np.float64)


def softmax(logits: np.ndarray) -> np.ndarray:
    value = _finite(logits, "logits")
    if value.ndim != 2 or value.shape[0] == 0 or value.shape[1] == 0:
        raise ValueError("logits must have non-empty (N,C) shape")
    shifted = value - value.max(axis=1, keepdims=True)
    probabilities = np.exp(shifted)
    return probabilities / probabilities.sum(axis=1, keepdims=True)


def cross_entropy(logits: np.ndarray, labels: np.ndarray) -> float:
    value = _finite(logits, "logits")
    target = np.asarray(labels)
    if value.ndim != 2 or target.ndim != 1 or target.size != value.shape[0] or not np.issubdtype(target.dtype, np.integer):
        raise ValueError("logits must be (N,C) and labels integer (N,)")
    if target.size == 0 or target.min() < 0 or target.max() >= value.shape[1]:
        raise ValueError("labels are outside the class range")
    log_z = np.logaddexp.reduce(value, axis=1)
    return float(np.mean(log_z - value[np.arange(len(target)), target]))


def train_head(
    features: np.ndarray,
    labels: np.ndarray,
    num_classes: int,
    epochs: int = 60,
    lr: float = 0.8,
    seed: int = 0,
) -> tuple[np.ndarray, np.ndarray, list[float]]:
    x = _finite(features, "features")
    if x.ndim != 2 or x.shape[0] == 0 or x.shape[1] == 0:
        raise ValueError("features must have non-empty (N,F) shape")
    y = np.asarray(labels)
    num_classes = _positive_int(num_classes, "num_classes")
    if y.ndim != 1 or len(y) != len(x) or not np.issubdtype(y.dtype, np.integer) or y.min() < 0 or y.max() >= num_classes:
        raise ValueError("labels must be integer, non-empty, and inside the class range")
    epochs = _positive_int(epochs, "epochs")
    if not isinstance(lr, Real) or not np.isfinite(lr) or lr <= 0:
        raise ValueError("lr must be positive and finite")
    weights, bias = init_head(x.shape[1], num_classes, seed)
    one_hot = np.eye(num_classes)[y]
    history: list[float] = []
    for _ in range(epochs):
        logits = linear_logits(x, weights, bias)
        history.append(cross_entropy(logits, y))
        gradient = (softmax(logits) - one_hot) / len(x)
        weights -= float(lr) * gradient.T @ x
        bias -= float(lr) * gradient.sum(axis=0)
    return weights, bias, history


def freeze_mask(total_params: int, trainable_indices: list[int] | tuple[int, ...]) -> np.ndarray:
    total_params = _positive_int(total_params, "total_params")
    indices = np.asarray(trainable_indices)
    if indices.ndim != 1 or not np.issubdtype(indices.dtype, np.integer) or np.any(indices < 0) or np.any(indices >= total_params):
        raise ValueError("trainable_indices must be integer indices within total_params")
    mask = np.zeros(total_params, dtype=bool)
    mask[indices] = True
    return mask


def parameter_counts(backbone_params: int, head_params: int, freeze_backbone: bool = True) -> dict[str, int | bool]:
    backbone_params = _positive_int(backbone_params, "backbone_params")
    head_params = _positive_int(head_params, "head_params")
    if not isinstance(freeze_backbone, (bool, np.bool_)):
        raise ValueError("freeze_backbone must be boolean")
    return {
        "backbone": backbone_params,
        "head": head_params,
        "total": backbone_params + head_params,
        "trainable": head_params if freeze_backbone else backbone_params + head_params,
        "backbone_frozen": bool(freeze_backbone),
    }


def discriminative_lrs(stages: list[str] | tuple[str, ...], base_lr: float = 1e-3, decay: float = 0.3) -> dict[str, float]:
    if not stages or any(not isinstance(stage, str) or not stage.strip() for stage in stages):
        raise ValueError("stages must be a non-empty sequence of names")
    if not isinstance(base_lr, Real) or not np.isfinite(base_lr) or base_lr <= 0:
        raise ValueError("base_lr must be positive and finite")
    if not isinstance(decay, Real) or not np.isfinite(decay) or not 0 < decay <= 1:
        raise ValueError("decay must lie in (0,1]")
    return {stage: float(base_lr) * float(decay) ** (len(stages) - 1 - index) for index, stage in enumerate(stages)}


def main() -> int:
    images, labels = synthetic_dataset(num_per_class=20, num_classes=3, size=12, seed=5)
    features = backbone_features(images)
    weights, bias, history = train_head(features, labels, num_classes=3, epochs=60, lr=0.8, seed=1)
    counts = parameter_counts(1_000_000, int(weights.size + bias.size), freeze_backbone=True)
    groups = discriminative_lrs(["stem", "stage1", "stage2", "head"], base_lr=1e-3)
    prediction = np.argmax(linear_logits(features, weights, bias), axis=1)
    print(f"frozen-backbone fixture: images={images.shape} features={features.shape}")
    print(f"parameters={counts} head_loss={history[0]:.4f}->{history[-1]:.4f} accuracy={np.mean(prediction == labels):.3f}")
    print("discriminative_lrs=", {key: f"{value:.2e}" for key, value in groups.items()})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
