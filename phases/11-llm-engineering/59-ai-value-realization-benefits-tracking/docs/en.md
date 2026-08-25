# AI Value Realization and Benefits Tracking

> AI value is real only when benefits have owners, baselines, metrics, and a review cadence.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 25 (AI Cost and Value Economics), Phase 11 Lesson 39 (AI Portfolio and Roadmap Management)
**Time:** ~45 minutes
**Capability:** Leadership - AI Benefits Management

## Learning Objectives

- Identify AI initiatives that need benefits tracking
- Build a value-realization artifact in Python
- Map benefit owner, baseline missing, metric drift, and adoption lag to controls
- Select benefit hypotheses, baselines, tracking cadence, and owner reviews
- Explain why AI value needs measurement beyond launch

## The Problem

AI initiatives are often counted as delivered when the tool goes live. Value realization requires more: a benefit hypothesis, a baseline, adoption evidence, metric tracking, and a review owner.

## The Concept

Benefits management connects portfolio intent to observed outcomes. AI can help with analysis and reporting, but people must define what value means and review whether it is happening.

```mermaid
flowchart LR
    H[Benefit hypothesis] --> B[Baseline metric]
    B --> T[Tracking cadence]
    T --> O[Owner review]
    O --> P[Portfolio decision]
```

### Signals to Look For

- benefit owner
- baseline missing
- metric drift
- adoption lag

### Controls to Teach

- benefit hypothesis
- baseline metric
- tracking cadence
- owner review

### Target Roles

- Leadership
- Project Management & Agility
- Corporate Functions
- Business & Strategy Consulting


## Use It

Use the artifact for AI portfolio reviews, benefits tracking, adoption reporting, and post-launch value checks.

## Reusable Artifact

AI benefits tracking sheet.

The template in `outputs/sheet-ai-benefits-tracking.md` can be used after an AI pilot or rollout moves into value realization.

## Worked scenario

The demo's first case is **copilot rollout**: Benefit owner exists but baseline missing and adoption lag is visible. Treat the labels benefit owner, baseline missing, metric drift, adoption lag as evidence to inspect, not as an automatic approval. The implementation's signal matcher looks for those terms in the scenario name, description, and explicit signal list; then the scorer combines impact, uncertainty, and two points per matched signal (capped at 20). The priority function maps that score to a control level: launch gate at 16 or above, guided pilot at 11–15, team practice at 7–10, and awareness below 7.

Run the case and check which of the controls — benefit hypothesis, baseline metric, tracking cadence, owner review — appear in the returned row. Ask three questions: Which signal is supported by an observable source? Which control has an owner who can act this week? What evidence would move the case to a different priority? Then change one signal or impact value and rerun it. If the priority changes, explain whether the change came from the score, the matching rule, or both. The score is a triage aid; it does not replace domain approval, privacy review, or a pilot metric. Keep that distinction in the artifact and in the handoff.
## Key Takeaways

- Launch is not the same as value.
- Benefits need owners and baselines.
- Adoption lag can explain weak value signals.
- Portfolio decisions should use tracked outcomes.

## Build It

Reconstruct **AI Value Realization and Benefits Tracking** by following `Scenario` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Ship It

Hand off `outputs/sheet-ai-benefits-tracking.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Exercises

Treat this as a lab exercise. Preserve the setup and result, then explain which observation is doing the evidentiary work.

1. **Trace the happy path.** Run [main.py](../code/main.py) with `python3 main.py` from the lesson's `code/` directory. Record the smallest input that demonstrates “Identify AI initiatives that need benefits tracking”. Point to `normalize()`, `signal_matches()`, `score_scenario()` and name the returned field or printed value that serves as evidence.
2. **Perturb the input.** Change exactly one input, threshold, or option that affects “Build a value-realization artifact in Python”. Predict the direction of the change before running it, then compare the two outputs and explain why the other fields should stay stable.
3. **Test a failure case.** Construct a case that stresses “Map benefit owner, baseline missing, metric drift, and adoption lag to controls”: choose an empty collection, missing field, maximum-sized value, malformed record, or another boundary that fits this lesson. Write the expected behavior first and distinguish an intentional guard from an accidental crash.
4. **Transfer the result.** Open outputs/sheet-ai-benefits-tracking.md and adapt one example to a real workflow. State the owner, evidence, and next decision required for “Select benefit hypotheses, baselines, tracking cadence, and owner reviews”; mark any assumption that the demo does not establish.

## Reference Solution

A complete handoff records python3 main.py, the observed output, and the reasoning behind it. Check:

- evidence for “Identify AI initiatives that need benefits tracking” with the relevant input and returned field;
- a one-variable comparison that makes “Build a value-realization artifact in Python” visible;
- a predicted and observed boundary result for “Map benefit owner, baseline missing, metric drift, and adoption lag to controls”, including why the behavior is safe; and
- one concrete update to outputs/sheet-ai-benefits-tracking.md that applies “Select benefit hypotheses, baselines, tracking cadence, and owner reviews” without hiding uncertainty.

Use normalize(), signal_matches(), score_scenario() to explain the result, not only the prose output. If the experiment disagrees with the prediction, keep the failed prediction in the receipt and revise the explanation rather than changing the input until it passes.
