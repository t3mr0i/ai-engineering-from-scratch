# Keypoint Detection & Pose Estimation.
# Canonical PyTorch/NumPy fixture for phases/04-computer-vision/21-keypoint-pose/docs/en.md.
# It generates Gaussian heatmaps, predicts K channels, and decodes integer/sub-pixel coordinates offline.
# The four-point synthetic task is an executable contract, not a production pose benchmark.

from __future__ import annotations

import math
from numbers import Integral, Real

import numpy as np
try:
    import torch
    from torch import nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ModuleNotFoundError:  # The canonical command reports the optional dependency and exits normally.
    torch = None  # type: ignore[assignment]
    F = None  # type: ignore[assignment]
    TORCH_AVAILABLE = False

    class _UnavailableModule:
        pass

    class _UnavailableNN:
        Module = _UnavailableModule

    nn = _UnavailableNN()  # type: ignore[assignment]


def _require_torch() -> None:
    if not TORCH_AVAILABLE:
        raise RuntimeError("PyTorch is unavailable; install the allowlisted optional dependency to run this fixture")


def _positive_int(name: str, value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) < 1:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _valid_sigma(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, Real) or not math.isfinite(float(value)) or float(value) <= 0:
        raise ValueError("sigma must be a finite positive real")
    sigma = float(value)
    with np.errstate(over="ignore", under="ignore", invalid="ignore"):
        sigma_sq = sigma * sigma
    if not math.isfinite(sigma_sq) or sigma_sq <= 0:
        raise ValueError("sigma must have a finite, representable positive square")
    return sigma


def gaussian_heatmap(size: int, cx: float, cy: float, sigma: float = 2.0) -> np.ndarray:
    size = _positive_int("size", size)
    if size < 2:
        raise ValueError("size must be at least 2")
    if isinstance(cx, bool) or not isinstance(cx, Real) or not math.isfinite(float(cx)) or not 0 <= float(cx) <= size - 1:
        raise ValueError("cx must be a finite coordinate inside the heatmap")
    if isinstance(cy, bool) or not isinstance(cy, Real) or not math.isfinite(float(cy)) or not 0 <= float(cy) <= size - 1:
        raise ValueError("cy must be a finite coordinate inside the heatmap")
    sigma = _valid_sigma(sigma)
    yy, xx = np.meshgrid(np.arange(size, dtype=np.float32), np.arange(size, dtype=np.float32), indexing="ij")
    sigma_sq = sigma * sigma
    return np.exp(-((xx - float(cx)) ** 2 + (yy - float(cy)) ** 2) / (2 * sigma_sq)).astype(np.float32)


def numpy_heatmap_to_coords(heatmaps: np.ndarray) -> np.ndarray:
    """Decode NumPy ``(N,K,H,W)`` heatmaps into ``(N,K,2)`` x/y coordinates."""
    if not isinstance(heatmaps, np.ndarray) or heatmaps.ndim != 4 or min(heatmaps.shape) < 1 or not np.isfinite(heatmaps).all():
        raise ValueError("heatmaps must be a non-empty finite (N,K,H,W) array")
    _, _, _, width = heatmaps.shape
    indices = heatmaps.reshape(heatmaps.shape[0], heatmaps.shape[1], -1).argmax(axis=-1)
    y, x = indices // width, indices % width
    return np.stack((x, y), axis=-1).astype(np.float32)


def numpy_subpixel_refine(heatmaps: np.ndarray) -> np.ndarray:
    """Apply the same bounded first-difference correction as the Torch decoder."""
    heatmaps = np.asarray(heatmaps)
    coords = numpy_heatmap_to_coords(heatmaps)
    _, _, height, width = heatmaps.shape
    refined = coords.copy()
    for batch in range(heatmaps.shape[0]):
        for keypoint in range(heatmaps.shape[1]):
            x, y = coords[batch, keypoint].astype(int)
            if 0 < x < width - 1:
                refined[batch, keypoint, 0] += 0.25 * np.sign(heatmaps[batch, keypoint, y, x + 1] - heatmaps[batch, keypoint, y, x - 1])
            if 0 < y < height - 1:
                refined[batch, keypoint, 1] += 0.25 * np.sign(heatmaps[batch, keypoint, y + 1, x] - heatmaps[batch, keypoint, y - 1, x])
    return refined


