# Regulatory Frameworks — EU, US, UK, Korea

> Four primary regulatory regimes define the 2026 AI governance landscape. EU AI Act (in force 1 August 2024) — prohibited practices and AI literacy from 2 February 2025; GPAI obligations from 2 August 2025; Article 50 transparency from 2 August 2026; legacy GPAI obligations from 2 August 2027; high-risk-system obligations postponed by Regulation (EU) 2026/1744 to 2 December 2027 (Annex III systems) and 2 August 2028 (Annex I systems); maximum penalties up to 35M EUR or 7% of worldwide annual turnover for violations of prohibited practices (Article 99(3)). GPAI Code of Practice (10 July 2025): three chapters — Transparency, Copyright, Safety and Security — 12 commitments; enforcement begins August 2026. UK AISI -> AI Security Institute (February 2025): rename signals narrower scope. US AISI -> CAISI (June 2025): Center for AI Standards and Innovation under NIST; shift toward pro-growth posture. Korean AI Framework Act (passed December 2024, effective January 2026): Article 12 establishes AISI under MSIT; mandates local representatives for foreign AI companies, risk assessment, safety measures for high-impact and generative AI.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 18 · 18 (frontier frameworks), Phase 18 · 27 (data governance)
**Time:** ~75 minutes

## Learning Objectives

- Describe the EU AI Act risk tiers (prohibited, high-risk, general-purpose, limited-risk) and the Feb 2025 / Aug 2025 / Aug 2026 / Aug 2027 / Dec 2027 / Aug 2028 timeline.
- Describe the three chapters of the GPAI Code of Practice and which providers each binds.
- Describe the 2025 rebrands: UK AISI -> AI Security Institute; US AISI -> CAISI; what each rebrand implies about policy direction.
- State the core provision of Korea's AI Framework Act.

## The Problem

Lab frameworks (Lesson 18) are voluntary. Regulatory frameworks are compulsory. The 2024-2026 period saw the first wave of comprehensive AI regulation enter force. Deployers must map technical controls to regulatory obligations; the mapping differs by jurisdiction.

## The Concept

### EU AI Act

**In force 1 August 2024.** Risk-tier structure:

- **Prohibited practices** (Article 5). Social scoring, real-time remote biometric identification in public (with law-enforcement exceptions), exploitative manipulation of vulnerable groups. Applied 2 February 2025.
- **High-risk systems** (Annex I products and Annex III use cases). Employment, education, credit, law enforcement, justice, migration. Require conformity assessment, risk management, logging, transparency. Applies 2 December 2027 (Annex III) / 2 August 2028 (Annex I).
- **General-Purpose AI (GPAI) models**. Applied 2 August 2025. All GPAI providers have obligations; systemic-risk GPAI (>1e25 FLOP training compute) have additional obligations.
- **Limited-risk systems**. Transparency obligations under Article 50 (AI-generated content labelling). Applied 2 August 2026.

Timeline:
- 2 Feb 2025: prohibited practices + AI literacy.
- 2 Aug 2025: GPAI + governance.
- 2 Aug 2026: Article 50 transparency. Maximum penalty (Article 99(3), prohibited practices): 35M EUR / 7% worldwide annual turnover.
- 2 Aug 2027: legacy GPAI (models placed on the market before 2 Aug 2025).
- 2 Dec 2027: high-risk systems under Annex III.
- 2 Aug 2028: high-risk systems embedded in Annex I products.

Regulation (EU) 2026/1744 (the "Digital Omnibus on AI," adopted 8 July 2026) enacted this postponement — Annex III high-risk obligations moved from the original 2 August 2026 to 2 December 2027, and Annex I high-risk obligations moved from the original 2 August 2027 to 2 August 2028. The legacy-GPAI date (2 August 2027) and the Article 50 transparency date (2 August 2026) were left unchanged.

### GPAI Code of Practice

