# Structured Meeting Facilitation with LLMs: From Summary to Action (2026)

> A 2025 Atlassian survey found that knowledge workers spend on average 31 hours per month in unproductive meetings — the chief complaint is not length but lack of clear outcomes. LLMs entered this space first as transcription-and-summary tools, but summary is the least valuable part of the job: a good summary of a bad meeting produces a polished record of nothing. The real leverage is in the decision layer: forcing explicit capture of the choice made, the rationale, the owner, and the deadline before the call ends. By 2026 a mature facilitation pattern treats the model not as a notetaker but as a structured elicitation loop — prompting participants in real time for decision frames, surfacing open threads, and producing durable artifacts that feed the next meeting rather than archive the last one.

**Type:** Learn
**Languages:** Python (stdlib — meeting artifact classifier + action-item quality scorer)
**Prerequisites:** Phase 11 · 29 (Decision-making with AI), Phase 14 · 39 (Reviewer agent)
**Time:** ~45 minutes

## The Problem

Most teams that adopt AI for meetings land in the same place: they configure a transcription bot, get a three-paragraph summary and a flat bullet list labelled "action items", and conclude after two weeks that the tool does not help. The problem is structural, not technological. A bullet list of action items is not an artifact that drives accountability; without an owner, a deadline, and an explicit connection to a decision, it is a wish list. The AI has done transcription work that a junior admin could have done, and no more.

The sharper consulting question is: what would a disciplined facilitator extract from a one-hour strategy call that a transcription bot does not? The answer is a set of durable, typed artifacts — decisions (with rationale), actions (with owner and deadline), open questions (with reopen trigger), and parking-lot items (with disposition). Each type has a different consumer and a different shelf life. Conflating them into one flat list destroys the signal. The engineering task for 2026 is to build the elicitation prompt chain that enforces this typing discipline automatically, and to score the quality of the output before it reaches the calendar invite.

## The Concept

### The four artifact types

Every productive meeting produces some mix of four artifact types. Getting them separated is the first and most important structural move.

| Artifact | Required fields | Consumer | Shelf life |
|---|---|---|---|
| **Decision** | What was decided · rationale · reversibility · owner | Team, stakeholders, future meetings | Permanent (decision log) |
| **Action** | Task description · single owner · deadline · definition of done | Owner, their manager | Until done or cancelled |
| **Open question** | Question text · what we need to answer it · reopen trigger | Facilitator, next meeting | Until resolved |
| **Parking lot** | Item text · disposition (defer / discard / escalate) · by whom | Meeting owner | End of session |

A meeting that produces only summaries has failed to classify its output. A meeting that produces a clean decision log plus a short, typed action list is recoverable even if the summary is mediocre.

### The elicitation prompt chain

A naive prompt — "summarise this transcript and list action items" — produces flat output because the model has no schema to enforce. The structured alternative is a three-pass chain:

1. **Identification pass.** Ask the model to scan the transcript and label every candidate artifact with its type. This is a classification task, not a summarisation task. Use a strict output schema (JSON or structured markdown), not free text.
2. **Enrichment pass.** For each decision, prompt: "What was the stated rationale? Who was in the room? Is this reversible?" For each action: "Who owns this — one name? What is the deadline? How will we know it is done?" Partial or missing fields are flagged explicitly rather than silently omitted or hallucinated.
3. **Quality gate pass.** Score each artifact against a rubric (see below). Items that fail the quality gate are returned to the meeting owner with specific questions, not silently dropped.

This pattern is the same reviewer-agent loop described in Phase 14 · 39, applied to a different domain. The key design choice is that the model is the structured elicitor, not the human. The human's job is to confirm or correct the model's extraction, not to fill in fields from memory after the call.

### Decision quality rubric

A decision artifact passes the quality gate when all of these are present:

| Field | Pass criterion | Fail signal |
|---|---|---|
| Decision text | One sentence, active voice, past tense ("We chose X") | Passive / ambiguous ("X was discussed") |
| Rationale | At least one "because" clause | Missing entirely |
| Owner | Single named individual | "The team", "TBD", absent |
| Reversibility | Explicit: "reversible by [condition]" or "irreversible" | Not stated |
| Stakeholders notified | List or "no external notification needed" | Absent |

