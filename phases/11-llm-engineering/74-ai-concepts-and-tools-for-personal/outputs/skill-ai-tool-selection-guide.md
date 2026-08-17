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

| Tool category | Best for | Approx cost (2026) | Watch out for |
|---|---|---|---|
| Internal RAG / Copilot M365 | Policy questions, internal knowledge retrieval | Infrastructure cost; marginal per query | May lag on recent updates; verify currency |
| Chat assistant (Claude Opus/Sonnet 4.x, ChatGPT, Gemini 2.x) | Drafting, ideation, public-data summarization | $3–$15 / 1M input, $15–$75 / 1M output (frontier) | Hallucinated specificity in numbers/names/dates |
| Code assistant (Copilot, Cursor, Claude Code) | Inline completion, multi-file edits, code review | Subscription or ~$3–$10 per active hour | Secret-scan context; attention cost on multi-file edits |
| Document intelligence | Large-volume PDF extraction, structured data | $0.01–$0.05 per page (Azure DI) | Position bias in long docs; never sole source for Tier 3+ |
| Human-only | Regulated data, irreversible decisions | N/A | N/A |

---

## Step 4 — Apply the right verification tier

| Consequence | Typical examples | Minimum verification |
|---|---|---|
| **Tier 1 — cosmetic** | Internal email draft, brainstorm list | Read once; adjust if needed |
| **Tier 2 — internal decision support** | Team summary, private script | Spot-check 2-3 key claims; run code in isolation |
| **Tier 3 — client-facing or legally binding** | Contract summary, client analysis, regulatory filing | SME review; **ask targeted retrieval questions**; verify all numbers/dates/negations |
| **Tier 4 — irreversible action** | Production deploy, client communication sent, data deleted | Second qualified reviewer; audit trail; rollback path confirmed |

**Tier 3 summarization always requires a targeted retrieval question** about
the most decision-critical clause in the source — even when the routing is
clean and the summary "looks complete." A correct tool choice does not
remove the verification step; it makes the verification step load-bearing.

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

## Attention cost — the trade-off the tools don't tell you

Supervisor attention is the actual bottleneck on knowledge work, not API cost.

| Tool | Approx attention overhead | What this means in practice |
|---|---|---|
| Chat assistant on a focused task | 5–15% | Background in your attention; scan, edit, send |
| Code assistant on a multi-file edit | 30–50% | Watch the diff; verify the tests |
| Server-side coding agent (issue → PR) | 80–95% first time, 40% once task shape is trusted | Read the PR as carefully as a junior engineer's first PR |

Match supervision to blast radius, not to the headline capability of the tool.

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

> We use [Internal RAG / approved chat assistant] for [task types], send only [public / anonymized internal] data to external tools, and require [SME review / second reviewer] before any AI output is used for [client-facing / irreversible] decisions. Tier 3 summarization always includes a targeted retrieval question about the most decision-critical clause in the source.

Fill in the blanks with your team's approved tools and escalation path.
