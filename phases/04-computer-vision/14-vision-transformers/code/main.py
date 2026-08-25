# NumPy Vision Transformer primitives for the Phase 04 Lesson 14 contract.
# Lesson docs: phases/04-computer-vision/14-vision-transformers/docs/en.md
# The artifact implements patching, attention, and shape checks without weights.
# It uses NumPy only; framework/model training is deliberately out of scope.

from __future__ import annotations

import math
from numbers import Real
from typing import Any

import numpy as np


def _positive_int(value: Any, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, np.integer)) or int(value) <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _finite(values: Any, name: str) -> np.ndarray:
    array = np.asarray(values, dtype=float)
    if not np.isfinite(array).all():
        raise ValueError(f"{name} must contain only finite values")
    return array


def patchify(images: Any, patch_size: int) -> np.ndarray:
    """Return flattened non-overlapping NCHW patches as ``(N, T, C*P*P)``."""
    size = _positive_int(patch_size, "patch_size")
    array = _finite(images, "images")
    if array.ndim != 4:
        raise ValueError("images must have shape (N, C, H, W)")
    n, channels, height, width = array.shape
    if min(n, channels, height, width) <= 0:
        raise ValueError("images must be non-empty")
    if height % size or width % size:
        raise ValueError("patch_size must divide both image axes")
    grid_h, grid_w = height // size, width // size
    blocks = array.reshape(n, channels, grid_h, size, grid_w, size)
    blocks = blocks.transpose(0, 2, 4, 1, 3, 5)
    return blocks.reshape(n, grid_h * grid_w, channels * size * size)


def linear_projection(tokens: Any, weight: Any, bias: Any) -> np.ndarray:
    """Apply a checked affine projection to the last token dimension."""
    values = _finite(tokens, "tokens")
    matrix = _finite(weight, "weight")
    offset = _finite(bias, "bias")
    if values.ndim < 2 or matrix.ndim != 2 or offset.ndim != 1:
        raise ValueError("tokens, weight, and bias have incompatible ranks")
    if matrix.shape[1] != values.shape[-1] or offset.shape[0] != matrix.shape[0]:
        raise ValueError("projection dimensions do not match")
    if values.shape[-1] == 0 or matrix.shape[0] == 0:
        raise ValueError("projection dimensions must be non-empty")
    return np.matmul(values, matrix.T) + offset


def layer_norm(values: Any, eps: float = 1e-5) -> np.ndarray:
    """Normalize each token over its last dimension."""
    array = _finite(values, "values")
    if array.ndim < 2 or array.shape[-1] <= 0:
        raise ValueError("values must have a non-empty feature dimension")
    if isinstance(eps, (bool, np.bool_)) or not isinstance(eps, Real):
        raise ValueError("eps must be finite and positive")
    epsilon = float(eps)
    if not math.isfinite(epsilon) or epsilon <= 0:
        raise ValueError("eps must be finite and positive")
    mean = array.mean(axis=-1, keepdims=True)
    variance = np.mean((array - mean) ** 2, axis=-1, keepdims=True)
    return (array - mean) / np.sqrt(variance + epsilon)


def softmax(values: Any, axis: int = -1) -> np.ndarray:
    """Compute a finite, max-shifted softmax."""
    array = _finite(values, "values")
    if array.ndim == 0 or isinstance(axis, (bool, np.bool_)) or not isinstance(axis, (int, np.integer)):
        raise ValueError("axis must be an integer for a non-scalar array")
    axis = int(axis)
    if axis < 0:
        axis += array.ndim
    if axis < 0 or axis >= array.ndim or array.shape[axis] == 0:
        raise ValueError("softmax needs a non-empty axis")
    shifted = array - np.max(array, axis=axis, keepdims=True)
    exponentials = np.exp(shifted)
    denominator = exponentials.sum(axis=axis, keepdims=True)
    if not np.isfinite(denominator).all() or np.any(denominator <= 0):
        raise ValueError("softmax normalization is not finite")
    return exponentials / denominator


