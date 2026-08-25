# Edge Inference — Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson

> The core edge constraint is memory bandwidth, not compute. Mobile DRAM sits at 50-90 GB/s; datacenter HBM3 clears 2-3 TB/s — a 30-50x gap. Decode is memory-bound so the gap is decisive. In 2026 the landscape splits four ways. Apple M4/A18 Neural Engine peaks at 38 TOPS with unified memory (no CPU↔NPU copy). Qualcomm Snapdragon X Elite / 8 Gen 4 Hexagon hits 45 TOPS. WebGPU + WebLLM runs Llama 3.1 8B (Q4) at ~41 tok/s on M3 Max (roughly 70-80% of native); 17.6k GitHub stars, OpenAI-compatible API, ~70-75% mobile coverage. NVIDIA Jetson Orin Nano Super (8GB) fits Llama 3.2 3B / Phi-3; AGX Orin runs gpt-oss-20b via vLLM at ~40 tok/s; Jetson T4000 (JetPack 7.1) is 2x AGX Orin. TensorRT Edge-LLM supports EAGLE-3, NVFP4, chunked prefill — shown at CES 2026 by Bosch, ThunderSoft, MediaTek.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 17 · 04 (vLLM Serving Internals), Phase 17 · 09 (Production Quantization)
**Time:** ~60 minutes

## Learning Objectives

- Explain why mobile LLM inference is memory-bandwidth-bound and compute is secondary.
- Enumerate the four edge targets (Apple ANE, Qualcomm Hexagon, WebGPU/WebLLM, NVIDIA Jetson) and match each to a use case.
- Name the 2026 WebGPU coverage gap (Firefox Android catching up) and the Safari iOS 26 landing.
- Pick a quantization format per target (Core ML INT4 + FP16 for ANE, QNN INT8/INT4 for Hexagon, WebGPU Q4 for browser, NVFP4 for Jetson Thor).

## The Problem

A customer wants an on-device chatbot: voice-first, private-by-default, works offline. On a MacBook Pro M3 Max, Llama 3.1 8B Q4 runs at ~55 tok/s — fine. On an iPhone 16 Pro, the same model runs at 3 tok/s — not fine. On a mid-range Android with Snapdragon 8 Gen 3, 7 tok/s. In the browser via WebGPU on Chrome Android v121+, 4-8 tok/s depending on the device.

The throughput variance is not a porting issue. It is the bandwidth gap times the quantization format times whether the NPU is accessible from user-space. Edge inference in 2026 is four different problems with four different solutions.

## The Concept

### Bandwidth is the real ceiling

Decode reads the full set of weights for every token. One 7B model in Q4 is 3.5 GB. Reading 3.5 GB at 50 GB/s takes 70 ms — a theoretical ceiling of ~14 tok/s. At 90 GB/s (high-end mobile DRAM) the ceiling moves to ~25 tok/s. No amount of compute helps below this number.

Datacenter HBM3 at 3 TB/s clears the same 3.5 GB in 1.2 ms — ceiling is 830 tok/s. Same model, same weights. Different memory subsystem.

### Apple Neural Engine (M4 / A18)

- Up to 38 TOPS. Unified memory (CPU and ANE share the same pool) — no copy overhead.
- Access via Core ML + `.mlmodel` compiled models, or via Metal Performance Shaders (MPS) through PyTorch.
- Llama.cpp Metal backend uses MPS, not ANE directly; native ANE requires Core ML conversion.
- Best practical path for iOS apps in 2026: Core ML with INT4 weights + FP16 activations.

### Qualcomm Hexagon (Snapdragon X Elite / 8 Gen 4)

- Up to 45 TOPS. Integrated with CPU and GPU in the SoC but separate memory domain.
- QNN (Qualcomm Neural Network) SDK and AI Hub provide conversion from PyTorch/ONNX.
- Chat templates, Llama 3.2, Phi-3 all ship as first-class artifacts on AI Hub.

### Intel / AMD NPUs (Lunar Lake, Ryzen AI 300)

- 40-50 TOPS. Software lags behind Apple/Qualcomm; OpenVINO is improving but niche.
- Best for Windows ARM copilot apps; native on AMD/Intel desktops for local-first.

### WebGPU + WebLLM

- Run models in the browser via WebGPU compute shaders; no install.
- Llama 3.1 8B Q4 at ~41 tok/s on M3 Max — roughly 70-80% of native via same backend.
- 17.6k GitHub stars on WebLLM; OpenAI-compatible JS API; Apache 2.0.
- 2026 coverage: Chrome Android v121+, Safari iOS 26 GA, Firefox Android still catching up. Overall ~70-75% mobile coverage.

