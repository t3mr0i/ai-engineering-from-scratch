# Entry point for phases/04-computer-vision/13-3d-vision-nerf/docs/en.md.
# Implements ray sampling, positional encoding, and finite-volume rendering with NumPy.
# The density/color fixture is an equation probe, not a trained NeRF or a point-cloud loader.
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


def positional_encoding(points: np.ndarray, levels: int = 6) -> np.ndarray:
    values = _finite(points, "points")
    levels = _positive_int(levels, "levels")
    if values.ndim < 1 or values.shape[-1] != 3 or values.size == 0:
        raise ValueError("points must have a non-empty final dimension of 3")
    frequencies = (2.0 ** np.arange(levels, dtype=np.float64)) * np.pi
    angles = values[..., None, :] * frequencies[None, :, None]
    encoded = np.concatenate((np.sin(angles), np.cos(angles)), axis=-2)
    return encoded.reshape(values.shape[:-1] + (3 * 2 * levels,))


def sample_ray_points(
    origins: np.ndarray,
    directions: np.ndarray,
    near: float,
    far: float,
    n_samples: int,
) -> tuple[np.ndarray, np.ndarray]:
    ray_origins, ray_directions = _finite(origins, "origins"), _finite(directions, "directions")
    if ray_origins.shape != ray_directions.shape or ray_origins.ndim != 2 or ray_origins.shape[1] != 3 or ray_origins.shape[0] == 0:
        raise ValueError("origins and directions must have matching non-empty (R,3) shapes")
    n_samples = _positive_int(n_samples, "n_samples")
    if not all(isinstance(v, Real) and np.isfinite(v) for v in (near, far)) or near < 0 or far <= near:
        raise ValueError("near and far must be finite with 0 <= near < far")
    t_vals = np.linspace(float(near), float(far), n_samples, dtype=np.float64)
    points = ray_origins[:, None, :] + ray_directions[:, None, :] * t_vals[None, :, None]
    return points, t_vals


def volume_render(
    sigma: np.ndarray,
    rgb: np.ndarray,
    t_vals: np.ndarray,
    background: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Composite finite ray samples using alpha and front-to-back transmittance."""
    density = _finite(sigma, "sigma")
    colors = _finite(rgb, "rgb")
    depths = _finite(t_vals, "t_vals")
    if density.ndim < 1 or density.shape[-1] < 2 or colors.shape != density.shape + (3,) or depths.ndim != 1 or len(depths) != density.shape[-1]:
        raise ValueError("sigma, rgb, and t_vals have incompatible ray-sample shapes")
    if np.any(density < 0) or np.any((colors < 0) | (colors > 1)) or np.any(np.diff(depths) <= 0):
        raise ValueError("sigma must be non-negative, rgb in [0,1], and t_vals strictly increasing")
    deltas = np.diff(depths)
    deltas = np.concatenate((deltas, deltas[-1:]))
    alpha = 1.0 - np.exp(-density * deltas)
    transmittance = np.cumprod(np.concatenate((np.ones(density.shape[:-1] + (1,)), 1.0 - alpha + 1e-12), axis=-1), axis=-1)[..., :-1]
    weights = alpha * transmittance
    rendered = np.sum(weights[..., None] * colors, axis=-2)
    depth = np.sum(weights * depths, axis=-1)
    if background is not None:
        backdrop = _finite(background, "background")
        if backdrop.shape != (3,) or np.any((backdrop < 0) | (backdrop > 1)):
            raise ValueError("background must be a finite RGB vector in [0,1]")
        rendered = rendered + (1.0 - weights.sum(axis=-1, keepdims=True)) * backdrop
    return rendered, depth, weights


def density_fixture(t_vals: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    depths = _finite(t_vals, "t_vals")
    if depths.ndim != 1 or len(depths) < 2 or np.any(np.diff(depths) <= 0):
        raise ValueError("t_vals must be an increasing one-dimensional ray")
    center = depths.mean()
    sigma = 4.0 * np.exp(-((depths - center) ** 2) / 0.08)
    rgb = np.stack((np.full(len(depths), 0.2), np.linspace(0.2, 0.8, len(depths)), np.full(len(depths), 0.9)), axis=-1)
    return sigma, rgb


def main() -> int:
    origins = np.array([[0.0, 0.0, 0.0]])
    directions = np.array([[0.0, 0.0, 1.0]])
    points, t_vals = sample_ray_points(origins, directions, 2.0, 6.0, 32)
    encoded = positional_encoding(points[0], levels=4)
    sigma, rgb = density_fixture(t_vals)
    rendered, depth, weights = volume_render(sigma, rgb, t_vals, background=np.array([0.0, 0.0, 0.0]))
    print(f"rays={origins.shape} samples={points.shape} encoded={encoded.shape}")
    print(f"rendered_rgb={rendered.round(4).tolist()} depth={float(depth[()]):.3f} weight_sum={float(weights.sum()):.3f}")
    print("note: density and color are a deterministic volume-rendering fixture, not a trained NeRF")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
