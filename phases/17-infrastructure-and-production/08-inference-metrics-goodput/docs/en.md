# Inference Metrics — TTFT, TPOT, ITL, Goodput, P99

> Four metrics decide whether an inference deployment is working. TTFT is prefill plus queue plus network. TPOT (equivalently ITL) is the memory-bound decode cost per token. End-to-end latency is TTFT plus TPOT times output length. Throughput is tokens per second aggregated across the fleet. But the one that matters for product is goodput — the fraction of requests that met every SLO simultaneously. High throughput at low goodput means you are processing tokens that never reach users on time. Reference numbers for Llama-3.1-8B-Instruct on TRT-LLM in 2026: mean TTFT 162 ms, mean TPOT 7.33 ms, mean E2E 1,093 ms. Always report P50, P90, P99 — never just mean. And watch the measurement trap: GenAI-Perf excludes TTFT from ITL calculation, LLMPerf includes it; two tools disagree on TPOT for the same run.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 17 · 04 (vLLM Serving Internals)
**Time:** ~60 minutes

## Learning Objectives

- Define TTFT, TPOT, ITL, E2E, throughput, and goodput precisely and name the component each one measures.
- Explain why mean is the wrong statistic for LLM serving and how to read P50/P90/P99.
- Construct an SLO multi-constraint (e.g. TTFT<500 ms AND TPOT<15 ms AND E2E<2 s) and compute goodput against it.
- Name two benchmark tools that disagree on TPOT for the same run and explain why.

## The Problem

"Our throughput is 15,000 tokens per second." So what? If 40% of requests blew past 2 seconds end-to-end, users abandoned the session. Throughput alone does not tell you whether the product works.

Inference has multiple axes of latency and each one fails differently. Prefill is compute-bound and scales with prompt length. Decode is memory-bound and scales with batch size. Queuing delay is an operational problem. Network is a physical-distance problem. You need distinct metrics for each, and you need percentiles, and you need a single composite that says "did the user get what they expected" — that is goodput.

## The Concept

### TTFT — time to first token

`TTFT = queue_time + network_request + prefill_time`

Prefill dominates when prompts are long. On Llama-3.3-70B FP8 on H100, a 32k prompt takes ~800 ms of pure prefill. Queue time is scheduler behavior under load. Network request is wire time including TLS. TTFT is the latency the user sees before anything streams back.

### TPOT / ITL — inter-token latency

Many names for one quantity. `TPOT` (time per output token), `ITL` (inter-token latency), `decode latency per token` — all the same. It is the time between consecutive streamed tokens after the first.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

On the same Llama-3.3-70B H100 stack with chunked prefill, TPOT mean ~7 ms. Without chunked prefill, during a long prefill on a neighboring sequence, TPOT can spike to 50 ms. Watch P99, not mean.

### E2E latency

`E2E = TTFT + TPOT * output_tokens + network_response`

For long outputs (>500 tokens), E2E is TPOT-dominated. For short outputs with long prompts, E2E is TTFT-dominated. Report output-length-conditioned E2E.

### Throughput

`throughput = total_output_tokens / elapsed_time`

Aggregate metric. Tells you fleet efficiency. Does not tell you individual-request health.

### Goodput — the metric you actually care about

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

The SLO is a multi-constraint. A request is "good" only if every constraint held. Goodput is the share. High throughput at 60% goodput is failure. Lower throughput at 99% goodput is the target.

In 2026, goodput is the metric used in MLPerf Inference v6.0 submissions and in internal SLA tracking at AI platform providers.

### Why mean is the wrong statistic

LLM latency distributions are right-skewed. A decode batch with one long-prefill neighbor can ship 500 tokens with TPOT ~7 ms and 20 tokens with TPOT ~60 ms. Mean TPOT is 9 ms. P99 TPOT is 65 ms. Users hit the P99 regularly — that is why they leave.

Always report the triple (P50, P90, P99). For user experience, P99 is the one you optimize.

### Reference numbers — Llama-3.1-8B-Instruct on TRT-LLM, 2026

- mean TTFT: 162 ms
- mean TPOT: 7.33 ms
- mean E2E: 1,093 ms
- P99 TPOT: varies 10-25 ms depending on chunked-prefill configuration.

These are the published NVIDIA reference points. They change with model size (70B would show 3-5x), hardware (H100 vs B200 ~3x), and load.

