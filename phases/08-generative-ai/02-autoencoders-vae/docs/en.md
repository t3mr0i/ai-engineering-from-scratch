# Autoencoders & Variational Autoencoders (VAE)

> A plain autoencoder compresses then reconstructs. It memorizes. It does not generate. Add one trick — force the code to look Gaussian — and you get a sampler. That single trick, the reparameterization of `z = μ + σ·ε`, is why every latent-diffusion and flow-matching image model you use in 2026 has a VAE at the input.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 minutes

## The Problem

Compress a 784-pixel MNIST digit to a 16-number code, then reconstruct. A plain autoencoder will ace reconstruction MSE but the code space is a lumpy mess. Pick a random point in the code space, decode it, and you get noise. It has no sampler. It is a compression model dressed up.

What you actually want is: (a) the code space is a clean, smooth distribution you can sample from — say an isotropic Gaussian `N(0, I)`, (b) decoding any sample produces a plausible digit, and (c) the encoder and decoder still compress well. Three goals, one architecture, one loss.

Kingma's 2013 VAE solves this by training the encoder to output a *distribution* `q(z|x) = N(μ(x), σ(x)²)`, pulling that distribution toward the prior `N(0, I)` via a KL penalty, and then sampling `z` from `q(z|x)` before decoding. At inference time, drop the encoder, sample `z ~ N(0, I)`, decode. The KL penalty is what forces the code space to be structured.

In 2026 VAEs rarely ship standalone — they have been outclassed by diffusion for raw image quality — but they are the encoder of choice for every latent-diffusion model (SD 1/2/XL/3, Flux, AudioCraft). Learn the VAE and you learn the invisible first layer of every image pipeline you use.

## The Concept

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`, `x̂ = decoder(z)`, loss = `||x - x̂||²`. Code space unstructured.

**VAE encoder.** Outputs two vectors: `μ(x)` and `log σ²(x)`. These define `q(z|x) = N(μ, diag(σ²))`.

**Reparameterization trick.** Sampling from `q(z|x)` is not differentiable. Rewrite the sample as `z = μ + σ·ε` where `ε ~ N(0, I)`. Now `z` is a deterministic function of `(μ, σ)` plus a non-parameter noise — gradients flow through `μ` and `σ`.

**Loss.** Evidence Lower BOund (ELBO), two terms:

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

Reconstruction pushes `x̂` toward `x`. KL pushes `q(z|x)` toward the prior. They trade off. Small β (<1) = sharper samples, code space less Gaussian. Large β (>1) = cleaner code space, blurrier samples. β-VAE (Higgins 2017) made this knob famous and kicked off disentanglement research.

**Sampling.** At inference: draw `z ~ N(0, I)`, forward through decoder. One forward pass — no iterative sampling like diffusion.


## Use It

The 2026 VAE stack:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

A latent-diffusion model is a VAE with a diffusion model living between encoder and decoder. The VAE does coarse compression, the diffusion model does the heavy lifting. Same pattern for video (VAE + video-diffusion DiT) and audio (Encodec + MusicGen transformer).

## Ship It

Save `outputs/skill-vae-trainer.md`.

Skill takes: dataset profile + latent-dim target + downstream use (reconstruction, sampling, or latent-diffusion input) and outputs: architecture choice (plain/β/VQ/RVQ), β schedule, latent dim, decoder likelihood (Gaussian vs categorical), and evaluation plan (recon MSE, KL per dim, Fréchet distance between `q(z|x)` and `N(0, I)`).


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Autoencoder | Encode-decode network | `x → z → x̂`, learn MSE. Not generative. |
| VAE | AE with a sampler | Encoder outputs a distribution, KL penalty shapes code space. |
| ELBO | Evidence lower bound | `log p(x) ≥ recon - KL[q(z\|x) \|\| p(z)]`; tight when `q = p(z\|x)`. |
| Reparameterization | `z = μ + σ·ε` | Rewrites stochastic node as deterministic + pure noise. Enables backprop through sampling. |
| Prior | `p(z)` | Target distribution for the latent, typically `N(0, I)`. |
| Posterior collapse | "KL term wins" | Encoder ignores `x`, outputs the prior; decoder must hallucinate. |
| β-VAE | Tunable KL weight | `loss = recon + β·KL`. Higher β = more disentangled but blurrier. |
| VQ-VAE | Discrete latent | Replace continuous `z` with nearest codebook vector; enables transformer modelling. |

## Production note: the VAE is the hottest path in a diffusion server

In a Stable Diffusion / Flux / SD3 pipeline the VAE is called twice per request — once to encode (if doing img2img / inpainting) and once to decode. At 1024² the decoder pass is often the single largest activation-memory peak in the whole pipeline because it upsamples `128×128×16` latents back to `1024×1024×3`. Two practical consequences:

- **Slice or tile the decode.** `diffusers` exposes `pipe.vae.enable_slicing()` and `pipe.vae.enable_tiling()`. Tiling trades a small seam artifact for `O(tile²)` memory instead of `O(H·W)`. Essential for 1024²+ on consumer GPUs.
- **bf16 decoder, fp32 numerics for the final resize.** The SD 1.x VAE was released in fp32 and *silently produces NaNs* when cast to fp16 at 1024²+. SDXL ships `madebyollin/sdxl-vae-fp16-fix` — always prefer the fp16-fix variant or use bf16.

## Further Reading

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) — the VAE paper.
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) — disentangled β-VAE.
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) — VQ-VAE.
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) — state-of-the-art image VAE.
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) — Stable Diffusion; VAE as encoder.
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) — Encodec, the audio VAE standard.
