# Data Literacy for AI Projects

> Make ownership, freshness, quality, privacy, and evaluation evidence visible before choosing a model.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lessons 01–02 (environment setup and collaboration)
**Time:** ~55 minutes

## Learning Objectives

- Represent a data-readiness case with source ownership, freshness, quality, and field metadata.
- Match complete normalized phrases without treating `source`, `quality`, or `field` alone as a finding.
- Derive readiness signals from structured evidence such as refresh age and measured quality rate.
- Map each finding to its own category, control set, and evidence request.
- Produce a sorted triage handoff without presenting it as a data-quality certificate.

## Build It

Run the offline standard-library worksheet:

```bash
cd phases/01-math-foundations/30-data-literacy-for-ai-projects/code
python3 main.py
```

`Scenario` accepts the four canonical phrases `unclear source owner`, `stale data`,
`quality issue`, and `sensitive field`. Known aliases include `missing source owner`,
`outdated data`, `data quality issue`, and `PII field`; an unknown explicit phrase such as
`source` raises `ValueError`. Narrative matching uses complete normalized phrases, so the
single word `quality` is not a finding by itself.

The structured fields make this lesson different from a text-only checklist:

- `source_owner=None` or `"unknown"` derives `unclear source owner`.
- `freshness_days > 30` derives `stale data`.
- `quality_rate < 0.95` derives `quality issue`.
- A non-empty `sensitive_fields` tuple derives `sensitive field`.

`impact` and `uncertainty` are integers from 0 through 5. The score is
`min(20, impact*2 + uncertainty + 2*number_of_signals)`. It prioritizes follow-up; it does
not certify the source or approve a model.

## Use It

The worksheet maps findings to the data operation they affect:

| Signal | Category | Controls | Evidence to request |
|---|---|---|---|
| `unclear source owner` | ownership | source inventory, named data steward | owner name and escalation route |
| `stale data` | freshness | freshness SLA, refresh timestamp | last refresh timestamp, freshness target |
| `quality issue` | quality | quality threshold, evaluation sample | missingness or validity measurement |
| `sensitive field` | privacy | privacy classification, field minimization | field inventory and access purpose |

`categories_for_signals`, `controls_for_signals`, and `evidence_for_signals` preserve this fixed
domain order and take the union of every matched signal. A healthy, named, recent source with a
quality rate of at least 0.95 receives `unclassified` and the baseline `intended-use record`
control; it is not silently treated as production-ready.

Try a source-evidence fixture:

```python
from main import Scenario, recommend

scenario = Scenario(
    "customer table",
    "The extract is being assessed before a pilot.",
    (),
    impact=4,
    uncertainty=4,
    source_owner=None,
    freshness_days=91,
    quality_rate=0.80,
    sensitive_fields=("email",),
)
recommendation = recommend(scenario)
assert recommendation.categories == ("ownership", "freshness", "quality", "privacy")
assert "freshness SLA" in recommendation.controls
assert "field inventory and access purpose" in recommendation.evidence
```

## Ship It

The handoff artifact is [the data-readiness worksheet](../../30-data-literacy-for-ai-projects/outputs/worksheet-data-readiness-triage.md).
Attach the source inventory, owner, refresh timestamp, quality measurement, field classification,
controls, evidence gaps, and review date to the project brief. The output supports a model-choice
conversation; it cannot substitute for a representative evaluation.

## Exercises

1. Compare a description containing `quality` with one containing `quality issue`; only the latter
   should match when structured evidence is healthy.
2. Construct a scenario with `source_owner=None`, `freshness_days=45`, and `quality_rate=0.90`;
   verify the owner, freshness, and quality signals are all derived.
3. Add `sensitive_fields=("employee_id",)` and verify the privacy category and field-minimization
   control join the existing union.
4. Try `quality_rate=1.1`, `freshness_days=-1`, and `impact=6`; verify each input is rejected.

## Reference Solution

The source-evidence fixture has four findings: an unknown owner, a 91-day refresh age, a quality
rate below 0.95, and one sensitive field. Its score is capped at 20, and its categories are
ownership, freshness, quality, and privacy. The resulting controls contain source inventory,
freshness SLA, quality threshold, evaluation sample, privacy classification, and field
minimization. A description containing only `source` or `quality` contributes no phrase match.

## Tests

```bash
python3 -m unittest discover tests -v
```

The tests cover generic-word rejection, alias phrases, structured evidence derivation, each
domain mapping, multi-signal control unions, unknown signals, metadata and score bounds, the
healthy baseline, and deterministic JSON handoff ordering.