### The measurement trap

Two of the most-used 2026 benchmark tools disagree on TPOT for the same run:

- **NVIDIA GenAI-Perf**: excludes TTFT from the ITL calculation. ITL starts from token 2.
- **LLMPerf**: includes TTFT. ITL starts from token 1.

For a request with TTFT 500 ms and 100 output tokens in 700 ms total decode, GenAI-Perf reports `ITL = 700/99 = 7.07 ms`, LLMPerf reports `ITL = 1200/100 = 12.00 ms`. Tool choice changes the number.

Always state which tool. Always publish the definition.

### Constructing an SLO

A reasonable consumer-facing SLO for a 70B chat model in 2026:

- TTFT P99 <= 800 ms.
- TPOT P99 <= 25 ms.
- E2E P99 <= 3 s for <300-token outputs.
- Goodput target >= 99%.

Enterprise SLOs tighten TTFT (200-400 ms) and loosen E2E. The point is to write them down, measure all three, and track goodput as a single composite.

### How to measure

- Run real traffic or realistic synthetic (LLMPerf with `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`).
- Target 2x peak concurrency for the benchmark run.
- Run 30-50 iterations, take percentiles of the combined sample.
- Publish with tool name, tool version, model, hardware, concurrency, prompt distribution.



## Build It

Reconstruct **Inference Metrics — TTFT, TPOT, ITL, Goodput, P99** by following `RequestTrace` on x=0.5 with the demo defaults. Run `python3 main.py` and verify that the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump.

## Use It

Call `RequestTrace` from a small caller with x=0.5 with the demo defaults. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-slo-goodput-gate.md` with the command `python3 main.py`, the accepted input shape (x=0.5 with the demo defaults), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) — canonical definition of TTFT, ITL, TPOT.
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) — alternative definitions and measurement recipe.
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) — applied measurement on real deployments.
- [LLMPerf](https://github.com/ray-project/llmperf) — Ray-based open-source benchmark.
- [GenAI-Perf](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/client/src/c++/perf_analyzer/genai-perf/README.html) — NVIDIA's benchmark tool.
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) — the industry-accepted goodput-based benchmark.

## Exercises

Use `RequestTrace` as the trace: start from x=0.5 with the demo defaults, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using x=0.5 with the demo defaults. Follow `RequestTrace`, `ttft_ms`, `e2e_ms`. Expect the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump; capture the first printed shape, metric, status, or summary field and state which part supports **Define TTFT, TPOT, ITL, E2E, throughput, and goodput precisely and name the component each one measures.**.
2. **Vary one named input.** Repeat the command after changing only the learning rate: use the same run with learning rate 0.1 instead of 0.01. Predict the direction of the change, then compare the two output values. Explain why **Explain why mean is the wrong statistic for LLM serving and how to read P50/P90/P99.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation a zero gradient or an already-minimized point. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Construct an SLO multi-constraint (e.g. TTFT<500 ms AND TPOT<15 ms AND E2E<2 s) and compute goodput against it.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-slo-goodput-gate.md` and add a worked example using x=0.5 with the demo defaults. Include the input contract, one expected output field, and a named acceptance check for **Name two benchmark tools that disagree on TPOT for the same run and explain why.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Inference Metrics — TTFT, TPOT, ITL, Goodput, P99** should contain:

- the `python3 main.py` output for x=0.5 with the demo defaults, with `RequestTrace`, `ttft_ms`, `e2e_ms` traced to the value or shape that supports **Define TTFT, TPOT, ITL, E2E, throughput, and goodput precisely and name the component each one measures.**;
- a before/after comparison for the learning rate, where the same run with learning rate 0.1 instead of 0.01 changes the observation in the direction predicted by **Explain why mean is the wrong statistic for LLM serving and how to read P50/P90/P99.**;
- a recorded result for a zero gradient or an already-minimized point that matches the implementation’s validation or empty-result contract and explains the evidence for **Construct an SLO multi-constraint (e.g. TTFT<500 ms AND TPOT<15 ms AND E2E<2 s) and compute goodput against it.**; and
- an updated `outputs/skill-slo-goodput-gate.md` example with a concrete input, expected output field, and acceptance check tied to **Name two benchmark tools that disagree on TPOT for the same run and explain why.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
