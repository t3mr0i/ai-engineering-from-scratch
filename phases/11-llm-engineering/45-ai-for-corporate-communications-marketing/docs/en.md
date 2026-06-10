# AI for Corporate Communications and Marketing

> AI can speed up communication work only when claims, tone, audience, and approval are made explicit before publication.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 21 (AI-Assisted Documentation), Phase 11 Lesson 26 (Consultative Prompting)
**Time:** ~45 minutes
**Capability:** Corporate Communications - Message Quality and Review

## Learning Objectives

- Identify communication scenarios where AI support creates brand or approval risk
- Build a message-review artifact in Python
- Map audience risk, brand claim, sensitive topic, and approval gap to controls
- Select review controls before AI-assisted messages are published
- Explain why AI communication work needs sources, tone checks, and ownership

## The Problem

AI can draft announcements, intranet posts, campaign copy, leadership briefs, and customer-facing messages quickly. The risk is that polished text hides weak sources, overstates a claim, misses tone, or bypasses approval.

## The Concept

Communications teams need a repeatable gate. Before using AI-assisted copy, check the audience, claim, sensitivity, and owner. The course artifact turns those signals into a review priority.

```mermaid
flowchart LR
    I[Input facts] --> D[Draft]
    D --> R[Risk signals]
    R --> C[Controls]
    C --> P[Publish or revise]
```

### Signals to Look For

- audience risk
- brand claim
- sensitive topic
- approval gap

### Controls to Teach

- source pack
- tone check
- approval owner
- channel plan

### Target Roles

- Corporate Functions
- Leadership
- Business & Strategy Consulting

## Build It

In the lab you build a communications AI review planner. It ranks draft scenarios and recommends controls before publication.

Run it locally:

```bash
cd phases/11-llm-engineering/45-ai-for-corporate-communications-marketing/code
python3 main.py
python3 -m unittest discover tests -v
```

## Use It

Use the artifact for intranet updates, campaign drafts, leadership notes, customer-facing messages, and change communication.

## Reusable Artifact

Communication AI review checklist.

The template in `outputs/checklist-communications-ai-review.md` can be used before AI-assisted messages are sent or published.

## Key Takeaways

- AI-assisted communication needs explicit source and approval checks.
- Tone quality is not the same as factual reliability.
- Sensitive messages need a named owner.
- The channel plan decides how much review is required.
