# Compliance — SOC 2, HIPAA, GDPR, PCI-DSS, EU AI Act, ISO 42001

> Multi-framework coverage is table stakes for 2026 enterprise deals. **EU AI Act**: in force since August 1, 2024. High-risk-system obligations now apply from 2 December 2027 (Annex III systems) / 2 August 2028 (Annex I systems), per Regulation (EU) 2026/1744 — postponed from the original August 2026/2027 dates. Fines up to €15M or 3% global annual turnover for high-risk-system obligations (Art. 99(4)); up to €35M or 7% for prohibited AI practices (Art. 99(3)). Applies globally if serving EU users. **Colorado AI Act**: effective June 30, 2026 (delayed from February 2026 by SB25B-004) — impact assessments for high-risk systems, right to appeal AI decisions. Virginia's equivalent (HB 2094) was vetoed by the Governor in March 2025 and is not in force. **SOC 2 Type II**: de facto B2B AI requirement (Type II, not Type I, for fintech). **GDPR**: largest documented AI-specific fine is €30.5M against Clearview AI (Dutch DPA, Sept 2024); Italy's Garante issued €15M against OpenAI in Dec 2024 (later overturned on appeal in March 2026). Real-time PII redaction at inference is the defensible standard; post-processing cleanup is not enough. **HIPAA**: healthcare bound — cannot send PHI to external AI services without BAA. **PCI-DSS**: AI-interaction-layer coverage requires configuration + contractual agreements, not automatic. **ISO 42001**: emerging AI governance standard, growing procurement requirement alongside ISO 27001. Reference profile: OpenAI maintains SOC 2 Type 2, ISO/IEC 27001:2022, ISO/IEC 27701:2019, GDPR/CCPA/HIPAA (BAA)/FERPA, PCI-DSS for ChatGPT payment components. Cross-framework mapping reduces audit fatigue: access controls map across ISO 27001 A.5.15-5.18, GDPR Art. 32, HIPAA §164.312(a).

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 17 · 25 (Security), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Learning Objectives

- Enumerate the seven 2026 frameworks relevant to LLM products and match each to a customer segment.
- Cite the EU AI Act enforcement timeline (in force August 2024; high-risk enforcement 2 December 2027 for Annex III / 2 August 2028 for Annex I, per Regulation (EU) 2026/1744) and the two-tier fine ceiling (€15M / 3% for high-risk obligations, €35M / 7% for prohibited practices).
- Explain why post-processing PII cleanup is not enough for GDPR and name real-time inference-layer redaction as the defensible standard.
- Describe cross-framework control mapping (e.g., access control maps to ISO 27001 A.5.15-5.18 + GDPR Art. 32 + HIPAA §164.312(a)).

## The Problem

An enterprise customer's procurement asks for SOC 2 Type II, GDPR, HIPAA BAA, ISO 27001, and "EU AI Act compliance statement." Your team has SOC 2 Type I. You're six months from Type II and haven't started GDPR Article 30 records.

Multi-framework coverage is not an LLM problem — it's an enterprise-SaaS problem, with LLM-specific overlays. Procurement teams in 2026 want a matrix with a row per framework and a column per control, not a PDF.

## The Concept

### The seven frameworks

| Framework | Scope | LLM-specific requirement |
|-----------|-------|--------------------------|
| SOC 2 Type II | B2B SaaS baseline | Process controls audited over 6-12 months |
| HIPAA | US healthcare | BAA required; PHI cannot leave infrastructure without signed agreement |
| GDPR | EU users | Real-time PII redaction; data subject rights; Article 30 records |
| PCI-DSS | Payment data | Configuration + contracts for AI touching payment |
| EU AI Act | Serving EU users | Risk tier classification; high-risk systems: conformity assessment, documentation, logging |
| Colorado AI Act | Serving CO residents | Impact assessments; right to appeal |
| ISO 42001 | AI governance | Emerging; pairs with ISO 27001 |

### EU AI Act timeline

- August 1, 2024: in force.
- February 2, 2025: prohibited-AI practices enforced.
- August 2, 2026: Article 50 transparency obligations enforced (unchanged by Regulation (EU) 2026/1744).
- December 2, 2027: Annex III high-risk systems enforced (conformity assessment, documentation, logging) — postponed from the original August 2, 2026 by Regulation (EU) 2026/1744.
- August 2, 2028: Annex I high-risk systems (in products under harmonized legislation) enforced — postponed from the original August 2027 by Regulation (EU) 2026/1744.

Risk tiers: Unacceptable (banned), High-risk (conformity + logging), Limited-risk (transparency), Minimal-risk (no constraint). Most B2B LLM SaaS is limited-risk; high-risk kicks in for employment, credit, education, law enforcement, migration, essential services.

Fines (Article 99): up to €15M or 3% global annual turnover for breaches of high-risk-system obligations (Art. 99(4)); up to €35M or 7% for prohibited AI practices (Art. 99(3)); whichever higher applies.

### GDPR — real-time redaction is the standard