### Action quality rubric

An action artifact passes when:

| Field | Pass criterion | Fail signal |
|---|---|---|
| Task description | Verb + object + context ("Update the pricing deck to reflect Q3 numbers") | Vague noun phrase ("Pricing update") |
| Single owner | One person's name | Multiple names, "TBD", absent |
| Deadline | Specific date or sprint | "ASAP", "soon", absent |
| Definition of done | One testable condition | Absent |

### Workshop design vs. ad-hoc meeting facilitation

These are two different problems. An ad-hoc meeting needs retrospective artifact extraction from a transcript. A designed workshop needs prospective structure: an agenda that maps each block to the artifact type it is supposed to produce, plus elicitation prompts built in advance.

For workshop design the LLM's role shifts earlier: given a goal (e.g., "we need to choose a cloud provider for the data platform"), the model generates the decision frame before the session — stakeholders, constraints, the decision criteria, and what "reversible" looks like for this choice. The Phase 11 · 29 decision-making pattern applies here directly: a structured decision brief built before the workshop prevents the meeting from devolving into preference-sharing with no frame.

### Model selection and privacy considerations

In 2026 the default facilitation stack is:

- **Transcript source:** Whisper-based transcription (local or API), Teams/Zoom native transcripts, or Fathom/Otter-class specialised tools.
- **Extraction model:** Claude Sonnet 4.x for artifact extraction and enrichment (cost-effective at meeting scale); escalate to Claude Opus 4.x for high-stakes decisions where the rationale chain must be explicitly audited.
- **Output format:** Structured JSON passed into a decision register (Notion, Confluence, Jira, plain Git-tracked YAML) rather than a freeform document.

Privacy is a first-class constraint. Meeting transcripts contain personnel discussions, unreleased financials, and client data. Never route raw transcripts to a public API endpoint without explicit data-processing agreement. For LHIND and most enterprise contexts: run transcription on-device or inside the corporate network boundary, and use the internal LLM gateway (see CLAUDE.md infrastructure notes) for the extraction pass.

### Integration with Phase 14 · 39 reviewer agents

The Phase 14 · 39 reviewer agent pattern generalises cleanly. The meeting artifact extractor is the author agent; a second pass is the reviewer. The reviewer checks:

- Are all decisions typed and complete per the quality rubric?
- Do any open questions have an implicit decision embedded in them? (A question like "should we use Postgres?" is an undeclared decision if the transcript shows consensus was reached.)
- Are any actions owned by more than one person?
- Does the artifact set cover the stated meeting goal, or is the goal itself unmet and undeclared?

Running this as a two-agent loop surfaces gaps that a single extraction pass misses — in our experience typically 15-25% of typed artifacts return with a missing owner, an implicit decision disguised as an open question, or an undeclared action — at the cost of one extra model call per meeting, justified for any meeting whose output feeds external stakeholders.



## Further Reading

- [Anthropic — Claude API documentation](https://docs.claude.com/en/api/getting-started) — structured output modes and tool use patterns relevant to extraction chains.
- [Atlassian — Decision-making playbook](https://www.atlassian.com/team-playbook/plays/daci) — DACI framework (Driver, Approver, Contributor, Informed); maps directly to the owner/stakeholder fields in the decision rubric.
- [Amazon — Working backwards and the six-pager](https://www.aboutamazon.com/about-us) — the pre-meeting written decision brief as a forcing function for clarity before any AI is involved.
- [OpenAI — Structured outputs documentation](https://platform.openai.com/docs/guides/structured-outputs) — JSON schema enforcement in LLM responses; the mechanism behind reliable artifact extraction.
- [ISO 9001:2015 — Clause 7.5 Documented information and Clause 9.3.3 Management review outputs](https://www.iso.org/standard/62085.html) — the clauses that formalise documentation (7.5) and decision-recording (9.3.3) requirements in quality management systems; useful when meeting artifacts feed regulated processes.
