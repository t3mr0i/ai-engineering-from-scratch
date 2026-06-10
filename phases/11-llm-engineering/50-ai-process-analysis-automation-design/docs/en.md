# AI Process Analysis and Automation Design

> AI automation starts with process understanding, not with a tool demo.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 24 (AI Use Case Spotting and Automation Discovery), Phase 11 Lesson 32 (AI Use Case Identification Workshop)
**Time:** ~45 minutes
**Capability:** Process Improvement - AI-Supported Automation Design

## Learning Objectives

- Identify process signals that make an AI automation idea worth analyzing
- Build a process-automation triage artifact in Python
- Map process pain, manual handoff, exception volume, and automation risk to controls
- Select pilot controls before automating a workflow
- Explain why exception handling and human fallback matter for AI automation

## The Problem

Many AI ideas start as "can we automate this?" before the process is understood. Without a process map, exception log, value check, and fallback plan, AI can make an inefficient process faster but less reliable.

## The Concept

Automation design begins with observable process signals. The team maps the flow, identifies handoffs and exceptions, checks value, and decides whether a pilot is safe.

```mermaid
flowchart LR
    P[Process pain] --> M[Process map]
    M --> E[Exceptions]
    E --> V[Value check]
    V --> F[Human fallback]
    F --> Pilot[Pilot]
```

### Signals to Look For

- process pain
- manual handoff
- exception volume
- automation risk

### Controls to Teach

- process map
- value check
- exception log
- human fallback

### Target Roles

- Business & Strategy Consulting
- Project Management & Agility
- Products & Value Streams
- Application Management

## Build It

In the lab you build a process automation triage planner. It ranks workflows and recommends controls before teams pilot AI automation.

Run it locally:

```bash
cd phases/11-llm-engineering/50-ai-process-analysis-automation-design/code
python3 main.py
python3 -m unittest discover tests -v
```

## Use It

Use the artifact for automation discovery, workflow redesign, AI pilot planning, and process-improvement workshops.

## Reusable Artifact

Process automation triage sheet.

The template in `outputs/sheet-process-automation-triage.md` can be used before choosing an AI automation pilot.

## Key Takeaways

- AI automation should start with a mapped process.
- Exceptions determine how much human fallback is needed.
- Value checks prevent automating low-impact work.
- Pilots need clear boundaries before scaling.
