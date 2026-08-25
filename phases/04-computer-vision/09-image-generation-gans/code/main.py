# Entry point for phases/04-computer-vision/09-image-generation-gans/docs/en.md.
# Implements a deterministic scalar GAN so minimax, non-saturating, and separate updates are inspectable.
# The toy generator maps one latent scalar to one sample; it is not an image model or a training benchmark.
# Run from this directory with: python3 main.py

from __future__ import annotations

from numbers import Integral, Real

import numpy as np


def _finite(value: np.ndarray | float, name: str) -> np.ndarray:
    array = np.asarray(value)
    if not np.issubdtype(array.dtype, np.number) or not np.isfinite(array).all():
        raise ValueError(f"{name} must contain finite numeric values")
    return array.astype(np.float64, copy=False)


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _finite_scalar(value: float, name: str) -> float:
    array = _finite(value, name)
    if array.ndim != 0:
        raise ValueError(f"{name} must be a finite scalar")
    return float(array)


def sigmoid(value: np.ndarray | float) -> np.ndarray:
    scores = _finite(value, "logits")
    result = np.empty_like(scores, dtype=np.float64)
    positive = scores >= 0
    result[positive] = 1.0 / (1.0 + np.exp(-scores[positive]))
    exp_scores = np.exp(scores[~positive])
    result[~positive] = exp_scores / (1.0 + exp_scores)
    return result


def softplus(value: np.ndarray | float) -> np.ndarray:
    scores = _finite(value, "value")
    return np.maximum(scores, 0) + np.log1p(np.exp(-np.abs(scores)))


def binary_cross_entropy_with_logits(logits: np.ndarray, labels: np.ndarray) -> float:
    scores = _finite(logits, "logits")
    targets = _finite(labels, "labels")
    if scores.shape != targets.shape or scores.size == 0:
        raise ValueError("logits and labels must have the same non-empty shape")
    if np.any((targets < 0) | (targets > 1)):
        raise ValueError("labels must lie in [0,1]")
    return float((softplus(scores) - scores * targets).mean())


def discriminator_loss(real_logits: np.ndarray, fake_logits: np.ndarray) -> float:
    real, fake = _finite(real_logits, "real_logits"), _finite(fake_logits, "fake_logits")
    if real.size == 0 or fake.size == 0:
        raise ValueError("real and fake logit batches must be non-empty")
    return binary_cross_entropy_with_logits(real, np.ones_like(real)) + binary_cross_entropy_with_logits(fake, np.zeros_like(fake))


def generator_loss_non_saturating(fake_logits: np.ndarray) -> float:
    scores = _finite(fake_logits, "fake_logits")
    if scores.size == 0:
        raise ValueError("fake_logits must be non-empty")
    return float(softplus(-scores).mean())


def generator_loss_minimax(fake_logits: np.ndarray) -> float:
    """Return the original minimax value ``E[log(1-D(G(z)))]``.

    Since ``D = sigmoid(logit)``, this value is ``-mean(softplus(logit))``.
    Treating it as a scalar minimized by gradient descent pushes fake logits
    upward, but its gradient is tiny when a fake logit is very negative.
    """
    scores = _finite(fake_logits, "fake_logits")
    if scores.size == 0:
        raise ValueError("fake_logits must be non-empty")
    return float(-softplus(scores).mean())


def generator_samples(z: np.ndarray, weight: float, bias: float) -> np.ndarray:
    latent = _finite(z, "z")
    if latent.ndim != 1 or latent.size == 0:
        raise ValueError("z must be a non-empty one-dimensional batch")
    weight, bias = _finite_scalar(weight, "weight"), _finite_scalar(bias, "bias")
    return weight * latent + bias


def discriminator_logits(samples: np.ndarray, weight: float, bias: float) -> np.ndarray:
    values = _finite(samples, "samples")
    if values.ndim != 1 or values.size == 0:
        raise ValueError("samples must be a non-empty one-dimensional batch")
    weight, bias = _finite_scalar(weight, "weight"), _finite_scalar(bias, "bias")
    return weight * values + bias


