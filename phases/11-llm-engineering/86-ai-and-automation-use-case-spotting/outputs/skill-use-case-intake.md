# Skill: AI & Automation Use-Case Intake

One-page decision aid for structured use-case intake. Paste into a stakeholder brief or workshop facilitator guide.

---

## Stage 1 — Discovery: Four Questions to Ask Every Department

Ask these in structured interviews, not open brainstorming. Record verbatim answers; score after the interview.

| # | Question | What to listen for |
|---|---|---|
| 1 | What do your people do that takes more than an hour per week and could be described in a written procedure? | High-volume, rule-stable tasks |
| 2 | What decisions do you make more than 50 times a month that follow a pattern? | Classification or routing tasks |
| 3 | Where do you receive information in an unstructured format and re-enter it somewhere structured? | Extraction candidates |
| 4 | What do you check manually that a rule or model could check? | Validation / QA candidates |

---

## Stage 2 — Scoring: Two-Axis Rubric

Score each candidate on both axes. Use integers 1-5 only. No half-points.

### Axis 1 — Value Density

| Score | What it means |
|---|---|
| 5 | Directly cashable: > €500 k/yr, number owned by process owner |
| 4 | Measurable FTE reduction or cycle-time gain, €100–500 k/yr, traceable to a P&L line |
| 3 | Quality or risk reduction, plausible but not yet quantified; or €10–100 k/yr |
| 2 | Productivity improvement, hard to quantify, no clear cost owner |
| 1 | No sponsor, no number, "nice to have" |

### Axis 2 — Automation Readiness

| Score | What it means |
|---|---|
| 5 | Structured inputs, labelled historical data, clear metric, IT access confirmed |
| 4 | Semi-structured inputs, partial data, metric defined but not instrumented |
| 3 | Unstructured inputs, data exists but needs cleaning, metric is proxied |
| 2 | Data sparse or siloed, process informal, stakeholder buy-in unclear |
| 1 | Process undocumented, data does not exist, regulatory clearance unknown |

### Classification

Plot each candidate at (value, readiness). Apply rules in order:

1. If `data_not_ready` (> 4 weeks to prepare training data): **DEFER**
2. If value < 3 AND readiness < 3: **DEPRIORITISE**
3. If value >= 3 AND readiness >= 3: **PILOT_NOW** (proceed to Stage 3)
4. If only readiness < 3: **IMPROVE_FIRST** (fix data/process, re-score next cycle)
5. If only value < 3: **DEPRIORITISE** (business case too weak)

---

## Stage 3 — Risk Overlay: Three Checks Before Ranking

Apply to every `PILOT_NOW` candidate. In sequence:

| Check | Elevated-risk signal | Action |
|---|---|---|
| Regulatory / compliance | Output is a regulated decision (credit, medical, employment); data is personal under GDPR / DSGVO; EU AI Act high-risk category applies | Subtract 1 from readiness score for ranking; add legal/compliance review milestone to pilot plan |
| Blast radius | An error affects > 1 000 customers or triggers a financial transaction per day | Add human-in-the-loop gate as mandatory go-live criterion; do not skip even when model accuracy looks good in testing |
| Data availability | Training or evaluation data requires > 4 weeks to prepare | Move to DEFER; do not start engineering before data is ready |

---

## Pilot Backlog: Output Template

After scoring and risk overlay, rank `PILOT_NOW` candidates by combined score (value + adjusted readiness) descending.

| Rank | Use case | V | R | Adj-R | Score | Flags | Recommended next action |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | Begin pilot scoping |
| 2 | | | | | | | Queue for next sprint |
| ... | | | | | | | |

Fill the "Flags" column with: `REGULATORY`, `HITL`, `DATA_WAIT`, or `-`.

---

## What This Output Is Not

- It is not a model selection. (That requires benchmarking against the specific task.)
- It is not a budget approval. (That requires FinOps: inference cost × volume × break-even; see Phase 17 · 27.)
- It is not a go-live decision. (That requires a canary/shadow rollout plan; see Phase 17 · 20.)
- It is not a substitute for a budget holder sign-off.

Present this as an evidence pack. The pilot decision is made by a human with authority and accountability.
