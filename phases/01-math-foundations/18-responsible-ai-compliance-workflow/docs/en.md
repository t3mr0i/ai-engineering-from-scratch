# Responsible AI Compliance Workflow

> A useful AI assistant is not production-ready until someone can explain what data it touches, what risks it creates, and who owns the decision when it is wrong.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 01 (Prompt Engineering), Phase 11 Lesson 10 (Evaluation & Testing)
**Time:** ~45 minutes
**Capability:** Foundation - Corporate Ethics & Compliance

## Learning Objectives

- Identify the operational signals that make this capability relevant in day-to-day LHIND work
- Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan
- Map risk, value, uncertainty, and controls into a practical course exercise
- Use the generated worksheet as a reusable starting point for team enablement
- Explain when the topic belongs in awareness training, guided pilot work, or a launch gate

## The Problem

A team builds a helpful document assistant for internal policies. It summarizes PDFs, answers questions, and drafts emails. The demo is good, so the team wants to publish it broadly. Then someone asks where sensitive HR data goes, whether the assistant can make employment recommendations, and who reviews high-risk outputs. Nobody has a crisp answer. The project stalls, not because the model failed, but because the workflow around the model was never designed.

This lesson treats the course as a working session, not as a slide deck. Participants should leave with something they can use in the next project conversation: a checklist, matrix, prompt pack, memo, or scoring worksheet.

## The Concept

Responsible AI compliance is an operating workflow, not a poster. The team needs a repeatable way to classify use cases, identify data sensitivity, assign controls, and decide whether a human review gate is mandatory. The key move is to separate capability from permission. A model may be able to infer, rank, or recommend, but the system may only be allowed to assist, summarize, or draft under review.

The recurring pattern is simple: identify the workflow, surface the signals, choose the right level of control, and produce an artifact that makes the next decision easier.

```mermaid
flowchart LR
    I[Input brief] --> S[Signals]
    S --> R[Risk and value score]
    R --> C[Controls]
    C --> A[Reusable artifact]
```

### Signals to Look For

- sensitive data
- external impact
- automated decision
- explanation required

### Controls to Teach

- PII minimization
- human review
- audit log
- approved tools only

### Target Roles

- All LHIND employees
- Leadership
- Corporate Functions


## Use It

Use the checklist before a pilot starts, not after the demo succeeds. It gives business owners, compliance, data protection, and engineering a shared language for whether a use case can ship as self-service, assisted workflow, or review-only capability.

The expected output is not a final answer from AI. It is a better human conversation. The artifact makes the assumptions visible enough that a team can challenge them, tune the controls, and agree on the next step.

### Workshop Flow

1. Start with a real workflow from the participant's team.
2. Capture the signals in plain language.
3. Score impact and uncertainty together.
4. Review the recommended controls.
5. Decide whether the next step is awareness, practice, pilot, or launch gate.

## Reusable Artifact

Responsible AI intake checklist and launch gate template.

The output template in `outputs/checklist-responsible-ai-intake.md` can be copied into a project kickoff, enablement workshop, or team retro. Keep the artifact short enough that teams actually use it.

## Key Takeaways

- The course is about operational judgment, not generic AI enthusiasm.
- A reusable artifact beats a one-time presentation because it changes the next project conversation.
- The right control level depends on workflow risk, uncertainty, business impact, and role accountability.
- AI can accelerate analysis, but the team still owns the decision, review, and rollout.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify the operational signals that make this capability relevant in day-to-day LHIND work.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Map risk, value, uncertainty, and controls into a practical course exercise.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify the operational signals that make this capability relevant in day-to-day LHIND work,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Map risk, value, uncertainty, and controls into a practical course exercise,” and cite a repeatable check rather than relying on visual inspection alone.
