# Conditional GANs & Pix2Pix

> The first big unlock of 2014-2017 was controlling what a GAN makes. Attach a label, or an image, or a sentence. Pix2Pix did the image version and it still beats every generic text-to-image model on narrow image-to-image tasks.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 minutes

## The Problem

An unconditional GAN samples arbitrary faces. Useful for a demo, useless in production. You want: *map a sketch to a photo*, *map a map to an aerial photo*, *map a daytime scene to nighttime*, *colorize a grayscale image*. In all of these, you are given an input image `x` and must output `y` with some semantic correspondence. There are many plausible `y`s per `x`. Mean-squared error flattens them into mush. An adversarial loss doesn't, because "looks real" is sharp.

Conditional GAN (Mirza & Osindero, 2014) adds a condition `c` as an input to both `G` and `D`. Pix2Pix (Isola et al., 2017) specialized this: condition is a full input image, generator is a U-Net, discriminator is a *patch-based* classifier (PatchGAN), and loss is adversarial + L1. That recipe outperforms from-scratch text-to-image models on narrow image-to-image domains even in 2026 because it is trained on *paired data* — you have exactly the signal you need.

## The Concept

![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y`. In Pix2Pix, `z` is dropout inside G (no input noise — Isola found explicit noise got ignored).

**Conditional D.** `D(x, y) → [0, 1]`. Input is the *pair* (condition, output). This is the key difference: D must judge whether `y` is consistent with `x`, not just whether `y` looks real.

**U-Net generator.** Encoder-decoder with skip connections across the bottleneck. Critical for tasks where input and output share low-level structure (edges, silhouette). Without the skips, high-frequency detail vanishes.

**PatchGAN discriminator.** Instead of outputting a single real/fake score, D outputs an `N×N` grid where each cell judges a receptive field of ~70×70 pixels. Averaged. This is a Markov random field assumption: realism is local. Much faster to train, fewer parameters, sharper output.

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

The L1 term stabilizes training and pushes G toward the known target. L1 gives sharper edges than L2 (medians, not means). `λ = 100` was the Pix2Pix default.

## CycleGAN — when you don't have pairs

Pix2Pix needs paired `(x, y)` data. CycleGAN (Zhu et al., 2017) drops this requirement at the cost of an extra loss: the *cycle consistency* loss. Two generators `G: X → Y` and `F: Y → X`. Train them so `F(G(x)) ≈ x` and `G(F(y)) ≈ y`. This lets you translate horses to zebras, summer to winter, without paired examples.

In 2026, unpaired image-to-image is mostly done via diffusion (ControlNet, IP-Adapter) rather than CycleGAN, but the cycle-consistency idea survives in almost every unpaired domain adaptation paper.




## Further Reading

- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) — the cGAN paper.
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) — Pix2Pix.
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) — CycleGAN.
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585) — Pix2PixHD.
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) — SPADE / GauGAN.
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) — the projection D.
