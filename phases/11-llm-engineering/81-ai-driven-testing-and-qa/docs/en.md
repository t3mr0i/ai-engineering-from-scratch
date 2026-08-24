# AI-Driven Testing and QA: From Eval Sets to Regression Gates (2026)

> Teams shipping LLM features routinely find that production regressions are caught by users rather than by automated tests — because the teams had no systematic eval before deployment. By 2026 the tooling gap has closed: Anthropic, OpenAI, and Google ship hosted eval runners; NIST AI RMF 1.0 (voluntary) and ISO/IEC 42001 (mandatory only for organizations pursuing certification) both name evaluation as a core control; and model providers publish standardized test harness APIs. What has not caught up is engineering practice. Most teams still treat LLM features like deterministic code, writing assertion-heavy unit tests that shatter on every model update and missing the class of failures those tests cannot see — coherence regressions, tone drift, silent context truncation, and adversarial prompt injection.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 10 (Evaluation), Phase 14 · 30 (Eval-driven agent development)
**Time:** ~45 minutes

## Learning Objectives

- Explain the production problem addressed by AI-Driven Testing and QA: From Eval Sets to Regression Gates (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## The Problem

A team ships a summarisation feature backed by Claude Sonnet 4.5. They write a pytest suite: parse the JSON output, assert the keys exist, assert the length is under 500 characters. Three months later the team upgrades to Sonnet 4.6. Every test passes. Two days after launch, a product manager notices the summaries have started hedging every claim with "it is important to note that" — the tone has shifted. The tests never saw it because they measured structure, not quality.

The symmetrical failure happens at the other end: a team writes no evals at all, iterates on prompts by vibe, and ships a RAG feature where 30 % of answers quietly hallucinate a date or a name. Neither failure is exotic. Both come from the same root cause: **applying unit-test intuitions to a probabilistic system that requires a different evaluation vocabulary** — one built on graded quality scores, behavioural coverage, and regression baselines rather than binary pass/fail on schema.

## The Concept

### The three evaluation layers

LLM feature testing requires three layers that mirror the traditional pyramid but differ in what each layer can actually catch:

| Layer | What it checks | Tooling | Cadence |
|---|---|---|---|
| **Structural** | Schema, field presence, length bounds, JSON validity | Standard assertion libraries, pytest | Every PR |
| **Behavioural** | Quality, coherence, tone, factual grounding, task completion | LLM-as-judge, rubric scoring, human annotation | Every model/prompt change |
| **Adversarial** | Prompt injection resistance, jailbreak surface, output poisoning | Red-team fixture sets, fuzz harness | Before prod deploy, quarterly |

Teams that only build the structural layer are in the regime of the hedging-tone failure above. Teams that skip the adversarial layer are in scope for the indirect prompt injection attacks documented in Phase 18 · 15.

### Eval set design

An eval set is a curated collection of inputs paired with expected outputs (or grading rubrics). The design decisions that matter most:

- **Coverage axes.** For a summarisation feature the axes include: long vs. short input, structured vs. unstructured source, positive vs. negative sentiment, multilingual. A test suite that covers only happy-path English prose has poor coverage even if it has 500 cases.
- **Golden references vs. rubrics.** For tasks with one right answer (entity extraction, SQL generation) a golden reference answer enables exact-match or near-exact scoring. For generative tasks (summaries, code explanations) a rubric evaluated by a judge model is more robust. The RAGAS framework (Phase 11 · 10) formalises this for RAG-specific metrics: faithfulness, answer relevance, context precision.
- **Fixture tasks.** A fixture task is a fixed input/output pair that should be deterministically solvable — it anchors the harness to something measurable even when the full eval set is too large to run on every commit. Phase 19 · 27 covers the fixture-task harness in detail.
- **Minimum set size.** A set with fewer than 30 cases has so much sampling variance that a one-point metric change is meaningless. In our experience, confidence intervals on a 30-case run are typically wide enough that you cannot distinguish a true 0.3-point shift from noise; the practical floor for a production eval is 50–100 balanced cases per coverage axis.

### LLM-as-judge scoring

Using a model to evaluate another model's output is now standard practice. Claude Opus 4.x, GPT-4o, and Gemini 2.0 Pro all perform well as judges when given a precise rubric. Key design rules for the judge prompt:

1. Define a numeric scale (1–5) with anchors for each integer. A 1-to-5 scale with anchors has much lower inter-rater variance than a vague "rate the quality."
2. Ask the judge to output reasoning before the score (chain-of-thought). This reduces positional bias and makes disagreements auditable.
3. Run at temperature 0. Variance in the judge output is noise in your metric.
4. Do not use the same model family as judge and subject when you can avoid it. A Claude-as-judge-of-Claude setup can be biased toward Claude's own output style.
5. Spot-check with human annotation on 10–15 % of cases every quarter. Judge-human agreement below 0.7 (Spearman) is a signal that your rubric needs rework.

### Regression gates

A regression gate is an automated decision rule applied to eval scores that determines whether a model or prompt change is safe to promote. The gate sits in CI/CD and blocks a deploy if the metric drops beyond a threshold. Three design choices define a gate:

**Threshold type.** Absolute thresholds ("score must be >= 3.5 / 5") are simple but break when you change the rubric. Relative thresholds ("score must not drop more than 0.15 relative to baseline") survive rubric evolution better. Use both: an absolute floor prevents deploying a broken model, a relative cap prevents silent regression.

**Metric portfolio.** A single aggregate score hides trade-offs. A useful minimum portfolio for a generative feature: task-completion rate, faithfulness (for RAG), coherence score, and latency p95. Phase 14 · 38 adds a verification-gate layer specifically for agentic workflows where tool calls must also be audited.

**Baseline management.** The baseline is the eval score of the current production prompt/model pair. It must be stored in version control alongside the eval set. Upgrading the baseline without review is the "goodhart" failure: the metric becomes the target rather than the proxy for quality.

### QA gate placement in the delivery pipeline

```
PR opened
    -> structural tests (pytest, every PR, <30 s)
    -> behavioural eval on fixture subset (LLM-as-judge, every PR, 2-5 min)

Model / prompt promoted to staging
    -> full behavioural eval on complete set (LLM-as-judge + human spot-check)
    -> adversarial eval (red-team fixtures)
    -> regression gate decision: PASS / BLOCK

Production deploy
    -> online A/B metric monitoring (completion rate, thumbs down rate)
    -> weekly canary eval on live traffic sample
```

This maps to the agent verification gates in Phase 14 · 38, extended to cover the full prompt-to-production lifecycle rather than a single agent turn.

### Current toolset (2026)

| Tool / Framework | What it adds | When to use it |
|---|---|---|
| **RAGAS** | Faithfulness, answer relevance, context precision for RAG | Any retrieval-augmented feature |
| **Anthropic Evals API** | Hosted eval runs, baseline storage, regression tracking | Teams already on Claude; avoids running judge infra |
| **OpenAI Evals** | JSON-defined eval harness, model-graded and human-graded modes | Cross-provider benchmarking |
| **PromptFoo** | CLI + CI integration, multiple model comparison, red-team modes | Mixed-provider teams, prompt A/B testing |
| **LangSmith** | Tracing + eval + dataset management in one surface | Teams using LangChain / LangGraph |
| **Braintrust** | Dataset, experiment, and scoring management; strong IDE integration | Teams who want a hosted alternative to LangSmith |

For teams on the LHIND stack: the internal LLM gateway (Phase 11 · 01) does not yet expose a hosted eval surface; run the LLM-as-judge calls against the gateway and store baselines in the repo.

### What evals cannot replace

Evals answer "does this behave the way I specified?" They do not answer "did I specify the right thing?" A perfect score on a faithfulness rubric does not tell you the retrieved context was the right context. A perfect task-completion rate does not tell you the task was worth automating. These are design questions that belong upstream in the product specification, not downstream in the eval harness.

Similarly, eval scores are a sample from a distribution. A 0.1-point drop in a 50-case set may be statistical noise; a 0.1-point drop on a 500-case balanced set is a real signal. Size matters.



## Further Reading

- [RAGAS documentation](https://docs.ragas.io) — faithfulness, answer relevance, context precision metrics for RAG evaluation.
- [Anthropic — Model evaluation guide](https://docs.claude.com/en/docs/test-and-evaluate/eval-your-prompts) — hosted evals, rubric design, and baseline management on the Anthropic platform.
- [PromptFoo documentation](https://promptfoo.dev/docs) — CLI-driven eval harness with red-team modes and multi-model comparison.
- [NIST AI Risk Management Framework 1.0](https://airc.nist.gov/Home) — a voluntary governance framework that names evaluation as a core control (the MEASURE function); Chapter 4 covers MEASURE.
- [Braintrust — Evaluations guide](https://www.braintrust.dev/docs/guides/evals) — dataset management, experiment tracking, and scoring; useful reference for hosted eval architecture patterns.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the production problem addressed by AI-Driven Testing and QA: From Eval Sets to Regression Gates (2026).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Apply the lesson's decision or implementation workflow to a concrete case.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Measure quality, cost, latency, and risk with explicit acceptance criteria.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the production problem addressed by AI-Driven Testing and QA: From Eval Sets to Regression Gates (2026),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Measure quality, cost, latency, and risk with explicit acceptance criteria,” and cite a repeatable check rather than relying on visual inspection alone.
