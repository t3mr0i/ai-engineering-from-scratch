# Flow Matching & Rectified Flows

> Diffusion models take 20-50 sampling steps because they walk a curved path from noise to data. Flow matching (Lipman et al., 2023) and rectified flow (Liu et al., 2022) trained straight paths. Straighter paths mean fewer steps mean faster inference. Stable Diffusion 3, Flux.1, and AudioCraft 2 all switched to flow matching in 2024.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## The Problem

DDPM's reverse process is a 1000-step stochastic walk from `N(0, I)` back to the data distribution. DDIM collapsed it to 20-50 deterministic steps. You want fewer steps — ideally one. The blocker is that the ODE solving the reverse process is stiff; the path is curved.

If you could train the model such that the path from noise to data was a *straight line*, a single Euler step from `t=1` to `t=0` would work. Flow matching builds this directly: define a straight-line interpolation from `x_1 ∼ N(0, I)` to `x_0 ∼ data`, train a vector field `v_θ(x, t)` to match its time derivative, integrate at inference.

Rectified flow (Liu 2022) goes further: iteratively straighten the paths with a reflow procedure that produces a progressively closer-to-linear ODE. After two reflow iterations, a 2-step sampler matches 50-step DDPM quality.

## The Concept

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### Straight-line flow

Define:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

where `x_0 ~ data` and `x_1 ~ N(0, I)`. The time derivative along this straight line is constant:

```
dx_t / dt = x_1 - x_0
```

Define a neural vector field `v_θ(x_t, t)` and train it to match this derivative:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

This is the **conditional flow matching** loss (Lipman 2023). Training is simulation-free: you never unroll the ODE. Just sample `(x_0, x_1, t)` and regress.

### Sampling

At inference, integrate the learned vector field *backwards* in time:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

Start at `x_1 ~ N(0, I)`, Euler-step down to `t=0`.

### Rectified flow (Liu 2022)

Straight-line flow works but the learned paths are *not actually straight* — they curve because many `x_0`s can map to the same `x_1`. Rectified flow's reflow step:

1. Train flow model v_1 with random pairings.
2. Sample N pairs `(x_1, x_0)` by integrating v_1 from `x_1` to its landing `x_0`.
3. Train v_2 on those paired examples. Because the pairs are now "ODE-matched", the straight-line interpolant between them is genuinely flatter.
4. Repeat.

In practice 2 reflow iterations get you to near-linear, enabling 2-4 step inference. SDXL-Turbo, SD3-Turbo, LCM are all distilled-from-flow-matching models.

### Why this won for images in 2024

Three reasons:

1. **Simulation-free training** — no ODE unrolling during training, trivial to implement.
2. **Better loss geometry** — straight paths have consistent signal-to-noise, whereas DDPM ε-loss has bad SNR at edges of the schedule.
3. **Faster inference** — 4-8 steps at SDXL-Turbo quality; 1 step with consistency distillation.

## Flow matching vs DDPM — the exact connection

Flow matching with a Gaussian-conditional path is diffusion *with a specific noise schedule*. Pick the `x_t = α(t) x_0 + σ(t) x_1` schedule and flow matching recovers Stratonovich-reformulated diffusion with `v = α'·x_0 - σ'·x_1`. The two are algebraically equivalent for Gaussian paths.

What flow matching added: the *clarity* of the target (a plain velocity), a cleaner loss, and the license to experiment with non-Gaussian interpolants.




## Further Reading

- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) — rectified flow.
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) — flow matching.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) — SD3, rectified flow at scale.
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) — general framework that covers FM + diffusion.
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) — 1-step distillation of diffusion / flow.
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) — turbo variant.
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) — flow matching in production.
