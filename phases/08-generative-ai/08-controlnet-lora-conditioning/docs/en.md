# ControlNet, LoRA & Conditioning

> Text alone is a clumsy control signal. ControlNet lets you clone a pretrained diffusion model and steer it with a depth map, pose skeleton, scribble, or edge image. LoRA lets you fine-tune a 2B-parameter model by training 10 million parameters. Together they turned Stable Diffusion from a toy into the 2026 image pipeline that ships at every agency.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — for LoRA foundation)
**Time:** ~75 minutes

## Learning Objectives

- Explain the probabilistic mechanism behind ControlNet, LoRA & Conditioning
- Implement the lesson's core generative step from first principles
- Inspect samples and intermediate states to diagnose generation behavior
- Compare quality, diversity, stability, and compute trade-offs

## The Problem

A prompt like "a woman in a red dress walking a dog on a busy street" gives the model no information about *where* the dog is, *what pose* the woman is in, or *the perspective* of the street. Text pins down about 10% of what you need to specify an image. The rest is visual and cannot be described efficiently in words.

Training a new conditional model from scratch for every signal (pose, depth, canny, segmentation) is prohibitive. You want to keep the 2.6B-param SDXL backbone frozen, attach a small side-network that reads the conditioning, and have it nudge the backbone's intermediate features. That is ControlNet.

You also want to teach the model new concepts (your face, your product, your style) without retraining the full model. You want a 100x smaller delta. That is LoRA — low-rank adapters that plug into existing attention weights.

ControlNet + LoRA + text = the 2026 practitioner's toolkit. Most production image pipelines layer 2-5 LoRAs, 1-3 ControlNets, and an IP-Adapter on top of an SDXL / SD3 / Flux base.

## The Concept

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### ControlNet (Zhang et al., 2023)

Take a pretrained SD. *Clone* the encoder half of the U-Net. Freeze the original. Train the clone to accept an extra conditioning input (edges, depth, pose). Connect the clone back to the decoder half of the original with *zero-convolution* skip connections (1×1 convs initialized to zero — start as a no-op, learn a delta).

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

Zero-conv init means ControlNet starts as identity — no harm even before training. Train on 1M (prompt, condition, image) triples with the standard diffusion loss.

Per-modality ControlNets ship as small side models (~360M for SDXL, ~70M for SD 1.5). You can compose them at inference:

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### LoRA (Hu et al., 2021)

For any linear layer `W ∈ R^{d×d}` in the model, freeze `W` and add a low-rank delta:

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

with `r << d`. Rank 4-16 is standard for attention, rank 64-128 for heavy fine-tunes. Number of new parameters: `2 · d · r` instead of `d²`. For SDXL attention with `d=640`, `r=16`: 20k params per adapter instead of 410k — a 20x reduction. Across the whole model: a LoRA is usually 20-200MB vs the base 5GB.

At inference you can scale the LoRA: `W' = W + α · B @ A`. `α = 0.5-1.5` is normal. Multiple LoRAs stack additively (with the usual caveat that they interact in non-linear ways).

### IP-Adapter (Ye et al., 2023)

A tiny adapter that accepts an *image* as conditioning (alongside text). Uses the CLIP image encoder to produce image tokens, injects them into cross-attention alongside text tokens. ~20MB per base model. Lets you do "generate an image in the style of this reference" without a LoRA.

## Composability matrix

| Tool | What it controls | Size | When to use |
|------|------------------|------|-------------|
| ControlNet | Spatial structure (pose, depth, edges) | 70-360MB | Exact layout, composition |
| LoRA | Style, subject, concept | 20-200MB | Personalization, style |
| IP-Adapter | Style or subject from reference image | 20MB | No text can describe the look |
| Textual Inversion | Single concept as a new token | 10KB | Legacy, mostly replaced by LoRA |
| DreamBooth | Full fine-tune on a subject | 2-5GB | Strong identity, high compute |
| T2I-Adapter | Lighter ControlNet alternative | 70MB | Edge devices, inference budget |

ControlNet ≈ spatial. LoRA ≈ semantic. Use both.




## Further Reading

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) — ControlNet.
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) — LoRA (originally for LLMs; ports to diffusion).
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) — IP-Adapter.
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) — lighter alternative to ControlNet.
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242) — DreamBooth.
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) — reference pipelines.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the probabilistic mechanism behind ControlNet, LoRA & Conditioning.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the lesson's core generative step from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect samples and intermediate states to diagnose generation behavior.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the probabilistic mechanism behind ControlNet, LoRA & Conditioning,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect samples and intermediate states to diagnose generation behavior,” and cite a repeatable check rather than relying on visual inspection alone.