class TinyKeypointNet(nn.Module):
    def __init__(self, num_keypoints: int = 4, base: int = 16) -> None:
        super().__init__()
        _require_torch()
        self.num_keypoints = _positive_int("num_keypoints", num_keypoints)
        base = _positive_int("base", base)
        self.down1 = nn.Sequential(nn.Conv2d(3, base, 3, 2, 1), nn.ReLU(inplace=True))
        self.down2 = nn.Sequential(nn.Conv2d(base, base * 2, 3, 2, 1), nn.ReLU(inplace=True))
        self.mid = nn.Sequential(nn.Conv2d(base * 2, base * 2, 3, 1, 1), nn.ReLU(inplace=True))
        self.up1 = nn.ConvTranspose2d(base * 2, base, 2, 2)
        self.up2 = nn.ConvTranspose2d(base, self.num_keypoints, 2, 2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if not isinstance(x, torch.Tensor) or x.ndim != 4 or x.shape[0] < 1 or x.shape[1] != 3 or min(x.shape[2:]) < 4 or any(int(axis) % 4 for axis in x.shape[2:]):
            raise ValueError("input must be non-empty (N,3,H,W) with H and W divisible by 4")
        if not torch.isfinite(x).all():
            raise ValueError("input must be finite")
        h1 = self.down1(x)
        h2 = self.down2(h1)
        h3 = self.mid(h2)
        return self.up2(self.up1(h3))


def _heatmaps(value: object) -> torch.Tensor:
    _require_torch()
    if not isinstance(value, torch.Tensor) or value.ndim != 4 or min(value.shape) < 1:
        raise ValueError("heatmaps must be a non-empty (N,K,H,W) tensor")
    if not torch.isfinite(value).all():
        raise ValueError("heatmaps must be finite")
    return value


def heatmap_to_coords(heatmaps: torch.Tensor) -> torch.Tensor:
    _require_torch()
    heatmaps = _heatmaps(heatmaps)
    _, _, _, width = heatmaps.shape
    flat = heatmaps.reshape(heatmaps.shape[0], heatmaps.shape[1], -1)
    indices = flat.argmax(dim=-1)
    y = (indices // width).float()
    x = (indices % width).float()
    return torch.stack([x, y], dim=-1)


def subpixel_refine(heatmaps: torch.Tensor) -> torch.Tensor:
    """Apply a bounded ±0.25 first-difference offset away from heatmap borders."""
    _require_torch()
    heatmaps = _heatmaps(heatmaps)
    _, _, height, width = heatmaps.shape
    coords = heatmap_to_coords(heatmaps)
    refined = coords.clone()
    for batch in range(heatmaps.shape[0]):
        for keypoint in range(heatmaps.shape[1]):
            x, y = (int(coords[batch, keypoint, 0]), int(coords[batch, keypoint, 1]))
            if 0 < x < width - 1:
                refined[batch, keypoint, 0] += 0.25 * torch.sign(heatmaps[batch, keypoint, y, x + 1] - heatmaps[batch, keypoint, y, x - 1])
            if 0 < y < height - 1:
                refined[batch, keypoint, 1] += 0.25 * torch.sign(heatmaps[batch, keypoint, y + 1, x] - heatmaps[batch, keypoint, y - 1, x])
    return refined


def make_synthetic_sample(size: int = 64, rng: np.random.Generator | None = None) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    size = _positive_int("size", size)
    if size < 24:
        raise ValueError("size must be at least 24 so four-pixel markers fit inside the sampling range")
    if rng is None:
        rng = np.random.default_rng()
    if not isinstance(rng, np.random.Generator):
        raise ValueError("rng must be a NumPy Generator or None")
    image = np.ones((3, size, size), dtype=np.float32)
    keypoints = rng.integers(10, size - 10, size=(4, 2))
    for cx, cy in keypoints:
        image[:, cy - 2 : cy + 2, cx - 2 : cx + 2] = 0.0
    heatmaps = np.stack([gaussian_heatmap(size, int(cx), int(cy)) for cx, cy in keypoints])
    return image, heatmaps, keypoints.astype(np.float32)


def main() -> None:
    _, target_heatmaps, points = make_synthetic_sample(24, np.random.default_rng(0))
    integer = numpy_heatmap_to_coords(target_heatmaps[None])[0]
    refined = numpy_subpixel_refine(target_heatmaps[None])[0]
    integer_error = float(np.linalg.norm(integer - points, axis=1).mean())
    refined_error = float(np.linalg.norm(refined - points, axis=1).mean())
    print(
        f"[NumPy Build-It] target_shape={target_heatmaps.shape} "
        f"mean_argmax_error={integer_error:.3f}px mean_subpixel_error={refined_error:.3f}px"
    )
    if not TORCH_AVAILABLE:
        print("PyTorch is unavailable; optional Use-It path skipped cleanly.")
        return
    torch.manual_seed(0)
    rng = np.random.default_rng(0)
    model = TinyKeypointNet(num_keypoints=4)
    optimizer = torch.optim.Adam(model.parameters(), lr=3e-3)
    for step in range(60):
        batch = [make_synthetic_sample(rng=rng) for _ in range(8)]
        images = torch.from_numpy(np.stack([item[0] for item in batch]))
        targets = torch.from_numpy(np.stack([item[1] for item in batch]))
        prediction = model(images)
        loss = F.mse_loss(prediction, targets)
        optimizer.zero_grad(); loss.backward(); optimizer.step()
        if step % 20 == 0:
            print(f"step {step:2d} mse={loss.item():.5f}")
    model.eval()
    with torch.no_grad():
        evaluation = [make_synthetic_sample(rng=rng) for _ in range(8)]
        images = torch.from_numpy(np.stack([item[0] for item in evaluation]))
        ground_truth = torch.from_numpy(np.stack([item[2] for item in evaluation]))
        predicted_heatmaps = model(images)
        integer = heatmap_to_coords(predicted_heatmaps)
        refined = subpixel_refine(predicted_heatmaps)
    print(f"mean L2 error argmax={torch.linalg.vector_norm(integer - ground_truth, dim=-1).mean().item():.3f}px")
    print(f"mean L2 error subpixel={torch.linalg.vector_norm(refined - ground_truth, dim=-1).mean().item():.3f}px")


if __name__ == "__main__":
    main()
