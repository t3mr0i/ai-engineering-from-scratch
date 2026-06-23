# AI Use-Case Intake: From Idea to Approved Deployment (2026)

> The EU AI Act entered full enforcement in August 2025: prohibited-use rules apply immediately, high-risk system obligations (conformity assessment, human oversight, logging) carry fines up to 3% of global revenue, and general-purpose model providers must now publish capability evaluations. At the same time, GDPR enforcement on AI-generated personal data has accelerated — six significant decisions landed in 2024–25, including a 250 M EUR fine for a generative model that reproduced training data verbatim. For a technology consultant, this means every new AI use case arrives with two distinct compliance clocks running simultaneously: the client's internal approval gate and the regulator's. Missing either is a project-stopper, not a paperwork problem. The skill this lesson builds is an intake process that turns a vague "let's use AI for this" into a documented, risk-classified, approval-ready proposal before any model is called.

**Type:** Learn
**Languages:** Python (stdlib — AI use-case risk classifier and approval gate simulator)
**Prerequisites:** Phase 11 · 18 (Responsible AI compliance workflow), Phase 11 · 12 (Guardrails, safety and content filtering)
**Time:** ~45 minutes

## The Problem

A consulting team proposes an AI assistant that summarises customer complaints, flags escalation candidates, and drafts response emails. The project manager books a demo for week three. By week six, the legal department has halted the project: customer complaint data is special-category personal data under GDPR, the escalation flag may constitute automated decision-making with legal effect, and no data-processing agreement exists with the model vendor. The demo worked. The intake did not.

The failure is structural and repeatable. Teams evaluate AI on capability and time-to-demo while compliance review is added as a final-step gate — a gate positioned too late to be anything but a blocker. The engineering question is not how to avoid compliance; it is how to run the intake fast enough that the compliance answer is known by day two, not week six. A structured intake also surfaces information that makes the build better: knowing the use case is high-risk under the AI Act triggers logging, human-oversight, and explainability requirements that should shape the architecture from the start, not be bolted on after the fact.

## The Concept

### The three regulatory clocks every AI project faces

| Clock | Standard | Key trigger for consulting work | Penalty range |
|---|---|---|---|
| EU AI Act | Regulation 2024/1689, full effect Aug 2025 | Deploying a "high-risk AI system" or a GPAI model | 1–3% global revenue; up to 7% for prohibited uses |
| GDPR / nFADP | GDPR 2016/679, CH nFADP 2023 | Processing personal data with AI; automated individual decisions | Up to 4% global revenue per violation |
| Internal governance | Company AI policy + InfoSec baseline | Any AI touching classified data, production systems, or customer data | Project halt, contract breach, reputational |

The clocks run in parallel. A use case can clear GDPR (no personal data, no automated decisions) and still be high-risk under the AI Act (e.g., AI used in critical infrastructure management). A use case can be low-risk under both regulations and still be blocked by an internal policy that prohibits sending any data to a cloud-hosted model. The intake must address all three.

### Risk classification: the EU AI Act pyramid

The Act stratifies AI systems into four tiers. Your first task on any new use case is to place it.

| Tier | Examples in consulting | Obligation |
|---|---|---|
| **Prohibited** | Social scoring of individuals; real-time biometric surveillance in public; subliminal manipulation | Do not build. Full stop. |
| **High-risk** | CV screening / hiring tools; credit scoring; medical diagnosis support; critical infrastructure management; law enforcement; education assessment | Conformity assessment, human oversight, explainability, logging, registration in EU database before deployment |
| **GPAI (general-purpose)** | Deploying Claude, GPT-4o, Gemini as a service component | Capability evaluations, copyright summaries, systemic-risk mitigations if above 10^25 FLOP training compute |
| **Minimal-risk** | Customer FAQ chatbot; internal knowledge search; code completion | Self-declaration of conformity; voluntary code of practice |

The practical consulting heuristic: if the AI output can affect a legal right, a safety outcome, or an employment/credit/education decision, assume high-risk and validate. If unsure, check Annex III of the AI Act directly — it lists the high-risk categories exhaustively.

### GDPR triggers that the AI Act does not cover

The EU AI Act does not replace GDPR; it adds to it. Four GDPR mechanisms that AI specifically activates:

1. **Automated decision-making (Article 22).** A decision "based solely on automated processing" that "produces legal effects or similarly significantly affects" the person requires either explicit consent, contractual necessity, or a Union/Member State legal basis. The AI does not need to make the final decision — if the human rubber-stamps a recommendation without meaningful review, regulators treat it as automated.

