# Hands-on Prompt Clinic

> Prompt training becomes useful when people leave with reusable prompts, review habits, and a clear sense of what must be checked by a human.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 01 (Prompt Engineering), Phase 11 Lesson 03 (Structured Outputs)
**Time:** ~45 minutes
**Capability:** Foundation - Personal AI Productivity and Applied Prompting

## Learning Objectives

- Diagnose weak prompts by goal, audience, context, constraints, and evidence
- Build a small prompt-clinic planner in Python
- Convert vague requests into reusable prompt briefs
- Choose review controls for AI outputs
- Explain when prompting is awareness training, team practice, or a guided pilot

## The Problem

Many people know that better prompts create better outputs, but they still ask for vague summaries, accept confident mistakes, and repeat the same prompt work manually. A prompt clinic gives teams a shared way to improve prompts together.

## The Concept

A good prompt is a work contract. It states the goal, audience, context, constraints, source material, and output format. The clinic adds review discipline: every output needs a quality check that fits the risk of the task.

```mermaid
flowchart LR
    G[Goal] --> C[Context]
    C --> R[Rules]
    R --> O[Output format]
    O --> V[Review]
    V --> P[Prompt pack]
```

### Signals to Look For

- vague goal
- missing audience
- weak constraint
- no example

### Controls to Teach

- prompt brief
- iteration log
- output rubric
- source check

### Target Roles

- All roles
- Corporate Functions
- Project Management
- Consulting


## Use It

Use the artifact in enablement sessions, brown bags, and team retros. The goal is not to memorize prompt formulas. The goal is to make good prompting repeatable and reviewable.

## Reusable Artifact

Prompt clinic review sheet.

The template in `outputs/prompt-clinic-review-sheet.md` can be used to collect before and after prompts, review comments, and reusable prompt patterns.

## Key Takeaways

- Prompt quality depends on task framing, not magic wording.
- Output review is part of the prompt workflow.
- Teams should turn good prompts into maintained assets.
- The best prompt clinic uses real work examples.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Diagnose weak prompts by goal, audience, context, constraints, and evidence.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a small prompt-clinic planner in Python.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Convert vague requests into reusable prompt briefs.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Diagnose weak prompts by goal, audience, context, constraints, and evidence,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Convert vague requests into reusable prompt briefs,” and cite a repeatable check rather than relying on visual inspection alone.
