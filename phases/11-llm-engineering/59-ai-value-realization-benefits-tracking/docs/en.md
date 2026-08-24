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

## Key Takeaways

- Launch is not the same as value.
- Benefits need owners and baselines.
- Adoption lag can explain weak value signals.
- Portfolio decisions should use tracked outcomes.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify AI initiatives that need benefits tracking.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a value-realization artifact in Python.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Map benefit owner, baseline missing, metric drift, and adoption lag to controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify AI initiatives that need benefits tracking,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Map benefit owner, baseline missing, metric drift, and adoption lag to controls,” and cite a repeatable check rather than relying on visual inspection alone.
