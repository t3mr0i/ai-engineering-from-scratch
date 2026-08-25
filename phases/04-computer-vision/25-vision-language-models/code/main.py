"""NumPy-first vision-language projection, classification, and routing seams."""

# Build-It implementation for phases/04-computer-vision/25-vision-language-models.
# The local artifact makes projection, pooling, cross-entropy, and CMER measurable.
# A pretrained VLM is an optional Use-It backend; this lesson downloads no weights.
# Run from this directory with: python3 main.py

from __future__ import annotations

import numpy as np


def _finite(value: object, *, name: str, ndim: int | None = None) -> np.ndarray:
    raw = np.asarray(value)
    if raw.dtype.kind == "b" or any(isinstance(item, (bool, np.bool_)) for item in np.asarray(value, dtype=object).reshape(-1)):
        raise ValueError(f"{name} must be numeric, not boolean")
    array = np.asarray(value, dtype=np.float64)
    if ndim is not None and array.ndim != ndim:
        raise ValueError(f"{name} must have {ndim} dimensions")
    if array.size == 0 or not np.all(np.isfinite(array)):
        raise ValueError(f"{name} must be non-empty and finite")
    return array


def _row_normalize(value: object, *, name: str) -> np.ndarray:
    array = _finite(value, name=name, ndim=2)
    scale = np.max(np.abs(array), axis=1, keepdims=True)
    if np.any(scale == 0.0):
        raise ValueError(f"{name} cannot contain zero rows")
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        scaled = array / scale
        norm = np.sqrt(np.sum(scaled * scaled, axis=1, keepdims=True))
        result = scaled / norm
    if not np.all(np.isfinite(result)):
        raise ValueError(f"{name} normalization was not finite")
    return result


def project_visual_tokens(tokens: object, output_dim: int = 64, seed: int = 0) -> np.ndarray:
    """Project ``(N, patches, vision_width)`` into a language width deterministically."""
    array = _finite(tokens, name="tokens", ndim=3)
    if isinstance(output_dim, bool) or not isinstance(output_dim, (int, np.integer)) or output_dim <= 0:
        raise ValueError("output_dim must be a positive integer")
    rng = np.random.default_rng(seed)
    weights = rng.normal(0.0, 1.0 / np.sqrt(array.shape[-1]), size=(array.shape[-1], int(output_dim)))
    projected = array @ weights
    if not np.all(np.isfinite(projected)):
        raise ValueError("projection produced a non-finite tensor")
    return projected


def mean_pool_tokens(projected: object) -> np.ndarray:
    array = _finite(projected, name="projected", ndim=3)
    return array.mean(axis=1)


def classify_logits(pooled: object, weights: object, bias: object) -> np.ndarray:
    features = _finite(pooled, name="pooled", ndim=2)
    matrix = _finite(weights, name="weights", ndim=2)
    offset = _finite(bias, name="bias", ndim=1)
    if matrix.shape[0] != features.shape[1] or offset.shape != (matrix.shape[1],):
        raise ValueError("classifier dimensions do not match")
    with np.errstate(over="ignore", invalid="ignore"):
        logits = features @ matrix + offset
    if not np.all(np.isfinite(logits)):
        raise ValueError("classifier produced non-finite logits")
    return logits


def cross_entropy_loss(logits: object, targets: object) -> float:
    """Compute mean multiclass CE using a max-shifted log-sum-exp."""
    scores = _finite(logits, name="logits", ndim=2)
    labels = np.asarray(targets)
    if labels.ndim != 1 or labels.shape[0] != scores.shape[0] or labels.dtype.kind not in "iu" or labels.dtype.kind == "b":
        raise ValueError("targets must be a one-dimensional integer array matching the batch")
    if np.any((labels < 0) | (labels >= scores.shape[1])):
        raise ValueError("target class is outside the logits columns")
    row_max = np.max(scores, axis=1, keepdims=True)
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        shifted = scores - row_max
        logsumexp = row_max[:, 0] + np.log(np.exp(shifted).sum(axis=1))
    loss = float(np.mean(logsumexp - scores[np.arange(scores.shape[0]), labels.astype(int)]))
    if not np.isfinite(loss):
        raise ValueError("cross-entropy was not finite")
    return loss


