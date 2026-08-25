---
name: prompt-gan-training-triage
description: Diagnose a short adversarial run from losses, ranges, and update order
phase: 4
lesson: 9
---

# GAN triage

Ask for one real-logit batch, one fake-logit batch, the generator objective name, and the order in which the two parameter groups were updated. If the minimax value is reported, check the negative `softplus(fake_logit)` sign and its saturating derivative; if the training update is the local default, check `softplus(-fake_logit)` instead. Check stable finite losses, the latent/sample batch shapes, and the seeded repeat. A falling discriminator loss alone does not establish useful samples; first verify that the generator received the intended gradient and that fake values were detached only for the discriminator update.
