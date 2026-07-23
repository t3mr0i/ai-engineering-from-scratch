# Transfusion: Autoregressive Text + Diffusion Image in One Transformer

> Chameleon and Emu3 bet everything on discrete tokens. They work, but the quantization bottleneck is visible — the image quality plateaus below continuous-space diffusion models. Transfusion (Meta, Zhou et al., August 2024) takes the opposite bet: keep images continuous, drop the VQ-VAE entirely, and train one transformer with two losses. Text tokens get next-token-prediction. Image patches get a flow-matching / diffusion loss. Both objectives optimize the same weights. The architecture underlying Stable Diffusion 3 (MMDiT) is a close cousin. This lesson reads the Transfusion thesis, builds a toy two-loss trainer, and traces the attention mask that lets one transformer do both jobs.

**Type:** Build
**Languages:** Python (stdlib, two-loss trainer on MNIST-scale toy)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 8 (Generative AI)
**Time:** ~180 minutes

## Learning Objectives

- Wire a transformer that runs two losses (NTP on text tokens, diffusion MSE on image patches) on one backbone.
- Explain why bidirectional attention across image patches plus causal attention over text tokens is the right mask choice.
- Compare Transfusion-style (continuous images, diffusion loss) to Chameleon-style (discrete images, NTP) on compute, quality, and code complexity.
- Name MMDiT's contribution: modality-specific weights at each block, joint attention at the residual stream.

## The Problem

The discrete vs continuous image tokens debate is older than LLMs. Continuous representations (raw pixels, VAE latents) preserve detail. Discrete tokens (VQ indices) fit the transformer's native vocabulary but lose detail at the quantization step.

Chameleon / Emu3 went discrete: one loss, one architecture, but image fidelity capped by tokenizer quality.

Diffusion models went continuous: exceptional image quality, but a separate model from the LLM, complex noise-schedule engineering, and no clean integration with text generation.

Transfusion asks: can we have both? Keep images continuous, still train one model, use two losses stitched into one gradient step.

## The Concept

### The two-loss architecture

A single decoder-only transformer processes a sequence that contains:

- Text tokens (discrete, from BPE vocab).
- Image patches (continuous, 16x16 pixel blocks projected into hidden dim via linear embedding — same as a ViT encoder's input).
- `<image>` and `</image>` tags marking where continuous patches live.

Forward pass runs once. The loss picks one of two heads per token:

- For text tokens: standard cross-entropy on the vocab-logits head.
- For image patches: diffusion loss on continuous patches — predict the noise that was added to each patch.

The gradient flows through the shared transformer body. Both losses improve the shared weights simultaneously.

### Attention mask: causal text + bidirectional image

Text tokens must be causal — you cannot let a text token attend to future text, or teacher forcing breaks. Image patches, however, represent one snapshot; they should attend to each other bidirectionally within the same image block.

The mask:

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i_image_end)   # text attends to previous images
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

Implemented as a block-triangular mask at training and inference.

### Diffusion loss inside the transformer

The diffusion loss is standard: add noise to an image patch, ask the model to predict the noise (or the clean patch, equivalently). Transfusion's version uses flow matching — predict the velocity field from noisy to clean.

During training:
1. For each image patch x0, sample a random timestep t.
2. Sample noise ε, compute xt = (1-t) * x0 + t * ε (linear interpolation for flow matching).
3. The transformer predicts v_theta(xt, t); loss = MSE(v_theta(xt, t), ε - x0).
4. Backprop alongside text NTP losses from the same sequence.

At inference, generation is:
- Text tokens: standard autoregressive sampling.
- Image patches: diffusion sampling loop (10-30 steps typical) conditioned on the prior text tokens.

### MMDiT: Stable Diffusion 3's variant

Stable Diffusion 3 (Esser et al., March 2024) shipped MMDiT (Multimodal Diffusion Transformer) around the same time as Transfusion. The architectures are siblings.

MMDiT's key differences:

- Modality-specific weights per block. Each transformer block has separate Q, K, V, and MLP weights for text tokens vs image patches. Attention is joint (cross-modality); everything else is modality-specific.
- Rectified flow training. A specific flow-matching variant with known sampling and simpler math than DDPM.
- Scale. MMDiT is the backbone for SD3 (2B and 8B param variants). Transfusion's paper scales to 7B.

Both converge on the same core idea: one transformer runs NTP on text and diffusion on continuous image representations.

### Why this beats Chameleon-style

The quality gap between continuous-diffusion and discrete-NTP on image generation is measurable. Transfusion paper reports:

- At 7B params, beats a same-size Chameleon-style model on FID by 3-5 points.
- No tokenizer training required — the image encoder is simpler (Linear projection to hidden, same as a ViT's input layer).
- Inference can parallelize image patch denoising, unlike autoregressive image tokens.

Downside: Transfusion is a dual-loss model, making training dynamics trickier. Loss weights need tuning. Schedule mismatch between NTP and diffusion can cause one head to dominate.

### What sits downstream

Janus-Pro (Lesson 12.15) refines Transfusion's idea by decoupling the vision encoder for understanding and generation — SigLIP for one, VQ for the other — while sharing the transformer body. Show-o (Lesson 12.14) swaps diffusion for discrete-diffusion (masked prediction). The unified-generation family branches rapidly after Transfusion.

2026 production VLMs that emit images — Gemini 3 Pro, GPT-5, Claude Opus 4.7's image generation path — almost certainly use some descendant of this family. Details are proprietary.



## Further Reading

- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
