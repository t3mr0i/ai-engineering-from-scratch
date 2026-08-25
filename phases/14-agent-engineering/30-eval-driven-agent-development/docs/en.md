# Eval-Driven Agent Development

> Anthropic's guidance: "start with simple prompts, optimize them with comprehensive evaluation, and add multi-step agentic systems only when needed." Evaluation is not the last step. It's the outer loop that drives every other choice in Phase 14.

**Type:** Build
**Languages:** Python
**Prerequisites:** All of Phase 14.
**Time:** ~60 minutes

## Learning Objectives

- Name the three evaluation layers — static benchmarks, custom offline, online production — and what each is for.
- Explain the evaluator-optimizer tight loop.
- Describe the 2026 best practice: evals live next to code, run in CI, gate PRs.
- Connect every Phase 14 lesson to the eval case it generates.

## The Problem

Agents pass demos. They fail in production in ways demos cannot predict. Benchmarks answer "is this model broadly capable?" not "is this agent shipping the right patches for my product?" The answer: evaluation at three layers, running continuously, with every guardrail and learned rule mapped to an eval case.

## The Concept

### Three evaluation layers

1. **Static benchmarks** — SWE-bench Verified for code (Lesson 19), WebArena/OSWorld for browsing / desktop (Lesson 20), GAIA for generalist (Lesson 19), BFCL V4 for tool use (Lesson 06). Use for cross-model comparison and regression gating. The [SWE-bench+ audit](https://arxiv.org/abs/2410.06992) found solution leakage in 32.67% of the successful patches it manually screened, so always name the exact benchmark and audit status.

2. **Custom offline evals** — your product's shape:
   - LLM-as-judge (Langfuse, Phoenix, Opik — Lesson 24).
   - Execution-based (run the patch, check tests).
   - Trajectory-based (compare action sequences against gold; OSWorld-Human shows top agents 1.4-2.7x over gold).

3. **Online evals** — production:
   - Session replays (Langfuse).
   - Guardrail-triggered alerts (Lesson 16, 21).
   - Per-step cost / latency tracking (Lesson 23 OTel spans).

### Evaluator-optimizer (Anthropic)

The tight loop:

1. Proposer generates output.
2. Evaluator judges.
3. Refine until evaluator passes.

This is Self-Refine (Lesson 05) generalized. Any agent flow you care about can wrap in evaluator-optimizer for reliability.

### 2026 best practice

- Evals live next to code.
- Run in CI on every PR.
- Gate merge on eval scores (e.g. "no regression > 5% vs main").
- Every guardrail maps to an eval case.
- Every learned rule (Reflexion, pro-workflow learn-rule) maps to a failure case.

### Where eval-driven development fails

- **No baseline.** Evals without a last-known-good are unreadable. Store baselines.
- **LLM-judge without grounding.** Judges hallucinate too. CRITIC pattern (Lesson 05) — judge grounds on external tools.
- **Over-fitting to evals.** Optimizing for the eval diverges from production usefulness. Rotate cases.
- **Flaky evals.** Non-deterministic cases cause false alarms. Pin seeds, snapshot state.




## Build It

Reconstruct **Eval-Driven Agent Development** by following `EvalCase` on x=0.5 with the demo defaults. Run `python3 main.py` and verify that the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump.

## Use It

Call `EvalCase` from a small caller with x=0.5 with the demo defaults. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-eval-suite.md` with the command `python3 main.py`, the accepted input shape (x=0.5 with the demo defaults), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — "start simple, optimize with evals"
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — the curated benchmark
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) — tool-use benchmark
- [Langfuse docs](https://langfuse.com/) — evals + session replay in practice

## Exercises

Use `EvalCase` as the trace: start from x=0.5 with the demo defaults, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using x=0.5 with the demo defaults. Follow `EvalCase`, `CaseResult`, `evaluator_optimizer`. Expect the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump; capture the first printed shape, metric, status, or summary field and state which part supports **Name the three evaluation layers — static benchmarks, custom offline, online production — and what each is for.**.
2. **Vary one named input.** Repeat the command after changing only the learning rate: use the same run with learning rate 0.1 instead of 0.01. Predict the direction of the change, then compare the two output values. Explain why **Explain the evaluator-optimizer tight loop.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation a zero gradient or an already-minimized point. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe the 2026 best practice: evals live next to code, run in CI, gate PRs.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-eval-suite.md` and add a worked example using x=0.5 with the demo defaults. Include the input contract, one expected output field, and a named acceptance check for **Connect every Phase 14 lesson to the eval case it generates.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Eval-Driven Agent Development** should contain:

- the `python3 main.py` output for x=0.5 with the demo defaults, with `EvalCase`, `CaseResult`, `evaluator_optimizer` traced to the value or shape that supports **Name the three evaluation layers — static benchmarks, custom offline, online production — and what each is for.**;
- a before/after comparison for the learning rate, where the same run with learning rate 0.1 instead of 0.01 changes the observation in the direction predicted by **Explain the evaluator-optimizer tight loop.**;
- a recorded result for a zero gradient or an already-minimized point that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe the 2026 best practice: evals live next to code, run in CI, gate PRs.**; and
- an updated `outputs/skill-eval-suite.md` example with a concrete input, expected output field, and acceptance check tied to **Connect every Phase 14 lesson to the eval case it generates.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
