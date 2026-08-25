"""NumPy-first patch tokens and rectified-flow equations."""

# Build-It implementation for phases/04-computer-vision/23-diffusion-transformers-rectified-flow.
# It makes patch geometry and the straight interpolation path observable offline.
# A transformer or checkpoint is an optional Use-It implementation, not required here.
# Run from this directory with: python3 main.py

from __future__ import annotations

import math
from typing import Callable

import numpy as np


def _finite(value: object, *, name: str, ndim: int | None = None) -> np.ndarray:
    raw = np.asarray(value)
    if raw.dtype.kind == "b" or any(isinstance(item, (bool, np.bool_)) for item in np.asarray(value, dtype=object).reshape(-1)):
        raise ValueError(f"{name} must be numeric, not boolean")
    arr = np.asarray(value, dtype=np.float64)
    if ndim is not None and arr.ndim != ndim:
        raise ValueError(f"{name} must have {ndim} dimensions")
    if arr.size == 0 or not np.all(np.isfinite(arr)):
        raise ValueError(f"{name} must be non-empty and finite")
    return arr


def _positive_int(value: object, *, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def timestep_embedding(t: object, dim: int) -> np.ndarray:
    """Return sinusoidal embeddings with shape ``(batch, dim)``."""
    dim = _positive_int(dim, name="dim")
    if dim % 2:
        raise ValueError("dim must be even")
    times = _finite(t, name="t", ndim=1)
    half = dim // 2
    frequencies = np.exp(-math.log(10000.0) * np.arange(half, dtype=np.float64) / half)
    arguments = times[:, None] * frequencies[None, :]
    return np.concatenate((np.sin(arguments), np.cos(arguments)), axis=1)


def patchify(image: object, patch_size: int = 2) -> np.ndarray:
    """Convert NCHW images into ``(N, patches, C*patch_size**2)`` tokens."""
    image_arr = _finite(image, name="image", ndim=4)
    patch_size = _positive_int(patch_size, name="patch_size")
    n, channels, height, width = image_arr.shape
    if height % patch_size or width % patch_size:
        raise ValueError("image height and width must be divisible by patch_size")
    rows, cols = height // patch_size, width // patch_size
    tokens = image_arr.reshape(n, channels, rows, patch_size, cols, patch_size)
    return tokens.transpose(0, 2, 4, 1, 3, 5).reshape(n, rows * cols, channels * patch_size * patch_size)


def unpatchify(tokens: object, image_shape: tuple[int, int, int, int], patch_size: int = 2) -> np.ndarray:
    """Invert :func:`patchify` for a known NCHW image shape."""
    token_arr = _finite(tokens, name="tokens", ndim=3)
    patch_size = _positive_int(patch_size, name="patch_size")
    if not isinstance(image_shape, tuple) or len(image_shape) != 4:
        raise ValueError("image_shape must be (N, C, H, W)")
    n, channels, height, width = image_shape
    if any(isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value <= 0 for value in image_shape):
        raise ValueError("image_shape dimensions must be positive integers")
    rows, cols = height // patch_size, width // patch_size
    if height % patch_size or width % patch_size or token_arr.shape != (n, rows * cols, channels * patch_size * patch_size):
        raise ValueError("tokens do not match image_shape and patch_size")
    return token_arr.reshape(n, rows, cols, channels, patch_size, patch_size).transpose(0, 3, 1, 4, 2, 5).reshape(image_shape)


def rectified_flow_path(x0: object, noise: object, t: object) -> tuple[np.ndarray, np.ndarray]:
    """Return ``x_t=(1-t)x0+t noise`` and its constant velocity ``noise-x0``."""
    start = _finite(x0, name="x0")
    endpoint = _finite(noise, name="noise")
    if start.shape != endpoint.shape or start.ndim < 1:
        raise ValueError("x0 and noise must have the same non-empty shape")
    raw_times = np.asarray(t)
    if raw_times.dtype.kind == "b":
        raise ValueError("t must be numeric, not boolean")
    times = np.asarray(t, dtype=np.float64)
    if times.ndim == 0:
        times = np.full((start.shape[0],), float(times))
    if times.ndim != 1 or times.shape[0] != start.shape[0] or not np.all(np.isfinite(times)):
        raise ValueError("t must be one finite value per batch item")
    if np.any((times < 0.0) | (times > 1.0)):
        raise ValueError("t must lie in [0, 1]")
    weights = times.reshape((times.shape[0],) + (1,) * (start.ndim - 1))
    with np.errstate(over="ignore", invalid="ignore"):
        point = (1.0 - weights) * start + weights * endpoint
        velocity = endpoint - start
    if not np.all(np.isfinite(point)) or not np.all(np.isfinite(velocity)):
        raise ValueError("flow calculation produced a non-finite value")
    return point, velocity


def euler_reverse_sample(
    x1: object,
    velocity_fn: Callable[[float, np.ndarray], np.ndarray],
    steps: int = 20,
) -> np.ndarray:
    """Integrate a velocity field from ``t=1`` to ``t=0`` with explicit Euler."""
    state = _finite(x1, name="x1").copy()
    steps = _positive_int(steps, name="steps")
    dt = 1.0 / steps
    for index in range(steps):
        time = 1.0 - index * dt
        velocity = _finite(velocity_fn(time, state), name="velocity")
        if velocity.shape != state.shape:
            raise ValueError("velocity_fn must preserve the state shape")
        with np.errstate(over="ignore", invalid="ignore"):
            state -= dt * velocity
    if not np.all(np.isfinite(state)):
        raise ValueError("Euler integration produced a non-finite sample")
    return state


def synthetic_blobs(num: int = 32, size: int = 16, seed: int = 0) -> np.ndarray:
    """Make deterministic RGB blob images in ``[-1, 1]`` for a local fixture."""
    num = _positive_int(num, name="num")
    size = _positive_int(size, name="size")
    if size < 8:
        raise ValueError("size must be at least 8 so a blob has room")
    rng = np.random.default_rng(seed)
    output = np.zeros((num, 3, size, size), dtype=np.float64)
    yy, xx = np.meshgrid(np.arange(size), np.arange(size), indexing="ij")
    for index in range(num):
        cx, cy = rng.uniform(3.0, size - 3.0, size=2)
        radius = rng.uniform(1.5, min(4.0, size / 3.0))
        colour = rng.uniform(-1.0, 1.0, size=3)
        mask = (xx - cx) ** 2 + (yy - cy) ** 2 <= radius * radius
        output[index, :, mask] = colour[None, :]
    return output


def main() -> None:
    images = synthetic_blobs(num=4, size=16, seed=7)
    tokens = patchify(images, patch_size=2)
    restored = unpatchify(tokens, images.shape, patch_size=2)
    x0 = np.zeros((2, 3), dtype=np.float64)
    noise = np.ones_like(x0)
    point, velocity = rectified_flow_path(x0, noise, np.array([0.25, 0.75]))
    sampled = euler_reverse_sample(noise, lambda _t, _x: np.ones_like(_x), steps=4)
    print("[DiT/rectified-flow Build-It]")
    print(f"blob fixture={images.shape} patch tokens={tokens.shape} roundtrip_max={np.max(np.abs(restored - images)):.1e}")
    print(f"path t=[.25,.75] values={point[:, 0].round(3).tolist()} velocity={velocity[0, 0]:.1f}")
    print(f"reverse Euler constant field steps=4 final={sampled[0, 0]:.3f}")
    print(f"time embedding shape={timestep_embedding(np.array([0.0, 0.5]), 8).shape}")


if __name__ == "__main__":
    main()
