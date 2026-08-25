# AI-Assisted Documentation

> AI can draft documentation. Teams still need a standard for what must be true, current, findable, and safe to rely on during an incident.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 01 (Prompt Engineering), Phase 11 Lesson 10 (Evaluation & Testing)
**Time:** ~45 minutes
**Capability:** Engineering - AI-Assisted Documentation

## Learning Objectives

- Identify the operational signals that make this capability relevant in day-to-day LHIND work
- Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan
- Map risk, value, uncertainty, and controls into a practical course exercise
- Use the generated worksheet as a reusable starting point for team enablement
- Explain when the topic belongs in awareness training, guided pilot work, or a launch gate

## The Problem

A project uses AI to create runbooks and release notes. The text looks polished, but one command is obsolete and one prerequisite is missing. During an incident the runbook slows the team down. The issue was not writing quality. It was documentation verification.

This lesson treats the course as a working session, not as a slide deck. Participants should leave with something they can use in the next project conversation: a checklist, matrix, prompt pack, memo, or scoring worksheet.

## The Concept

AI-assisted documentation needs source grounding, ownership, and freshness checks. Treat generated text as a draft against evidence: code, tickets, architecture decisions, monitoring links, and operational procedures. Good documentation is not more prose. It is a reliable map for action.

The recurring pattern is simple: identify the workflow, surface the signals, choose the right level of control, and produce an artifact that makes the next decision easier.

```mermaid
flowchart LR
    I[Input brief] --> S[Signals]
    S --> R[Risk and value score]
    R --> C[Controls]
    C --> A[Reusable artifact]
```

### Signals to Look For

- missing owner
- no source link
- stale date
- no verification step

### Controls to Teach

- source citation
- owner approval
- review cadence
- command validation

### Target Roles

- Technology Consulting
- Corporate Functions
- Leadership


## Use It

Use it for runbooks, ADRs, API docs, handover pages, and release notes. The scanner helps reviewers catch glossy but untrustworthy AI-generated documentation.

The expected output is not a final answer from AI. It is a better human conversation. The artifact makes the assumptions visible enough that a team can challenge them, tune the controls, and agree on the next step.

### Workshop Flow

1. Start with a real workflow from the participant's team.
2. Capture the signals in plain language.
3. Score impact and uncertainty together.
4. Review the recommended controls.
5. Decide whether the next step is awareness, practice, pilot, or launch gate.

## Reusable Artifact

Documentation quality checklist and review prompt.

The output template in `outputs/checklist-ai-documentation-review.md` can be copied into a project kickoff, enablement workshop, or team retro. Keep the artifact short enough that teams actually use it.

## Key Takeaways

- The course is about operational judgment, not generic AI enthusiasm.
- A reusable artifact beats a one-time presentation because it changes the next project conversation.
- The right control level depends on workflow risk, uncertainty, business impact, and role accountability.
- AI can accelerate analysis, but the team still owns the decision, review, and rollout.

## Build It

Reconstruct **AI-Assisted Documentation** by following `Scenario` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Ship It

Hand off `outputs/checklist-ai-documentation-review.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Exercises

Begin with a control run and leave a short receipt: input, output, and the reasoning that connects them to the objective.

1. **Reproduce the control run.** Run [main.py](../code/main.py) with `python3 main.py` from the lesson's `code/` directory. Record the smallest input that demonstrates “Identify the operational signals that make this capability relevant in day-to-day LHIND work”. Point to `normalize()`, `signal_matches()`, `score_scenario()` and name the returned field or printed value that serves as evidence.
2. **Change one decision.** Change exactly one input, threshold, or option that affects “Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan”. Predict the direction of the change before running it, then compare the two outputs and explain why the other fields should stay stable.
3. **Probe a boundary.** Construct a case that stresses “Map risk, value, uncertainty, and controls into a practical course exercise”: choose an empty collection, missing field, maximum-sized value, malformed record, or another boundary that fits this lesson. Write the expected behavior first and distinguish an intentional guard from an accidental crash.
4. **Transfer the result.** Open outputs/checklist-ai-documentation-review.md and adapt one example to a real workflow. State the owner, evidence, and next decision required for “Use the generated worksheet as a reusable starting point for team enablement”; mark any assumption that the demo does not establish.

## Reference Solution

Keep the solution auditable: run python3 main.py, save the output, and explain what it demonstrates. Include:

- evidence for “Identify the operational signals that make this capability relevant in day-to-day LHIND work” with the relevant input and returned field;
- a one-variable comparison that makes “Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan” visible;
- a predicted and observed boundary result for “Map risk, value, uncertainty, and controls into a practical course exercise”, including why the behavior is safe; and
- one concrete update to outputs/checklist-ai-documentation-review.md that applies “Use the generated worksheet as a reusable starting point for team enablement” without hiding uncertainty.

Use normalize(), signal_matches(), score_scenario() to explain the result, not only the prose output. If the experiment disagrees with the prediction, keep the failed prediction in the receipt and revise the explanation rather than changing the input until it passes.
