---
name: skill-gan-update-contract
description: Review GAN objectives and update boundaries before choosing a network
version: 1.0.0
phase: 4
lesson: 9
tags: [generative-models, gan, losses]
---

# GAN update contract

Record the following before replacing the scalar fixture with a convolutional model:

1. Discriminator real/fake logits and the exact stable BCE expression.
2. Generator objective: minimax or non-saturating; do not label one as the other.
3. The discriminator update's detached fake batch.
4. The generator update's fresh discriminator evaluation and separate optimizer state.
5. Seed, batch shape, image range, and a finite bounded acceptance check.

The lesson's `gan_step` is deliberately framework-free. It is a contract scaffold, not a pretrained model or image-quality benchmark.
