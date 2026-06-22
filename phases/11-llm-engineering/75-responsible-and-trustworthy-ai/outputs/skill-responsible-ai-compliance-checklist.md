# Responsible AI Compliance Checklist

**Use at:** project kickoff, sprint zero, pre-production sign-off, and any time a system prompt, retrieval source, or output type changes.

---

## 1. GDPR Data Category Gate

Run this before any retrieval context is finalized. One RED row blocks production.

| Check | Pass condition | Risk if failed |
|---|---|---|
| Every field in the context has a declared Art. 6 legal basis | Basis is documented in the design doc | AMBER — processing without lawful basis |
| Special-category fields (health, biometric, racial origin, political opinion, sexual orientation, trade-union, genetic, criminal record) have an Art. 9 lawful basis | Basis is consent, statutory necessity, public interest, or legal claim | RED — illegal special-category processing |
| Every field is declared necessary for the stated purpose | Product owner has signed off the field list | RED — data minimisation violation (Art. 5(1)(c)) |
| Prompt and completion logs have a defined retention period | Retention period is in the privacy notice | Violation of storage limitation (Art. 5(1)(e)) |
| Logs with personal data are redacted before storage | PII scrubber runs at log time | Retention of unlawful log data |
| No personal data is reused for model training without a compatible-purpose assessment | DPO sign-off documented | Purpose limitation violation (Art. 5(1)(b)) |

**Scoring:** Any RED violation requires resolution before production. Any AMBER requires DPO consultation within the sprint.

---

## 2. AI Act High-Risk Classification

Answer Yes/No. One Yes triggers the obligations in the right column.

| Use case category (Annex III) | Your system? | Obligations triggered |
|---|---|---|
| Recruitment / CV screening / candidate ranking | Y / N | Conformity assessment, bias audit, human review of each individual decision |
| Credit scoring / loan or insurance eligibility | Y / N | FRIA, transparency to subjects, human oversight |
| Employee performance monitoring or management | Y / N | Data minimisation, human oversight, access rights |
| Social benefit eligibility | Y / N | Conformity assessment, logging, explanation on request |
| Biometric identification in public spaces | Y / N | Near-prohibition (real-time, public space: prohibited in EU) |
| Education or vocational training access | Y / N | Conformity assessment, transparency |
| Law enforcement, border control, justice | Y / N | Strict conditions; legal advice required |

**If any answer is Yes:**
- Conduct a Fundamental Rights Impact Assessment (FRIA) before go-live.
- Conduct a DPIA (Art. 35 GDPR) if the use case involves large-scale or special-category processing.
- Implement Art. 14 human oversight controls (see Section 4).

---

## 3. Bias and Fairness Audit Gate

Required for any system with a ranking, scoring, or classification output used in a high-risk context.

| Step | What to do | Done? |
|---|---|---|
| Identify proxy variables | List fields that correlate with protected attributes (postcode/ethnicity, name/gender, language style) | [ ] |
| Define protected groups | Agree on the groups relevant for your deployment geography | [ ] |
| Run disparity audit | Measure output distribution across proxy groups; compute disparity ratio | [ ] |
| Set disparity threshold | Agree with client/DPO on the maximum acceptable ratio (common starting point: 0.8 four-fifths rule) | [ ] |
| Document results | Record baseline metrics; commit to re-running on each model or prompt change | [ ] |
| Block if threshold breached | System does not go to production if disparity ratio exceeds threshold | [ ] |

---

## 4. Human Oversight Controls (AI Act Art. 14)

Mandatory for high-risk AI systems. Each row is a binary gate.

| Control | Requirement | Verified? |
|---|---|---|
| Confidence indicator | Every high-stakes output carries a confidence score and provenance (model version, system prompt version, retrieved sources) | [ ] |
| Override path | A reviewer can substitute their own decision; substitution is logged with timestamp and reviewer ID | [ ] |
| Kill switch | Stopping the system does not require a re-deployment; tested in staging | [ ] |
| Real-time monitoring | Operations team can see output volume, refusal rate, escalation rate; alerting configured | [ ] |
| Audit trail | Every individual decision is logged (input hash, output hash, model version, reviewer action) for the period required by sector regulation | [ ] |

---

## 5. Guardrail Design Checklist

| Guardrail | Implemented? | Notes |
|---|---|---|
| Input classifier: blocks prompts requesting protected-attribute decisions | [ ] | Earliest and highest-value control |
| Context minimisation: per-field annotation at retrieval; special-category fields on deny list | [ ] | Prevents Art. 9 violations at the context-window layer |
| Output refusal: blocks responses asserting facts about identifiable individuals without a verified source | [ ] | Reduces hallucination + accuracy (Art. 5(1)(d)) risk |
| Logging redaction: PII scrubber applied before any log is written | [ ] | Prevents storage limitation violation |
| Escalation trigger: confidence below threshold routes to human reviewer | [ ] | Art. 14 implementation in the inference loop |
| Indirect prompt injection guard | [ ] | See Phase 18 · 15 — attacker-controlled documents can bypass input-layer checks |

---

## 6. Pre-Production Sign-Off

| Approver | Sign-off required for |
|---|---|
| Data Protection Officer | Any processing of personal data; any DPIA; any change to retention policy |
| Legal / compliance | High-risk AI Act classification determination; FRIA |
| Product owner | Field necessity declarations (data minimisation) |
| Security / CISO | Logging redaction implementation; kill-switch test |
| ML / AI engineer | Bias audit results; disparity ratio sign-off |

---

## Quick Reference: GDPR Articles to Bookmark

| Article | Topic |
|---|---|
| Art. 5 | Core data protection principles (lawfulness, minimisation, purpose, storage, accuracy) |
| Art. 6 | Legal bases for personal data processing |
| Art. 9 | Special-category data — stricter lawful bases |
| Art. 22 | Automated individual decision-making and profiling |
| Art. 35 | DPIA — when mandatory, what it must contain |

---

*Maintained in: phases/11-llm-engineering/75-responsible-and-trustworthy-ai. Pair with Phase 18 · 24 (regulatory frameworks) and Phase 11 · 12 (guardrails implementation).*
