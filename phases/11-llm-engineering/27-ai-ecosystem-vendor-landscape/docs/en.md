# AI Ecosystem and Vendor Landscape

> Vendor knowledge is not memorizing logos. It is knowing which category of tool solves which problem, what lock-in it creates, and what must be tested before buying.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 01 (Prompt Engineering), Phase 11 Lesson 10 (Evaluation & Testing)
**Time:** ~45 minutes
**Capability:** Advisory and Business Consulting - AI Ecosystem Knowledge

## Learning Objectives

- Identify the operational signals that make this capability relevant in day-to-day LHIND work
- Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan
- Map risk, value, uncertainty, and controls into a practical course exercise
- Use the generated worksheet as a reusable starting point for team enablement
- Explain when the topic belongs in awareness training, guided pilot work, or a launch gate

## The Problem

A team compares a copilot, an agent platform, a vector database, and a workflow tool as if they were alternatives. The discussion becomes brand-driven because the team lacks a shared map of the AI ecosystem.

This lesson treats the course as a working session, not as a slide deck. Participants should leave with something they can use in the next project conversation: a checklist, matrix, prompt pack, memo, or scoring worksheet.

## The Concept

The AI ecosystem is layered: models, inference platforms, orchestration, retrieval, evaluation, observability, security, copilots, and business applications. Good vendor decisions start by locating the need in the stack and defining evaluation criteria before demos.

The recurring pattern is simple: identify the workflow, surface the signals, choose the right level of control, and produce an artifact that makes the next decision easier.

```mermaid
flowchart LR
    I[Input brief] --> S[Signals]
    S --> R[Risk and value score]
    R --> C[Controls]
    C --> A[Reusable artifact]
```

### Signals to Look For

- data residency
- integration need
- governance requirement
- lock-in risk

### Controls to Teach

- evaluation criteria
- pilot test
- exit plan
- security review

### Target Roles

- Business & Strategy Consulting
- Technology Consulting
- Leadership


## Use It

Use the matrix during make-or-buy discussions, RFP preparation, architecture review, and vendor demos. It keeps the team focused on evidence instead of hype.

The expected output is not a final answer from AI. It is a better human conversation. The artifact makes the assumptions visible enough that a team can challenge them, tune the controls, and agree on the next step.

### Workshop Flow

1. Start with a real workflow from the participant's team.
2. Capture the signals in plain language.
3. Score impact and uncertainty together.
4. Review the recommended controls.
5. Decide whether the next step is awareness, practice, pilot, or launch gate.

## Reusable Artifact

AI ecosystem map and vendor evaluation matrix.

The output template in `outputs/matrix-ai-vendor-evaluation.md` can be copied into a project kickoff, enablement workshop, or team retro. Keep the artifact short enough that teams actually use it.

## Key Takeaways

- The course is about operational judgment, not generic AI enthusiasm.
- A reusable artifact beats a one-time presentation because it changes the next project conversation.
- The right control level depends on workflow risk, uncertainty, business impact, and role accountability.
- AI can accelerate analysis, but the team still owns the decision, review, and rollout.
