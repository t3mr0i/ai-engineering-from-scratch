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




## Further Reading

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — the canonical paper
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) — tool-grounded verification
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — evaluator-optimizer workflow pattern
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — output guardrails as CRITIC-shaped verifiers

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: State Self-Refine's three prompts (generate, feedback, refine) and explain why history matters for the refine prompt.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Explain CRITIC's critical insight: LLMs are unreliable at self-verification without external grounding.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Implement a stdlib Self-Refine loop with history and an optional external verifier.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “State Self-Refine's three prompts (generate, feedback, refine) and explain why history matters for the refine prompt,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Implement a stdlib Self-Refine loop with history and an optional external verifier,” and cite a repeatable check rather than relying on visual inspection alone.
