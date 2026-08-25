# Shadow Traffic, Canary Rollout, and Progressive Deployment for LLMs

> LLM rollouts combine the hardest parts of software deployment: no unit tests, diffuse failure modes, delayed signals. The sequence is (1) shadow mode — duplicate prod requests to candidate model, log, compare with zero user impact; catches obvious distribution issues but is not a quality guarantee; (2) canary rollout — progressive traffic shift 10% → 25% → 50% → 75% → 100% with gates at each step; track latency percentiles, cost/request, error/refusal rate, output length distribution, user-feedback rate; (3) A/B testing for distinct alternatives after stability confirmed. Non-determinism is irreducible — up to 15% accuracy variation across runs with identical inputs due to GPU FP non-associativity plus batch-size variance. Cost is a variable, not constant — a 20% better model can be 3x more expensive per call. Rollback speed is decisive: if rollback requires redeploy, you are too slow. Policy lives in config/flags; model lives in registry with pinned digests; rollback = flip policy + revert threshold + pin old model in seconds.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 21 (A/B Testing)
**Time:** ~60 minutes

## Learning Objectives

- Distinguish shadow mode (zero-impact compare), canary (live traffic progressive), and A/B (stability-confirmed comparison).
- Enumerate five LLM-specific canary metrics (latency, cost/request, error/refusal, output-length distribution, user feedback).
- Explain why LLM non-determinism (up to 15%) changes what "stable" means in a rollout.
- Design a rollback path that takes seconds (policy flip) not hours (redeploy).

## The Problem

**Hypothetical scenario.** You ship a new model. Offline evals show 3% accuracy gain. You flip it on in production. Within 24 hours, cost is up 40%, user thumbs-down is up 8%, three customer tickets report "weird answers." You roll back. Redeploy takes 3 hours. Your weekend is ruined.

Every piece of that was avoidable. Shadow mode would have caught the 40% cost spike before any user saw it. Canary would have stopped at 10% when thumbs-down moved. Policy-flag rollback would have taken 30 seconds. The discipline is what fills in the gap between "offline evals look good" and "real users are happy."

## The Concept

### Shadow mode

Candidate receives the same requests as production; outputs are logged, not returned to users. Zero user impact. Log:

- Output content (diff against production).
- Token counts (cost delta).
- Latency.
- Refusal and error.

Catches: cost blow-ups, length regressions, obvious refusal changes, hard errors. Does NOT catch: quality delta users would perceive. Shadow is a smoke test, not a quality test.

### Canary rollout

Progressive traffic shift with gates. Typical progression: 1% → 10% → 25% → 50% → 75% → 100%. Gate on 5 metrics at each step:

1. **Latency percentiles** — P50, P95, P99. Breach: canary has P99 > 1.5x baseline.
2. **Cost per request** — blended $. Breach: >20% above baseline.
3. **Error / refusal rate** — 5xx plus explicit refusals. Breach: 2x baseline.
4. **Output length distribution** — mean + P99. Breach: distributional shift.
5. **User-feedback rate** — thumbs-down / ticket filings. Breach: 1.5x baseline.

### Non-determinism is the new variance

Identical inputs produce non-identical outputs. Reasons:

- GPU FP non-associativity (floating-point reduction order varies by batch).
- Batch-size variance (same prompt in a batch of 128 vs batch of 16).
- Sampling (temperature > 0).

Measured: up to 15% accuracy variation run-to-run on identical eval sets. "Stable" in a rollout means metrics are within expected variance, not identical to baseline. Set gates above the noise floor.

### Cost is a variable

A 20% better model can be 3x more expensive per call. Cost/request is one of the five gates. Shipping a "better" model that breaks unit economics is a rollback case.

### Rollback is the weapon

- Policy flag (feature flag system): flip percentage in config; takes seconds.
- Model pinning (registry digest): pinned model does not auto-upgrade.
- Rollback = revert flag + set pinned digest to previous. Seconds, not hours.

If your stack requires redeploy to rollback, fix that before rolling.

### Tooling

**Argo Rollouts** / **Flagger** — Kubernetes progressive delivery controllers. Integrate with Istio/Linkerd weighted routing.

**Istio weighted routing** — service-mesh-level traffic split.

**KServe / Seldon Core** — model serving with built-in canary.

**Feature flags** — LaunchDarkly, Flagsmith, Unleash. Policy-level flip, no redeploy.

### Metrics cadence

Canary gates check every 5-15 minutes depending on traffic volume. 1% traffic with 10 req/min gives 50-150 data points per window — enough for latency but noisy for user feedback. 10% gives ~10x more. Progressions should pause long enough to accumulate enough samples at each step.

### The A/B step is optional

If the new model is distinctly different (different behavior, different cost curve, different tone), A/B test it at 50% after canary passes. If it's just an improved version, skip to 100% when canary gates pass.

### Numbers you should remember

- Canary progression: 1% → 10% → 25% → 50% → 75% → 100%.
- Non-determinism ceiling: up to 15% run-to-run variance on identical inputs.
- Five canary metrics: latency, cost, error/refusal, output length, user feedback.
- Cost gate: >20% above baseline is a breach.
- Rollback: seconds, not hours.



## Build It

Reconstruct **Shadow Traffic, Canary Rollout, and Progressive Deployment for LLMs** by following `Regression` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `Regression` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-rollout-runbook.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)

## Exercises

Keep two runs side by side for **Shadow Traffic, Canary Rollout, and Progressive Deployment for LLMs**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `Regression`, `measure_stage`, `check_gates`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Distinguish shadow mode (zero-impact compare), canary (live traffic progressive), and A/B (stability-confirmed comparison).**.
2. **Run a two-value comparison.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Enumerate five LLM-specific canary metrics (latency, cost/request, error/refusal, output-length distribution, user feedback).** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain why LLM non-determinism (up to 15%) changes what "stable" means in a rollout.** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-rollout-runbook.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Design a rollback path that takes seconds (policy flip) not hours (redeploy).**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Shadow Traffic, Canary Rollout, and Progressive Deployment for LLMs** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `Regression`, `measure_stage`, `check_gates` traced to the value or shape that supports **Distinguish shadow mode (zero-impact compare), canary (live traffic progressive), and A/B (stability-confirmed comparison).**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Enumerate five LLM-specific canary metrics (latency, cost/request, error/refusal, output-length distribution, user feedback).**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain why LLM non-determinism (up to 15%) changes what "stable" means in a rollout.**; and
- an updated `outputs/skill-rollout-runbook.md` example with a concrete input, expected output field, and acceptance check tied to **Design a rollback path that takes seconds (policy flip) not hours (redeploy).**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
