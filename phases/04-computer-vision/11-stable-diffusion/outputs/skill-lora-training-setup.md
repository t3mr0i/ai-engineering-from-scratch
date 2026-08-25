---
name: skill-lora-matrix-contract
description: Check a low-rank adaptation update before attaching it to a model
version: 1.0.0
phase: 4
lesson: 11
tags: [diffusion, lora, parameter-efficient-tuning]
---

# LoRA update checklist

For a base matrix `(out,in)`, require `down=(rank,in)` and `up=(out,rank)`. Record `scale`, the number of trainable low-rank entries, and the untouched base weights. Verify `base + scale*(up @ down)` is finite and shape-compatible. Keep checkpoint names, VAE scaling, and scheduler settings outside this local fixture unless they come from the actual model's documentation.
