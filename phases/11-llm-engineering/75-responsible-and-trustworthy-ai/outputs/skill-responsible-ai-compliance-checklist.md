# Responsible AI Compliance Checklist

**Use at:** project kickoff, sprint zero, pre-production sign-off, and any time a system prompt, retrieval source, output type, or model version changes. The three gates (data tier, use-case tier, proxy-bias audit) compose; pass each one before moving on.

---

## 1. GDPR Data Category Gate (data tier)

Run before any retrieval context is finalised. One RED row blocks production.

| Check | Pass condition | Risk if failed |
|---|---|---|
| Every field in the context has a declared Art. 6 legal basis | Basis is documented in the design doc | AMBER — processing without lawful basis |
| Special-category fields (health, biometric, racial origin, political opinion, religious belief, sexual orientation, trade-union, genetic, criminal record) have an Art. 9 lawful basis | Basis is consent, statutory necessity, public interest, or legal claim (legitimate interest is not an Art. 9 basis) | RED — illegal special-category processing |
| Every field is declared necessary for the stated purpose | Product owner has signed off the field list | RED — data minimisation violation (Art. 5(1)(c)) |
| Prompt and completion logs have a defined retention period | Retention period is in the privacy notice | Violation of storage limitation (Art. 5(1)(e)) |
| Logs with personal data are redacted before storage | PII scrubber runs at log time, not as a post-hoc export step | Retention of unlawful log data |
| No personal data is reused for model training without a compatible-purpose assessment | DPO sign-off documented; vendor DPA reviewed | Purpose limitation violation (Art. 5(1)(b)) — common 2026 finding |

**Scoring:** Any RED requires resolution before production. Any AMBER requires DPO consultation within the sprint.

---

## 2. AI Act Use-Case Gate (use-case tier)

Answer Yes/No per row. One Yes triggers the obligations in the right column. This gate is independent of the data tier: GREEN data does not exempt a high-risk use case.

| Use case category (Annex III) | Your system? | Obligations triggered |
|---|---|---|
| Recruitment / CV screening / candidate ranking | Y / N | Conformity assessment, bias audit (Section 3), human review of each individual decision |
| Credit scoring / loan or insurance eligibility / coverage classification | Y / N | Fundamental Rights Impact Assessment (FRIA), transparency to subjects, Art. 14 human oversight |
| Employee performance monitoring or management | Y / N | Data minimisation, human oversight, access rights |
| Social benefit eligibility | Y / N | Conformity assessment, logging, explanation on request |
| Biometric identification in public spaces (real-time) | Y / N | Near-prohibition; legal advice required |
| Education or vocational training access | Y / N | Conformity assessment, transparency |
| Law enforcement, border control, justice | Y / N | Strict conditions; specific legal regime |

**If any answer is Yes:**
- Conduct a FRIA before go-live.
- Conduct a DPIA (Art. 35 GDPR) if the use case involves large-scale or special-category processing.
- Implement Art. 14 human oversight controls (Section 4) — the data-tier gate alone is not sufficient.

---

## 3. Proxy-Bias Audit Gate (bias tier)

Required for any system with a ranking, scoring, or classification output used in a high-risk context. Run this even when no protected attribute appears in the input — proxies do the same work.

| Step | What to do | Done? |
|---|---|---|
| Identify proxy variables | List fields that correlate with protected attributes (postcode, name, language style, school attended) | [ ] |
| Define protected groups | Agree on the groups relevant for your deployment geography | [ ] |
| Run a stratified sample | Approximately 200–500 queries per group, controlled variation in the proxy field only | [ ] |
| Compute the disparity ratio | Lowest-group outcome rate ÷ highest-group rate | [ ] |
| Apply the threshold | Conservative floor: 0.80 (four-fifths rule). EU high-risk deployments: 0.85 or higher. | [ ] |
| Document results | Record baseline metrics; commit to re-running on every model or prompt change | [ ] |
| Block on threshold breach | System does not go to production if disparity ratio is below threshold | [ ] |

A system that fails the disparity ratio is not production-ready regardless of overall accuracy. This is the gate that catches bias at retrieval time, not in the quarterly review.

---

## 4. Human Oversight Controls (AI Act Art. 14)

Mandatory for high-risk AI systems. Each row is a binary gate.

| Control | Requirement | Verified? |
|---|---|---|
| Confidence indicator | Every high-stakes output carries a confidence score and provenance (model version, system-prompt version, retrieved source IDs) | [ ] |
| Override path | A reviewer can substitute their own decision; substitution is logged with timestamp and reviewer ID | [ ] |
| Kill switch | Stopping the system does not require a re-deployment; tested in staging | [ ] |
| Real-time monitoring | Operations team can see output volume, refusal rate, escalation rate; alerting configured | [ ] |
| Audit trail | Every individual decision is logged (input hash, output hash, model version, reviewer action) for the period required by sector regulation | [ ] |

A kill switch that requires a code change is not a kill switch. A feature flag is the design, not the fallback.

---

## 5. Guardrail Design Checklist

| Guardrail | Implemented? | Notes |
|---|---|---|
| Input classifier: blocks prompts requesting protected-attribute decisions | [ ] | Earliest and highest-value control |
| Context minimisation: per-field annotation at retrieval; special-category fields on deny list | [ ] | Push the gate to the retrieval layer, not the log layer |
| Output refusal: blocks responses asserting facts about identifiable individuals without a verified source | [ ] | Reduces hallucination + accuracy (Art. 5(1)(d)) risk |
| Logging redaction: PII scrubber applied before any log is written | [ ] | Logs are a second context with their own lawful-basis requirement |
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

The DPO's sign-off is the only one that survives contact with a regulator. If the DPO has not signed, the system is not deployable in any EU member state.

---

## Quick Reference: GDPR and AI Act Articles to Bookmark

| Article | Topic |
|---|---|
| GDPR Art. 5 | Core data protection principles (lawfulness, minimisation, purpose, storage, accuracy) |
| GDPR Art. 6 | Legal bases for personal data processing |
| GDPR Art. 9 | Special-category data — stricter lawful bases; legitimate interest is not one |
| GDPR Art. 22 | Automated individual decision-making and profiling |
| GDPR Art. 35 | DPIA — when mandatory, what it must contain |
| AI Act Art. 9 | Risk management system |
| AI Act Art. 10 | Data governance for high-risk systems |
| AI Act Art. 13 | Transparency to deployers and subjects |
| AI Act Art. 14 | Human oversight — the engineering requirement, not the UX nice-to-have |
| AI Act Art. 15 | Accuracy, robustness, cybersecurity |
| AI Act Annex III | High-risk use-case categories |

---

*Maintained in: phases/11-llm-engineering/75-responsible-and-trustworthy-ai. Pair with Phase 18 · 24 (regulatory frameworks) and Phase 11 · 12 (guardrails implementation). The three gates in Sections 1, 2, and 3 are the same gates the code in `code/main.py` evaluates.*
