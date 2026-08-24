# AI for Legal, Procurement, and Compliance

> AI can accelerate review preparation, but legal and procurement teams still own obligations, evidence, negotiation, and final judgment.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 18 (Responsible AI Compliance Workflow), Phase 11 Lesson 37 (AI Vendor and Procurement Evaluation)
**Time:** ~45 minutes
**Capability:** Corporate Functions - Legal and Procurement AI Enablement

## Learning Objectives

- Identify where AI can support legal, procurement, and compliance workflows
- Build a clause-and-obligation triage artifact in Python
- Map confidentiality, obligation risk, vendor terms, and missing evidence to controls
- Choose review controls before AI-assisted legal or procurement outputs are used
- Explain why AI can prepare work but cannot own legal interpretation

## The Problem

Legal and procurement teams can use AI to summarize policies, compare vendor terms, draft questions, and prepare review notes. The risk is that a generated summary misses obligations, weakens negotiation, or exposes confidential material.

## The Concept

AI-supported legal and procurement work should separate preparation from judgment. The model may help structure information, but legal interpretation, risk acceptance, and negotiation positions require accountable human review.

```mermaid
flowchart LR
    D[Document] --> S[Summary]
    S --> O[Obligations]
    O --> R[Risk review]
    R --> A[Approval]
```

### Signals to Look For

- confidential term
- obligation risk
- vendor clause
- missing evidence

### Controls to Teach

- confidentiality check
- clause register
- legal reviewer
- decision record

### Target Roles

- Corporate Functions
- Business & Strategy Consulting
- Leadership


## Use It

Use the artifact for AI-assisted policy summaries, vendor comparisons, contract review preparation, and compliance intake.

## Reusable Artifact

Legal and procurement AI review sheet.

The template in `outputs/sheet-legal-procurement-ai-review.md` can be used before generated review notes are shared.

## Key Takeaways

- AI can prepare legal and procurement work, not own it.
- Confidentiality and obligation risk must be checked first.
- Vendor terms need traceable evidence.
- Human reviewers remain accountable for decisions.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify where AI can support legal, procurement, and compliance workflows.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a clause-and-obligation triage artifact in Python.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Map confidentiality, obligation risk, vendor terms, and missing evidence to controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify where AI can support legal, procurement, and compliance workflows,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Map confidentiality, obligation risk, vendor terms, and missing evidence to controls,” and cite a repeatable check rather than relying on visual inspection alone.
