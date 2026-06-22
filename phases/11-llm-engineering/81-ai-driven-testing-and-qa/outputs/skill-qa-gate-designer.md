# QA Gate Designer — Decision Aid

One-page reference for designing evaluation layers and regression gates for LLM features.
Paste into a PR description or Confluence page alongside a model/prompt change.

---

## Step 1 — Identify your evaluation layers

| Feature type | Structural | Behavioural | Adversarial |
|---|---|---|---|
| Classifier / router | Required | Required | Optional |
| Summarisation / generation | Required | Required | Recommended |
| RAG / retrieval | Required | Required | **Required** |
| Agent with tool use | Required | Required | **Required** |
| Code generation | Required | Required | Recommended |

**Rule of thumb:** if the feature calls external tools or retrieves from a knowledge base, the adversarial layer is required, not optional. Reference: Phase 18 · 15 (indirect prompt injection).

---

## Step 2 — Size your eval set

| Coverage axis count | Min cases per axis | Total floor |
|---|---|---|
| 1–2 axes | 50 | 50–100 |
| 3–4 axes | 50 | 150–200 |
| 5+ axes | 30 | 150+ |

- RAG features: minimum 75 cases per axis (faithfulness metric needs more signal).
- Agent features: minimum 100 cases per axis.
- Below 30 total cases: metric changes are noise. Do not gate on them.

---

## Step 3 — Choose reference type

| Task shape | Reference type | Rationale |
|---|---|---|
| Structured output (JSON, SQL, entity extraction) | Golden reference + exact/near-exact match | One right answer |
| Free-form generative (summaries, explanations) | Rubric + LLM-as-judge | No single right answer |
| RAG answer quality | RAGAS (faithfulness + answer relevance) | Grounded metrics, established baselines |
| Classification / routing | Confusion matrix, F1 | Binary or multi-class label |

**Judge model rules:**
- Temperature = 0. Always.
- Chain-of-thought before score. Reduces positional bias.
- Avoid same-family judge and subject (e.g. Claude judging Claude) unless cross-provider access is blocked.
- Spot-check human agreement quarterly. Flag rubric if Spearman < 0.7.

---

## Step 4 — Set gate thresholds

Copy this table into your project's eval config. Adjust floors to your feature's risk level.

| Metric | Absolute floor | Relative delta cap | Gate action |
|---|---|---|---|
| Task-completion rate | 0.70 | -10 % vs. baseline | BLOCK |
| Faithfulness (RAG) | 0.80 | -8 % vs. baseline | BLOCK |
| Coherence (LLM-judge, 0-1) | 0.65 | -12 % vs. baseline | BLOCK |
| Latency p95 | < 4 000 ms | +25 % vs. baseline growth | WARN / BLOCK |

- **Both rules apply.** A candidate that passes the absolute floor can still be blocked by the relative cap.
- **WARN vs. BLOCK:** use WARN for latency growth below 40 %; use BLOCK above. Quality metrics always BLOCK.
- **Baseline version-control:** store baseline scores in `evals/baseline.json` alongside the eval set. Updating without a review is the Goodhart failure.

---

## Step 5 — Place gates in CI/CD

```
PR opened
  structural tests       <- every PR, <30 s, pytest
  fixture eval subset    <- every PR, 2-5 min, LLM-as-judge on ~20 fixture tasks

Model / prompt promoted to staging
  full behavioural eval  <- complete eval set + human spot-check 10-15 %
  adversarial eval       <- red-team fixture set
  regression gate        <- PASS / WARN / BLOCK decision

Production deploy
  online monitoring      <- completion rate, thumbs-down rate
  weekly canary eval     <- sample of live traffic, judge-scored
```

---

## Quick checklist before shipping an LLM feature change

- [ ] Eval set exists and is version-controlled alongside the code
- [ ] Coverage axes documented (at least 2 axes for any generative feature)
- [ ] Baseline scores stored in `evals/baseline.json`
- [ ] Judge model pinned (model ID, temperature 0, rubric version)
- [ ] Absolute floors and relative delta caps defined and merged to main
- [ ] Regression gate runs in CI before staging promotion
- [ ] Adversarial fixture set run if feature uses retrieval or tool calls
- [ ] Human spot-check scheduled (quarterly at minimum)
- [ ] Monitoring alert configured for task-completion drop in production

---

## Metric quick-reference

| Term | Definition | Source |
|---|---|---|
| Faithfulness | Fraction of answer claims grounded in retrieved context | RAGAS |
| Answer relevance | How well the answer addresses the question | RAGAS |
| Context precision | Fraction of retrieved chunks actually used in the answer | RAGAS |
| Task-completion rate | Fraction of eval inputs where the model completed the specified task | Custom rubric |
| Coherence | Rubric score for logical flow and internal consistency | LLM-as-judge rubric |
| Latency p95 | 95th-percentile end-to-end response time under load | Infrastructure metrics |
