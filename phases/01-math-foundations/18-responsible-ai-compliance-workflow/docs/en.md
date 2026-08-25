# Responsible AI Compliance Workflow

> Turn a use case into explicit risk phrases, governance categories, controls, and review evidence.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lessons 01–02 (environment setup and collaboration)
**Time:** ~50 minutes

## Learning Objectives

- Validate a responsible-AI `Scenario` with bounded impact and uncertainty levels.
- Match complete, normalized risk phrases without treating words such as `data` or `decision` as signals.
- Map sensitive data, impact, automation, and explanation requirements to governance categories.
- Produce the union of controls and evidence requests implied by the matched signals.
- Serialize a sorted intake plan while keeping its score separate from a legal or regulatory verdict.

## Build It

Run the standard-library implementation:

```bash
cd phases/01-math-foundations/18-responsible-ai-compliance-workflow/code
python3 main.py
```

`Scenario.impact` and `Scenario.uncertainty` are integers from 0 through 5. The explicit
`signals` field accepts the canonical phrases `sensitive data`, `external impact`,
`automated decision`, and `explanation required`, plus the documented aliases `PII`,
`public impact`, `decision automation`, and `explainability requirement`. An unknown explicit
phrase raises `ValueError`; it is never silently converted into a risk.

`signal_matches` also scans the name and description for complete normalized phrases. Thus
`"personal data"` matches `sensitive data`, while a description containing only `"data"` does
not. `score_scenario` computes
`min(20, impact*2 + uncertainty + 2*number_of_matched_signals)`. The score is a prioritization
fixture, not a compliance certification.

## Use It

The mapping is deliberately explicit:

| Signal | Categories | Controls | Evidence to request |
|---|---|---|---|
| `sensitive data` | privacy | PII minimization, privacy review | data inventory, purpose and retention note |
| `external impact` | fairness, accountability | impact assessment, human review | affected-user impact note |
| `automated decision` | fairness, accountability | bias evaluation, human review, audit log | override procedure, bias evaluation result |
| `explanation required` | transparency | decision rationale, appeal path | sample decision rationale, appeal owner |

`categories_for_signals` follows the fixed order privacy, fairness, accountability, transparency.
`controls_for_signals` and `evidence_for_signals` take the de-duplicated union for every matched
signal; they do not take an arbitrary prefix of a global list. A scenario with no matched signal
gets `unclassified` plus the baseline controls `intended-use record` and `named human owner`.

Try a screening fixture:

```python
from main import Scenario, recommend

scenario = Scenario(
    "HR screening assistant",
    "Employee information feeds an automated decision and an explanation is required for affected staff.",
    ("sensitive data", "automated decision", "explanation required"),
    impact=4,
    uncertainty=4,
)
recommendation = recommend(scenario)
assert recommendation.categories == ("privacy", "fairness", "accountability", "transparency")
assert recommendation.score == 18
assert "bias evaluation" in recommendation.controls
```

## Ship It

The handoff artifact is [the responsible-AI intake checklist](../../18-responsible-ai-compliance-workflow/outputs/checklist-responsible-ai-intake.md).
Copy `signals`, `categories`, `score`, `priority`, `controls`, and `evidence` into the project
record, then assign a human owner. The JSON row is review input, not permission to launch.

## Exercises

1. Compare descriptions containing `data` and `sensitive data`; verify that only the complete
   phrase produces the privacy signal.
2. Pass `("PII",)` as an explicit signal and then pass `("decision",)`; observe the alias match
   and the `ValueError` for the unknown phrase.
3. Build a scenario with `automated decision` and `explanation required`; verify all three
   relevant categories and the union of five controls.
4. Try `impact=6` and `uncertainty=-1`; verify that `Scenario` rejects both before scoring.

## Reference Solution

The screening fixture matches three signals, so its score is `4*2 + 4 + 3*2 = 18`; its
categories are privacy, fairness, accountability, and transparency. Its controls include
privacy review, bias evaluation, human review, audit log, decision rationale, and appeal path.
The one-word description `"data"` matches nothing, and an explicit `"decision"` is rejected
because the contract requires a complete known phrase.

## Tests

```bash
python3 -m unittest discover tests -v
```

The tests cover phrase boundaries, alias normalization, unknown-signal rejection, each core
signal mapping, multi-signal control unions, level and score bounds, the baseline case, and
deterministic plan serialization.
