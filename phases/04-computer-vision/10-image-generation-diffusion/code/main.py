# Entry point for phases/04-computer-vision/10-image-generation-diffusion/docs/en.md.
# Implements a NumPy forward schedule, q_sample, posterior mean, and deterministic DDIM-style step.
# The arrays expose diffusion algebra without a U-Net, framework trainer, checkpoint, or image claim.
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


def linear_beta_schedule(T: int = 1000, beta_start: float = 1e-4, beta_end: float = 2e-2) -> np.ndarray:
    T = _positive_int(T, "T")
    if T < 2:
        raise ValueError("T must be at least 2 for a reverse step")
    if any(isinstance(v, (bool, np.bool_)) for v in (beta_start, beta_end)) or not all(isinstance(v, Real) and np.isfinite(v) for v in (beta_start, beta_end)):
        raise ValueError("beta endpoints must be finite")
    if not 0 < beta_start <= beta_end < 1:
        raise ValueError("beta endpoints must satisfy 0 < start <= end < 1")
    return np.linspace(float(beta_start), float(beta_end), T, dtype=np.float64)


def precompute_schedule(betas: np.ndarray) -> dict[str, np.ndarray]:
    values = _finite(betas, "betas")
    if values.ndim != 1 or len(values) < 2 or np.any((values <= 0) | (values >= 1)):
        raise ValueError("betas must be a one-dimensional vector of values in (0,1)")
    alphas = 1.0 - values
    alpha_bar = np.cumprod(alphas)
    alpha_bar_prev = np.concatenate(([1.0], alpha_bar[:-1]))
    posterior_variance = values * (1.0 - alpha_bar_prev) / (1.0 - alpha_bar)
    posterior_variance[0] = 0.0
    return {
        "betas": values,
        "alphas": alphas,
        "alpha_bar": alpha_bar,
        "sqrt_alpha_bar": np.sqrt(alpha_bar),
        "sqrt_one_minus_alpha_bar": np.sqrt(1.0 - alpha_bar),
        "sqrt_recip_alpha": np.sqrt(1.0 / alphas),
        "posterior_variance": posterior_variance,
        "posterior_mean_coef1": values * np.sqrt(alpha_bar_prev) / (1.0 - alpha_bar),
        "posterior_mean_coef2": (1.0 - alpha_bar_prev) * np.sqrt(alphas) / (1.0 - alpha_bar),
    }


def _timesteps(t: int | np.ndarray, batch: int, T: int) -> np.ndarray:
    raw = np.asarray(t)
    if raw.ndim == 0:
        raw = np.full(batch, raw.item())
    if raw.ndim != 1 or len(raw) != batch or not np.issubdtype(raw.dtype, np.integer):
        raise ValueError("t must be an integer scalar or a vector matching the batch")
    values = raw.astype(np.int64, copy=False)
    if np.any((values < 0) | (values >= T)):
        raise ValueError("timestep is outside the schedule")
    return values


def _broadcast_schedule(values: np.ndarray, t: int | np.ndarray, batch: int, ndim: int) -> np.ndarray:
    return values[_timesteps(t, batch, len(values))].reshape((batch,) + (1,) * (ndim - 1))


def q_sample(x0: np.ndarray, t: int | np.ndarray, noise: np.ndarray, schedule: dict[str, np.ndarray]) -> np.ndarray:
    clean, random_noise = _finite(x0, "x0"), _finite(noise, "noise")
    if clean.ndim < 2 or clean.shape != random_noise.shape or clean.shape[0] == 0:
        raise ValueError("x0 and noise must have the same non-empty batch shape")
    sqrt_bar = _broadcast_schedule(schedule["sqrt_alpha_bar"], t, clean.shape[0], clean.ndim)
    sqrt_noise = _broadcast_schedule(schedule["sqrt_one_minus_alpha_bar"], t, clean.shape[0], clean.ndim)
    return sqrt_bar * clean + sqrt_noise * random_noise


def predict_x0_from_eps(x_t: np.ndarray, t: int | np.ndarray, eps: np.ndarray, schedule: dict[str, np.ndarray]) -> np.ndarray:
    noisy, predicted = _finite(x_t, "x_t"), _finite(eps, "eps")
    if noisy.shape != predicted.shape or noisy.ndim < 2 or noisy.shape[0] == 0:
        raise ValueError("x_t and eps must have the same non-empty batch shape")
    sqrt_bar = _broadcast_schedule(schedule["sqrt_alpha_bar"], t, noisy.shape[0], noisy.ndim)
    sqrt_noise = _broadcast_schedule(schedule["sqrt_one_minus_alpha_bar"], t, noisy.shape[0], noisy.ndim)
    return (noisy - sqrt_noise * predicted) / sqrt_bar


