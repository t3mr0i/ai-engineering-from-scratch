# Internal Knowledge Assistants with RAG

> A useful internal assistant is not a chatbot over every document. It is a governed retrieval workflow with source ownership, evaluation, and escalation.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 06 (RAG), Phase 11 Lesson 30 (Data Literacy for AI Projects)
**Time:** ~45 minutes
**Capability:** Foundation - Personal AI Productivity and Data Literacy

## Learning Objectives

- Identify when an internal knowledge assistant is a good fit
- Build a source-readiness planner in Python
- Map ownership, freshness, permissions, and evaluation into a RAG intake
- Choose controls before indexing internal knowledge
- Explain why source governance matters more than chatbot polish

## The Problem

Many teams want a SharePoint or Confluence assistant. The hard part is not the chat box. The hard part is knowing which sources are allowed, who owns them, what is stale, and how wrong answers will be caught.

## The Concept

RAG makes knowledge available at query time. For internal assistants, that knowledge must be curated. A useful assistant needs a source inventory, permission model, evaluation sample, and fallback path when the answer is uncertain.

```mermaid
flowchart LR
    S[Sources] --> I[Index]
    I --> R[Retrieval]
    R --> A[Answer]
    A --> E[Evidence]
    E --> F[Fallback]
```

### Signals to Look For

- source sprawl
- stale content
- permission risk
- no evaluation set

### Controls to Teach

- source owner
- freshness rule
- access boundary
- answer evaluation

### Target Roles

- Corporate Functions
- Products & Value Streams
- Application Management
- Business & Strategy Consulting

## Build It

In the lab you build a source-readiness planner for internal assistants. It ranks scenarios and recommends the controls needed before documents are indexed.

Run it locally:

```bash
cd phases/11-llm-engineering/36-internal-knowledge-assistants-rag/code
python3 main.py
python3 -m unittest discover tests -v
```

## Use It

Use the artifact before building a knowledge assistant, during source cleanup, and when defining support handoff for uncertain answers.

## Reusable Artifact

Internal knowledge assistant intake.

The template in `outputs/intake-internal-knowledge-assistant.md` can be used before indexing internal sources.

## Key Takeaways

- Internal RAG quality depends on source governance.
- Permissions and freshness are product requirements.
- Evaluation samples should include real user questions.
- A fallback path is part of the assistant design.
