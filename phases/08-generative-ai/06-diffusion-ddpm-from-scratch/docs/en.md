# Diffusion Models — DDPM from Scratch

> Ho, Jain, Abbeel (2020) gave the field a recipe it could not quit. Destroy the data with noise over a thousand small steps. Train one neural net to predict the noise. Reverse the process at inference. Today every mainstream image, video, 3D, and music model runs on this loop, possibly with flow matching or consistency tricks on top.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## Learning Objectives

- Explain the probabilistic mechanism behind Diffusion Models — DDPM from Scratch
- Implement the lesson's core generative step from first principles
- Inspect samples and intermediate states to diagnose generation behavior
- Compare quality, diversity, stability, and compute trade-offs

## The Problem

You want a sampler for `p_data(x)`. GANs play a minimax game that often diverges. VAEs produce blurry samples from a Gaussian decoder. What you really want is a training objective that is (a) a single stable loss (no saddle point, no minimax), (b) a lower bound on `log p(x)` (so you have likelihoods), and (c) samples that match SOTA quality.

Sohl-Dickstein et al. (2015) had a theoretical answer: define a Markov chain `q(x_t | x_{t-1})` that gradually adds Gaussian noise, and train a reverse chain `p_θ(x_{t-1} | x_t)` to denoise. Ho, Jain, Abbeel (2020) showed the loss could be simplified to one line — predict the noise — and cleaned up the math. In 2020 this was a curiosity. In 2021 it produced state-of-the-art samples. In 2022 it became Stable Diffusion. In 2026 it is the substrate.

## The Concept

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process `q`.** Add Gaussian noise in `T` small steps. The closed form — the reason the math is tractable — is that the cumulative step is also Gaussian:

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

where `α̅_t = ∏_{s=1..t} (1 - β_s)` for a schedule of `β_t`. Pick `β_t` from 1e-4 to 0.02 linearly over T=1000 steps and `x_T` is approximately `N(0, I)`.

**Reverse process `p_θ`.** Learn a neural net `ε_θ(x_t, t)` that predicts the noise that was added. Given `x_t`, denoise by:

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

where `σ_t` is either `sqrt(β_t)` or a learned variance. The expression is ugly but it is just algebra — solving for `x_{t-1}` given the posterior `q(x_{t-1} | x_t, x_0)` and substituting `x_0` with its noise-predicted estimate.

**Training loss.**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

Sample `x_0` from data, pick a random `t`, sample `ε ~ N(0, I)`, compute the noisy `x_t` in one shot via the closed form, and regress on the noise. One loss, no minimax, no KL, no reparameterization tricks.

**Sampling.** Start `x_T ~ N(0, I)`. Iterate the reverse step from `t = T` to `1`. Done.

## Why it works

Three intuitions:

1. **Denoising is easy; generating is hard.** At `t=T`, the data is pure noise — the net has to solve a trivial problem. At `t=0`, the net only has to clean up a few pixels. At intermediate `t`, the problem is hard but the net has many gradients flowing through the same weights from every noise level.

2. **Score matching in disguise.** Vincent (2011) proved that predicting the noise is equivalent to estimating `∇_x log q(x_t | x_0)`, the *score*. The reverse SDE uses this score to walk up the density gradient — a guided random walk toward high-probability regions.

3. **The ELBO reduces to simple MSE.** The full variational lower bound has a KL term per timestep. With DDPM's parameterization those KL terms simplify to MSE on noise prediction with specific coefficients; Ho dropped the coefficients (calling it "simple" loss) and quality *improved*.




## Further Reading

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) — the diffusion paper, ahead of its time.
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) — DDPM.
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) — DDIM, fewer steps.
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) — cosine schedule, learned variance.
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) — classifier guidance.
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) — CFG.
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) — unified notation, cleanest recipe.
