# Video Generation

> An image is a 2-D tensor. A video is a 3-D one. The theory is the same; the compute is 10-100x harder. OpenAI's Sora (Feb 2024) proved it was possible. By 2026 Veo 2, Kling 1.5, Runway Gen-3, Pika 2.0, and WAN 2.2 ship production video from text at 1080p — and the open-weights stack (CogVideoX, HunyuanVideo, Mochi-1, WAN 2.2) is 12 months behind.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 7 · 09 (ViT), Phase 8 · 06 (DDPM)
**Time:** ~45 minutes

## The Problem

A 10-second 1080p video at 24fps is 240 frames of 1920×1080×3 pixels. That's ~1.5 GB of raw data per clip. Pixel-space diffusion is infeasible. You need:

1. **Spatiotemporal compression.** A VAE that encodes videos, not frames, into a sequence of spatial-temporal patches.
2. **Temporal coherence.** Frames need to share content, lighting, and object identity over seconds. The net has to model motion.
3. **Compute budget.** Video training is 10-100x more expensive than image for the same model size.
4. **Conditioning.** Text, image (first-frame), audio, or another video. Most production models accept all four.

The architecture that solved this is the **Diffusion Transformer (DiT)** applied to spatiotemporal patches, trained on huge (prompt, caption, video) datasets. Same diffusion loss as Lesson 06.

## The Concept

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### Patchify

Encode the video with a 3D VAE (learned spatiotemporal compression). The latent is shape `[T_latent, H_latent, W_latent, C_latent]`. Split into patches of size `[t_p, h_p, w_p]`. For Sora-style models, `t_p = 1` (per-frame patches) or `t_p = 2` (every two frames). A 10-second 1080p video compresses to ~20,000-100,000 patches.

### Spatiotemporal DiT

A transformer processes the flat sequence of patches. Each patch has a 3D positional embedding (time + y + x). Attention is usually factorized:

- **Spatial attention** within each frame's patches.
- **Temporal attention** across frames at the same spatial location.
- **Full 3D attention** is 16-100x more expensive; used only at low resolution or in research.

### Text conditioning

Cross-attention with a large text encoder (T5-XXL for Sora, CogVideoX-5B uses T5-XXL). Long prompts matter — Sora's training set had GPT-generated dense re-captions averaging 200 tokens per clip.

### Training

Standard diffusion loss (ε or v prediction) over spatiotemporal latents. Data: web video + ~100M curated clips + synthetic text captions. Compute: 10,000+ GPU hours for even a small research run; Sora-scale is 100,000+.

## The 2026 production landscape

| Model | Date | Max duration | Max res | Open weights? | Notable |
|-------|------|--------------|---------|---------------|---------|
| Sora (OpenAI) | 2024-02 | 60s | 1080p | No | First model to show world simulator properties at scale |
| Sora Turbo | 2024-12 | 20s | 1080p | No | Production Sora at 5x faster inference |
| Veo 2 (Google) | 2024-12 | 8s | 4K | No | Highest quality + physics in 2025 |
| Veo 3 | 2025 Q3 | 15s | 4K | No | Native audio and stronger camera control |
| Kling 1.5 / 2.1 (Kuaishou) | 2024-2025 | 10s | 1080p | No | Best human motion in 2025 Q1 |
| Runway Gen-3 Alpha | 2024-06 | 10s | 768p | No | Professional video tools on top |
| Pika 2.0 | 2024-10 | 5s | 1080p | No | Strongest character consistency |
| CogVideoX (THUDM) | 2024 | 10s | 720p | Yes (2B, 5B) | First open 5B-scale video |
| HunyuanVideo (Tencent) | 2024-12 | 5s | 720p | Yes (13B) | Open SOTA late 2024 |
| Mochi-1 (Genmo) | 2024-10 | 5.4s | 480p | Yes (10B) | Most permissively licensed |
| WAN 2.2 (Alibaba) | 2025-07 | 5s | 720p | Yes | Strongest open model mid-2025 |

Open weights are closing the gap faster than in the image space: HunyuanVideo + WAN 2.2 LoRAs already power most open-source workflows by mid-2026.




## Further Reading

- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) — Sora technical report.
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072) — CogVideoX.
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603) — HunyuanVideo.
- [Genmo (2024). Mochi-1 Technical Report](https://www.genmo.ai/blog/mochi) — Mochi-1.
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/) — open SOTA mid-2025.
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) — the seminal video diffusion paper.
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) — Stable Video Diffusion's ancestor.
