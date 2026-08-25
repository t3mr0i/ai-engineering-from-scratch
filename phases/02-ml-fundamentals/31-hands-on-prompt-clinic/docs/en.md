# Hands-on ML Prompt Clinic

> A useful ML prompt names the target, data boundary, evaluation design, and acceptance test.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02, Lessons 01–14
**Time:** ~45 minutes

## Learning Objectives

- Turn a vague machine-learning request into a testable problem brief.
- Detect exact risk phrases for leakage, missing splits, undefined metrics, and absent acceptance tests.
- Map each signal to a concrete review control without relying on a modulo or list prefix.
- Score impact and uncertainty as local triage inputs rather than model-quality certificates.
- Produce a deterministic plan that a team can review and reuse.

## The clinic's input

This lesson is a small offline planner, not a language model. A Scenario contains
a name, a description, explicit signals, an impact from 1 through 5, and an
uncertainty from 1 through 5. Signals are exact entries from the controlled list:
vague target, missing audience, leakage risk, missing split, undefined metric,
and no acceptance test. Unknown or duplicate entries are rejected.

signal_matches searches the description for complete normalized phrases and unions
those matches with the declared signals. A sentence containing only the word
metric does not activate undefined metric, and only the phrase leakage risk
activates that signal. This keeps a short description from silently changing a
review plan.

## Domain mapping

Each signal has a stable category and controls:

- vague target or missing audience maps to problem framing and a problem brief;
- leakage risk maps to data integrity, leakage check, and source check;
- missing split or undefined metric maps to evaluation design and its named protocol;
- no acceptance test maps to release review, acceptance test, and output rubric.

recommend returns every distinct control and category required by the matched
signals in the controlled order. Its category field is the first primary category
for backward-compatible display, while categories preserves the full union. It
never treats impact or uncertainty as a compliance result.
score_scenario computes min(20, 2*impact + uncertainty + 2*matched_signals).
priority_for labels 16–20 launch gate required, 11–15 guided pilot, 7–10 team
practice, and 0–6 awareness only. build_plan sorts by descending score and then
scenario name for a repeatable handoff.

## Build It

From code/, run python3 main.py. The JSON plan contains support-ticket triage,
weekly churn classifier, and reviewed demand baseline. The churn row includes
leakage check, source check, split protocol, metric definition, and evaluation
rubric; its score is capped at 20 and its priority is launch gate required.
The reviewed baseline has no matched signal and receives the default controls.

For a direct check, construct a Scenario named forecast with description
future values create leakage risk and no acceptance test, explicit signals
(leakage risk, no acceptance test), impact 4, and uncertainty 4. Its category is
data integrity and its controls include both leakage check and acceptance test.

## Use It

Run the planner during an ML design review. Replace the fixture descriptions with
the team's actual target, audience, source columns, chronological or grouped
split, metric denominator, and acceptance thresholds. Treat the returned plan as
a checklist for a human reviewer; it does not execute a data audit or validate a
model.

## Ship It

outputs/prompt-clinic-review-sheet.md is the reusable worksheet. A completed
sheet should contain the problem brief, source and leakage notes, split protocol,
metric definition, output rubric, acceptance test, and reviewer decision. Preserve
the original request and the revised ML prompt so later changes remain traceable.

## Exercises

1. Create a churn Scenario whose description contains only the word leakage.
   Confirm that signal_matches returns no leakage risk until the complete phrase
   appears or the explicit signal is declared.
2. Add missing split and undefined metric to a scenario. List the category and
   every distinct control returned by recommend.
3. Vary impact from 2 to 5 while keeping signals fixed. Show that priority can
   change, but the semantic control list does not.
4. Build two scenarios with equal scores and verify build_plan uses the name as
   its deterministic tie-breaker.
5. Submit an unknown signal, impact 0, uncertainty 6, and a non-integer score.
   Record the explicit validation errors and explain why they are safer than a
   plausible-looking plan.

## Reference Solution

A correct submission demonstrates phrase-boundary matching, the explicit signal
to category/control mapping, score bounds, deterministic sorting, and a complete
review sheet. It lists leakage, split, metric, and acceptance evidence for a
realistic classifier or forecast request. It labels scores as triage only and
does not claim that the planner measured model quality.
