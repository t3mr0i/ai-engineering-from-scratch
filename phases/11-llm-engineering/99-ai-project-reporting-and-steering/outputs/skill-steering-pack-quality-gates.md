# Steering Pack Quality Gates — Decision Aid

**When to use:** Before any AI-generated (or human-authored) pack section goes into a stakeholder deck. Run this once per section, not per deck.

---

## Step 1 — Classify your signals

For each signal in this section, record:

| Signal name | Value | Source | Age (days) | Tier |
|---|---|---|---|---|
| (e.g. Production error rate) | (e.g. 0.04%) | (e.g. Datadog) | (e.g. 0.5) | T1 |
| ... | | | | |

**Tier reference:**

| Tier | Examples | Staleness limit |
|---|---|---|
| T1 — Measured outcomes | Production error rate, MTTR, API latency p99 | 1 day |
| T2 — Delivery metrics | Sprint velocity, planned vs. actual scope, blocker count | 3 days |
| T3 — Qualitative assessments | Team confidence score, stakeholder satisfaction | 7 days |
| T4 — Proxy signals | Meeting attendance, commit frequency, open PR age | 14 days |

**Action:** Strike out any signal that exceeds its tier's staleness limit. It is inadmissible for this section.

---

## Step 2 — Determine the section type

Answer these two questions about the admissible signals:

| Question | Yes | No |
|---|---|---|
| Does any admissible signal represent an active blocker? | → **Decision request** | Continue |
| Does any admissible signal exceed a pre-agreed threshold? | → **Risk escalation** | Continue |
| Is at least one T1 or T2 signal admissible? | → **Status confirmation** | → **Risk escalation** (insufficient tier) |

If zero admissible signals remain after staleness filtering: → **Decision request** (no evidence to present).

---

## Step 3 — Apply the quality gates

Run these five gates mechanically. A section that fails any gate does not go into the deck.

| # | Gate | Check | Pass condition |
|---|---|---|---|
| G1 | Evidence traceability | Every factual claim has a named source and a date | Zero unsourced claims |
| G2 | Signal tier coverage | At least one T1 or T2 signal is admissible | True |
| G3 | Decision question present | Section ends with one of the three required closings | True |
| G4 | Consistency | Traffic-light direction matches the dominant evidence signal direction | No contradiction |
| G5 | Staleness | All cited signals are within their tier threshold | True |

Mark each gate: **PASS / FAIL / N/A**

---

## Step 4 — Add the required closing

Each section must end with exactly one of these closings. Fill in the brackets:

**Status confirmation:**
> No decision needed: On current trajectory, [outcome] is expected by [date]. No steering action required.

**Risk escalation:**
> Contingent decision: If [trigger condition] occurs before [date], the team will [pre-agreed response]. Noted for awareness.

**Decision request:**
> Decision request: The team needs a decision on [specific question] by [date]. Options: A ([trade-off]), B ([trade-off]). Recommended: [option with rationale].

---

## Step 5 — AI-generated content: additional checks

If the section was drafted by a model (Claude, GPT, Fable, etc.), add these checks:

| Check | What to verify |
|---|---|
| No invented numbers | Every number in the draft appears verbatim in the extracted signal JSON |
| No confident status under ambiguity | If T1/T2 signals conflict, the draft must say "signals conflict" not resolve by narrative smoothing |
| No decision-question elision | If a blocker or threshold breach is in the signals, the closing must be Decision request — not Status confirmation |
| Source citations preserved | Model output must include signal name, value, and age — not just the narrative summary |

---

## Quick-reference: failure modes and fixes

| Failure | Symptom | Fix |
|---|---|---|
| Hallucinated metric | Number in draft not traceable to source data | Re-run extraction step; require verbatim values in schema |
| Confident under ambiguity | Green narrative when T1/T2 signals conflict | Add explicit conflict-surfacing instruction to synthesis prompt |
| Decision elision | Status confirmation when blocker/breach is present | Add gate check to pipeline; require closing form in output schema |
| Stale evidence | Signal age exceeds tier threshold | Update data pipeline; or flag as inadmissible and note evidence gap |
| Missing decision question | Section ends with a status summary but no closing form | Add closing form as a required output field in the synthesis prompt |

---

## One-line pre-meeting test

Before presenting: can you answer "where does this amber/green/red come from?" in under 30 seconds by pointing to a row in the signal table above? If not, the section is not ready.