### NVIDIA Jetson family

- Orin Nano Super (8GB): fits Llama 3.2 3B, Phi-3 at good tok/s.
- AGX Orin: runs gpt-oss-20b via vLLM at ~40 tok/s.
- Thor / T4000 (JetPack 7.1): 2x AGX Orin performance, EAGLE-3 and NVFP4 supported.
- TensorRT Edge-LLM (2026) supports EAGLE-3 speculative decoding, NVFP4 weights, chunked prefill — the datacenter optimizations ported to edge.

### Quantization choice per target

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC (q4f16_1) | Use `mlc_llm convert_weight` + compiled `.wasm`; GGUF is not supported |
| Jetson Orin Nano | Q4 GGUF or TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### The long-context trap on edge

Llama 3.1's 128K context is a datacenter feature. On a phone with 8 GB RAM, 4 GB model + 2 GB KV cache for 32K tokens + OS overhead = OOM. Edge deployments keep context at 4K-8K unless aggressive KV quantization (Q4 KV) is accepted.

### Voice is the killer app

Voice agents are latency-sensitive (first token < 500 ms). Local inference eliminates network latency entirely. Combine with speech-to-text (Whisper Turbo variants run on edge) and edge inference becomes the production-quality voice loop.

### Numbers you should remember

- Apple M4 / A18 ANE: 38 TOPS.
- Qualcomm Hexagon SD X Elite: 45 TOPS.
- WebLLM M3 Max: ~41 tok/s on Llama 3.1 8B Q4.
- AGX Orin: ~40 tok/s on gpt-oss-20b via vLLM.
- Datacenter-edge bandwidth gap: 30-50x.
- WebGPU mobile coverage: ~70-75% (Firefox Android lagging).



## Build It

Reconstruct **Edge Inference — Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson** by following `Target` on the reported device check on CPU. Run `python3 main.py` and verify that the report distinguishes an available device from an unavailable one and records the selected backend.

## Use It

Call `Target` from a small caller with the reported device check on CPU. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-edge-target-picker.md` with the command `python3 main.py`, the accepted input shape (the reported device check on CPU), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) — landscape and benchmarks.
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) — Orin / AGX / Thor.
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/) — 2026 edge port announcement.
- [WebLLM (arXiv:2412.15803)](https://arxiv.org/html/2412.15803v2) — design and benchmarks.
- [Apple Core ML](https://developer.apple.com/documentation/coreml) — ANE-native conversion.
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) — pre-converted models for Hexagon.

## Exercises

Use `Target` as the trace: start from the reported device check on CPU, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the reported device check on CPU. Follow `Target`, `ceiling`, `efficiency`. Expect the report distinguishes an available device from an unavailable one and records the selected backend; capture the first printed shape, metric, status, or summary field and state which part supports **Explain why mobile LLM inference is memory-bandwidth-bound and compute is secondary.**.
2. **Vary one named input.** Repeat the command after changing only the selected device backend: use the same check with CUDA/MPS unavailable. Predict the direction of the change, then compare the two output values. Explain why **Enumerate the four edge targets (Apple ANE, Qualcomm Hexagon, WebGPU/WebLLM, NVIDIA Jetson) and match each to a use case.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation a machine with no visible accelerator. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Name the 2026 WebGPU coverage gap (Firefox Android catching up) and the Safari iOS 26 landing.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-edge-target-picker.md` and add a worked example using the reported device check on CPU. Include the input contract, one expected output field, and a named acceptance check for **Pick a quantization format per target (Core ML INT4 + FP16 for ANE, QNN INT8/INT4 for Hexagon, WebGPU Q4 for browser, NVFP4 for Jetson Thor).**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Edge Inference — Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson** should contain:

- the `python3 main.py` output for the reported device check on CPU, with `Target`, `ceiling`, `efficiency` traced to the value or shape that supports **Explain why mobile LLM inference is memory-bandwidth-bound and compute is secondary.**;
- a before/after comparison for the selected device backend, where the same check with CUDA/MPS unavailable changes the observation in the direction predicted by **Enumerate the four edge targets (Apple ANE, Qualcomm Hexagon, WebGPU/WebLLM, NVIDIA Jetson) and match each to a use case.**;
- a recorded result for a machine with no visible accelerator that matches the implementation’s validation or empty-result contract and explains the evidence for **Name the 2026 WebGPU coverage gap (Firefox Android catching up) and the Safari iOS 26 landing.**; and
- an updated `outputs/skill-edge-target-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Pick a quantization format per target (Core ML INT4 + FP16 for ANE, QNN INT8/INT4 for Hexagon, WebGPU Q4 for browser, NVFP4 for Jetson Thor).**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
