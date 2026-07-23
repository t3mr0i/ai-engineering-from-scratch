# Eval-Driven Agent Development

> Anthropic's guidance: "start with simple prompts, optimize them with comprehensive evaluation, and add multi-step agentic systems only when needed." Evaluation is not the last step. It's the outer loop that drives every other choice in Phase 14.

**Type:** Learn + Build
**Languages:** Python (stdlib)
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

1. **Static benchmarks** — SWE-bench Verified for code (Lesson 19), WebArena/OSWorld for browsing / desktop (Lesson 20), GAIA for generalist (Lesson 19), BFCL V4 for tool use (Lesson 06). Use for cross-model comparison and regression gating. Contamination is real: SWE-bench+ found 32.67% solution leakage. Always report Verified / +-audited scores.

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


## Use It

- Write eval cases in the same repo as your agent code.
- Run them on every PR via CI.
- Fail the build on regression.
- Track pass rate over time.
- Tie every production failure to a new case.

## Ship It

`outputs/skill-eval-suite.md` builds a three-layer eval suite for an agent product with CI gates and regression tracking.


## Key Terms

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Static benchmark | "Off-the-shelf eval" | SWE-bench, GAIA, AgentBench, WebArena, OSWorld |
| Custom offline eval | "Domain eval" | LLM-as-judge / exec / trajectory on your product shape |
| Online eval | "Production eval" | Session replay, guardrail alerts, cost/latency tracking |
| Evaluator-optimizer | "Propose-judge-refine" | Iterate until judge passes |
| CI gate | "Merge blocker" | Fail the build on eval regression |
| Baseline | "Last-known-good" | Reference score to detect regression |
| Trajectory efficiency | "Steps over gold" | Agent step count divided by human expert minimum |

## Further Reading

- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — "start simple, optimize with evals"
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — the curated benchmark
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) — tool-use benchmark
- [Langfuse docs](https://langfuse.com/) — evals + session replay in practice
