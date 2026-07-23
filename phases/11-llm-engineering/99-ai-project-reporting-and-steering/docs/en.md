# AI-Assisted Project Status and Steering Pack Production (2026)

> A 2025 McKinsey study found that project managers spend 35–40% of their weekly hours on status collection, synthesis, and pack assembly — work that produces no new decisions. By 2026, frontier models handle the mechanical synthesis reliably: pulling signals from Jira, Git, and meeting transcripts, structuring them into a steering-ready format, and surfacing the open decision questions that actually need stakeholder attention. The skill that separates an effective consultant from a frustrated one is no longer the ability to assemble a pack; it is the ability to define what evidence a good pack must contain, what decision question each slide answers, and when AI-generated content is good enough to present without manual rework. This lesson builds that skill as an engineering discipline rather than a presentation-design question.

**Type:** Learn
**Languages:** Python (stdlib — steering-signal classifier + pack-section decision router)
**Prerequisites:** Phase 11 · 10 (Evaluation and Testing LLM Applications), Phase 11 · 29 (Decision Making with AI)
**Time:** ~45 minutes

## The Problem

Project steering packs fail in two predictable ways. The first is evidence-free status: a RAG/Amber/Green indicator appears on the cover slide with no traceable source, stakeholders cannot tell whether the amber means "one minor delay" or "the MVP scope is at risk," and the meeting turns into a fact-finding exercise that should have happened before the room assembled. The second failure is the opposite: raw data dumps — sprint velocity charts, open-ticket counts, deployment frequencies — assembled without a governing decision question, so a typical 60-minute steering meeting typically loses 20–30 minutes to triangulating signals the author could have pre-answered.

The engineering question for 2026 is not whether an LLM can write a status section. It is: given a set of project signals, which ones change the steering recommendation, which decision question each section of the pack is designed to answer, and when the confidence in AI-generated synthesis is high enough to present without a human editorial pass. Phase 11 · 10 showed that evaluation gates are the discipline that keeps LLM outputs from degrading silently; this lesson applies the same thinking to reporting pipelines: treat each pack section as an LLM output that requires a defined acceptance criterion, not a document that "looks right" on a quick read.

## The Concept

### What a steering pack actually is

A steering pack is a structured sequence of decision questions answered with evidence. It is not a slide deck that happens to contain project information. Every section should map to exactly one of three types of steering action:

| Section type | Steering action | Confidence required |
|---|---|---|
| Status confirmation | Approve continuation at current scope and pace | High — signals are consistent and unambiguous |
| Risk escalation | Trigger a pre-agreed response (more resource, scope cut, architecture review) | Medium — one or more signals exceed threshold |
| Decision request | Stakeholder makes a call that the team cannot make below their level | Low — competing options exist, each with material trade-offs |

Most packs contain all three types. The failure mode is conflating them: burying a decision request inside a status section means it will not get a decision.

### The evidence hierarchy

Not all project signals carry equal weight as steering evidence. The hierarchy below applies across consulting engagements and product organizations:

| Tier | Signal examples | Reliability | Staleness threshold |
|---|---|---|---|
| T1 — Measured outcomes | Production defect rate, API error rate, lead time for changes | Highest | 24 hours |
| T2 — Delivery metrics | Sprint velocity, planned vs. actual scope, open blocker count | High | 3 days |
| T3 — Qualitative assessments | Team confidence scores, stakeholder satisfaction, risk narrative | Medium | 1 week |
| T4 — Proxy signals | Meeting attendance, commit frequency, open PR age | Low | As available |

An LLM synthesizing a status section should cite the tier and the timestamp of every signal it uses. A status section that draws only from T3 and T4 signals is structurally unreliable even if it reads fluently. Phase 11 · 10 covers how to build an evaluation rubric for this; the same rubric applies to AI-generated steering content.

### Prompt architecture for pack generation

Generating a pack section is a two-step pipeline, not a single prompt:

1. **Signal extraction.** A structured extraction prompt pulls a fixed schema from raw sources (Jira export, stand-up transcript, CI dashboard snapshot). The output is JSON — named fields, typed values, source citations. This step should have near-100% format compliance; use a JSON schema validator as the acceptance gate.

2. **Synthesis and framing.** A separate prompt takes the extracted signals and generates a section draft: a 3–5 sentence status narrative, a traffic-light with explicit rationale, and the open decision question (if any). The acceptance criterion is not "reads well" — it is that the decision question is explicit, the traffic-light rationale cites at least one T1 or T2 signal, and no signal is referenced without a timestamp.

Separating the steps matters because it localizes failures: a bad synthesis draft is a prompting problem; missing signals in the extracted JSON are a data-pipeline problem. Mixing them produces defects that are hard to diagnose.

### The decision question discipline

Every steering pack section should end with one of three explicit closings:

- **No decision needed:** "On current trajectory, [outcome] is expected by [date]. No steering action required."
- **Contingent decision:** "If [trigger condition] occurs before [date], the team will [pre-agreed response]. This is noted for awareness."
- **Active decision request:** "The team needs a decision on [specific question] by [date]. Options: A ([trade-off]), B ([trade-off]). Recommended: [option with rationale]."

An LLM can generate all three forms reliably if the prompt explicitly requires this closing and provides the evidence. What it cannot do is determine which form applies — that requires knowing the project's pre-agreed escalation thresholds, which should live in a steering agreement document, not in the prompt. Phase 11 · 29 covers how to structure the decision context that makes the third form actionable.

### Quality gates before presenting

Before any AI-generated pack section goes into a stakeholder deck, apply this checklist mechanically — not by "reading it over":

