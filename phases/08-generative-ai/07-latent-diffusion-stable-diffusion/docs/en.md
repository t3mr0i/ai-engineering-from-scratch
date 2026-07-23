# Latent Diffusion & Stable Diffusion

> Pixel-space diffusion on 512×512 images is a computational war crime. Rombach et al. (2022) noticed that you do not need all 786k dimensions to generate an image — you need enough to capture semantic structure, and a separate decoder for the rest. Run diffusion inside a VAE's latent space. That one idea is Stable Diffusion.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## The Problem

Pixel-space diffusion at 512² means the U-Net runs on tensors of shape `[B, 3, 512, 512]`. Each sampling step is ~100 GFLOPS for a 500M-param U-Net. Fifty steps is 5 TFLOPS per image. Train on a billion images and the compute bill is absurd.

Most of those FLOPs go to pushing perceptually unimportant details through the net — the high-frequency texture that a lossy VAE could compress away. Rombach's idea: train a VAE once (the *first stage*), freeze it, and run diffusion entirely in the 4-channel 64×64 latent space (the *second stage*). Same U-Net. 1/16th the pixels. ~64x fewer FLOPs for comparable quality.

This is the Stable Diffusion recipe. SD 1.x / 2.x used an 860M U-Net over `64×64×4` latents, SDXL used a 2.6B U-Net over `128×128×4`, SD3 swapped the U-Net for a Diffusion Transformer (DiT) with flow matching. Flux.1-dev (Black Forest Labs, 2024) ships a 12B-param DiT-MMDiT. All run on the same two-stage substrate.

## The Concept

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**Two stages, separately trained.**

1. **Stage 1 — VAE.** Encoder `E(x) → z`, decoder `D(z) → x`. Target compression: 8× downsample in each spatial axis + adjust channels so total latent size is ~1/16th of pixel count. Loss = reconstruction (L1 + LPIPS perceptual) + KL (small weight so `z` isn't forced too Gaussian, because we do not need exact sampling from `z`). Often trained with an adversarial loss so decoded images are sharp.

2. **Stage 2 — diffusion on `z`.** Treat `z = E(x_real)` as the data. Train a U-Net (or DiT) to denoise `z_t`. At inference: sample `z_0` via diffusion, then `x = D(z_0)`.

**Text conditioning.** Two additional components. A frozen text encoder (CLIP-L for SD 1.x, CLIP-L+OpenCLIP-G for SD 2/XL, T5-XXL for SD3 and Flux). A cross-attention injection: every U-Net block takes `[Q = image features, K = V = text tokens]` and mixes them in. The tokens are the only way text influences the image.

**The loss function is identical to Lesson 06.** Same DDPM / flow matching MSE on noise. You just swap the data domain.

## Architecture variants

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

The trend: replace U-Net with DiT (transformer over latent patches), scale the text encoder (T5 beats CLIP for prompt adherence), increase latent channels (4 → 16 gives more detail headroom).




## Further Reading

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) — Stable Diffusion.
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) — SDXL.
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748) — DiT.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) — SD3, MMDiT.
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) — CFG.
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) — Flux.1 family.
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index) — reference implementation for every checkpoint above.
