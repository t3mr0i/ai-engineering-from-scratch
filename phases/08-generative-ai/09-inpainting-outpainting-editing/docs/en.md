# Inpainting, Outpainting & Image Editing

> Text-to-image makes new things. Inpainting fixes old ones. In production, 70% of billable image work is editing — swap a background, remove a logo, extend the canvas, regenerate a hand. Inpainting is where diffusion earns its keep.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## The Problem

A client sends a perfect product photo with a distracting sign in the background. You want to erase the sign and leave everything else pixel-identical. You cannot run text-to-image from scratch — the result will have a different color, different lighting, different product angle. You want to regenerate *only* the masked region, and you want the regeneration to respect the surrounding context.

That is inpainting. Variants:

- **Inpainting.** Regenerate inside a mask, keep outside pixels.
- **Outpainting.** Regenerate outside a mask (or beyond the canvas), keep inside.
- **Image editing.** Regenerate the whole image but keep semantic or structural fidelity to the original (SDEdit, InstructPix2Pix).

Every diffusion pipeline in 2026 ships an inpainting mode. Flux.1-Fill, Stable Diffusion Inpaint, SDXL-Inpaint, DALL-E 3 Edit. They work on the same principle.

## The Concept

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### The naive approach (and why it's wrong)

Run standard text-to-image with a mask. At each sampling step, replace the unmasked region of the noisy latent with the forward-diffused clean image. It works... badly. Boundary artifacts bleed through because the model has no information about what is in the masked region.

### The proper inpainting model

Train a modified U-Net that takes 9 input channels instead of 4:

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

The extra channels are a copy of the VAE-encoded source image plus a single-channel mask. At training time, you randomly mask regions of the image and train the model to denoise only the masked region while the unmasked region is given as a clean conditioning signal. At inference, the model can "see" what surrounds the masked region and produces coherent completions.

SD-Inpaint, SDXL-Inpaint, Flux-Fill all use this 9-channel (or analog) input. Diffusers `StableDiffusionInpaintPipeline`, `FluxFillPipeline`.

### SDEdit (Meng et al., 2022) — free editing

Add noise to the source image up to some intermediate `t`, then run the reverse chain from `t` down to 0 with a new prompt. No retraining. The choice of starting `t` trades fidelity for creative freedom:

- `t/T = 0.3` → nearly identical to source, small stylistic changes
- `t/T = 0.6` → moderate edits, preserves coarse structure
- `t/T = 0.9` → generated from near-noise, minimal source preservation

### InstructPix2Pix (Brooks et al., 2023)

Fine-tune a diffusion model on `(input_image, instruction, output_image)` triples. At inference, condition on both the input image and a text instruction ("make it sunset", "add a dragon"). Two CFG scales: image scale and text scale.

### RePaint (Lugmayr et al., 2022)

Keep a standard unconditional diffusion model. At each reverse step, resample — jump back to a noisier state occasionally and regenerate. Avoids boundary artifacts. Used when you don't have a trained inpainting model.




## Further Reading

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) — training-free inpainting.
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) — SDEdit.
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) — text-instruction editing.
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643) — SAM, the mask source.
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) — video SAM.
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) — attention-level editing.
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) — 2024 tooling.