def gan_step(
    params: dict[str, float],
    real: np.ndarray,
    z: np.ndarray,
    lr_g: float = 0.02,
    lr_d: float = 0.05,
) -> tuple[dict[str, float], dict[str, float]]:
    """Update D on detached generator samples, then G with the non-saturating loss."""
    if isinstance(lr_g, (bool, np.bool_)) or not isinstance(lr_g, Real) or not np.isfinite(lr_g) or lr_g <= 0:
        raise ValueError("lr_g must be positive and finite")
    if isinstance(lr_d, (bool, np.bool_)) or not isinstance(lr_d, Real) or not np.isfinite(lr_d) or lr_d <= 0:
        raise ValueError("lr_d must be positive and finite")
    required = ("g_weight", "g_bias", "d_weight", "d_bias")
    if set(params) != set(required):
        raise ValueError("params must contain exactly four finite GAN parameters")
    try:
        params = {key: _finite_scalar(params[key], key) for key in required}
    except (TypeError, ValueError) as exc:
        raise ValueError("params must contain exactly four finite GAN parameters") from exc
    real_values, latent = _finite(real, "real"), _finite(z, "z")
    if real_values.ndim != 1 or latent.ndim != 1 or real_values.size == 0 or latent.size == 0:
        raise ValueError("real and z must be non-empty one-dimensional batches")

    fake = generator_samples(latent, params["g_weight"], params["g_bias"])
    real_logits = discriminator_logits(real_values, params["d_weight"], params["d_bias"])
    fake_logits = discriminator_logits(fake, params["d_weight"], params["d_bias"])
    loss_d = discriminator_loss(real_logits, fake_logits)
    d_real_grad = sigmoid(real_logits) - 1.0
    d_fake_grad = sigmoid(fake_logits)
    d_weight_grad = float(np.mean(d_real_grad * real_values) + np.mean(d_fake_grad * fake))
    d_bias_grad = float(np.mean(d_real_grad) + np.mean(d_fake_grad))
    updated = dict(params)
    updated["d_weight"] -= float(lr_d) * d_weight_grad
    updated["d_bias"] -= float(lr_d) * d_bias_grad

    fake = generator_samples(latent, params["g_weight"], params["g_bias"])
    fake_logits_for_g = discriminator_logits(fake, updated["d_weight"], updated["d_bias"])
    loss_g = generator_loss_non_saturating(fake_logits_for_g)
    fake_logit_grad = sigmoid(fake_logits_for_g) - 1.0
    g_weight_grad = float(np.mean(fake_logit_grad * updated["d_weight"] * latent))
    g_bias_grad = float(np.mean(fake_logit_grad * updated["d_weight"]))
    updated["g_weight"] -= float(lr_g) * g_weight_grad
    updated["g_bias"] -= float(lr_g) * g_bias_grad
    return updated, {"d_loss": loss_d, "g_loss": loss_g}


def train_toy_gan(steps: int = 80, batch_size: int = 32, seed: int = 0) -> dict[str, object]:
    steps, batch_size = _positive_int(steps, "steps"), _positive_int(batch_size, "batch_size")
    if isinstance(seed, bool) or not isinstance(seed, Integral):
        raise ValueError("seed must be an integer")
    rng = np.random.default_rng(int(seed))
    params = {"g_weight": 0.15, "g_bias": -0.5, "d_weight": 0.2, "d_bias": 0.0}
    d_losses, g_losses, fake_means = [], [], []
    for _ in range(steps):
        real = rng.normal(2.0, 0.25, batch_size)
        z = rng.normal(0.0, 1.0, batch_size)
        params, losses = gan_step(params, real, z)
        d_losses.append(losses["d_loss"])
        g_losses.append(losses["g_loss"])
        fake_means.append(float(generator_samples(z, params["g_weight"], params["g_bias"]).mean()))
    return {"params": params, "d_losses": d_losses, "g_losses": g_losses, "fake_means": fake_means}


def main() -> int:
    result = train_toy_gan(steps=80, batch_size=32, seed=4)
    print("toy GAN: scalar generator -> scalar discriminator")
    print(f"steps={len(result['d_losses'])} final_D={result['d_losses'][-1]:.4f} final_G={result['g_losses'][-1]:.4f}")
    print(f"parameters={result['params']} final_fake_batch_mean={result['fake_means'][-1]:.3f}")
    print("updates: discriminator(real, detached fake) then generator(non-saturating)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