def scaled_dot_product_attention(
    query: Any,
    key: Any,
    value: Any,
    mask: Any | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    """Return attention output and weights for ``(..., T, D)`` tensors."""
    q = _finite(query, "query")
    k = _finite(key, "key")
    v = _finite(value, "value")
    if q.ndim < 3 or k.ndim < 3 or v.ndim < 3:
        raise ValueError("query, key, and value need batch, sequence, and feature axes")
    if q.shape[:-2] != k.shape[:-2] or q.shape[:-2] != v.shape[:-2]:
        raise ValueError("leading attention dimensions must match")
    if q.shape[-1] != k.shape[-1] or q.shape[-1] == 0 or q.shape[-2] == 0 or k.shape[-2] == 0:
        raise ValueError("query/key sequence and head dimensions are incompatible")
    if v.shape[-2] != k.shape[-2] or v.shape[-1] == 0:
        raise ValueError("value sequence dimension must match key")
    scores = np.matmul(q, np.swapaxes(k, -1, -2)) / math.sqrt(q.shape[-1])
    if mask is not None:
        visible = np.asarray(mask)
        if visible.dtype != bool:
            raise ValueError("attention mask must be boolean")
        try:
            visible = np.broadcast_to(visible, scores.shape)
        except ValueError as exc:
            raise ValueError("attention mask does not broadcast to score shape") from exc
        if np.any(~visible.any(axis=-1)):
            raise ValueError("each query must have at least one visible key")
        scores = np.where(visible, scores, np.finfo(float).min)
    weights = softmax(scores, axis=-1)
    return np.matmul(weights, v), weights


def add_cls_token(patch_tokens: Any, cls_token: Any) -> np.ndarray:
    """Prepend one class token to each ``(N, T, D)`` patch sequence."""
    patches = _finite(patch_tokens, "patch_tokens")
    cls = _finite(cls_token, "cls_token")
    if (patches.ndim != 3 or patches.shape[0] == 0 or patches.shape[1] == 0 or
            patches.shape[2] == 0):
        raise ValueError("patch_tokens must have shape (N, T, D) with N,T > 0")
    if cls.ndim == 1:
        cls = np.broadcast_to(cls, (patches.shape[0], 1, patches.shape[2]))
    elif cls.shape == (1, 1, patches.shape[2]):
        cls = np.broadcast_to(cls, (patches.shape[0], 1, patches.shape[2]))
    elif cls.shape != (patches.shape[0], 1, patches.shape[2]):
        raise ValueError("cls_token must have shape (D,), (1,1,D), or (N,1,D)")
    return np.concatenate([cls, patches], axis=1)


def sinusoidal_positions(length: int, dim: int) -> np.ndarray:
    """Create deterministic sinusoidal positions with shape ``(length, dim)``."""
    count = _positive_int(length, "length")
    width = _positive_int(dim, "dim")
    if width % 2:
        raise ValueError("dim must be even for paired sine/cosine positions")
    positions = np.arange(count, dtype=float)[:, None]
    frequencies = np.exp(np.arange(0, width, 2, dtype=float) * (-math.log(10000.0) / width))
    result = np.zeros((count, width), dtype=float)
    result[:, 0::2] = np.sin(positions * frequencies)
    result[:, 1::2] = np.cos(positions * frequencies)
    return result


def vit_forward(
    images: Any,
    patch_size: int = 8,
    dim: int = 24,
    num_heads: int = 3,
    num_classes: int = 4,
    seed: int = 0,
) -> dict[str, np.ndarray]:
    """Run one deterministic, untrained ViT-style encoder block."""
    patches = patchify(images, patch_size)
    width = _positive_int(dim, "dim")
    heads = _positive_int(num_heads, "num_heads")
    classes = _positive_int(num_classes, "num_classes")
    if width % heads:
        raise ValueError("dim must be divisible by num_heads")
    if isinstance(seed, bool) or not isinstance(seed, (int, np.integer)):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    projection = rng.normal(0.0, 1.0 / math.sqrt(patches.shape[-1]), (width, patches.shape[-1]))
    projected = linear_projection(patches, projection, np.zeros(width))
    cls = rng.normal(0.0, 0.02, width)
    tokens = add_cls_token(projected, cls)
    tokens = tokens + sinusoidal_positions(tokens.shape[1], width)[None, :, :]
    tokens = layer_norm(tokens)
    head_dim = width // heads
    heads_in = tokens.reshape(tokens.shape[0], tokens.shape[1], heads, head_dim).transpose(0, 2, 1, 3)
    attended, attention = scaled_dot_product_attention(heads_in, heads_in, heads_in)
    attended = attended.transpose(0, 2, 1, 3).reshape(tokens.shape)
    encoded = layer_norm(tokens + attended)
    classifier = rng.normal(0.0, 1.0 / math.sqrt(width), (classes, width))
    logits = linear_projection(encoded[:, 0, :], classifier, np.zeros(classes))
    return {"patches": patches, "tokens": encoded, "attention": attention, "logits": logits}


def main() -> None:
    rng = np.random.default_rng(7)
    images = rng.normal(size=(2, 3, 32, 32))
    result = vit_forward(images, patch_size=8, dim=24, num_heads=3, num_classes=4, seed=7)
    print(f"[shapes] input {images.shape} -> patches {result['patches'].shape}")
    print(f"[shapes] tokens with CLS: {result['tokens'].shape}")
    print(f"[shapes] attention: {result['attention'].shape}")
    print(f"[shapes] logits: {result['logits'].shape}")
    print(f"[attention] first row sum: {result['attention'][0, 0, 0].sum():.4f}")
    print("[scope] NumPy forward fixture; no pretrained weights or framework training run")


if __name__ == "__main__":
    main()
