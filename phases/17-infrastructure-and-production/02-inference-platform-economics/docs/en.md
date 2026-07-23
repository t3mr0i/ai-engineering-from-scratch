# Inference Platform Economics — Fireworks, Together, Baseten, Modal, Replicate, Anyscale

> The 2026 inference market is no longer GPU time rental. It bifurcates into custom silicon (Groq, Cerebras, SambaNova), GPU platforms (Baseten, Together, Fireworks, Modal), and API-first marketplaces (Replicate, DeepInfra). Fireworks raised price $1/hr per GPU on May 1, 2026, and $4B valuation on 10T+ tokens/day tells you the volume-driven model works. Baseten closed $300M Series E at $5B in January 2026. The competitive positioning rule is simple: Fireworks optimizes latency, Together optimizes catalog breadth, Baseten optimizes enterprise polish, Modal optimizes Python-native DX, Replicate optimizes multimodal reach, Anyscale optimizes distributed Python. This lesson gives you a matrix you can hand a founder.

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**Prerequisites:** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 04 (vLLM Serving Internals)
**Time:** ~60 minutes

## Learning Objectives

- Name the three market segments (custom silicon, GPU platforms, API-first) and map each vendor to a segment.
- Explain why the "per-token" API pricing model compresses toward the serving engine's cost curve, not the hardware's.
- Compute effective cost per request across at least three vendors and explain when per-minute (Baseten, Modal) beats per-token.
- Identify which platform is the right default for a given workload (serverless bursty, steady high-throughput, fine-tuned variants, multimodal).

## The Problem

You evaluated managed hyperscaler platforms. You decided you need a narrower, faster provider — Fireworks for latency, Together for breadth, Baseten for a fine-tuned custom model. Now you have six real choices and the pricing pages do not line up. Fireworks shows $/M tokens; Baseten shows $/minute; Modal shows $/second; Replicate shows $/prediction. You cannot compare them head-to-head without modeling the workload.

Worse, the business model behind each pricing page is different. Fireworks runs its own custom engine (FireAttention) on shared GPUs; the per-token rate reflects their utilization curve. Baseten gives you Truss + dedicated GPUs; per-minute reflects exclusivity. Modal is true Python serverless — per-second billing with sub-second cold starts. Same output (an LLM response), three different cost functions.

This lesson models the six and tells you when each wins.

## The Concept

### The three segments

**Custom silicon** — Groq (LPU), Cerebras (WSE), SambaNova (RDU). Typically 5-10x faster decode than a GPU-based cluster on the same model. Higher per-token price (Groq was ~$0.99/M on Llama-70B late 2025) but unbeatable for latency-sensitive use cases. Groq is the production pick for voice agents and real-time translation.

**GPU platforms** — Baseten, Together, Fireworks, Modal, Anyscale. Run on NVIDIA (H100, H200, B200 in 2026) or sometimes AMD. The economic layer between "raw GPU rental" (RunPod, Lambda) and "hyperscaler managed service" (Bedrock).

**API-first marketplaces** — Replicate, DeepInfra, OpenRouter, Fal. Broad catalog, pay-per-prediction or pay-per-second, emphasize time-to-first-call.

### Fireworks — latency-optimized GPU platform

- FireAttention engine (custom); marketed as 4x lower latency than vLLM on equivalent configs.
- Batch tier at ~50% of serverless rate for non-interactive workloads.
- Fine-tuned model served at the same rate as the base model — a real differentiator versus providers that charge a premium for your LoRA.
- Mid-2026: raised on-demand GPU rental $1/hour effective May 1, 2026. Volume pricing negotiable at scale.
- Financial signal: $4B valuation, 10T+ tokens/day handled.

### Together — breadth-optimized

- 200+ models including open-source releases within days of upstream publication.
- 50-70% cheaper than Replicate on equivalent LLM models — the "AI Native Cloud" positioning is volume and catalog.
- Inference + fine-tuning + training in one API.

### Baseten — enterprise-polish-optimized

- Truss framework: model packaging with dependencies, secrets, serving config in one manifest.
- GPU range from T4 through B200. Per-minute billing with reasonable cold-start mitigation.
- SOC 2 Type II, HIPAA-ready. Common fintech and healthcare pick.
- $5B valuation, January 2026 Series E ($300M from CapitalG, IVP, NVIDIA).

### Modal — Python-native-optimized

- Infrastructure-as-code in pure Python. Decorate a function with `@modal.function(gpu="A100")` and deploy with one command.
- Per-second billing. Cold starts 2-4s with pre-warming; <1s for small models.
- $87M Series B at $1.1B valuation (2025). Strongest developer experience score in independent surveys.

### Replicate — multimodal breadth

- Pay-per-prediction. The default platform for image, video, and audio models.
- Integration ecosystem (Zapier, Vercel, CMS plugins).
- Less competitive on LLM per-token rates but wins on multimodal variety.

### Anyscale — Ray-native

- Built on Ray; RayTurbo is Anyscale's proprietary inference engine (competes with vLLM).
- Best for distributed Python workloads where the inference step is one node in a larger graph.
- Managed Ray clusters; tight integration with Ray AIR and Ray Serve.

### Per-token versus per-minute — when each wins

Per-token makes sense when the workload is latency-insensitive and bursty — you only pay for what you use. Per-minute makes sense when utilization is high and predictable — you beat per-token once you're saturating the GPU.

Rough rule: for workloads above ~30% sustained utilization of a dedicated GPU, per-minute (Baseten, Modal) starts to beat per-token (Fireworks, Together). Below that, per-token wins because you avoid paying for idle.

### Custom engine is the real moat

Every platform above vLLM and SGLang claims a custom engine. FireAttention, RayTurbo, Baseten's inference stack. Custom-engine claims shade marketing — the honest framing is that vLLM + SGLang represent about 80% of production open-source inference, and the differentiators at the platform layer are DX, attribution, and SLAs.

### Numbers you should remember

- Fireworks GPU rental: $1/hr raise effective May 1, 2026.
- Fireworks claim: 4x lower latency than vLLM on equivalent configs.
- Together: 50-70% cheaper than Replicate on LLMs.
- Baseten valuation: $5B (Series E, Jan 2026, $300M round).
- Modal valuation: $1.1B (Series B, 2025).
- Per-minute beats per-token above ~30% sustained utilization.



## Further Reading

- [Fireworks Pricing](https://fireworks.ai/pricing) — per-token rates, batch tier, GPU rental.
- [Baseten Pricing](https://www.baseten.co/pricing/) — per-minute rates, committed capacity, enterprise tiers.
- [Modal Pricing](https://modal.com/pricing) — per-second GPU rates and free tier.
- [Together AI Pricing](https://www.together.ai/pricing) — model catalog and per-token rates.
- [Anyscale Pricing](https://www.anyscale.com/pricing) — RayTurbo and managed Ray pricing.
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) — comparative assessment.
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared) — vendor landscape.
