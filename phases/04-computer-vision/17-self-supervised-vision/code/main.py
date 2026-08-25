# Self-Supervised Vision — SimCLR, DINO, MAE.
# Canonical PyTorch fixture for phases/04-computer-vision/17-self-supervised-vision/docs/en.md.
# It exposes InfoNCE, deterministic masking, and a compact DINO-style teacher/student head.
# No checkpoint, dataset, network, or unallowlisted package is required.

from __future__ import annotations

import math
from numbers import Integral, Real

import numpy as np
try:
    import torch
    import torch.nn.functional as F
    from torch import nn
    TORCH_AVAILABLE = True
except ModuleNotFoundError:  # Keep the canonical command finite when the optional dependency is absent.
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


def _no_grad(function):
    return torch.no_grad()(function) if TORCH_AVAILABLE else function


def _finite_positive(name: str, value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, Real) or not math.isfinite(float(value)) or float(value) <= 0:
        raise ValueError(f"{name} must be a finite positive real")
    return float(value)


def _features(name: str, value: object) -> torch.Tensor:
    if not isinstance(value, torch.Tensor) or value.ndim != 2 or value.shape[0] < 2 or value.shape[1] < 1:
        raise ValueError(f"{name} must be a 2-D tensor with at least two rows")
    if not torch.isfinite(value).all():
        raise ValueError(f"{name} must contain only finite values")
    if torch.any(torch.linalg.vector_norm(value, dim=1) == 0):
        raise ValueError(f"{name} cannot contain a zero feature vector")
    return value


def numpy_normalize(features: np.ndarray) -> np.ndarray:
    """Return unit-length rows for the executable NumPy Build-It path."""
    if not isinstance(features, np.ndarray) or features.ndim != 2 or features.shape[0] < 2 or features.shape[1] < 1:
        raise ValueError("features must be a 2-D array with at least two rows")
    if not np.isfinite(features).all():
        raise ValueError("features must be finite")
    values = features.astype(np.float64, copy=False)
    scale = np.max(np.abs(values), axis=1, keepdims=True)
    if np.any(scale == 0):
        raise ValueError("features cannot contain zero rows")
    scaled = values / scale
    unit_norm = np.sqrt(np.sum(scaled * scaled, axis=1, keepdims=True))
    if not np.isfinite(unit_norm).all() or np.any(unit_norm == 0):
        raise ValueError("features cannot be normalized to finite unit rows")
    normalized = scaled / unit_norm
    if not np.isfinite(normalized).all():
        raise ValueError("normalized features must remain finite")
    return normalized


def _numpy_logsumexp(values: np.ndarray, axis: int = -1) -> np.ndarray:
    maximum = np.max(values, axis=axis, keepdims=True)
    with np.errstate(over="ignore", invalid="ignore", divide="ignore", under="ignore"):
        shifted = values - maximum
        result = maximum + np.log(np.sum(np.exp(shifted), axis=axis, keepdims=True))
    if np.isnan(shifted).any() or not np.isfinite(result).all():
        raise ValueError("log-sum-exp inputs must remain numerically representable")
    return np.squeeze(result, axis=axis)


def numpy_info_nce(z1: np.ndarray, z2: np.ndarray, tau: float = 0.1) -> float:
    """Compute the symmetric two-view InfoNCE objective in NumPy."""
    z1 = numpy_normalize(z1)
    z2 = numpy_normalize(z2)
    if z1.shape != z2.shape:
        raise ValueError("z1 and z2 must have the same shape")
    tau = _finite_positive("tau", tau)
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        similarities = np.concatenate((z1, z2), axis=0) @ np.concatenate((z1, z2), axis=0).T / tau
    if not np.isfinite(similarities).all():
        raise ValueError("temperature-scaled similarities must remain finite")
    np.fill_diagonal(similarities, -np.inf)
    n = z1.shape[0]
    targets = np.concatenate((np.arange(n, 2 * n), np.arange(n)))
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        losses = -similarities[np.arange(2 * n), targets] + _numpy_logsumexp(similarities, axis=1)
        loss = np.mean(losses)
    if not np.isfinite(loss):
        raise ValueError("InfoNCE loss must remain finite")
    return float(loss)


def numpy_mask_indices(num_patches: int, mask_ratio: float = 0.75, seed: int = 0) -> tuple[np.ndarray, np.ndarray]:
    """Return sorted visible/masked patch IDs with deterministic NumPy sampling."""
    if isinstance(num_patches, bool) or not isinstance(num_patches, Integral) or int(num_patches) < 2:
        raise ValueError("num_patches must be an integer of at least 2")
    if isinstance(mask_ratio, bool) or not isinstance(mask_ratio, Real) or not math.isfinite(float(mask_ratio)) or not 0 <= float(mask_ratio) < 1:
        raise ValueError("mask_ratio must be finite and satisfy 0 <= mask_ratio < 1")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    permutation = np.random.default_rng(int(seed)).permutation(int(num_patches))
    n_keep = max(1, int(int(num_patches) * (1.0 - float(mask_ratio))))
    return np.sort(permutation[:n_keep]), np.sort(permutation[n_keep:])


