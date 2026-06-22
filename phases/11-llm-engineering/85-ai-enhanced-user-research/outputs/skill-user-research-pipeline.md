# Decision Aid: AI-Enhanced User Research Pipeline

One page. Paste into your synthesis session. Work top to bottom.

---

## Stage 1 — Ingestion and Tagging

Before any clustering prompt, every snippet must carry:

- [ ] Participant ID (stable across sessions)
- [ ] Segment label (e.g., new-user, power-user, enterprise)
- [ ] Session date
- [ ] Data source type (interview / support ticket / survey free-text / session note)

**Gate:** Do not proceed until every snippet has all four fields. Anonymize IDs only after the bias check is complete.

---

## Stage 2 — Clustering (LLM-assisted)

Prompt requirements for a traceable cluster:

- [ ] Request cluster label, representative quote, AND full membership list (participant IDs + snippet IDs)
- [ ] Specify minimum cluster size (recommended: 3+ snippets from 2+ distinct participants)
- [ ] Use structured output / JSON schema (see Phase 11 · 03) — prose summaries lose the membership list
- [ ] Review cluster labels for merges or splits; do not accept the LLM's labels without reading the members

**Minimum cluster record:**

```
Cluster label:   <string>
Snippet count:   <int>
Participant IDs: <list of IDs>
Segments:        <list of segment labels>
Rep quote:       "<text>" — <participant ID>, <date>
```

**Gate:** Each cluster must cite at least two distinct participant IDs.

---

## Stage 3 — Hypothesis Scoring

For each cluster, produce one hypothesis. Use the fields below.

| Field | Rule |
|---|---|
| **Claim** | Specific and measurable. Avoid "users find X hard" — say "users abandon X at rate Y." |
| **Evidence** | List cluster IDs and snippet counts. |
| **Confidence** | Apply the rubric below. Do not let the LLM set confidence without the rubric in-prompt. |
| **Falsification criterion** | State the observable outcome that would refute this hypothesis in a future study. Must name a metric and a threshold. |

### Confidence Rubric

| Score | Tier | Minimum evidence |
|---|---|---|
| 0.80–1.00 | Strong | 5+ distinct participants, 2+ segments, evidence spans multiple session dates |
| 0.50–0.79 | Moderate | 3–4 distinct participants, OR single segment only |
| 0.20–0.49 | Weak | 1–2 distinct participants |
| 0.00–0.19 | Anecdote | Single source, or inferred from subtext |

**Gate:** Hypotheses below 0.50 confidence must be labeled as "signal to investigate" and must not appear as primary findings in the decision artefact without a follow-up plan.

---

## Stage 4 — Representational Bias Review

Run this check for every hypothesis before finalizing the research readout.

### Coverage Check

For each hypothesis, list the segments contributing evidence:

| Segment | Snippet count | % of hypothesis evidence | % of target population |
|---|---|---|---|
| (fill in) | | | |

**Flag condition:** evidence share > 60 % AND population share < 40 %.

Flag text to insert: `FLAGGED: evidence skewed toward [segment] ([X]% of evidence, [Y]% of population). Consider targeted follow-up study.`

### Silence Check

List all segments in the participant pool. Mark those absent from this hypothesis:

| Segment | Present in evidence? | Possible reason for absence |
|---|---|---|
| (fill in) | Yes / No | |

Possible reasons: not asked the relevant questions / dropped out of study / excluded by recruitment screener / genuine non-problem for this segment.

**Gate:** Silent segments must be named in the research readout. "We did not hear from X" is a finding.

---

## What the LLM Owns vs. What You Own

| Task | LLM | You |
|---|---|---|
| Grouping semantically similar snippets | Yes | Review labels; merge/split |
| Drafting hypothesis claims | Yes | Add falsification criterion; set confidence |
| Flagging imbalance given metadata | Yes | Decide whether the flag blocks or caveats |
| Selecting which hypotheses reach product | No | You own this gate |
| Interpreting why a segment is silent | No | Requires recruitment context |

---

## Research Readout Checklist

Before handing findings to product or engineering:

- [ ] Every hypothesis has a confidence score and a falsification criterion
- [ ] Every hypothesis below 0.50 is labeled as exploratory signal
- [ ] Every flagged bias is named inline in the finding (not in an appendix)
- [ ] Every silent segment is listed with a stated possible reason
- [ ] The decision artefact names the LLM model used, the clustering prompt version, and the date of the run

---

*Phase 11 · 85 — AI-Enhanced User Research. See also Phase 11 · 01 (prompt engineering), Phase 11 · 03 (structured outputs), Phase 18 · 20 (representational harm).*
