# AI Architecture Decision Governance

> AI architecture decisions need recorded tradeoffs before they become expensive defaults.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 03 (Structured Outputs), Phase 11 Lesson 37 (AI Vendor and Procurement Evaluation)
**Time:** ~45 minutes
**Capability:** Architecture - Governed AI Design Decisions

## Learning Objectives

- Identify AI architecture decisions that need formal governance
- Build an architecture-decision triage artifact in Python
- Map technical uncertainty, vendor lock-in, security boundary, and cost tradeoff to controls
- Choose when to create a design note, ADR, or architecture review
- Explain why reversibility matters in AI architecture decisions

## The Problem

AI architecture choices can become sticky: model providers, gateways, RAG designs, security boundaries, observability tools, and cost patterns. If tradeoffs are not recorded, teams inherit decisions without context.

## The Concept

Architecture governance records the decision, alternatives, risk, cost, security boundary, and review owner. The stronger the impact and the harder the reversal, the stronger the governance gate.

```mermaid
flowchart LR
    D[Decision] --> A[ADR]
    A --> T[Threat model]
    T --> C[Cost model]
    C --> R[Review board]
```

### Signals to Look For

- technical uncertainty
- vendor lock-in
- security boundary
- cost tradeoff

### Controls to Teach

- adr record
- threat model
- cost model
- review board

### Target Roles

- Technology Consulting
- Products & Value Streams
- Application Management
- Leadership


## Use It

Use the artifact for model gateway decisions, RAG architecture choices, vendor selection, AI security boundary design, and cost tradeoff reviews.

## Reusable Artifact

AI architecture decision record template.

The template in `outputs/template-ai-architecture-decision-record.md` can be used before approving a material AI architecture decision.

## Key Takeaways

- AI architecture decisions should be recorded before scaling.
- Vendor lock-in and security boundaries raise governance needs.
- Cost tradeoffs belong in the architecture discussion.
- Reversibility determines how formal the review should be.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify AI architecture decisions that need formal governance.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build an architecture-decision triage artifact in Python.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Map technical uncertainty, vendor lock-in, security boundary, and cost tradeoff to controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify AI architecture decisions that need formal governance,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Map technical uncertainty, vendor lock-in, security boundary, and cost tradeoff to controls,” and cite a repeatable check rather than relying on visual inspection alone.
