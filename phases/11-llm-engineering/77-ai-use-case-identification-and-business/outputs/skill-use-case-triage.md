---
name: use-case-triage
description: Run a single AI use case through the five-stage triage funnel and produce a sponsor-ready verdict with supporting numbers.
version: 1.1.0
phase: 11
lesson: 77
tags: [use-case, triage, roi, feasibility, eu-ai-act, prioritization, common-case-smuggle]
---

Given a candidate AI use case, work through the five stages below in order. Stop at the first gate that fails and record the failure reason. If the use case passes all gates, compute the composite score and assign it to a track.

> **Hard read of Stage 3.** The SME question is "can the SME label the *hard* examples, including the long tail the use case will actually see?" not "can the SME label 50-100 common examples." Reading it in the shallow register is the **common-case smuggle** — the named failure shape the lesson demonstrates.

---

## Stage 1 — LLM Fit

Answer all three. One "no" = ruled out (wrong tool, route to deterministic automation).

| Question | Yes / No |
|---|---|
| Is the task language-shaped? (reading, writing, classifying, extracting, transforming text or code) | |
| Does it require expert judgment recoverable from text? | |
| Is output variance acceptable? (not tax calculation, regulatory reporting, or other zero-tolerance domains) | |

**Gate result:** PASS / FAIL (reason: ____________)

---

## Stage 2 — Back-of-Envelope ROI

Fill in the seven numbers. The ratio only needs to be directional.

| Input | Value |
|---|---|
| Annual volume (tasks/yr) | |
| Time saved per task (minutes) | |
| Loaded FTE rate (EUR/min) | |
| Automation rate (0-1) | |
| Avg input tokens per task (per CALL) | |
| Avg output tokens per task (per CALL) | |
| Calls per task (1 for single-shot, N for agent loops) | |

```
Annual value  = volume x time_saved x fte_rate x automation_rate
Token cost    = volume x calls_per_task x ((tokens_in/1000 x 0.003)
                                          + (tokens_out/1000 x 0.015))
Annual cost   = token_cost + (engineering_months x 15000 / 3) + 3000
ROI ratio     = annual_value / annual_cost
```

**ROI ratio:** ______:1   Interpretation: < 2:1 = research project | 2-5:1 = strategic | > 5:1 = quick-win candidate

> **Agent-loop gotcha.** For multi-step agents, `calls_per_task` is the multiplier that separates per-task cost from per-call cost. A 20-step agent doing 50K tasks at 30 sub-calls each is 1.5M model calls, not 50K. Always multiply before dividing.

---

## Stage 3 — Feasibility Scan

One blocker does not kill the use case. It adds a dependency that must appear in sprint 0.

| Question | Status | If "blocked": dependency |
|---|---|---|
| Input data exists and is accessible? | OK / Blocked | |
| Eval rubric defined or definable? (Phase 11.10) | OK / Blocked | |
| Latency compatible with LLM inference? | OK / Blocked | |
| **SME available to label 50-100 examples spanning the *hard* cases?** (common-case smuggle check) | OK / Blocked | |
| Prototype possible without fine-tuning? | OK / Blocked | |

**Blocker count:** ____   All clear = quick-win eligible  |  1-2 = strategic  |  3+ = plan phase required

> **Common-case smuggle.** If the SME has labelled 50-100 examples but only the common ones, the gate is no. Ask: "Have you seen the long-tail cases this use case will actually face?" If the answer is "not yet," the gate stays open. Do not advance the use case.

---

## Stage 4 — Risk Screen

| Check | Result |
|---|---|
| EU AI Act tier (green / amber / red) | |
| If high-risk: conformity assessment in scope? | |
| Personal data sent to external model API? | |
| If yes: DPIA in place or in progress? | |

**Effective risk:** GREEN (no action) / AMBER (legal/compliance review before proceeding) / RED (do not build)

EU AI Act high-risk categories (non-exhaustive): CV screening, credit scoring, critical infrastructure, law enforcement, biometrics, medical device software, educational assessment.

---

## Stage 5 — Composite Score

Only complete this if Stages 1-4 all pass or are amber (not red).

| Dimension | Weight | Score (1-10) | Weighted |
|---|---|---|---|
| Business value (normalized ROI) | 40% | | |
| Implementation speed (10 - 2 x blockers) | 35% | | |
| Strategic fit (does it build a capability we want?) | 25% | | |
| **Composite** | 100% | | **___** |

Value score heuristic: ROI 1:1 -> 3, ROI 5:1 -> 7, ROI 10:1 -> 9.

---

## Track Assignment

| Criteria | Track |
|---|---|
| All Stage 3 gates clear *on the hard examples*, ROI > 5:1, risk GREEN | **Quick win** - start next sprint |
| 1-2 blockers OR ROI 2-5:1 OR risk AMBER | **Strategic project** - plan separately |
| Stage 1 fail OR risk RED | **Ruled out** - route elsewhere |

---

## Sponsor Deliverable (one paragraph)

Do not share the scoring matrix. Write this instead:

> We recommend [use case name] as a sprint-1 candidate. It avoids [N] of the five feasibility traps (including the hard-case SME check), delivers an estimated [ROI]:1 return on the first year of operation (EUR [value]/yr value, EUR [cost]/yr cost), and clears the EU AI Act and GDPR screens at [tier]. The single prerequisite before sprint planning is [top dependency if any, else "none"].

---

## Hard Rejects

- Do not advance a use case past Stage 4 if the EU AI Act tier is RED.
- Do not present a composite score without a Stage 2 estimate, however rough.
- Do not label something a "quick win" if it has an unresolved feasibility blocker - including the hard-case SME check.
- Do not skip the DPIA check when personal data is involved, regardless of ROI.
- Do not present the scoring matrix to the business sponsor - present the conclusion.
- Do not read the SME gate in the shallow register. Hard cases are the gate.
