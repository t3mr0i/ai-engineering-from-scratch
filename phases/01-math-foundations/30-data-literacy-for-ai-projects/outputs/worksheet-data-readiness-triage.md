---
name: data-readiness-triage-worksheet
description: Record source evidence, readiness signals, mapped controls, and evidence gaps.
phase: 1
lesson: 30
---

# Data-readiness triage worksheet

This worksheet makes a model-choice conversation concrete. It does not certify data quality or
replace a representative evaluation.

## Source record

| Field | Value |
|---|---|
| Source or dataset | |
| Business question | |
| Named source owner | |
| Last refresh timestamp / age in days | |
| Measured quality rate | |
| Sensitive fields and access purpose | |

## Signal contract

Use exact phrases or documented aliases. A generic word such as `source`, `quality`, or `field`
does not create a finding. Structured evidence can derive the following findings:

| Finding | Trigger | Category | Controls | Evidence gap |
|---|---|---|---|---|
| `unclear source owner` | no owner, `unknown`, or `missing source owner` | ownership | source inventory; named data steward | owner and escalation route |
| `stale data` | `freshness_days > 30` or `outdated data` | freshness | freshness SLA; refresh timestamp | last refresh and target |
| `quality issue` | `quality_rate < 0.95` or `quality issue` | quality | quality threshold; evaluation sample | missingness/validity measurement |
| `sensitive field` | non-empty sensitive-field list or `PII field` | privacy | privacy classification; field minimization | field inventory and purpose |

## Handoff

- Matched signals:
- Categories:
- Score and priority:
- Controls to assign:
- Evidence gaps:
- Evaluation sample and acceptance threshold:
- Decision, owner, and review date:

For a healthy, named, recent source with quality rate at least `0.95`, the artifact returns
`unclassified` and the baseline `intended-use record`. That result is a documented starting
point, not a production approval.