Published 10 July 2025. Three chapters:

- **Transparency.** All GPAI providers.
- **Copyright.** All GPAI providers.
- **Safety and Security.** Systemic-risk GPAI providers (estimated 5-15 companies).

12 commitments total. A Signatory Taskforce chaired by the AI Office manages implementation. Enforcement begins 2 August 2026; until then, good-faith compliance is accepted.

### Transparency Code for Article 50

First draft 17 December 2025. Second draft March 2026. Final version June 2026. Covers AI-generated content labelling including deepfakes — the regulatory layer that requires Lesson 23's watermarking technology.

### UK AI Security Institute (February 2025)

Renamed from AI Safety Institute. The rebrand narrows scope: drops algorithmic bias and free-speech framings; focuses on frontier capability security. Open-sourced the Inspect evaluation tool (May 2024). Collaborates with Redwood (Lesson 10) on control safety cases.

### US CAISI (June 2025)

Trump administration transforms NIST's AI Safety Institute into the Center for AI Standards and Innovation. Shift toward "pro-growth AI policies" per VP Vance's Paris AI Action Summit remarks. Reduced emphasis on pre-deployment evaluation; emphasis on standards and innovation support. Domestic counterweight to EU AI Act's regulatory posture.

### Korean AI Framework Act

Passed December 2024. Enacted January 2025. Effective January 2026. Consolidates 19 separate AI bills.

Article 12 establishes an AISI under the Ministry of Science and ICT (MSIT). Mandates:
- Local representatives for foreign AI companies operating in Korea.
- Risk assessment for "high-impact" AI systems.
- Safety measures for generative AI and high-impact AI.

First Asian jurisdiction with a comprehensive horizontal AI regulation.

### Cross-jurisdiction dynamics

- EU: strict, risk-tiered, heavy penalties. Benchmark for privacy-adjacent regulation.
- US: innovation-favouring, decentralized, states (e.g., California AB 2013 — Lesson 27) fill federal gaps.
- UK: narrow security focus, strong evaluation infrastructure.
- Korea: MSIT-led, foreign-provider-focused.

Competing regulatory philosophies. Deployers in multiple jurisdictions have to comply with the strictest, which in 2026 is typically the EU AI Act.

### Where this fits in Phase 18

Lesson 18 is lab-voluntary governance; Lesson 24 is regulatory; Lesson 25 is an emerging class of CVEs for AI systems; Lessons 26-27 cover documentation (cards) and training-data governance.



## Further Reading

- [EU AI Act text (Regulation 2024/1689)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) — the regulation and timeline
- [GPAI Code of Practice (10 July 2025)](https://digital-strategy.ec.europa.eu/en/library/final-version-general-purpose-ai-code-practice) — three-chapter code
- [UK AI Security Institute (renamed Feb 2025)](https://www.gov.uk/government/organisations/ai-security-institute) — official page
- [CSET — South Korea AI Framework Act Analysis (2025)](https://cset.georgetown.edu/publication/south-korea-ai-law-2025/) — Korean framework analysis

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Describe the EU AI Act risk tiers (prohibited, high-risk, general-purpose, limited-risk) and the Feb 2025 / Aug 2025 / Aug 2026 / Aug 2027 / Dec 2027 / Aug 2028 timeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Describe the three chapters of the GPAI Code of Practice and which providers each binds.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Describe the 2025 rebrands: UK AISI -> AI Security Institute; US AISI -> CAISI; what each rebrand implies about policy direction.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Describe the EU AI Act risk tiers (prohibited, high-risk, general-purpose, limited-risk) and the Feb 2025 / Aug 2025 / Aug 2026 / Aug 2027 / Dec 2027 / Aug 2028 timeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Describe the 2025 rebrands: UK AISI -> AI Security Institute; US AISI -> CAISI; what each rebrand implies about policy direction,” and cite a repeatable check rather than relying on visual inspection alone.
