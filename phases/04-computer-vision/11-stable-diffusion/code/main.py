# Entry point for phases/04-computer-vision/11-stable-diffusion/docs/en.md.
# Implements an offline latent-shape, classifier-free guidance, scheduler, and LoRA bookkeeping fixture.
# It deliberately imports no diffusion framework and never downloads or generates a model image.
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


def latent_shape(
    image_shape: tuple[int, int, int, int],
    downsample_factor: int = 8,
    latent_channels: int = 4,
) -> tuple[int, int, int, int]:
    if len(image_shape) != 4:
        raise ValueError("image_shape must be (N,C,H,W)")
    batch, channels, height, width = (_positive_int(v, name) for v, name in zip(image_shape, ("N", "C", "H", "W")))
    downsample_factor = _positive_int(downsample_factor, "downsample_factor")
    latent_channels = _positive_int(latent_channels, "latent_channels")
    if height % downsample_factor or width % downsample_factor:
        raise ValueError("H and W must be divisible by downsample_factor")
    return batch, latent_channels, height // downsample_factor, width // downsample_factor


def encode_latent(image: np.ndarray, downsample_factor: int = 2, latent_channels: int = 4) -> np.ndarray:
    value = _finite(image, "image")
    if value.ndim != 4 or 0 in value.shape:
        raise ValueError("image must have a non-empty (N,C,H,W) shape")
    shape = latent_shape(value.shape, downsample_factor, latent_channels)
    batch, channels, height, width = value.shape
    factor = int(downsample_factor)
    if channels > latent_channels:
        raise ValueError("latent_channels must cover every input channel")
    pooled = value.reshape(batch, channels, height // factor, factor, width // factor, factor).mean(axis=(3, 5))
    latent = np.empty(shape, dtype=np.float64)
    latent[:, :min(channels, latent_channels)] = pooled[:, :min(channels, latent_channels)]
    if latent_channels > channels:
        latent[:, channels:] = pooled.mean(axis=1, keepdims=True)
    return latent


def decode_latent(latent: np.ndarray, image_channels: int = 3, upsample_factor: int = 2) -> np.ndarray:
    values = _finite(latent, "latent")
    if values.ndim != 4 or 0 in values.shape:
        raise ValueError("latent must have a non-empty (N,C,H,W) shape")
    image_channels = _positive_int(image_channels, "image_channels")
    upsample_factor = _positive_int(upsample_factor, "upsample_factor")
    if image_channels > values.shape[1]:
        raise ValueError("latent does not contain enough channels for the requested image")
    expanded = np.repeat(np.repeat(values[:, :image_channels], upsample_factor, axis=2), upsample_factor, axis=3)
    return expanded


def classifier_free_guidance(unconditional: np.ndarray, conditional: np.ndarray, guidance_scale: float) -> np.ndarray:
    uncond, cond = _finite(unconditional, "unconditional"), _finite(conditional, "conditional")
    if uncond.shape != cond.shape or uncond.size == 0:
        raise ValueError("unconditional and conditional predictions must share a non-empty shape")
    if isinstance(guidance_scale, (bool, np.bool_)) or not isinstance(guidance_scale, Real) or not np.isfinite(guidance_scale) or guidance_scale < 0:
        raise ValueError("guidance_scale must be finite and non-negative")
    return uncond + float(guidance_scale) * (cond - uncond)


def scheduler_sigmas(num_steps: int, start: float = 1.0, end: float = 0.01) -> np.ndarray:
    num_steps = _positive_int(num_steps, "num_steps")
    if num_steps < 2:
        raise ValueError("num_steps must be at least 2 to include both endpoints")
    if any(isinstance(v, (bool, np.bool_)) for v in (start, end)) or not all(isinstance(v, Real) and np.isfinite(v) for v in (start, end)) or not 0 < end <= start:
        raise ValueError("scheduler sigmas require finite 0 < end <= start")
    return np.linspace(float(start), float(end), num_steps)


def lora_update(base: np.ndarray, down: np.ndarray, up: np.ndarray, scale: float = 1.0) -> np.ndarray:
    weights = _finite(base, "base")
    lower, upper = _finite(down, "down"), _finite(up, "up")
    if (weights.ndim != 2 or lower.ndim != 2 or upper.ndim != 2 or
            0 in weights.shape or 0 in lower.shape or 0 in upper.shape or
            lower.shape[1] != weights.shape[1] or upper.shape[0] != weights.shape[0] or
            upper.shape[1] != lower.shape[0]):
        raise ValueError("base, down, and up have incompatible 2-D LoRA shapes")
    if isinstance(scale, (bool, np.bool_)) or not isinstance(scale, Real) or not np.isfinite(scale):
        raise ValueError("scale must be finite")
    return weights + float(scale) * (upper @ lower)


def pipeline_manifest() -> list[dict[str, str]]:
    return [
        {"component": "text_encoder", "role": "prompt -> conditioning vectors", "status": "contract only"},
        {"component": "denoiser", "role": "predict a latent update", "status": "contract only"},
        {"component": "scheduler", "role": "choose reverse timesteps", "status": "NumPy sigma fixture"},
        {"component": "VAE", "role": "image <-> latent shape adapter", "status": "mean-pool fixture"},
        {"component": "safety_check", "role": "policy gate on decoded output", "status": "not implemented here"},
    ]


def main() -> int:
    image = np.linspace(-1, 1, 3 * 32 * 32).reshape(1, 3, 32, 32)
    latent = encode_latent(image, downsample_factor=8, latent_channels=4)
    uncond, cond = np.zeros((1, 4, 4, 4)), np.ones((1, 4, 4, 4))
    guided = classifier_free_guidance(uncond, cond, guidance_scale=5.0)
    down, up = np.ones((2, 4)), np.ones((4, 2))
    adapted = lora_update(np.zeros((4, 4)), down, up, scale=0.5)
    print("offline Stable-Diffusion component ledger:")
    for item in pipeline_manifest():
        print(f"  {item['component']}: {item['role']} ({item['status']})")
    print(f"image={image.shape} latent={latent.shape} cfg_mean={guided.mean():.1f} lora_shape={adapted.shape}")
    print(f"scheduler_sigmas={scheduler_sigmas(5).round(3).tolist()}")
    print("note: no diffusers import, model download, or image-generation claim")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