def numpy_dino_teacher(logits: np.ndarray, centre: np.ndarray | None = None, temp: float = 0.04) -> np.ndarray:
    """Center and sharpen logits, then return detached teacher probabilities."""
    if not isinstance(logits, np.ndarray) or logits.ndim != 2 or logits.shape[0] < 1 or logits.shape[1] < 1:
        raise ValueError("logits must be a non-empty (N,K) array")
    if not np.isfinite(logits).all():
        raise ValueError("logits must be finite")
    temp = _finite_positive("teacher temperature", temp)
    if centre is None:
        centre = np.zeros(logits.shape[1], dtype=np.float64)
    if not isinstance(centre, np.ndarray) or centre.shape != (logits.shape[1],) or not np.isfinite(centre).all():
        raise ValueError("centre must be a finite vector matching the logit width")
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        shifted = (logits - centre) / temp
    if not np.isfinite(shifted).all():
        raise ValueError("centered and temperature-scaled logits must remain finite")
    with np.errstate(over="ignore", invalid="ignore", divide="ignore", under="ignore"):
        shifted -= shifted.max(axis=1, keepdims=True)
        probabilities = np.exp(shifted)
        probabilities = probabilities / probabilities.sum(axis=1, keepdims=True)
    if not np.isfinite(probabilities).all():
        raise ValueError("teacher probabilities must remain finite")
    return probabilities


def numpy_update_centre(centre: np.ndarray, logits: np.ndarray, momentum: float = 0.9) -> np.ndarray:
    """Apply the same bounded EMA center update as ``DinoHead``."""
    if isinstance(momentum, bool) or not isinstance(momentum, Real) or not math.isfinite(float(momentum)) or not 0 <= float(momentum) < 1:
        raise ValueError("momentum must be finite and satisfy 0 <= momentum < 1")
    if not isinstance(centre, np.ndarray) or not isinstance(logits, np.ndarray) or logits.ndim != 2 or centre.shape != (logits.shape[1],):
        raise ValueError("centre and logits have incompatible shapes")
    if not np.isfinite(centre).all() or not np.isfinite(logits).all() or logits.shape[0] < 1:
        raise ValueError("centre/logits must be finite and non-empty")
    values = logits.astype(np.float64, copy=False)
    column_scale = np.max(np.abs(values), axis=0)
    scaled = np.divide(values, column_scale, out=np.zeros_like(values), where=column_scale > 0)
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        column_mean = scaled.mean(axis=0) * column_scale
        updated = float(momentum) * centre + (1.0 - float(momentum)) * column_mean
    if not np.isfinite(column_mean).all() or not np.isfinite(updated).all():
        raise ValueError("centre update must remain finite")
    return updated


def info_nce(z1: torch.Tensor, z2: torch.Tensor, tau: float = 0.1) -> torch.Tensor:
    """Return symmetric InfoNCE for two equally sized views."""
    _require_torch()
    z1 = _features("z1", z1)
    z2 = _features("z2", z2)
    if z1.shape != z2.shape:
        raise ValueError("z1 and z2 must have the same shape")
    tau = _finite_positive("tau", tau)
    z = torch.cat([F.normalize(z1, dim=-1), F.normalize(z2, dim=-1)], dim=0)
    similarities = z @ z.T / tau
    if not torch.isfinite(similarities).all():
        raise ValueError("temperature-scaled similarities must remain finite")
    similarities.fill_diagonal_(float("-inf"))
    n = z1.shape[0]
    targets = torch.cat([torch.arange(n, 2 * n, device=z.device), torch.arange(n, device=z.device)])
    loss = F.cross_entropy(similarities, targets)
    if not torch.isfinite(loss):
        raise ValueError("InfoNCE loss must remain finite")
    return loss


def random_mask_indices(num_patches: int, mask_ratio: float = 0.75, seed: int = 0) -> tuple[torch.Tensor, torch.Tensor]:
    """Return sorted visible and masked indices for a reproducible MAE fixture."""
    _require_torch()
    if isinstance(num_patches, bool) or not isinstance(num_patches, Integral) or int(num_patches) < 2:
        raise ValueError("num_patches must be an integer of at least 2")
    if isinstance(mask_ratio, bool) or not isinstance(mask_ratio, Real) or not math.isfinite(float(mask_ratio)) or not 0 <= float(mask_ratio) < 1:
        raise ValueError("mask_ratio must be finite and satisfy 0 <= mask_ratio < 1")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    num_patches = int(num_patches)
    n_keep = max(1, int(num_patches * (1.0 - float(mask_ratio))))
    generator = torch.Generator().manual_seed(int(seed))
    permutation = torch.randperm(num_patches, generator=generator)
    return permutation[:n_keep].sort().values, permutation[n_keep:].sort().values


