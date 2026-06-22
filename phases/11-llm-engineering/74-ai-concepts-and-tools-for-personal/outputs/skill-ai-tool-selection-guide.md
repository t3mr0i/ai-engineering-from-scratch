# AI Tool Selection Guide

One-page decision aid for choosing the right AI tool, handling data correctly,
and verifying output in proportion to consequence. Paste into your team wiki
or use as a pre-task checklist.

---

## Step 1 — Classify the task (four questions)

| Question | If yes | If no |
|---|---|---|
| Can the internal corpus answer this? | Use Internal RAG first | Continue to step 2 |
| Is the source a large binary document (PDF, complex spreadsheet)? | Consider Document Intelligence (check data tier first) | Continue to step 3 |
| Is the task primarily about code? | Use a Code Assistant | Continue to step 4 |
| Is the task generative (draft, summarize, ideate, classify)? | Use Chat Assistant | Reconsider task definition |

---

## Step 2 — Check data classification before sending anything

| Data tier | Definition | Approved external tools |
|---|---|---|
| Public / unrestricted | No sensitivity, freely shareable | Any approved tool |
| Internal / limited | Company-internal; no client data | Internal RAG, Code assistants (anonymize first) |
| Confidential | Client data, M&A, financial models | Internal RAG only; anonymize before external use |
| Regulated | PII, health data, regulated financials | Human-only — no external AI API |

**When in doubt, classify one tier higher until you can confirm.**

---

## Step 3 — Select the tool

| Tool category | Best for | Watch out for |
|---|---|---|
| Internal RAG / Copilot M365 | Policy questions, internal knowledge retrieval | May lag on recent updates; verify currency |
| Chat assistant (Claude, ChatGPT, Gemini) | Drafting, ideation, public-data summarization | Hallucinated specificity in numbers/names/dates |
| Code assistant (Copilot, Cursor, Claude Code) | Inline completion, multi-file edits, code review | Secret-scan context before pasting; check what the diff changed |
| Document intelligence | Large-volume PDF extraction, structured data | Position bias in long docs; never sole source for Tier 3+ |
| Human-only | Regulated data, irreversible decisions | N/A |

---

## Step 4 — Apply the right verification tier

| Consequence | Typical examples | Minimum verification |
|---|---|---|
| **Tier 1 — cosmetic** | Internal email draft, brainstorm list | Read once; adjust if needed |
| **Tier 2 — internal decision support** | Team summary, private script | Spot-check 2-3 key claims; run code in isolation |
| **Tier 3 — client-facing or legally binding** | Contract summary, client analysis, regulatory filing | SME review; ask targeted retrieval questions; verify all numbers/dates/negations |
| **Tier 4 — irreversible action** | Production deploy, client communication sent, data deleted | Second qualified reviewer; audit trail; rollback path confirmed |

---

## Summarization checklist (Tier 3+)

Use when summarizing any document that will inform a decision.

- [ ] Read the summary. Then ask: "What does the document say about [the critical clause / number / obligation]?"
- [ ] Check every number, name, and date against the source.
- [ ] Verify negations at clause boundaries ("does not allow", "except when").
- [ ] Confirm whether the summary covers the full document or just the first/last sections.
- [ ] Label the output "AI-assisted draft" until an SME has reviewed it.

---

## Writing and drafting checklist

- [ ] Specify length, format, and what to leave out in the prompt (see Phase 11 · 01).
- [ ] Request two structurally different drafts if the output is high-stakes.
- [ ] Revise — do not send the first output verbatim.
- [ ] Check for voice homogenization if the team uses AI drafting heavily.

---

## Quick-reference: blocked combinations

These combinations are always blocked regardless of prompt quality:

| Task + Data | Blocked because |
|---|---|
| Any task + Regulated data + external tool | Regulated data prohibited from external APIs |
| Confidential data + external Document Intelligence | DPA likely not in place; data leaves your system |
| Code task + Internal/Confidential data + external code tool | Source code with internal context must not leave tenant |
| Irreversible action with no second reviewer | Tier 4 policy — AI output cannot be the sole check |

---

## One-sentence team agreement template

> We use [Internal RAG / approved chat assistant] for [task types], send only [public / anonymized internal] data to external tools, and require [SME review / second reviewer] before any AI output is used for [client-facing / irreversible] decisions.

Fill in the blanks with your team's approved tools and escalation path.
