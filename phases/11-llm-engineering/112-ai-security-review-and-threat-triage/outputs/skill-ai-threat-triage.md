---
name: ai-threat-triage
description: Run a structured four-category threat triage on any proposed AI use case and produce an auditable verdict card before scoping continues.
version: 1.0.0
phase: 11
lesson: 112
tags: [ai-security, threat-triage, prompt-injection, llm-risk, owasp-llm]
---

For any proposed AI feature or use case, assess the four canonical LLM risk categories, assign a severity rating to each, and derive a composite verdict that determines whether the team may continue scoping.

Produce a **triage card** with the following sections in order.

---

## 1. Use-Case Description

Paste the proposal verbatim (one paragraph). Do not paraphrase — the signal matching is against actual language the proposer used.

---

## 2. Four-Category Assessment

For each category, assign one severity (HIGH / MEDIUM / LOW / NONE) and write one sentence of justification citing the specific phrase or signal from the description.

### Sensitive Data Exposure

| Signal words | Default severity |
|---|---|
| PII, health records, credit card, credentials, patient | HIGH |
| Customer data, employee records, contracts, financial, pricing, internal memos | MEDIUM |
| Internal systems, proprietary processes | LOW |
| No data referenced | NONE |

**Severity:** ___
**Justification (one sentence):** ___

### External Tool and API Access

| Signal words | Default severity |
|---|---|
| Send email, book resources, payment, deploy, delete, update CRM, call external API | HIGH |
| Agent, automates, triggers, writes back, integration, webhook | MEDIUM |
| Notify, read-only API | LOW |
| No external calls | NONE |

**Severity:** ___
**Justification (one sentence):** ___

### Identity and Authorisation Ambiguity

| Signal words | Default severity |
|---|---|
| On behalf of, impersonates, replies for, acts as the user, answers for | HIGH |
| Service account, delegated, authorised to act | MEDIUM |
| Represents the team | LOW |
| Model acts only in its own context | NONE |

**Severity:** ___
**Justification (one sentence):** ___

### Untrusted Input Injection

| Signal words | Default severity |
|---|---|
| Upload, user provides, paste, external content, web search, retrieved document, user-supplied | HIGH |
| User feedback, user input, PDF, document processing | MEDIUM |
| Structured form input, system-generated ticket | LOW |
| No user-controlled input reaches the prompt | NONE |

**Severity:** ___
**Justification (one sentence):** ___

---

## 3. Composite Verdict

Apply the following rules in order. Use the first rule that matches.

| Condition | Verdict |
|---|---|
| Any category rated HIGH | HARD STOP |
| Two or more categories rated MEDIUM | HARD STOP |
| Exactly one category rated MEDIUM | PROCEED WITH CONDITIONS |
| All categories rated LOW or NONE | PROCEED |

**Verdict:** ___

---

## 4. Conditions (if applicable)

For each HIGH or MEDIUM category, write one condition that must be satisfied before scoping may continue.

- **HIGH — Sensitive Data Exposure:** Security architect must review data classification and access model before design starts.
- **HIGH — External Tool Access:** Scope and rate limits for every tool call must be documented; a kill-switch or human approval step must be specified for any write or financial action.
- **HIGH — Identity Ambiguity:** Authorisation model must be specified: which credential the model uses, whose permissions it represents, and how those are verified at runtime.
- **HIGH — Untrusted Input Injection:** Security architect must review; note that no input sanitisation fully mitigates this category — privilege separation and human-in-the-loop for high-stakes actions are required.
- **MEDIUM (any):** Risk must be documented in the architecture decision record; a security review milestone must appear in the project plan before MVP.

---

## Hard Rejects

Do not continue scoping under any of the following conditions regardless of the triage verdict:

- The proposer responds to a HARD STOP by saying "we'll add input sanitisation" for an injection finding. Sanitisation reduces but does not eliminate prompt injection risk; it does not clear a HARD STOP.
- The use case involves a model acting under a service account with broader permissions than any individual user — and identity ambiguity was rated NONE or LOW.
- The triage was completed after prototyping was already underway. Retroactive triage does not substitute for pre-scoping triage; both are required.
- Any HIGH finding where the proposer cannot name the blast radius (maximum scope of damage if exploited) in one sentence.

---

## OWASP LLM Top 10 (2025) Quick Reference

| OWASP item | Maps to | Severity floor |
|---|---|---|
| LLM01 Prompt Injection | Untrusted input injection | MEDIUM (document-only) / HIGH (user-supplied or web) |
| LLM02 Sensitive Information Disclosure | Sensitive data exposure | Depends on data classification |
| LLM06 Excessive Agency | External tool access + Identity ambiguity | HIGH if writes or financial actions |
| LLM08 Vector and Embedding Weaknesses | Sensitive data exposure (RAG) | MEDIUM minimum |

---

## Output Format

Return the completed triage card as a single document with all four sections filled in. The card is the handoff artefact to the security review team — it replaces a verbal description and must stand alone without the proposer present.