def posterior_mean(x_t: np.ndarray, x0: np.ndarray, t: int | np.ndarray, schedule: dict[str, np.ndarray]) -> np.ndarray:
    noisy, clean = _finite(x_t, "x_t"), _finite(x0, "x0")
    if noisy.shape != clean.shape or noisy.ndim < 2 or noisy.shape[0] == 0:
        raise ValueError("x_t and x0 must have the same non-empty batch shape")
    coef1 = _broadcast_schedule(schedule["posterior_mean_coef1"], t, noisy.shape[0], noisy.ndim)
    coef2 = _broadcast_schedule(schedule["posterior_mean_coef2"], t, noisy.shape[0], noisy.ndim)
    return coef1 * clean + coef2 * noisy


def reverse_mean(x_t: np.ndarray, t: int, eps: np.ndarray, schedule: dict[str, np.ndarray]) -> np.ndarray:
    noisy, predicted = _finite(x_t, "x_t"), _finite(eps, "eps")
    if noisy.shape != predicted.shape or noisy.ndim < 2 or noisy.shape[0] == 0:
        raise ValueError("x_t and eps must have the same non-empty batch shape")
    if isinstance(t, bool) or not isinstance(t, Integral) or not 0 <= int(t) < len(schedule["betas"]):
        raise ValueError("t must be an in-range integer")
    index = int(t)
    beta = schedule["betas"][index]
    return schedule["sqrt_recip_alpha"][index] * (noisy - beta / schedule["sqrt_one_minus_alpha_bar"][index] * predicted)


def ddim_step(
    x_t: np.ndarray,
    t: int,
    t_prev: int,
    eps: np.ndarray,
    schedule: dict[str, np.ndarray],
    eta: float = 0.0,
) -> np.ndarray:
    noisy, predicted = _finite(x_t, "x_t"), _finite(eps, "eps")
    if noisy.shape != predicted.shape or noisy.ndim < 2 or noisy.shape[0] == 0:
        raise ValueError("x_t and eps must have the same non-empty batch shape")
    T = len(schedule["betas"])
    if any(isinstance(v, bool) or not isinstance(v, Integral) or not 0 <= int(v) < T for v in (t, t_prev)):
        raise ValueError("t and t_prev must be in-range integers")
    t, t_prev = int(t), int(t_prev)
    if t_prev >= t:
        raise ValueError("t_prev must be earlier than t")
    if isinstance(eta, (bool, np.bool_)) or not isinstance(eta, Real) or not np.isfinite(eta) or eta != 0:
        raise ValueError("the local ddim_step supports finite eta=0 only")
    alpha_t, alpha_prev = schedule["alpha_bar"][t], schedule["alpha_bar"][t_prev]
    x0 = (noisy - np.sqrt(1 - alpha_t) * predicted) / np.sqrt(alpha_t)
    direction = np.sqrt(1 - alpha_prev) * predicted
    return np.sqrt(alpha_prev) * x0 + direction


def timestep_embedding(t: np.ndarray, dim: int = 16) -> np.ndarray:
    values = np.asarray(t)
    dim = _positive_int(dim, "dim")
    if values.ndim != 1 or not np.issubdtype(values.dtype, np.integer):
        raise ValueError("t must be a one-dimensional integer vector")
    half = max(dim // 2, 1)
    frequencies = np.exp(-np.log(10000.0) * np.arange(half) / half)
    angles = values.astype(float)[:, None] * frequencies[None]
    embedding = np.concatenate((np.sin(angles), np.cos(angles)), axis=1)
    if embedding.shape[1] < dim:
        embedding = np.pad(embedding, ((0, 0), (0, dim - embedding.shape[1])))
    return embedding[:, :dim]


def synthetic_circles(num: int = 16, size: int = 8, seed: int = 0) -> np.ndarray:
    num, size = _positive_int(num, "num"), _positive_int(size, "size")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    yy, xx = np.meshgrid(np.arange(size), np.arange(size), indexing="ij")
    images = np.full((num, 1, size, size), -1.0, dtype=np.float64)
    for index in range(num):
        radius = rng.uniform(size * 0.2, size * 0.3)
        center = rng.uniform(radius, size - radius, 2)
        images[index, 0][(xx - center[0]) ** 2 + (yy - center[1]) ** 2 <= radius ** 2] = 1.0
    return images


def main() -> int:
    schedule = precompute_schedule(linear_beta_schedule(20, 1e-4, 0.04))
    x0 = synthetic_circles(1, 8, seed=2)
    noise = np.random.default_rng(5).normal(size=x0.shape)
    t = 7
    x_t = q_sample(x0, t, noise, schedule)
    recovered = predict_x0_from_eps(x_t, t, noise, schedule)
    step = ddim_step(x_t, t, 3, noise, schedule)
    print(f"schedule T={len(schedule['betas'])} alpha_bar[0]={schedule['alpha_bar'][0]:.6f} alpha_bar[-1]={schedule['alpha_bar'][-1]:.6f}")
    print(f"x0={x0.shape} x_t={x_t.shape} reconstruction_max_error={np.abs(recovered - x0).max():.2e}")
    print(f"ddim_step={step.shape} embedding={timestep_embedding(np.array([t]), 8).shape}")
    print("note: no U-Net is trained; the output verifies schedule and sampler algebra only")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
