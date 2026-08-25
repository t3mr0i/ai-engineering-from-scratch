# Self-Refine and CRITIC: Iterative Output Improvement

> Self-Refine (Madaan et al., 2023) uses one LLM in three roles — generate, feedback, refine — in a loop. Average gain: +20 absolute on 7 tasks. CRITIC (Gou et al., 2023) hardens the feedback step by routing verification through external tools. In 2026 this pattern ships in every framework as "evaluator-optimizer" (Anthropic) or a guardrail loop (OpenAI Agents SDK).

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 minutes

## Learning Objectives

- State Self-Refine's three prompts (generate, feedback, refine) and explain why history matters for the refine prompt.
- Explain CRITIC's critical insight: LLMs are unreliable at self-verification without external grounding.
- Implement a stdlib Self-Refine loop with history and an optional external verifier.
- Map this pattern to Anthropic's "evaluator-optimizer" workflow and OpenAI Agents SDK's output guardrails.

## The Problem

An agent produces an answer that is almost right. Maybe a line of code has a syntax error. Maybe a summary is too long. Maybe a plan misses an edge case. What you want is: the agent critiques its own output, then fixes it.

Self-Refine shows this works with a single model, no training data, no RL. But there is a catch: LLMs are bad at self-verification on hard facts. CRITIC names the fix — route the verify step through external tools (search, code interpreter, calculator, test runner).

Together these two papers define the 2026 default for iterative improvement: generate, verify (externally when possible), refine, stop when the verifier passes.

## The Concept

### Self-Refine (Madaan et al., NeurIPS 2023)

One LLM, three roles:

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

Key detail: `refine` sees the full history — all prior outputs and critiques — so it does not repeat mistakes. The paper ablates this: drop history and quality drops sharply.

Headline: +20 absolute improvement averaged across 7 tasks (math, code, acronym, dialog) including GPT-4. No training, no external tools, single model.

### CRITIC (Gou et al., arXiv:2305.11738, v4 Feb 2024)

Self-Refine's weakness: the feedback step is an LLM scoring itself. For factual claims this is unreliable (a hallucination often looks convincing to the model that produced it). CRITIC replaces `feedback(task, output)` with `verify(task, output, tools)` where `tools` includes:

- A search engine for factual claims.
- A code interpreter for code correctness.
- A calculator for arithmetic.
- Domain-specific verifiers (unit tests, type checkers, linters).

The verifier produces a structured critique grounded in tool results. The refiner then conditions on this critique.

Headline: CRITIC outperforms Self-Refine on factual tasks because the critique is grounded. On tasks without external verifiers (creative writing, formatting), CRITIC reduces to Self-Refine.

### The stop condition

Two common shapes:

1. **Verifier passes.** External test returns success. Preferred when available (unit tests, type checker, guardrail assertion).
2. **No feedback issued.** Model says "the output is fine." Cheaper but unreliable; pair with a max-iteration cap.

2026 default: combine them. "Stop if verifier passes OR model says fine AND iterations >= 2 OR iterations >= max_iterations."

### Evaluator-Optimizer (Anthropic, 2024)

Anthropic's Dec 2024 post names this as one of the five workflow patterns. Two roles:

- Evaluator: scores the output and produces a critique.
- Optimizer: revises the output given the critique.

Loop until the evaluator passes. This is Self-Refine/CRITIC in Anthropic's framing. The critical engineering detail Anthropic adds: the evaluator and optimizer prompts should be substantially different so the model does not just rubber-stamp.

### OpenAI Agents SDK output guardrails

OpenAI Agents SDK ships this pattern as "output guardrails." A guardrail is a validator that runs on the final output of an agent. If the guardrail trips (raises `OutputGuardrailTripwireTriggered`), the output is rejected and the agent can retry. Guardrails can call tools (CRITIC-style) or be pure functions (Self-Refine-style).

### 2026 pitfalls

- **Rubber-stamp loops.** Same model doing generation and critique with the same prompt style converges on "looks good to me." Use structurally different prompts, or a smaller cheap model for critique.
- **Over-refinement.** Each refine pass adds latency and tokens. Budget 1-3 passes; after that, escalate to human review.
- **CRITIC on trivial tasks.** If there is no external verifier, CRITIC degenerates to Self-Refine; do not pay the latency for a stub verifier.




## Build It

Reconstruct **Self-Refine and CRITIC: Iterative Output Improvement** by following `Attempt` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `Attempt` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-refine-loop.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — the canonical paper
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) — tool-grounded verification
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — evaluator-optimizer workflow pattern
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — output guardrails as CRITIC-shaped verifiers

## Exercises

This lab follows `Attempt` and `generate` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `Attempt`, `generate`, `feedback_self`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **State Self-Refine's three prompts (generate, feedback, refine) and explain why history matters for the refine prompt.**.
2. **Change the controlled parameter.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Explain CRITIC's critical insight: LLMs are unreliable at self-verification without external grounding.** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Implement a stdlib Self-Refine loop with history and an optional external verifier.** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-refine-loop.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Map this pattern to Anthropic's "evaluator-optimizer" workflow and OpenAI Agents SDK's output guardrails.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Self-Refine and CRITIC: Iterative Output Improvement** should contain:

- the `python3 main.py` output for the text "red fox", with `Attempt`, `generate`, `feedback_self` traced to the value or shape that supports **State Self-Refine's three prompts (generate, feedback, refine) and explain why history matters for the refine prompt.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Explain CRITIC's critical insight: LLMs are unreliable at self-verification without external grounding.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Implement a stdlib Self-Refine loop with history and an optional external verifier.**; and
- an updated `outputs/skill-refine-loop.md` example with a concrete input, expected output field, and acceptance check tied to **Map this pattern to Anthropic's "evaluator-optimizer" workflow and OpenAI Agents SDK's output guardrails.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
