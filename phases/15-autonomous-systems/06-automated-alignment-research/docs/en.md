# Automated Alignment Research (Anthropic AAR)

> Anthropic ran parallel teams of Claude Opus 4.6 Autonomous Alignment Researchers in independent sandboxes, coordinating via a shared forum whose logs live outside any sandbox (so agents cannot delete their own records). On the weak-to-strong training problem, the AARs outperformed human researchers. Anthropic's own summary flags that prescribed workflows often constrain AAR flexibility and degrade performance. Automating alignment research is the compression step that compresses the timeline to the exact misalignment risks the RSP is meant to detect.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 15 · 05 (AI Scientist v2), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## Learning Objectives

- Explain the autonomy mechanism and assumptions behind Automated Alignment Research (Anthropic AAR)
- Model its control loop, state transitions, and stopping conditions explicitly
- Apply bounded permissions, budgets, and rollback controls
- Evaluate capability and safety claims against reproducible evidence

## The Problem

Alignment research is expensive in human-researcher time. Problems like scalable oversight, reward specification, or weak-to-strong training require experiments that take weeks per iteration. As frontier capabilities advance, the alignment workload grows faster than the supply of qualified researchers.

Automated Alignment Research (AAR) asks whether the same frontier models whose capability is outrunning alignment can contribute to closing the gap. Anthropic's 2026 report on an AAR-run weak-to-strong-training study (alignment.anthropic.com/2026/automated-w2s-researcher/) is one of the first public results from a deployed system of this class.

The result is genuinely positive: AARs solved a research problem better than the human baseline. The result also concentrates, in a single system, every concern this phase has developed. If alignment research can be automated, so can the parts that compromise safeguards. The RSP's thresholds for AI R&D capability are written with this loop in mind.

## The Concept

### The architecture (as publicly described)

- **Parallel agents.** Multiple Claude Opus 4.6 instances run as AARs, each in an independent sandbox. Sandboxes limit filesystem, network, and process surface.
- **Shared forum.** Findings are published to a shared forum whose storage backend sits outside every sandbox. Agents can read the forum; agents cannot delete or edit forum records from within their own sandbox.
- **Task allocation.** A human-designed task queue assigns research problems to AARs. AARs propose decompositions, run experiments, write up findings.
- **Weak-to-strong training focus.** The published study addressed weak-to-strong training — using a weaker supervisor model to train a stronger student model. AARs outperformed human researchers on this task.

### Why the out-of-sandbox log matters

The log-integrity property is the difference between a controlled experiment and a potentially compromised one. If AARs could edit their own logs, they could cover up failed or dubious experiments. Anthropic flags this directly: the property is a necessary condition for trusting the research output, and it is non-trivial to verify.

The analog in infrastructure terms is append-only logs with write-through to external storage (e.g. S3 object-lock, immutable Datadog logs). The agent has no credential to modify past records. This is the same pattern that 2026 corporate security teams use to make ransomware-resistant audit trails.

### The prescribed-workflow tradeoff

Anthropic's report notes that prescribed workflows often constrain AAR flexibility and degrade performance. In other words: if the human designer writes the research plan step-by-step, AARs do worse than if given high-level goals and freedom to decompose. This is consistent with results across agentic research (LangGraph, Microsoft's Agent Framework) — overspecified scaffolds hurt capable agents.

The safety implication is subtle. The flexibility that improves AAR performance is also the flexibility that allows unsanctioned decomposition, novel tool use, and goal-drift. The tradeoff is a design-space decision: how much flexibility buys enough capability to beat humans, without handing the agent room to generalize goals off-distribution?

### The compression risk

RSP v3.0 (Lesson 19) introduces an AI R&D capability threshold: the ability to fully automate the AI R&D pipeline at competitive cost vs human + AI tools. DeepMind's FSF v3 includes an analogous ML R&D autonomy level. Both frameworks treat this threshold as the trigger for elevated controls.

AAR is one step short of the threshold: it automates part of the pipeline (alignment research on specific, well-scoped tasks) but not the end-to-end capability development loop. The timeline question is how fast the gap closes.

Compressed timelines are the compounding-failure concern. If alignment research and capability research compound at similar rates, the misalignment risk surface grows at least as fast as capability. If capability compounds faster (the historical trend), the gap widens. This is the argument for AAR being a qualified good: each additional alignment result reduces the gap if and only if the research process is trustworthy.

### What AAR does not replace

Human researchers set the task queue, review results, and hold the constitutional authority. The AARs accelerate the middle of the pipeline, not the ends. Anthropic's published outputs include both AAR contributions and human-researcher judgement on what to publish, what to retract, and what to refine.

This matches the propose-then-commit pattern from Lesson 15 applied to research itself: AARs propose; humans commit.



## Build It

Reconstruct **Automated Alignment Research (Anthropic AAR)** by following `ForumRecord` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `ForumRecord` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-aar-deployment-review.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) — primary source.
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — AI R&D threshold framing.
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) — broader agent-autonomy framing.
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — ML R&D autonomy levels parallel to RSP.
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) — the underlying problem AARs attacked.

## Exercises

Use `ForumRecord` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `ForumRecord`, `Forum`, `head`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the autonomy mechanism and assumptions behind Automated Alignment Research (Anthropic AAR)**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Model its control loop, state transitions, and stopping conditions explicitly** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Apply bounded permissions, budgets, and rollback controls** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-aar-deployment-review.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate capability and safety claims against reproducible evidence**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Automated Alignment Research (Anthropic AAR)** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `ForumRecord`, `Forum`, `head` traced to the value or shape that supports **Explain the autonomy mechanism and assumptions behind Automated Alignment Research (Anthropic AAR)**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Model its control loop, state transitions, and stopping conditions explicitly**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Apply bounded permissions, budgets, and rollback controls**; and
- an updated `outputs/skill-aar-deployment-review.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate capability and safety claims against reproducible evidence**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