2. **Data minimisation and purpose limitation (Articles 5(1)(b) and (c)).** Training data or retrieval context cannot include personal data unless it was collected for a compatible purpose. Using a customer CRM export to fine-tune a model is almost always a purpose-limitation violation.

3. **Data Processing Agreement (Article 28).** Every model vendor that processes personal data on your behalf is a data processor. A signed DPA must exist before the first API call that contains personal data. No DPA = an active violation from day one.

4. **Transfer to third countries (Chapter V).** Sending personal data to a model hosted in the US or Asia requires either EU Standard Contractual Clauses or an adequacy decision. The EU–US Data Privacy Framework (2023) covers most major US cloud vendors, but this must be verified per vendor and jurisdiction.

### Internal policy controls: the three gates

LHIND's AI governance baseline (and most large enterprise AI policies) adds three gates that sit below the regulatory layer:

1. **Data classification gate.** Map every data element the AI will touch to the company's classification scheme (Public / Internal / Confidential / Secret). Any AI call that contains Confidential or Secret data requires explicit CISO approval and, typically, a private/on-premises model or contractual data-isolation guarantees from the vendor.

2. **Human-in-the-loop gate.** Specify the human review step before the AI output has effect. For generative outputs, "a human read it before sending" is the minimum. For decision-support outputs, the reviewer must have the information and authority to overrule.

3. **Logging and auditability gate.** Can you reconstruct what the model was asked, what it said, and who acted on it? Logging must cover: the prompt (sanitised if needed), the response, the model version, the timestamp, and the user identity. Without this, incident response is impossible and regulatory investigations stall.

### The intake checklist in practice

Phase 11 · 18 describes the full compliance workflow. This lesson adds the front-end classification step that determines which compliance path to take. The sequence:

1. **Describe the use case** in one paragraph: who, what data, what decision, what output, what human action follows.
2. **Classify against the AI Act pyramid.** Use `code/main.py` to get the tier and the resulting obligation list.
3. **Check the GDPR triggers.** Does it process personal data? Automated decision with legal effect? Is a DPA needed? Is a cross-border transfer involved?
4. **Apply internal gates.** Data classification of inputs; human-in-the-loop design; logging plan.
5. **Document and route.** The intake document goes to legal, InfoSec, and the project sponsor before architecture decisions are made.

The guardrails layer built in Phase 11 · 12 is where intake decisions are operationalised: a use case approved only for Internal data gets an input filter that blocks Confidential content at runtime. The model-system-dataset cards described in Phase 18 · 26 are the documentation artefact that captures these decisions for the lifecycle of the system.

### Current model landscape and compliance implications

In 2026, the dominant frontier models are Claude Sonnet/Opus 4.x (Anthropic), GPT-4o and o3 (OpenAI), and Gemini 2.x (Google). All three vendors have published data-processing agreements and EU Standard Contractual Clauses. However, DPA availability does not mean automatic compliance — you must sign the DPA, configure data residency where available (EU endpoints exist for Azure OpenAI, Vertex AI, and Anthropic via AWS/Azure), and verify that no input data is used for training (all three vendors offer this opt-out under enterprise tiers).

Open-weight models (Llama 4, Mistral Large 2) deployed on company-owned infrastructure sidestep the DPA requirement but introduce a different obligation: the company becomes the model operator under the AI Act and is fully responsible for all downstream harms from the model's outputs.

## Use It

`code/main.py` implements a two-part deterministic intake simulator. Part 1 is a **risk classifier**: given a structured description of a use case (data types, decision effect, sector), it maps the case to an AI Act tier and returns the obligation list for that tier. Part 2 is an **approval gate checker**: given the classifier output plus three boolean answers (DPA in place, data classification cleared, logging designed), it returns one of three decisions — `APPROVED`, `CONDITIONAL` (specifying which gaps must close), or `BLOCKED` — and prints a one-paragraph justification. The sample cases demonstrate all three outcomes.

## Ship It

`outputs/skill-ai-use-case-intake.md` is a one-page paste-and-use intake worksheet for a working consultant: a structured description template, the risk classification table, a GDPR trigger checklist, the three internal gates, and a routing matrix. Print it before the first project meeting where AI is mentioned.

## Exercises