def deepstack_features(per_layer_features: list[object]) -> np.ndarray:
    """Concatenate same-grid features from multiple vision depths along the width."""
    if not isinstance(per_layer_features, list) or not per_layer_features:
        raise ValueError("at least one feature layer is required")
    arrays = [_finite(value, name="layer", ndim=3) for value in per_layer_features]
    if any(array.shape[:2] != arrays[0].shape[:2] for array in arrays[1:]):
        raise ValueError("all feature layers must share batch and patch dimensions")
    return np.concatenate(arrays, axis=-1)


def cross_modal_error_rate(
    image_embeddings: object,
    text_embeddings: object,
    text_confidence: object,
    sim_threshold: float = 0.25,
    conf_threshold: float = 0.8,
) -> float:
    """Fraction of high-confidence pairs whose cosine similarity is below the gate."""
    image = _row_normalize(image_embeddings, name="image_embeddings")
    text = _row_normalize(text_embeddings, name="text_embeddings")
    confidence = _finite(text_confidence, name="text_confidence", ndim=1)
    if image.shape != text.shape or confidence.shape != (image.shape[0],):
        raise ValueError("embedding and confidence shapes must agree")
    if (
        isinstance(sim_threshold, bool) or isinstance(conf_threshold, bool)
        or not isinstance(sim_threshold, (int, float, np.number))
        or not isinstance(conf_threshold, (int, float, np.number))
        or not np.isfinite(sim_threshold) or not np.isfinite(conf_threshold)
        or not -1.0 <= sim_threshold <= 1.0 or not 0.0 <= conf_threshold <= 1.0
        or np.any((confidence < 0.0) | (confidence > 1.0))
    ):
        raise ValueError("thresholds must be finite and confidence threshold must be in [0, 1]")
    similarity = np.sum(image * text, axis=1)
    flagged = (confidence > conf_threshold) & (similarity < sim_threshold)
    return float(np.mean(flagged))


def synthetic_vision_class_data(
    num_classes: int = 5,
    num_patches: int = 16,
    vision_width: int = 32,
    per_class: int = 8,
    seed: int = 0,
) -> tuple[np.ndarray, np.ndarray]:
    """Make class-prototype token sequences for an offline VLM fixture."""
    values = (num_classes, num_patches, vision_width, per_class)
    if any(isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value <= 0 for value in values):
        raise ValueError("dataset dimensions must be positive integers")
    rng = np.random.default_rng(seed)
    prototypes = rng.normal(size=(num_classes, vision_width))
    examples, labels = [], []
    for label in range(num_classes):
        for _ in range(per_class):
            examples.append(prototypes[label][None, :] + 0.1 * rng.normal(size=(num_patches, vision_width)))
            labels.append(label)
    return np.asarray(examples, dtype=np.float64), np.asarray(labels, dtype=np.int64)


def main() -> None:
    tokens, labels = synthetic_vision_class_data(num_classes=3, per_class=4, seed=4)
    projected = project_visual_tokens(tokens, output_dim=12, seed=4)
    pooled = mean_pool_tokens(projected)
    rng = np.random.default_rng(9)
    logits = classify_logits(pooled, rng.normal(size=(12, 3)), np.zeros(3))
    layers = deepstack_features([tokens, tokens * 0.5, tokens * 0.25])
    image = np.eye(4, dtype=np.float64)
    text = np.array(((1.0, 0.0, 0.0, 0.0), (0.0, 1.0, 0.0, 0.0), (-1.0, 0.0, 0.0, 0.0), (0.0, -1.0, 0.0, 0.0)))
    cmer = cross_modal_error_rate(image, text, np.full(4, 0.9))
    print("[vision-language Build-It]")
    print(f"tokens={tokens.shape} projected={projected.shape} pooled={pooled.shape} CE={cross_entropy_loss(logits, labels):.3f}")
    print(f"DeepStack layers=3 -> {layers.shape}; CMER={cmer:.2f} at similarity<0.25/confidence>0.8")


if __name__ == "__main__":
    main()