| Gate | Check | Pass condition |
|---|---|---|
| Evidence traceability | Every factual claim has a cited source with a date | Zero unsourced claims |
| Signal tier coverage | At least one T1 or T2 signal appears | True |
| Decision question present | Section ends with one of the three explicit closings | True |
| Consistency | Traffic-light matches the cited evidence direction | No contradiction |
| Staleness | All signals are within tier threshold | True |

A section that fails any gate goes back to the pipeline, not to the deck. This is the equivalent of the test-gate in a CI pipeline (Phase 11 · 10): the cost of a failed gate before the meeting is low; the cost of a failed gate during the meeting is high.

### Where current models sit

Fable 5 and Claude Opus/Sonnet 4.x (2026) handle T3/T4 synthesis reliably with well-structured prompts. The failure modes that remain are:

- **Hallucinated metrics**: the model invents plausible-sounding numbers when the source data is absent or ambiguous. Gate: require every number to appear verbatim in the extracted JSON.
- **Confident status under genuine ambiguity**: the model produces a fluent green narrative when signals conflict, because fluency is easier than hedging. Gate: the synthesis prompt must explicitly instruct the model to surface conflicts as "ambiguous" rather than resolving them by narrative smoothing.
- **Decision question elision**: when the evidence points to a difficult trade-off, the model tends to omit the decision request and frame everything as status. Gate: if the extracted JSON contains a blocker or a threshold breach, the synthesis prompt must require the decision-request closing.

These are engineering constraints, not general model limitations. They are addressable by prompt design and output validation, not by waiting for a better model.

## Use It

`code/main.py` implements the two core decisions this lesson is about:

1. A **steering-signal classifier** that takes a set of project signals, assigns each a tier and a staleness assessment, and determines whether each one is admissible as steering evidence.
2. A **pack-section router** that takes a set of admitted signals and determines which of the three section types (status confirmation, risk escalation, decision request) a section should be, along with the required closing form — and flags any section that would fail a quality gate.

No network, no LLM calls. The point is to make the decision logic executable and testable, the same way the permission-mode classifier in Phase 15 · 10 made the agent safety policy executable.

## Ship It

`outputs/skill-steering-pack-quality-gates.md` is a one-page decision aid for use in a real project. Paste the current week's signals into the left column, run the gate checklist, and the output tells you which sections are ready to present, which need rework, and what decision question each section is responsible for surfacing.


## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Steering pack | "The slide deck" | A structured sequence of decision questions answered with evidence; not a presentation format |
| Status confirmation | "Green/Amber/Red" | A section type claiming that continuation at current scope and pace is warranted; requires T1/T2 evidence |
| Decision request | "FYI, there's an issue" | A section type requiring a specific stakeholder call by a named date, with explicit options and trade-offs |
| Evidence tier | "How reliable is this?" | A four-tier hierarchy (T1 measured outcomes → T4 proxy signals) that determines signal admissibility |
| Signal extraction step | "Structuring the inputs" | A prompt that produces typed JSON from raw sources; validated against a schema before synthesis |
| Synthesis step | "Writing the section" | A prompt that generates narrative + traffic-light + decision closing from structured signals |
| Quality gate | "Reviewing the output" | A mechanical checklist (source traceability, tier coverage, decision question, consistency, staleness) applied before presenting |
| Decision question elision | "Reads smoothly but decided nothing" | A failure mode where the model omits a decision request when evidence points to a difficult trade-off |

## Consultant field notes

The patterns a senior PM or delivery lead recognizes after the third steering pack has failed:

- **The amber that nobody could trace.** The cover-slide traffic-light had a rationale attached, but two clicks into the source it cited a Slack message from a stand-up three weeks ago. The amber was real; the evidence was a fossil. Lesson: if the timestamp is older than the staleness threshold, the section is not amber — it is unknown.

- **The demo prompt that fell over in production.** The extraction JSON came back clean, the synthesis read fluently, and the stakeholder approved. Two sprints later the same section surfaced a number that turned out to be hallucinated — plausible-shaped, not present in the source. Lesson: gates that check fluency pass the demo; gates that check source traceability catch the production drift.

- **The decision request buried in a status section.** Everything read green; the team had a known blocker on a third-party dependency, but it appeared as one bullet among twelve. Nobody in the room felt they were being asked a question. Lesson: if a section contains a blocker, it is not a status section — the prompt must classify it as a decision request before it reaches the deck.

- **The pack that was perfect and changed nothing.** Every gate passed, the traffic-lights matched, the decision closings were explicit — and the meeting still ended with no commitments logged. Lesson: a steering pack that does not produce a written owner-and-date for every action is a status report, not a steering pack.

- **The weekly pack that nobody read by week three.** The first two iterations got careful stakeholder attention; by week three the same format was being skimmed or skipped entirely. Lesson: pack reliability decays without variation; a section that repeats the same closing shape for four consecutive weeks is signalling that the underlying decision has already been made and the pack should be retired, not refreshed.

## Further Reading

- [Anthropic — Prompt engineering overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview) — canonical guidance on structured extraction and output validation prompts.
- [DORA — Accelerate State of DevOps Report](https://dora.dev/research/) — the source for T1 delivery metrics (lead time, change failure rate, MTTR); citable as evidence standards in steering packs.
- [PMI — Practice Standard for Project Reporting](https://www.pmi.org/pmbok-guide-standards) — the profession's formal framework for what project status communication must contain.
- [Google — SRE Book, Chapter 4 (Service Level Objectives)](https://sre.google/sre-book/service-level-objectives/) — how to define and cite measurable outcomes as T1 evidence.
- [BARC — AI in Business Intelligence and Analytics](https://barc-research.com/) — recent practitioner survey on AI-assisted reporting quality and where human review remains necessary.