class DinoHead(nn.Module):
    """Small teacher/student head exposing centering, sharpening, and EMA state."""

    def __init__(self, in_dim: int = 64, out_dim: int = 128, momentum: float = 0.9) -> None:
        super().__init__()
        _require_torch()
        if isinstance(in_dim, bool) or not isinstance(in_dim, Integral) or int(in_dim) < 1:
            raise ValueError("in_dim must be a positive integer")
        if isinstance(out_dim, bool) or not isinstance(out_dim, Integral) or int(out_dim) < 1:
            raise ValueError("out_dim must be a positive integer")
        if isinstance(momentum, bool) or not isinstance(momentum, Real) or not math.isfinite(float(momentum)) or not 0 <= float(momentum) < 1:
            raise ValueError("momentum must be finite and satisfy 0 <= momentum < 1")
        self.in_dim = int(in_dim)
        self.out_dim = int(out_dim)
        self.proj = torch.nn.Linear(self.in_dim, self.out_dim)
        self.register_buffer("centre", torch.zeros(self.out_dim))
        self.momentum = float(momentum)

    def _check_input(self, x: torch.Tensor) -> torch.Tensor:
        if not isinstance(x, torch.Tensor) or x.ndim != 2 or x.shape[1] != self.in_dim or x.shape[0] < 1:
            raise ValueError(f"features must have shape (N,{self.in_dim}) with N > 0")
        if not torch.isfinite(x).all():
            raise ValueError("features must be finite")
        return x

    def student(self, x: torch.Tensor, temp: float = 0.1) -> torch.Tensor:
        temp = _finite_positive("student temperature", temp)
        logits = self.proj(self._check_input(x)) / temp
        if not torch.isfinite(logits).all():
            raise ValueError("student temperature-scaled logits must remain finite")
        return F.log_softmax(logits, dim=-1)

    @_no_grad
    def teacher(self, x: torch.Tensor, temp: float = 0.04) -> torch.Tensor:
        temp = _finite_positive("teacher temperature", temp)
        logits = (self.proj(self._check_input(x)) - self.centre) / temp
        if not torch.isfinite(logits).all():
            raise ValueError("centered teacher logits must remain finite")
        return F.softmax(logits, dim=-1)

    @_no_grad
    def update_centre(self, teacher_logits: torch.Tensor) -> None:
        if not isinstance(teacher_logits, torch.Tensor) or teacher_logits.ndim != 2 or teacher_logits.shape[1] != self.out_dim or teacher_logits.shape[0] < 1:
            raise ValueError(f"teacher_logits must have shape (N,{self.out_dim}) with N > 0")
        if not torch.isfinite(teacher_logits).all():
            raise ValueError("teacher_logits must be finite")
        self.centre.mul_(self.momentum).add_(teacher_logits.mean(dim=0), alpha=1.0 - self.momentum)


def main() -> None:
    rng = np.random.default_rng(0)
    z = rng.normal(size=(4, 8))
    visible, masked = numpy_mask_indices(16, 0.75, seed=4)
    teacher = numpy_dino_teacher(rng.normal(size=(4, 6)))
    print(
        f"[NumPy Build-It] info_nce={numpy_info_nce(z, z):.3f} "
        f"visible={len(visible)} masked={len(masked)} teacher_row_sum={teacher[0].sum():.3f}"
    )
    if not TORCH_AVAILABLE:
        print("PyTorch is unavailable; optional Use-It path skipped cleanly.")
        return
    torch.manual_seed(0)
    print("[InfoNCE]")
    z = F.normalize(torch.randn(16, 32), dim=-1)
    z_random = F.normalize(torch.randn(16, 32), dim=-1)
    print(f"  aligned loss: {info_nce(z, z).item():.3f}")
    print(f"  random loss:  {info_nce(z, z_random).item():.3f}  baseline~log(31)={math.log(31):.3f}")

    visible, masked = random_mask_indices(196, mask_ratio=0.75)
    print(f"[MAE mask] visible={len(visible)} masked={len(masked)} first_visible={visible[:5].tolist()}")

    head = DinoHead(in_dim=64, out_dim=16)
    features = torch.randn(64, 64)
    before = head.teacher(features)
    head.update_centre(head.proj(features))
    after = head.teacher(features)
    print(f"[DINO centre] max column mean before={before.mean(0).max().item():.3f} after={after.mean(0).max().item():.3f}")


if __name__ == "__main__":
    main()
