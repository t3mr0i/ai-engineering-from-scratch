# Capstone 07 — End-to-End Fine-Tuning Pipeline (Data to SFT to DPO to Serve)

> An 8B model trained on your own data, DPO-aligned on your own preferences, quantized, speculative-decoded, and served at measurable $/1M tokens. The 2026 open stack is Axolotl v0.8, TRL 0.15, Unsloth for iteration, GPTQ/AWQ/GGUF for quantization, vLLM 0.7 with EAGLE-3 for serving. The capstone is to run the whole pipeline reproducibly — YAML in, served endpoint out — and publish a model card under the 2026 Model Openness Framework.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 (ML), Phase 3 (DL), Phase 7 (transformers), Phase 10 (LLMs from scratch), Phase 11 (LLM engineering), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 hours

## Learning Objectives

- Define measurable acceptance criteria for Capstone 07 — End-to-End Fine-Tuning Pipeline (Data to SFT to DPO to Serve)
- Integrate the required components into one self-terminating workflow
- Exercise happy paths, edge cases, and failure recovery with reproducible fixtures
- Package the verified result as a reusable curriculum artifact

## Problem

Every serious AI team in 2026 keeps a fine-tuning pipeline on tap. Not because they ship a frontier base model, but because downstream adaptation — domain SFT, DPO against labeled preferences, distilled drafts for speculative decoding, serving with EAGLE-3 — is where the measurable wins live. Axolotl v0.8 handles multi-GPU SFT configs. TRL 0.15 handles DPO and GRPO. Unsloth gets you fast single-GPU iteration. vLLM 0.7 with EAGLE-3 pushes decode throughput 2-3x without quality loss. The tooling works; the craft is in the YAMLs, the data hygiene, and the eval discipline.

You will run an 8B base (Llama 3.3, Qwen3, or Gemma 3) through SFT then DPO on task-specific data, quantize for serving, and measure gains against lm-evaluation-harness, RewardBench-2, MT-Bench-v2, and MMLU-Pro. You will produce a model card under the 2026 Model Openness Framework. The point is reproducibility — one command reruns the whole pipeline end to end.

## Concept

The pipeline has five stages. **Data**: dedup (MinHash / Datatrove), quality filter (Nemotron-CC style classifier), PII scrub, split-hygiene check against public benchmark contamination. **SFT**: Axolotl YAML, ZeRO-3 on 8xH100, cosine schedule, packed sequences, 2-3 epochs. **DPO or GRPO**: TRL config, 1 epoch, preference pairs either human-labeled or model-judged, beta tuning. **Quantize**: GPTQ + AWQ + GGUF for deployment flexibility. **Serve**: vLLM 0.7 with EAGLE-3 speculative heads (or SGLang with SpecForge), K8s deployment, HPA on queue-wait.

Ablations are the deliverable: SFT-only vs SFT+DPO vs SFT+GRPO on three task-specific benchmarks. Serving metrics: tokens/s at batch 1 / 8 / 32, EAGLE-3 acceptance rate, $/1M tokens. Safety eval: Llama Guard 4 pass rate. Model card: bias evaluations, reproducibility seeds, data licensing.

## Architecture

```
raw data (HF datasets + internal)
    |
    v
Datatrove dedup + Nemotron-CC quality filter + PII scrub
    |
    v
split hygiene (MMLU-Pro contamination check)
    |
    v
Axolotl SFT config (YAML)  ---> 8xH100, ZeRO-3
    |
    v
TRL DPO / GRPO config       ---> 4xH100, 1 epoch
    |
    v
GPTQ + AWQ + GGUF quantize
    |
    v
vLLM 0.7 + EAGLE-3 speculative decoding
    |
    v
K8s deployment, HPA on queue-wait
    |
    v
lm-eval-harness + RewardBench-2 + MT-Bench-v2 + MMLU-Pro
    |
    v
model card (2026 MOF) + safety eval (Llama Guard 4)
```

## Stack

- Data: Datatrove for dedup, Nemotron-CC classifier for quality, Presidio for PII
- Base: Llama 3.3 8B, Qwen3 14B, or Gemma 3 12B
- SFT: Axolotl v0.8 with ZeRO-3, Flash Attention 3, packed sequences
- Preference tuning: TRL 0.15 for DPO or GRPO; Unsloth for single-GPU iteration
- Quantization: GPTQ (Marlin), AWQ, GGUF via llama.cpp
- Serving: vLLM 0.7 with EAGLE-3 speculative decoding (or SGLang 0.4 + SpecForge)
- Eval: lm-evaluation-harness, RewardBench-2, MT-Bench-v2, MMLU-Pro
- Safety eval: Llama Guard 4, ShieldGemma-2
- Infrastructure: Kubernetes + NVIDIA device plugin, HPA on queue-wait metric
- Observability: W&B for training, Langfuse for inference




## Further Reading

- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) — the reference SFT / DPO trainer
- [TRL documentation](https://huggingface.co/docs/trl) — DPO and GRPO reference implementations
- [Unsloth](https://github.com/unslothai/unsloth) — single-GPU iteration reference
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) — GRPO methodology
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) — reference serving stack
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) — alternate speculative-decoding trainer
- [Model Openness Framework 2026](https://isocpp.org/) — the open-release grading standard
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) — canonical eval runner

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Define measurable acceptance criteria for Capstone 07 — End-to-End Fine-Tuning Pipeline (Data to SFT to DPO to Serve).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Integrate the required components into one self-terminating workflow.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Exercise happy paths, edge cases, and failure recovery with reproducible fixtures.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Define measurable acceptance criteria for Capstone 07 — End-to-End Fine-Tuning Pipeline (Data to SFT to DPO to Serve),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Exercise happy paths, edge cases, and failure recovery with reproducible fixtures,” and cite a repeatable check rather than relying on visual inspection alone.