Post-processing cleanup (redact PII after the LLM sees it) is not a defensible posture — the model already saw the data. Real-time inference-layer redaction is the 2026 standard:

- Entity recognition before the LLM call.
- Consistent tokenization (Mesh approach) preserves semantics.
- Store only redacted prompts + consented opt-in raw.

Recent enforcement: €30.5M against Clearview AI (Dutch DPA, Sept 2024) is the largest documented AI-specific GDPR fine to date; €15M against OpenAI (Italy's Garante, Dec 2024) is the largest LLM-specific fine, though it was overturned on appeal in March 2026 and the ruling remains under further review. Post-processing claims have failed at audit.

### HIPAA — BAA is not optional

You cannot send PHI to external AI services without a signed Business Associate Agreement. All three hyperscaler LLM platforms (Bedrock, Azure OpenAI, Vertex) offer BAAs. OpenAI direct API offers BAA. Anthropic direct API offers BAA. Confirm before sending PHI.

### SOC 2 Type II

Type I: controls designed and documented.
Type II: controls operate effectively over 6-12 months.

B2B procurement in 2026 defaults to Type II. Type I is a starter; Type II is the gate.

Common audit drivers: access logs (who saw what), change management (how was it deployed), risk assessments (quarterly), incident response (tested?). Audit log from Phase 17 · 25 is directly reusable.

### Cross-framework mapping

One access control policy satisfies multiple framework controls:

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18, GDPR Art. 32, HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32, PCI DSS Req. 6, HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24, GDPR Art. 32, HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.5.17, PCI DSS Req. 8, SOC 2 CC6.1 |

Compliance tools (Drata, Vanta, Secureframe) automate this mapping. Worth the cost at scale.

### ISO 42001 — emerging

Published late 2023. Growing procurement requirement alongside ISO 27001. Framework for AI governance including risk management, data quality, transparency, human oversight.

### OpenAI's reference profile

OpenAI maintains SOC 2 Type 2, ISO/IEC 27001:2022, ISO/IEC 27701:2019, GDPR/CCPA/HIPAA (BAA)/FERPA, PCI-DSS for ChatGPT payment components. That is roughly the enterprise table stakes in 2026.

### Numbers you should remember

- EU AI Act fines: up to €15M / 3% (high-risk obligations, Art. 99(4)); up to €35M / 7% (prohibited practices, Art. 99(3)).
- EU AI Act high-risk enforcement: December 2, 2027 (Annex III) / August 2, 2028 (Annex I), per Regulation (EU) 2026/1744.
- Largest documented AI-specific GDPR fine: €30.5M, Clearview AI (Dutch DPA, Sept 2024).
- Largest LLM-specific GDPR fine: €15M, OpenAI (Italy's Garante, Dec 2024; overturned on appeal March 2026).
- SOC 2 Type II window: 6-12 months of operated controls.
- Colorado AI Act effective date: June 30, 2026 (delayed from February 2026 by SB25B-004).



## Build It

Reconstruct **Compliance — SOC 2, HIPAA, GDPR, PCI-DSS, EU AI Act, ISO 42001** by following `main` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `main` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-compliance-matrix.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/) — reference compliance profile.
- [GuardionAI — LLM Compliance 2026: ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 Audit Guide 2026: 10 AI Controls](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) — primary source.
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) — primary source.
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) — AI management system standard.

## Exercises

Use `main` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `main`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Enumerate the seven 2026 frameworks relevant to LLM products and match each to a customer segment.**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Cite the EU AI Act enforcement timeline (in force August 2024; high-risk enforcement 2 December 2027 for Annex III / 2 August 2028 for Annex I, per Regulation (EU) 2026/1744) and the two-tier fine ceiling (€15M / 3% for high-risk obligations, €35M / 7% for prohibited practices).** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain why post-processing PII cleanup is not enough for GDPR and name real-time inference-layer redaction as the defensible standard.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-compliance-matrix.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Describe cross-framework control mapping (e.g., access control maps to ISO 27001 A.5.15-5.18 + GDPR Art. 32 + HIPAA §164.312(a)).**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Compliance — SOC 2, HIPAA, GDPR, PCI-DSS, EU AI Act, ISO 42001** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `main` traced to the value or shape that supports **Enumerate the seven 2026 frameworks relevant to LLM products and match each to a customer segment.**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Cite the EU AI Act enforcement timeline (in force August 2024; high-risk enforcement 2 December 2027 for Annex III / 2 August 2028 for Annex I, per Regulation (EU) 2026/1744) and the two-tier fine ceiling (€15M / 3% for high-risk obligations, €35M / 7% for prohibited practices).**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain why post-processing PII cleanup is not enough for GDPR and name real-time inference-layer redaction as the defensible standard.**; and
- an updated `outputs/skill-compliance-matrix.md` example with a concrete input, expected output field, and acceptance check tied to **Describe cross-framework control mapping (e.g., access control maps to ISO 27001 A.5.15-5.18 + GDPR Art. 32 + HIPAA §164.312(a)).**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
