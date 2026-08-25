# AI Use Case Spotting and Automation Discovery

> A good AI use case is not any task that mentions text. It is a workflow with pain, data, repeatability, risk controls, and a measurable value hypothesis.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 01 (Prompt Engineering), Phase 11 Lesson 10 (Evaluation & Testing)
**Time:** ~45 minutes
**Capability:** Advisory and Business Consulting - AI & Automation Use Case Spotting

## Learning Objectives

- Identify the operational signals that make this capability relevant in day-to-day LHIND work
- Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan
- Map risk, value, uncertainty, and controls into a practical course exercise
- Use the generated worksheet as a reusable starting point for team enablement
- Explain when the topic belongs in awareness training, guided pilot work, or a launch gate

## The Problem

A workshop produces 60 AI ideas. Everyone is excited, but the list mixes automation, reporting, search, decision support, and novelty demos. Three months later, nothing ships because no one separated attractive ideas from viable use cases.

This lesson treats the course as a working session, not as a slide deck. Participants should leave with something they can use in the next project conversation: a checklist, matrix, prompt pack, memo, or scoring worksheet.

## The Concept

Use case spotting is a discipline of framing. Capture the workflow, user, trigger, input data, decision point, output, risk, and value metric. Then classify whether the right solution is rule automation, AI assistance, retrieval, prediction, or process redesign.

The recurring pattern is simple: identify the workflow, surface the signals, choose the right level of control, and produce an artifact that makes the next decision easier.

```mermaid
flowchart LR
    I[Input brief] --> S[Signals]
    S --> R[Risk and value score]
    R --> C[Controls]
    C --> A[Reusable artifact]
```

### Signals to Look For

- repeatable workflow
- text-heavy input
- measurable pain
- clear owner

### Controls to Teach

- pilot metric
- risk review
- data readiness check
- owner signoff

### Target Roles

- Business & Strategy Consulting
- Project Management & Agility


## Use It

Use the scorer in discovery workshops and portfolio reviews. It helps teams turn broad AI enthusiasm into a prioritized experiment backlog.

The expected output is not a final answer from AI. It is a better human conversation. The artifact makes the assumptions visible enough that a team can challenge them, tune the controls, and agree on the next step.

### Workshop Flow

1. Start with a real workflow from the participant's team.
2. Capture the signals in plain language.
3. Score impact and uncertainty together.
4. Review the recommended controls.
5. Decide whether the next step is awareness, practice, pilot, or launch gate.

## Reusable Artifact

AI use-case discovery canvas and prioritization score.

The output template in `outputs/canvas-ai-use-case-discovery.md` can be copied into a project kickoff, enablement workshop, or team retro. Keep the artifact short enough that teams actually use it.

## Key Takeaways

- The course is about operational judgment, not generic AI enthusiasm.
- A reusable artifact beats a one-time presentation because it changes the next project conversation.
- The right control level depends on workflow risk, uncertainty, business impact, and role accountability.
- AI can accelerate analysis, but the team still owns the decision, review, and rollout.

## Build It

Reconstruct **AI Use Case Spotting and Automation Discovery** by following `Scenario` on x=0.5 with the demo defaults. Run `python3 main.py` and verify that the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump.

## Ship It

Hand off `outputs/canvas-ai-use-case-discovery.md` with the command `python3 main.py`, the accepted input shape (x=0.5 with the demo defaults), the expected observable result, and a failure note for malformed inputs.

## Exercises

Start with the smallest reproducible run. Keep the input, output, and interpretation together so another reader can repeat the check.

1. **Start with a known input.** Run [main.py](../code/main.py) with `python3 main.py` from the lesson's `code/` directory. Record the smallest input that demonstrates “Identify the operational signals that make this capability relevant in day-to-day LHIND work”. Point to `normalize()`, `signal_matches()`, `score_scenario()` and name the returned field or printed value that serves as evidence.
2. **Run a controlled comparison.** Change exactly one input, threshold, or option that affects “Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan”. Predict the direction of the change before running it, then compare the two outputs and explain why the other fields should stay stable.
3. **Try the smallest valid counterexample.** Construct a case that stresses “Map risk, value, uncertainty, and controls into a practical course exercise”: choose an empty collection, missing field, maximum-sized value, malformed record, or another boundary that fits this lesson. Write the expected behavior first and distinguish an intentional guard from an accidental crash.
4. **Transfer the result.** Open outputs/canvas-ai-use-case-discovery.md and adapt one example to a real workflow. State the owner, evidence, and next decision required for “Use the generated worksheet as a reusable starting point for team enablement”; mark any assumption that the demo does not establish.

## Reference Solution

Your solution is complete when it records python3 main.py, the captured output, and a short interpretation. Show:

- evidence for “Identify the operational signals that make this capability relevant in day-to-day LHIND work” with the relevant input and returned field;
- a one-variable comparison that makes “Build a lightweight Python artifact that turns an ambiguous AI idea into a structured plan” visible;
- a predicted and observed boundary result for “Map risk, value, uncertainty, and controls into a practical course exercise”, including why the behavior is safe; and
- one concrete update to outputs/canvas-ai-use-case-discovery.md that applies “Use the generated worksheet as a reusable starting point for team enablement” without hiding uncertainty.

Use normalize(), signal_matches(), score_scenario() to explain the result, not only the prose output. If the experiment disagrees with the prediction, keep the failed prediction in the receipt and revise the explanation rather than changing the input until it passes.
