# AI Product Experiment Design and Feedback Analytics

> Product AI work needs hypotheses and feedback loops, not just feature ideas.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 23 (AI-Enhanced User Research), Phase 11 Lesson 105 (AI-Assisted Backlog Scoring)
**Time:** ~45 minutes
**Capability:** Products and Value Streams - Experiment Feedback Fit

## Learning Objectives

- Identify product AI ideas that should be tested as experiments
- Build a product experiment triage artifact in Python
- Map user feedback, unclear hypotheses, missing metrics, and rollout risk to controls
- Select hypothesis, metric, feedback-sample, and stop-rule controls
- Explain why AI product decisions need explicit learning goals

## The Problem

AI features often reach the backlog as broad ideas: add a copilot, summarize customer input, classify requests, or automate a workflow. Without a hypothesis and feedback design, the team may ship an impressive demo that does not improve the product outcome.

## The Concept

A product experiment connects an AI capability to a user behavior, a measurable outcome, and a decision. AI can help synthesize feedback, but the team still needs a clear hypothesis, success metric, sample plan, and stop rule.

```mermaid
flowchart LR
    I[Idea] --> H[Hypothesis]
    H --> M[Success metric]
    M --> F[Feedback sample]
    F --> S[Stop rule]
    S --> D[Product decision]
```

### Signals to Look For

- user feedback
- hypothesis unclear
- metric missing
- experiment risk

### Controls to Teach

- hypothesis statement
- success metric
- feedback sample
- stop rule

### Target Roles

- Products & Value Streams
- Product Owners
- Project Management & Agility
- Business Consulting


## Use It

Use the artifact for AI backlog items, product discovery, feedback synthesis, pilot planning, and controlled rollout decisions.

## Reusable Artifact

Product experiment feedback canvas.

The template in `outputs/canvas-product-experiment-feedback.md` can be used before an AI product idea moves from discovery into delivery.

## Key Takeaways

- AI product work should start with a hypothesis.
- Feedback synthesis needs a visible sample and bias check.
- Metrics should decide what happens after the pilot.
- Stop rules protect teams from scaling weak evidence.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify product AI ideas that should be tested as experiments.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a product experiment triage artifact in Python.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Map user feedback, unclear hypotheses, missing metrics, and rollout risk to controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify product AI ideas that should be tested as experiments,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Map user feedback, unclear hypotheses, missing metrics, and rollout risk to controls,” and cite a repeatable check rather than relying on visual inspection alone.
