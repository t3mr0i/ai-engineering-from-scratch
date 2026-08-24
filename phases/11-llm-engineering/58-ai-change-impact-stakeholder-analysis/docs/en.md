# AI Change Impact and Stakeholder Analysis

> AI adoption succeeds when role impact, stakeholder needs, communication, and manager enablement are explicit.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 33 (AI Change Management and Team Integration), Phase 11 Lesson 45 (AI for Corporate Communications and Marketing)
**Time:** ~45 minutes
**Capability:** Change Management - Stakeholder Impact Mapping

## Learning Objectives

- Identify AI rollouts that require change-impact analysis
- Build a stakeholder-impact artifact in Python
- Map role impact, adoption risk, communication gap, and manager dependency to controls
- Select impact, stakeholder, communication, and manager-enablement controls
- Explain why AI adoption needs role-specific change planning

## The Problem

AI rollouts often focus on tools and training. Teams still struggle when roles change, managers cannot explain expectations, or stakeholders do not see how the change affects their work.

## The Concept

Change analysis starts with impact. The team maps affected roles, stakeholder needs, communication gaps, and manager dependencies before scaling adoption.

```mermaid
flowchart LR
    R[Role impact] --> S[Stakeholder plan]
    S --> C[Communication script]
    C --> M[Manager brief]
    M --> A[Adoption]
```

### Signals to Look For

- role impact
- adoption risk
- communication gap
- manager dependency

### Controls to Teach

- impact map
- stakeholder plan
- communication script
- manager brief

### Target Roles

- Leadership
- Project Management & Agility
- Corporate Functions
- AI Champions


## Use It

Use the artifact for AI rollout planning, role-impact analysis, stakeholder communication, and manager enablement.

## Reusable Artifact

AI change impact map.

The template in `outputs/map-ai-change-impact.md` can be used before an AI tool, workflow, or assistant is rolled out.

## Key Takeaways

- AI change planning starts with role impact.
- Managers need clear briefing material.
- Communication gaps become adoption risk.
- Stakeholder plans should be specific to the affected work.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify AI rollouts that require change-impact analysis.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a stakeholder-impact artifact in Python.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Map role impact, adoption risk, communication gap, and manager dependency to controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify AI rollouts that require change-impact analysis,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Map role impact, adoption risk, communication gap, and manager dependency to controls,” and cite a repeatable check rather than relying on visual inspection alone.
