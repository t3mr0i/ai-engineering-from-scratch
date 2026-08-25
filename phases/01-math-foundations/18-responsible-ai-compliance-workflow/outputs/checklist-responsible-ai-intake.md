---
name: responsible-ai-intake-checklist
description: Capture explicit responsible-AI signals, mapped controls, and review evidence.
phase: 1
lesson: 18
---

# Responsible-AI intake checklist

Use the local Python artifact to make the review inputs explicit. A score helps sequence work;
it is not a legal, regulatory, or launch approval.

## Scenario record

- Workflow or decision:
- Affected people or users:
- Intended use and current owner:
- Impact level (0–5):
- Uncertainty level (0–5):

## Exact signal phrases

Record only the canonical phrases or their documented aliases:

- `sensitive data` / `personal data` / `PII`
- `external impact` / `public impact`
- `automated decision` / `decision automation`
- `explanation required` / `explainability requirement`

Do not promote a generic word such as `data` or `decision` to a signal. Unknown explicit phrases
are rejected by the artifact so they cannot silently alter the review.

## Mapping to review work

| Matched signal | Categories | Controls | Evidence |
|---|---|---|---|
| `sensitive data` | privacy | PII minimization; privacy review | data inventory; purpose/retention note |
| `external impact` | fairness; accountability | impact assessment; human review | affected-user impact note |
| `automated decision` | fairness; accountability | bias evaluation; human review; audit log | override procedure; bias result |
| `explanation required` | transparency | decision rationale; appeal path | rationale sample; appeal owner |

## Handoff

- Matched signals:
- Categories:
- Score and priority:
- Controls to assign:
- Evidence still missing:
- Human owner and reviewers:
- Next review date:

If no signal is matched, record `unclassified`, `intended-use record`, and `named human owner`
explicitly rather than treating an empty result as approval.
