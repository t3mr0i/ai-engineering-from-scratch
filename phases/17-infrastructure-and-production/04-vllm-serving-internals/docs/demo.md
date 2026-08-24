# Guided demo: vLLM Serving Internals: PagedAttention, Continuous Batching, Chunked Prefill

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can explain PagedAttention as a KV cache allocator: blocks, block tables, and why fragmentation stays under 4% at production load?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Explain PagedAttention as a KV cache allocator: blocks, block tables, and why fragmentation stays under 4% at production load.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/17-infrastructure-and-production/04-vllm-serving-internals/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Explain PagedAttention as a KV cache allocator: blocks, block tables, and why fragmentation stays under 4% at production load**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Diagram continuous batching at the iteration level: how finished sequences leave the batch and new ones join without draining**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Describe chunked prefill in one sentence and name which latency metric it protects (hint: it is TTFT tail, not mean throughput)**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **name the 2026 vLLM v0.18.0 gotcha that bites teams enabling every optimization at once**. If the evidence is ambiguous, name the next measurement rather than claiming success.