1. Run `code/main.py`. Which sample use case is classified as high-risk and why? Change one attribute of that case so it drops to minimal-risk. What changed, and is the change realistic for that domain?

2. The approval gate checker returns `CONDITIONAL` for two sample cases. Pick the CV screening case. Read the justification it prints. What single gap must the project team close before the gate changes to `APPROVED`?

3. A colleague proposes using a public-cloud LLM to summarise internal meeting notes. The notes sometimes mention individual employees' performance. Walk through the four GDPR triggers. How many apply? What is the minimum set of controls that would make this use case compliant?

4. Your client wants to use an AI system to screen job applications and rank candidates. Place this use case in the AI Act pyramid. List every high-risk obligation that would apply before the system can go live.

5. An open-weight model (Llama 4, self-hosted) is proposed to avoid DPA complexity. Does self-hosting eliminate all regulatory obligations? List the compliance requirements that remain and the new risks it introduces.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| AI Act high-risk | "Heavily regulated AI" | Systems in EU AI Act Annex III — conformity assessment, logging, human oversight, and EU-database registration are all mandatory before deployment |
| Prohibited use | "Things AI cannot do" | A closed list of AI applications the Act bans outright, including social scoring and real-time remote biometric identification in public spaces |
| Article 22 GDPR | "No automated decisions" | Prohibition on decisions based solely on automated processing that have legal or similarly significant effects on a person, with three narrow exceptions |
| Data Processing Agreement | "DPA" | Mandatory contract between a data controller and any processor that handles personal data on its behalf; must be signed before the first API call that includes personal data |
| GPAI model | "Foundation model compliance" | General-Purpose AI models above capability thresholds must publish evaluations, copyright summaries, and (above 10^25 FLOP) systemic-risk mitigations |
| Data classification gate | "Checking sensitivity" | Mapping every input data element to the enterprise classification scheme before selecting a model deployment option; determines whether a private endpoint is required |
| Human-in-the-loop | "A human reviews it" | A defined human review step with actual authority to overrule the AI output before it has effect; rubber-stamping a recommendation does not satisfy this requirement |
| SCCs | "Standard Contractual Clauses" | EU-approved transfer mechanism for sending personal data to a third country; must be in place before cross-border API calls that include personal data |

## Consultant field notes

- **The prompt that worked in the demo but failed in production.** Demos run on cleaned, sanitised data. The first production query carries a customer name, an account number, and an edge case the model has never seen. If the intake did not classify data sensitivity before the demo, the same team that celebrated week three is filling out an incident report by week four.
- **The use case everyone approved but nobody wanted.** A sponsor signs off, legal signs off, InfoSec signs off. Then the frontline team that has to live with the AI output quietly routes around it. This almost always means the intake captured stakeholder sign-off but not end-user workflow — the "who actually clicks the button" question was never asked.
- **The vendor pilot that never made it past the security review.** Procurement approved the vendor in principle six months ago. Security review starts, and the DPA is unsigned, the data residency is unclear, and the training-opt-out clause is buried in a tier that was never contracted. The fix is to make the security checklist a precondition of the pilot kickoff, not a deliverable of it.
- **The AI feature that hit a cost ceiling in month two.** Per-token economics looked fine in the design doc. Real traffic, real prompts, real context windows, and a logging layer that retains full conversations for audit — the monthly invoice triples between month one and month three, and the business case quietly stops working. Intake should include a usage envelope, not just a unit price.
- **The RAG that returned the right doc but the wrong paragraph.** Compliance approved the retrieval corpus because it was the right *source*. The system retrieved the right document and surfaced the wrong section — the one that contradicted the policy. Chunking strategy and citation grounding belong in the intake, not as a post-build tuning exercise.

## Further Reading

- [EU AI Act full text — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689) — Annex III lists all high-risk categories; Article 5 lists all prohibited uses.
- [European Data Protection Board — Guidelines on automated decision-making](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines_en) — authoritative GDPR Article 22 interpretation.
- [EU AI Office — GPAI model compliance](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) — the implementation guidance and codes of practice for GPAI providers and deployers.
- [NIST AI Risk Management Framework 1.0](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) — the US complement to the EU Act; adopted as a baseline reference in the AI governance policies of most large multinational enterprises our teams encounter, typically alongside the EU framework.
- [ISO/IEC 42001:2023 — AI Management System standard](https://www.iso.org/standard/81230.html) — the international management-system standard for AI; increasingly required in enterprise procurement and audit.
