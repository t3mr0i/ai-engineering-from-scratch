# AI BI Reporting and Data Storytelling

> AI can draft reporting narratives, but metrics, charts, causality, and decisions still need human review.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 30 (Data Literacy for AI Projects), Phase 11 Lesson 48 (AI Project Reporting and Steering)
**Time:** ~45 minutes
**Capability:** Data Literacy - AI-Assisted Reporting Narratives

## Learning Objectives

- Identify reporting scenarios where AI-generated narratives need evidence controls
- Build a BI storytelling triage artifact in Python
- Map metric ambiguity, visualization risk, causality claim, and audience decision to controls
- Select metric definition, chart check, causality warning, and decision-context controls
- Explain why AI data stories must not overstate what the data proves

## The Problem

AI can quickly write dashboard summaries and management report narratives. The risk is that it turns ambiguous metrics, misleading charts, or weak correlations into confident business explanations.

## The Concept

Data storytelling needs a review gate. Before a narrative is shared, define the metric, inspect the chart, flag causality limits, and state the decision context.

```mermaid
flowchart LR
    M[Metric] --> C[Chart check]
    C --> W[Causality warning]
    W --> D[Decision context]
    D --> N[Narrative]
```

### Signals to Look For

- metric ambiguity
- visualization risk
- causality claim
- audience decision

### Controls to Teach

- metric definition
- chart check
- causality warning
- decision context

### Target Roles

- Leadership
- Corporate Functions
- Business & Strategy Consulting
- Project Management & Agility


## Use It

Use the artifact for Power BI narratives, management reports, KPI summaries, dashboard notes, and decision briefings.

## Reusable Artifact

AI reporting narrative review sheet.

The template in `outputs/sheet-bi-reporting-narrative-review.md` can be used before AI-generated reporting text is shared.

## Key Takeaways

- AI reporting text needs metric definitions.
- Chart risks can change the story.
- Correlation should not be written as causality.
- Decision context determines how much review is needed.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify reporting scenarios where AI-generated narratives need evidence controls.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a BI storytelling triage artifact in Python.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Map metric ambiguity, visualization risk, causality claim, and audience decision to controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify reporting scenarios where AI-generated narratives need evidence controls,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Map metric ambiguity, visualization risk, causality claim, and audience decision to controls,” and cite a repeatable check rather than relying on visual inspection alone.
