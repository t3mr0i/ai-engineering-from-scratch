# Entry point for phases/04-computer-vision/01-image-fundamentals/docs/en.md.
# Builds deterministic NumPy image fixtures without PIL, network access, or hidden decoding.
# Every transform states its HWC/CHW, dtype, and value-range contract explicitly.
# Run from this directory with: python3 main.py

from __future__ import annotations

import math
from numbers import Real
from typing import Sequence

import numpy as np


IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def _rgb_hwc(image: np.ndarray, name: str = "image") -> np.ndarray:
    array = np.asarray(image)
    if array.ndim != 3 or array.shape[2] != 3 or array.shape[0] == 0 or array.shape[1] == 0:
        raise ValueError(f"{name} must have non-empty HWC shape (H,W,3)")
    if not np.issubdtype(array.dtype, np.number) or not np.isfinite(array).all():
        raise ValueError(f"{name} must contain finite numeric values")
    if float(array.min()) < 0.0 or float(array.max()) > 255.0:
        raise ValueError(f"{name} values must lie in [0,255]")
    return array


def synthetic_image(height: int = 8, width: int = 8, seed: int = 0) -> np.ndarray:
    """Return a deterministic uint8 HWC RGB fixture with a visible gradient."""
    height = _positive_int(height, "height")
    width = _positive_int(width, "width")
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(seed)
    yy, xx = np.meshgrid(
        np.linspace(0.0, 1.0, height), np.linspace(0.0, 1.0, width), indexing="ij"
    )
    rgb = np.stack((xx, yy, (1.0 - xx) * yy), axis=-1) * 255.0
    rgb += rng.normal(0.0, 2.0, size=(height, width, 3))
    return np.clip(np.rint(rgb), 0, 255).astype(np.uint8)


def inspect_image(image: np.ndarray, label: str = "image") -> dict[str, object]:
    array = _rgb_hwc(image, label)
    return {
        "label": label,
        "shape": tuple(int(value) for value in array.shape),
        "dtype": str(array.dtype),
        "min": float(array.min()),
        "max": float(array.max()),
        "mean": array.reshape(-1, 3).mean(axis=0).round(3).tolist(),
    }


def hwc_to_chw(image: np.ndarray) -> np.ndarray:
    return np.ascontiguousarray(_rgb_hwc(image).transpose(2, 0, 1))


def chw_to_hwc(image: np.ndarray) -> np.ndarray:
    array = np.asarray(image)
    if array.ndim != 3 or array.shape[0] != 3 or array.shape[1] == 0 or array.shape[2] == 0:
        raise ValueError("image must have non-empty CHW shape (3,H,W)")
    if not np.issubdtype(array.dtype, np.number) or not np.isfinite(array).all():
        raise ValueError("image must contain finite numeric values")
    return np.ascontiguousarray(array.transpose(1, 2, 0))


def rgb_to_grayscale(rgb: np.ndarray) -> np.ndarray:
    array = _rgb_hwc(rgb)
    weights = np.array([0.299, 0.587, 0.114], dtype=np.float32)
    return (array.astype(np.float32) @ weights).astype(np.float32)


def rgb_to_hsv(rgb: np.ndarray) -> np.ndarray:
    array = _rgb_hwc(rgb).astype(np.float32) / 255.0
    r, g, b = array[..., 0], array[..., 1], array[..., 2]
    cmax = np.max(array, axis=-1)
    cmin = np.min(array, axis=-1)
    delta = cmax - cmin
    hue = np.zeros_like(cmax)
    nonzero = delta > 0
    max_channel = np.argmax(array, axis=-1)
    red = nonzero & (max_channel == 0)
    green = nonzero & (max_channel == 1)
    blue = nonzero & (max_channel == 2)
    hue[red] = ((g[red] - b[red]) / delta[red]) % 6.0
    hue[green] = (b[green] - r[green]) / delta[green] + 2.0
    hue[blue] = (r[blue] - g[blue]) / delta[blue] + 4.0
    hue *= 60.0
    saturation = np.divide(delta, cmax, out=np.zeros_like(delta), where=cmax > 0)
    return np.stack((hue, saturation, cmax), axis=-1).astype(np.float32)


def preprocess_imagenet(rgb_uint8: np.ndarray) -> np.ndarray:
    array = _rgb_hwc(rgb_uint8).astype(np.float32) / 255.0
    return ((array - IMAGENET_MEAN) / IMAGENET_STD).transpose(2, 0, 1).astype(np.float32)


def deprocess_imagenet(chw_float32: np.ndarray) -> np.ndarray:
    array = np.asarray(chw_float32)
    if array.ndim != 3 or array.shape[0] != 3 or array.shape[1] == 0 or array.shape[2] == 0:
        raise ValueError("input must have non-empty CHW shape (3,H,W)")
    if not np.isfinite(array).all():
        raise ValueError("input must be finite")
    hwc = array.transpose(1, 2, 0) * IMAGENET_STD + IMAGENET_MEAN
    return np.clip(np.rint(hwc * 255.0), 0, 255).astype(np.uint8)


def resize_nearest(image: np.ndarray, height: int, width: int) -> np.ndarray:
    height = _positive_int(height, "height")
    width = _positive_int(width, "width")
    array = np.asarray(image)
    if array.ndim not in (2, 3) or array.shape[0] == 0 or array.shape[1] == 0:
        raise ValueError("image must have non-empty HW or HWC shape")
    rows = np.minimum((np.arange(height) * array.shape[0] / height).astype(int), array.shape[0] - 1)
    cols = np.minimum((np.arange(width) * array.shape[1] / width).astype(int), array.shape[1] - 1)
    return np.ascontiguousarray(array[rows[:, None], cols[None, :]])


def local_roughness(image: np.ndarray) -> float:
    array = np.asarray(image)
    if array.ndim not in (2, 3) or array.shape[0] < 2 or array.shape[1] < 2:
        raise ValueError("image needs at least 2x2 spatial dimensions")
    if not np.isfinite(array).all():
        raise ValueError("image must be finite")
    return float(np.abs(np.diff(array.astype(np.float32), axis=0)).mean() + np.abs(np.diff(array.astype(np.float32), axis=1)).mean())


def main() -> int:
    raw = synthetic_image(8, 10, seed=7)
    print(f"raw={inspect_image(raw)}")
    chw = hwc_to_chw(raw)
    print(f"layout HWC={raw.shape} CHW={chw.shape} roundtrip={np.array_equal(chw_to_hwc(chw), raw)}")
    hsv = rgb_to_hsv(raw)
    print(f"gray_shape={rgb_to_grayscale(raw).shape} hsv_ranges=({hsv[...,0].min():.1f},{hsv[...,1].max():.2f},{hsv[...,2].max():.2f})")
    normalized = preprocess_imagenet(raw)
    restored = deprocess_imagenet(normalized)
    print(f"normalized_shape={normalized.shape} roundtrip_max_error={int(np.abs(restored.astype(int)-raw.astype(int)).max())}")
    enlarged = resize_nearest(raw, 16, 20)
    print(f"nearest_shape={enlarged.shape} roughness={local_roughness(enlarged):.3f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
