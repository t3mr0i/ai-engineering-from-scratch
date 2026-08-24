# AI Change Management and Team Integration

> AI adoption is not finished when a tool is available. It is finished when roles, handoffs, review duties, and behavior changes are clear.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 18 (Responsible AI Compliance Workflow), Phase 11 Lesson 90 (AI Workforce Strategy)
**Time:** ~45 minutes
**Capability:** Leadership and Strategy - Managing AI Transformations

## Learning Objectives

- Identify adoption signals that block AI use in real teams
- Build a change-readiness planner in Python
- Map role impact, adoption friction, governance gaps, and handoffs
- Select controls for team integration and rollout
- Explain why AI change needs operating routines, not only communication

## The Problem

A tool is launched, a few early adopters use it, and then adoption stalls. Some teams worry about accountability, some do not know when AI is allowed, and some managers cannot see whether behavior changed. The missing piece is team integration.

## The Concept

AI change management links people, process, risk, and measurement. Every new AI workflow needs a role map, a human review point, an adoption metric, and a way to handle exceptions.

```mermaid
flowchart LR
    T[Target workflow] --> R[Role impact]
    R --> H[Handoffs]
    H --> G[Governance]
    G --> M[Adoption metric]
    M --> P[Rollout plan]
```

### Signals to Look For

- role impact
- adoption friction
- governance gap
- process handoff

### Controls to Teach

- role map
- stakeholder plan
- training path
- adoption metric

### Target Roles

- Leadership
- Project Management
- Corporate Functions
- Business & Strategy Consulting


## Use It

Use the artifact when moving from pilot to rollout, when defining team responsibilities, or when preparing a leader conversation about AI adoption.

## Reusable Artifact

AI change integration plan.

The template in `outputs/plan-ai-change-integration.md` can be used as a rollout checklist for team-level adoption.

## Key Takeaways

- AI change is a workflow redesign problem.
- Adoption needs role clarity and a measurable behavior shift.
- Human review points must be explicit.
- Governance language should be translated into team routines.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify adoption signals that block AI use in real teams.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a change-readiness planner in Python.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Map role impact, adoption friction, governance gaps, and handoffs.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify adoption signals that block AI use in real teams,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Map role impact, adoption friction, governance gaps, and handoffs,” and cite a repeatable check rather than relying on visual inspection alone.
