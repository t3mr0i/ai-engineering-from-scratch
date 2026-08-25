# STaR, V-STaR, Quiet-STaR — Self-Taught Reasoning

> The smallest possible self-improvement loop sits inside the rationale. A model generates a chain of thought, keeps the ones that land on correct answers, and fine-tunes on those. That is STaR. V-STaR adds a verifier so inference-time selection is better. Quiet-STaR pushes the rationale down to every token. All three work. None of them are magic — the loop preserves any shortcut that happened to reach the right answer.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon framing)
**Time:** ~60 minutes

## Learning Objectives

- Explain the autonomy mechanism and assumptions behind STaR, V-STaR, Quiet-STaR — Self-Taught Reasoning
- Model its control loop, state transitions, and stopping conditions explicitly
- Apply bounded permissions, budgets, and rollback controls
- Evaluate capability and safety claims against reproducible evidence

## The Problem

The straightforward way to teach a model to reason is to collect human-written reasoning traces. That is expensive, slow, and bounded by how much high-quality chain-of-thought humans are willing to write.

STaR (Self-Taught Reasoner, Zelikman et al., 2022) asks: what if the model writes its own rationales and grades them against known answers? The loop is:

1. Sample a reasoning trace plus answer.
2. If the final answer is correct, keep the trace.
3. Fine-tune on the kept traces.
4. Repeat.

It works. GSM8K and CommonsenseQA both improved without new human annotation. But the loop has a built-in bias: any rationale that produced the right answer is retained, regardless of whether the reasoning itself was sound. V-STaR (Hosseini et al., 2024) patches this with a learned verifier; Quiet-STaR (Zelikman et al., 2024) generalizes the idea to per-token internal rationales.

## The Concept

### STaR: bootstrap on what worked

Start from a base model with some weak reasoning ability. On each training problem, sample a rationale plus answer. If the answer matches the label, keep the (problem, rationale, answer) triple. Fine-tune the model on the kept set. Repeat.

One twist matters. If the model can never get a problem right, the loop cannot learn on it. STaR adds **rationalization**: for problems the model fails, inject the correct answer as a hint and re-prompt the model to produce a rationale that leads to it. Rationalized rationales are added to the training set.

Result in the original paper (Zelikman et al., 2022): a GPT-J base model improved on GSM8K from 5.8% to 10.7% through repeated STaR rounds with rationalization — about 5 percentage points absolute. On CommonsenseQA, STaR-trained GPT-J 6B reached 72.5%, comparable to a fine-tuned GPT-3 175B (~73%) — a roughly 30x larger model trained on hand-annotated rationales.

### V-STaR: train a verifier with DPO

STaR throws away incorrect rationales. Hosseini et al. (2024) observed those are also data: every pair of (rationale, "is this correct") can train a verifier. They use Direct Preference Optimization over both correct and incorrect solutions to build a ranker. At inference time, sample N rationales and pick the verifier's top choice.

Reported delta: +4 to +17 percentage points over prior self-improvement baselines on GSM8K and MATH, with most of the gain coming from using the verifier for inference-time selection rather than for additional generator fine-tuning.

### Quiet-STaR: per-token internal rationales

Zelikman et al. (2024) asked: what if the model learns to generate a short internal rationale at every token position, not just between problem and answer? Quiet-STaR trains a model to emit a hidden "thought" before each predicted token, then mixes the thought-aware prediction with the baseline prediction via a learned weight.

Result: Mistral 7B gained absolute zero-shot improvements on GSM8K from 5.9% to 10.9% and CommonsenseQA from 36.3% to 47.2% without task-specific fine-tuning. The model learned "when to think" — hard tokens get longer internal rationales; easy ones get almost none.

### Why all three share a safety concern

All three methods use the final answer as the gradient signal. A rationale that reaches the right answer via flawed reasoning — exploiting a shortcut, guessing, or using a non-generalizing pattern — gets positively reinforced. On in-distribution problems the shortcut works. On out-of-distribution problems it breaks silently.

V-STaR's verifier mitigates by learning to rank rationales, but the verifier is trained on the same label set. It can learn to prefer well-formatted wrong reasoning over honest uncertainty. The safer design is to combine STaR-style data with (a) process-supervised reward models (rewarding intermediate steps, not just answers) and (b) held-out OOD evaluation that breaks simple shortcuts.

### Comparison

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | keep (rationale, answer) if correct | 1x | discards all incorrect rationales | shortcut rationales |
| STaR + rationalization | above + correct-answer hinted retries | 1x | less | rationalized rationales may be implausible |
| V-STaR | STaR + DPO verifier from both classes | Nx (best-of-N) | minimal | verifier can reinforce confident wrongness |
| Quiet-STaR | per-token rationale + mixing weight | 1.5-3x | minimal | still answer-conditioned gradient |

### Where this sits in the 2026 stack

STaR is old. But the pattern reappears everywhere in 2025-2026. RL on verifiable math problems (DeepSeek-R1, Kimi-k1.5, o1) is STaR's answer-conditioned gradient signal, scaled up. Process reward models (Lightman et al., 2023; OpenAI's "Let's verify step by step") are the process-supervised alternative. AlphaEvolve (Lesson 3) is STaR for code, with a program evaluator instead of a label. Darwin Godel Machine (Lesson 4) is STaR for the agent scaffolding itself.

Understanding STaR makes all of these click. It is the minimum-viable self-improvement loop.



## Build It

Reconstruct **STaR, V-STaR, Quiet-STaR — Self-Taught Reasoning** by following `Trace` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `Trace` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-star-loop-reviewer.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) — the original paper.
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) — adds a DPO verifier for inference-time selection.
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) — per-token internal rationales.
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) — process reward models, the alternative gradient signal.
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) — RL on verifiable tasks, STaR scaled to frontier training.

## Exercises

Use `Trace` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `Trace`, `Model`, `sample`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the autonomy mechanism and assumptions behind STaR, V-STaR, Quiet-STaR — Self-Taught Reasoning**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Model its control loop, state transitions, and stopping conditions explicitly** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Apply bounded permissions, budgets, and rollback controls** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-star-loop-reviewer.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate capability and safety claims against reproducible evidence**; note what the demo cannot establish.

## Reference Solution

A checkable result for **STaR, V-STaR, Quiet-STaR — Self-Taught Reasoning** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `Trace`, `Model`, `sample` traced to the value or shape that supports **Explain the autonomy mechanism and assumptions behind STaR, V-STaR, Quiet-STaR — Self-Taught Reasoning**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Model its control loop, state transitions, and stopping conditions explicitly**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Apply bounded permissions, budgets, and rollback controls**; and
- an updated `outputs/skill-star-loop-reviewer.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate capability and safety claims against reproducible evidence**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
