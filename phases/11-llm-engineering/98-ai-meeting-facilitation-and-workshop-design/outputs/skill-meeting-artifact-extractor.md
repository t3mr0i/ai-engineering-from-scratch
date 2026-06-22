# Skill: Meeting Artifact Extractor

One-page decision aid for structured meeting facilitation with LLMs.
Use before routing any transcript to a model, and after to quality-gate the output.

---

## Pre-flight: Privacy checklist

Run this before sending any transcript anywhere.

- [ ] Does the transcript contain personnel decisions, performance data, or disciplinary content?
- [ ] Does it contain unreleased financials or client-confidential strategy?
- [ ] Have all attendees consented to AI-assisted capture (check meeting invite or team agreement)?
- [ ] Are you routing to the internal LLM gateway (not a public API endpoint) for enterprise transcripts?
- [ ] Is the transcription itself on-device or inside the corporate network boundary?

If any box is unchecked: resolve it before proceeding.

---

## The four artifact types — field reference

| Artifact | Required fields | Default if missing |
|---|---|---|
| **Decision** | Decision text · Rationale · Owner · Reversibility · Stakeholders | Block publication |
| **Action** | Task description · Single owner · Deadline · Definition of done | Block publication |
| **Open question** | Question text · What is needed to answer it · Reopen trigger | Return to facilitator |
| **Parking lot** | Item text · Disposition (defer / discard / escalate) · By whom | Add to next agenda |

---

## Three-pass elicitation chain

### Pass 1 — Identification

```
You are a meeting analyst. Read the transcript below and produce a structured list.
For each item, assign exactly one type: Decision | Action | OpenQuestion | ParkingLot.
Output as JSON array: [{type, text, confidence}].
Do not summarise. Do not merge items. Flag low-confidence assignments.

TRANSCRIPT:
[paste transcript here]
```

### Pass 2 — Enrichment (run once per artifact type)

**For each Decision:**
```
For the decision: "[decision text]"
Answer these fields. If a field is missing from the transcript, write MISSING — do not infer.
- Rationale:
- Owner (single person):
- Reversibility (reversible by [condition] / irreversible):
- Stakeholders to notify:
```

**For each Action:**
```
For the action: "[action text]"
Answer these fields. If a field is missing from the transcript, write MISSING — do not infer.
- Single owner (one name):
- Deadline (specific date or sprint):
- Definition of done (one testable condition):
```

**For each Open Question:**
```
For the open question: "[question text]"
Answer these fields. If missing, write MISSING.
- What is needed to answer it:
- Reopen trigger (who needs to answer, by when):
```

### Pass 3 — Quality gate

```
You are a quality reviewer. For each artifact below, check every required field.
Return: field name | PASS or FAIL | reason if FAIL.
Do not rewrite or fill in missing fields. Flag them.

ARTIFACTS:
[paste enriched artifacts from Pass 2]
```

---

## Decision quality rubric (quick reference)

| Field | Pass | Fail |
|---|---|---|
| Decision text | Active voice, past tense, one sentence | Passive / "X was discussed" |
| Rationale | At least one "because" clause | Absent |
| Owner | Single named individual | "The team", "TBD", absent |
| Reversibility | Explicit statement | Not stated |
| Stakeholders | Named list or "none needed" | Absent |

---

## Action quality rubric (quick reference)

| Field | Pass | Fail |
|---|---|---|
| Task description | Verb + object + context, 5+ words | Vague noun phrase |
| Single owner | One person's name | Group, "TBD", absent |
| Deadline | Specific date or sprint | "ASAP", "soon", absent |
| Definition of done | One testable condition, 3+ words | Absent or single vague word |

---

## Workshop design — pre-session checklist

Use when designing a meeting rather than extracting from a transcript.

- [ ] Write the decision frame before the session: choice, constraints, criteria, reversibility.
- [ ] Map each agenda block to the artifact type it must produce (Decision / Action / etc.).
- [ ] Assign a facilitator who is not also a decision maker.
- [ ] Include a 5-minute quality gate at the end: read back each decision and action, confirm owner and deadline out loud.
- [ ] Schedule the follow-up slot before the current meeting ends.

---

## Common failure modes

| Symptom | Root cause | Fix |
|---|---|---|
| Long action list, nothing moves | No single owners, no deadlines | Re-run Pass 2 enrichment; block publication until fields complete |
| "We'll circle back" on everything | No open-question reopen triggers | Assign each open question a named resolver and a deadline |
| Conflicting decisions in the log | Decisions not typed separately from discussion | Strict Pass 1 classification before any enrichment |
| Transcript too long for context window | No segmentation | Split by agenda block; classify each block independently |
| Owner says "I didn't agree to that" | Action captured without confirmation | Read back actions to owners before the call ends |
