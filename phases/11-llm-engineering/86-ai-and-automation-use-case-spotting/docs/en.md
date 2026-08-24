# Spotting AI and Automation Opportunities: The Structured Intake (2026)

> The hardest part of an AI use-case program is not building the pilots — it is choosing which ones to build. Most enterprise AI pilots are still not in production well after launch; the leading cause is not technical failure but misfit: the use case was not ready for AI, or the value was never well-specified before the team committed. The discipline that prevents this is structured use-case intake: a repeatable method for surfacing candidate processes, scoring them on value and automation readiness, and making the go/no-go decision on a pilot before any model is selected or any engineer is assigned. This lesson frames the intake as an engineering artifact — a policy you can code, audit, and hand off — not a workshop exercise done once and forgotten. The sibling lessons on FinOps (Phase 17 · 27) and cost governors (Phase 15 · 13) assume you have already made this decision correctly; this lesson is where that decision happens.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 01 (Prompt engineering), Phase 17 · 27 (FinOps for LLMs)
**Time:** ~45 minutes

## Learning Objectives

- Explain the production problem addressed by Spotting AI and Automation Opportunities: The Structured Intake (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## The Problem

Most consulting engagements start the AI conversation in the wrong place. A stakeholder names a technology ("we need an LLM for our helpdesk") or a capability ("we want something like ChatGPT for internal documents"), and the team moves directly into vendor evaluation or prototype construction. Six months later, the team has a working demo that nobody uses, because the underlying process was too unstructured for automation, the data was not available, or the value case was never grounded in a number anyone was accountable for.

The opposite failure is just as common: a genuinely strong automation candidate — a high-volume, rule-dominated, data-rich subprocess — is dismissed because it does not look interesting enough, or because it sits in an unglamorous part of the business. The engineering question for 2026 is not "can we build an AI thing here." It is: given a portfolio of process candidates, which ones have the value density, automation readiness, and risk profile that justify committing an engineering team and a production budget? That question needs a scoring model, not an opinion.

## The Concept

### The intake funnel

Use-case intake is a three-stage funnel. The stages are sequential: a candidate that fails stage one does not reach stage two.

| Stage | Question | Output |
|---|---|---|
| **Discovery** | Where in this organisation are there high-volume, repetitive, data-rich processes? | Long list of candidates (20-100 items) |
| **Scoring** | For each candidate: how much value does it unlock, and how automatable is it today? | Scored short list (5-15 items) |
| **Pilot decision** | For top-scored candidates: is the risk/effort profile acceptable? Which one goes first? | Ranked pilot backlog + go/no-go per item |

Running all three stages in a single workshop is, in our experience, the mistake that derails roughly half of first-time intake programs — typically because stakeholders compress a multi-week sequence into a half-day room. Discovery requires breadth; scoring requires precision; the pilot decision requires risk judgment from people who have authority. Split them.

### Discovery: where to look

The highest-yield discovery method is structured process interviews, not open brainstorming. For each department, ask:

- What do your people do that takes more than an hour per week and could be described in a procedure document?
- What decisions do you make more than 50 times a month that follow a pattern?
- Where do you receive information in an unstructured format (email, PDF, voice) and immediately re-enter it somewhere structured?
- What do you check manually that a rule could check?

These four questions reliably surface the automation-rich seam in a business process. The answers cluster into recognisable types:

| Process type | Examples | Automation readiness |
|---|---|---|
| Document extraction | Invoice processing, contract clause review, CV screening | High — well-defined schema, large training corpus |
| Classification / triage | Support ticket routing, defect categorisation, compliance flags | High — labels exist, feedback loop is fast |
| Generation with constraints | Report drafts from structured data, RFP response sections, meeting summaries | Medium — requires human review gate |
| Decision support | Credit scoring inputs, procurement recommendation, risk flags | Medium — model can score; human must decide |
| Open-ended interaction | Customer service chat, internal Q&A, code generation | Medium-to-low — high variance, hard to define done |
| Process orchestration | Multi-step workflows across systems | Low until sub-steps are individually stable |

### Scoring: the two-axis model

Once you have a candidate list, score each item on two axes. Both scores are 1-5 integers. No half points — forced discretisation reveals disagreements among stakeholders that finer scales hide.

**Axis 1 — Value density** (what the business gains)

| Score | Criterion |
|---|---|
| 5 | Directly cashable saving or revenue: > €500 k/yr at current volume, quantified by the process owner |
| 4 | Measurable FTE reduction or cycle-time gain traceable to a P&L line, €100–500 k/yr |
| 3 | Quality or risk reduction with a plausible but not yet quantified value; or €10–100 k/yr |
| 2 | Productivity improvement, hard to quantify, no clear cost owner |
| 1 | "Nice to have"; no sponsor; no number |

**Axis 2 — Automation readiness** (what engineering needs)

| Score | Criterion |
|---|---|
| 5 | Structured inputs, labelled historical data, clear success metric, IT system access confirmed |
| 4 | Semi-structured inputs, partial data, metric defined but not instrumented |
| 3 | Unstructured inputs, data exists but needs cleaning, metric is proxied |
| 2 | Data is sparse or siloed; process definition is informal; stakeholder buy-in unclear |
| 1 | Process is not yet documented; data does not exist; regulatory clearance unknown |

Plot each candidate on a 5×5 grid. The pilot zone is the upper-right quadrant (value ≥ 3, readiness ≥ 3). Below value 3 and the business case is not strong enough to absorb pilot risk. Below readiness 3 and the engineering effort exceeds what a time-boxed pilot budget can fund.

### The pilot decision: risk overlay

Not everything in the pilot zone should go first. A risk overlay ranks the short list within the pilot zone. Apply three risk factors:

| Risk factor | Elevated-risk signal | Penalty |
|---|---|---|
| **Regulatory / compliance** | Output is a regulated decision (credit, medical, employment), or data is personal under GDPR/DSGVO | Subtract 1 from readiness score |
| **Blast radius** | An error affects > 1 000 customers per day or triggers a financial transaction | Add "requires human-in-the-loop gate" constraint |
| **Data availability** | Training/evaluation data requires more than 4 weeks to prepare | Defer to next intake cycle |

After the risk overlay, rank surviving candidates by (value + readiness) descending. The top item is your recommended first pilot. The recommendation is a starting point, not a mandate — the pilot decision requires sign-off from a budget holder who understands the risk surface. The intake output is an evidence pack for that conversation, not a substitute for it.

### Connecting to the sibling lessons

Phase 17 · 27 (FinOps for LLMs) shows how to cost the pilot once you have chosen it: inference cost per transaction, evaluation cost, and the break-even volume. That calculation feeds back into the value score — a use case that scores 4 on value may drop to 3 once inference cost is modelled at realistic volume.

Phase 15 · 13 (cost governors) shows how to set hard budget caps on a running production system. The intake score tells you whether to build; the governor tells you how to keep the build from overrunning once it is live. Both are prerequisites to a responsible scale decision (Phase 17 · 20, shadow-canary-progressive rollout).

### What the intake does not decide

The intake scores a process against a scoring rubric. It does not:

- Select a model (that is prompt engineering and benchmarking, Phase 11 · 01).
- Design the human-in-the-loop gate (Phase 15 · 01 covers long-horizon agent design).
- Define the evaluation harness (Phase 11 · 01 and the evals literature).
- Approve production spend (that requires FinOps, Phase 17 · 27).

A common failure: the intake meeting becomes a model selection meeting. Keep scope narrow. The intake produces a ranked, risk-annotated pilot backlog. Everything else is downstream.



## Further Reading

- [Gartner — AI Use Case Prism](https://www.gartner.com/en/information-technology/insights/artificial-intelligence) — the analyst firm's canonical use-case taxonomy and readiness assessment framework.
- [McKinsey Global Institute — The economic potential of generative AI (2023)](https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier) — the function-by-function value mapping that grounds the value scoring rubric.
- [MIT Sloan Management Review — Competing in the Age of AI](https://sloanreview.mit.edu/article/competing-in-the-age-of-ai/) — the process-type taxonomy this lesson draws on.
- [ISO/IEC 42001:2023 — AI Management System standard](https://www.iso.org/standard/81230.html) — the international management-system standard that governs AI use-case risk governance; directly relevant to the risk overlay section.
- [Anthropic — Claude model documentation](https://docs.claude.com/en/docs/about-claude/models/overview) — current model capabilities relevant to matching a shortlisted use case to the right model family once the intake is complete.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the production problem addressed by Spotting AI and Automation Opportunities: The Structured Intake (2026).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Apply the lesson's decision or implementation workflow to a concrete case.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Measure quality, cost, latency, and risk with explicit acceptance criteria.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the production problem addressed by Spotting AI and Automation Opportunities: The Structured Intake (2026),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Measure quality, cost, latency, and risk with explicit acceptance criteria,” and cite a repeatable check rather than relying on visual inspection alone.
