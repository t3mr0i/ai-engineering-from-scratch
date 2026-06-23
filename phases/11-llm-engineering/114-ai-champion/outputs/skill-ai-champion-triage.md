# AI Champion Triage — Decision Aid

One-page paste-and-use reference for working champions. Update the "Current model" column when a named model series changes your team's quality bar on a real eval.

---

## 1. Classify the request

| Incoming request | Audience level | Knowledge type | Go to section |
|---|---|---|---|
| "Can you explain what RAG is?" | L1 — Aware | Conceptual | A |
| "Show us how to use Copilot Chat in a PR review" | L1 — Aware | Procedural | B |
| "How do I write a good system prompt?" | L2 — Practitioner | Procedural | C |
| "How do we know if the summarizer is getting worse?" | L2 — Practitioner | Evaluative | D |
| "We want to try the new Claude Sonnet 4.x reasoning" | L3 — Builder | Evaluative | E |
| "Can you run a brown bag on AI agents?" | Any | Any | F |

---

## Section A — L1 Conceptual: produce a decision aid

- One page maximum. One question, one answer, one table or checklist.
- Do not explain the technology; explain the choice. ("Use X when Y; avoid X when Z.")
- Review trigger: update when a named model series changes or a new tool-use capability ships.

**Current model column for 2026 decision aids:** Sonnet 4.x for everyday tasks; Opus 4.x for reasoning-heavy; Haiku 4.x for high-volume / low-latency; Fable 5 for multimodal / frontier agentic.

---

## Section B — L1 Procedural: run a session, close with a decision aid

Checklist for the session:
- [ ] Live demo on a real task from the audience's domain (not a toy)
- [ ] Failure case shown explicitly (what the model gets wrong)
- [ ] Decision aid distributed at the end — one page, paste-ready
- [ ] Recording posted within 24 h
- [ ] Next step for any L3 attendees: pointer to reference implementation or eval

Do not end the session without the decision aid in hand. A recording without a persistent artifact is a depreciated asset.

---

## Section C — L2 Procedural: produce a reference implementation

- Runnable code, annotated, stdlib-only or with clearly pinned dependencies.
- Must include at least one expected-output assertion or test so colleagues can verify it runs correctly on their machine.
- Follow-on: an eval harness (Phase 19 · 27) is the next artifact. Schedule it in the same sprint.

---

## Section D — L2/L3 Evaluative: produce or extend the eval harness

- Fixture tasks: 10–20 representative inputs with a human-verified expected output or rubric score.
- Pass-rate threshold: set before running the harness, not after seeing the results.
- Regression check: run the harness whenever a new model version is adopted. Log the date, model, and pass rate.
- The harness lives in version control alongside the reference implementation.

---

## Section E — L3 Builder: pilot gate checklist

| Gate | Evidence required | Status |
|---|---|---|
| G1 — Feasibility | Working prototype + documented failure cases (2-day timebox) | [ ] |
| G2 — Quality | Eval harness exists; pass rate >= team threshold | [ ] |
| G3 — Transfer | Decision aid + reference impl + colleague reproduction | [ ] |

Do not scale past the gate you have not cleared. G2 (the eval harness) is the most commonly skipped; it is also the one that catches the most expensive production failures.

---

## Section F — Brown bag / CoP session design

| Element | What to prepare | Time |
|---|---|---|
| Warm-up question | One concrete question the audience will have answered by the end | 2 min |
| Context framing | Why this capability matters now (one changelog fact, not hype) | 3 min |
| Live demo | Real task, real failure shown | 15 min |
| Structured exercise | Audience tries it on a task from their work | 15 min |
| Artifact handoff | Decision aid or reference impl distributed | 3 min |
| L3 pointer | One sentence on where to go next (eval harness, skill file) | 2 min |

Total: 40 minutes. Do not exceed 50 minutes for a general CoP session.

---

## CoP health checklist (review quarterly)

- [ ] Every session produced at least one persistent artifact (decision aid, reference impl, or eval update)
- [ ] Facilitation was rotated at least once in the last quarter
- [ ] The eval harness was run at least once against the current production model
- [ ] The decision aid was updated if a major capability shift landed
- [ ] At least one lagging metric tracked (e.g., time-to-first-working-LLM-feature for a new team member)

---

## Changelog triage (update decision aids when you see these)

| Signal | Action |
|---|---|
| New named model series (e.g., Sonnet 5.x) outperforms previous on your eval | Update "Current model" column in all decision aids; re-run harness |
| New tool-use modality or MCP server support | Add a row to the relevant decision aid; consider a new reference impl |
| New agent architecture or reasoning mode | Open a G1 feasibility pilot; do not add to decision aids until G2 |
| Pricing / speed change only | No action unless it changes which model tier the team uses |
| Minor safety tweak or context window increment | No action |

---

*Lesson: Phase 11 · 114 — The AI Champion Playbook. Sibling artifacts: Phase 13 · 22 (Skill files), Phase 19 · 27 (Eval harness).*
