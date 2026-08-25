# Entry point for phases/04-computer-vision/12-video-understanding/docs/en.md.
# Implements temporal sampling, feature pooling, 2D-to-3D kernel inflation, and split contracts with NumPy.
# The fixture exposes video axes without torchvision weights, a network download, or a framework model.
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


def sample_uniform(num_frames_total: int, T: int) -> np.ndarray:
    total, count = _positive_int(num_frames_total, "num_frames_total"), _positive_int(T, "T")
    if total <= count:
        return np.concatenate((np.arange(total), np.full(count - total, total - 1))).astype(np.int64)
    indices = np.floor(np.arange(count) * total / count).astype(np.int64)
    return np.minimum(indices, total - 1)


def sample_dense(num_frames_total: int, T: int, rng: np.random.Generator | None = None) -> np.ndarray:
    total, count = _positive_int(num_frames_total, "num_frames_total"), _positive_int(T, "T")
    if total <= count:
        return np.concatenate((np.arange(total), np.full(count - total, total - 1))).astype(np.int64)
    if rng is not None and not isinstance(rng, np.random.Generator):
        raise ValueError("rng must be a numpy.random.Generator or None")
    generator = np.random.default_rng() if rng is None else rng
    start = int(generator.integers(0, total - count + 1))
    return np.arange(start, start + count, dtype=np.int64)


def temporal_pool(features: np.ndarray, indices: np.ndarray | None = None) -> np.ndarray:
    values = _finite(features, "features")
    if (values.ndim not in (2, 3) or values.shape[-2] == 0 or
            values.shape[-1] == 0 or (values.ndim == 3 and values.shape[0] == 0)):
        raise ValueError("features must have shape (T,D) or (N,T,D)")
    count = values.shape[-2]
    if indices is None:
        selected = np.arange(count)
    else:
        selected = np.asarray(indices)
        if selected.ndim != 1 or selected.size == 0 or not np.issubdtype(selected.dtype, np.integer):
            raise ValueError("indices must be a non-empty integer vector")
        if np.any((selected < 0) | (selected >= count)):
            raise ValueError("indices are outside the feature sequence")
    return values[..., selected, :].mean(axis=-2)


def inflate_kernel_2d(kernel: np.ndarray, time_kernel: int = 3) -> np.ndarray:
    weights = _finite(kernel, "kernel")
    time_kernel = _positive_int(time_kernel, "time_kernel")
    if weights.ndim != 4 or 0 in weights.shape:
        raise ValueError("kernel must have non-empty (out,in,height,width) shape")
    return np.repeat(weights[:, :, None, :, :], time_kernel, axis=2) / time_kernel


def conv2plus1d_parameter_count(
    in_channels: int,
    out_channels: int,
    spatial_kernel: int = 3,
    time_kernel: int = 3,
    mid_channels: int | None = None,
) -> dict[str, int]:
    in_channels = _positive_int(in_channels, "in_channels")
    out_channels = _positive_int(out_channels, "out_channels")
    spatial_kernel = _positive_int(spatial_kernel, "spatial_kernel")
    time_kernel = _positive_int(time_kernel, "time_kernel")
    if mid_channels is None:
        mid_channels = max(1, (in_channels * out_channels * spatial_kernel * spatial_kernel * time_kernel)
                           // (in_channels * spatial_kernel * spatial_kernel + out_channels * time_kernel))
    mid_channels = _positive_int(mid_channels, "mid_channels")
    spatial = in_channels * mid_channels * spatial_kernel * spatial_kernel
    temporal = mid_channels * out_channels * time_kernel
    return {"mid_channels": mid_channels, "spatial": spatial, "temporal": temporal, "total": spatial + temporal}


def temporal_split(num_frames: int, train_fraction: float = 0.8) -> tuple[np.ndarray, np.ndarray]:
    total = _positive_int(num_frames, "num_frames")
    if (total < 2 or isinstance(train_fraction, (bool, np.bool_)) or
            not isinstance(train_fraction, Real) or not np.isfinite(train_fraction) or
            not 0 < train_fraction < 1):
        raise ValueError("num_frames must be at least 2 and train_fraction must lie in (0,1)")
    boundary = int(np.floor(total * float(train_fraction)))
    boundary = min(max(boundary, 1), total - 1)
    indices = np.arange(total, dtype=np.int64)
    return indices[:boundary], indices[boundary:]


def synthetic_video(num_frames: int = 12, height: int = 8, width: int = 10, seed: int = 0) -> np.ndarray:
    num_frames = _positive_int(num_frames, "num_frames")
    height, width = _positive_int(height, "height"), _positive_int(width, "width")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    video = rng.normal(0, 0.01, (num_frames, height, width, 1))
    for t in range(num_frames):
        left = t % max(width - 2, 1)
        video[t, height // 2 - 1:height // 2 + 1, left:left + 2, 0] += 1.0
    return video


def main() -> int:
    uniform = sample_uniform(30, 8)
    dense = sample_dense(30, 8, np.random.default_rng(4))
    features = np.arange(8 * 4, dtype=float).reshape(8, 4)
    pooled = temporal_pool(features, uniform[:4] % 8)
    kernel = inflate_kernel_2d(np.ones((4, 3, 3, 3)), time_kernel=3)
    counts = conv2plus1d_parameter_count(3, 16, mid_channels=8)
    train, test = temporal_split(30, 0.8)
    print(f"uniform={uniform.tolist()} dense={dense.tolist()}")
    print(f"features={features.shape} pooled={pooled.shape} inflated_kernel={kernel.shape} params={counts}")
    print(f"temporal_split train={train[[0,-1]].tolist()} test={test[[0,-1]].tolist()}")
    print("note: no pretrained frame backbone is loaded; temporal axes and leakage boundary are the artifact")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
