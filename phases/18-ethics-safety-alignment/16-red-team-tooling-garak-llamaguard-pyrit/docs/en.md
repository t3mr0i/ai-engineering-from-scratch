# Red-Team Tooling — Garak, Llama Guard, PyRIT

> Three production tools frame the 2026 red-team stack. Llama Guard (Meta) — a Llama-3.1-8B classifier fine-tuned on 14 MLCommons hazard categories; the 2025 Llama Guard 4 is a 12B natively multimodal classifier pruned from Llama 4 Scout. Garak (NVIDIA) — open-source LLM vulnerability scanner with static, dynamic, and adaptive probes for hallucination, data leakage, prompt injection, toxicity, and jailbreaks. PyRIT (Microsoft) — multi-turn red-team campaigns with Crescendo, TAP, and custom converter chains for deep exploitation. Llama Guard 3 is documented in Meta's "Llama 3 Herd of Models" (arXiv:2407.21783); Llama Guard 3-1B-INT4 in arXiv:2411.17713; Garak's probe architecture in github.com/NVIDIA/garak. These tools are the 2026 production interface between red-team research (Lessons 12-15) and deployment (Lesson 17+).

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 18 · 12-15 (jailbreaks and IPI)
**Time:** ~75 minutes

## Learning Objectives

- Describe Llama Guard 3/4's position in the safety stack: input classifier, output classifier, or both.
- Name the 14 MLCommons hazard categories and state one non-obvious one (Code Interpreter Abuse).
- Describe Garak's probe architecture: probes, detectors, harnesses.
- Describe PyRIT's multi-turn campaign structure and how it composes with Garak probes.

## The Problem

Lessons 12-15 present the attack surface. Production deployments need repeatable, scalable evaluation. Three tools dominate 2026: Llama Guard (the defense classifier), Garak (the scanner), PyRIT (the campaign orchestrator). Each targets a different layer of the red-team lifecycle.

## The Concept

### Llama Guard (Meta)

Llama Guard 3 is a Llama-3.1-8B model fine-tuned for input/output classification over the MLCommons AILuminate 14 categories:
- Violent crimes, non-violent crimes, sex-related, CSAM, defamation
- Specialized advice, privacy, IP, indiscriminate weapons, hate
- Suicide/self-harm, sexual content, elections, code-interpreter abuse

Supports 8 languages. Usage: place before the LLM (input moderation), after the LLM (output moderation), or both. The two uses generate different training distributions — Llama Guard 3 ships as a single model handling both.

Llama Guard 3-1B-INT4 (arXiv:2411.17713, 440MB, ~30 tokens/s on mobile CPU) is the quantized edge variant.

Llama Guard 4 (April 2025) is 12B, natively multimodal, pruned from Llama 4 Scout. It replaces both the 8B text and 11B vision predecessors with one classifier that ingests text + images.

### Garak (NVIDIA)

Open-source vulnerability scanner. Architecture:
- **Probes.** Attack generators for hallucination, data leakage, prompt injection, toxicity, jailbreaks. Static (fixed prompts), dynamic (generated prompts), adaptive (responds to target output).
- **Detectors.** Score outputs against expected failure modes — toxic, leaked, jailbroken.
- **Harnesses.** Manage probe-detector pairs, run campaigns, generate reports.

TrustyAI integrates Garak with the Llama-Stack shields (Prompt-Guard-86M input classifier, Llama-Guard-3-8B output classifier) for end-to-end shielded-target evaluation. Tier-based scoring (TBSA) replaces binary pass/fail — a model can pass at severity tier 3 and fail at severity tier 5 on the same probe.

### PyRIT (Microsoft)

Python Risk Identification Toolkit. Multi-turn red-team campaigns. Built around:
- **Converters.** Transform a seed prompt — paraphrase, encode, translate, roleplay.
- **Orchestrators.** Run the campaign: Crescendo (escalation), TAP (branching), RedTeaming (custom loop).
- **Scoring.** LLM-as-judge or classifier-as-judge.

PyRIT is the heavier cousin of Garak. Garak runs thousands of single-turn probes; PyRIT runs deep multi-turn campaigns designed to break specific failure modes.

### The stack

Put Llama Guard on both sides of the model. Run Garak nightly for regression. Run PyRIT for pre-release campaigns. This is the 2026 default configuration for most production deployments.

### Evaluation pitfalls

- **Judge identity.** All three tools can use an LLM judge; judge calibration drives reported ASRs (Lesson 12). Specify the judge alongside the tool.
- **Probe staleness.** Garak probes age as models are patched against them. Adaptive probes (PAIR-shaped) age slower than static probes.
- **Llama Guard FPR on benign content.** Early Llama Guard versions over-flagged political and LGBTQ+ content; Llama Guard 3/4 calibrations are improved but not calibrated per-deployment.

### Where this fits in Phase 18

Lessons 12-15 are the attack families. Lesson 16 is the production tooling. Lesson 17 (WMDP) is the evaluation for dual-use capability. Lesson 18 is the frontier safety frameworks that wrap these tools in a policy structure.



## Build It

Reconstruct **Red-Team Tooling — Garak, Llama Guard, PyRIT** by following `guard_classify` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `guard_classify` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-red-team-stack.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) — the 8B classifier
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) — quantized mobile classifier
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) — the scanner repo and documentation
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) — the campaign toolkit

## Exercises

Use `guard_classify` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `guard_classify`, `is_unsafe`, `Probe`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Describe Llama Guard 3/4's position in the safety stack: input classifier, output classifier, or both.**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Name the 14 MLCommons hazard categories and state one non-obvious one (Code Interpreter Abuse).** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe Garak's probe architecture: probes, detectors, harnesses.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-red-team-stack.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Describe PyRIT's multi-turn campaign structure and how it composes with Garak probes.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Red-Team Tooling — Garak, Llama Guard, PyRIT** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `guard_classify`, `is_unsafe`, `Probe` traced to the value or shape that supports **Describe Llama Guard 3/4's position in the safety stack: input classifier, output classifier, or both.**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Name the 14 MLCommons hazard categories and state one non-obvious one (Code Interpreter Abuse).**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe Garak's probe architecture: probes, detectors, harnesses.**; and
- an updated `outputs/skill-red-team-stack.md` example with a concrete input, expected output field, and acceptance check tied to **Describe PyRIT's multi-turn campaign structure and how it composes with Garak probes.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
