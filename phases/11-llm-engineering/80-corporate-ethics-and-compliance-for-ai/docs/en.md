# AI Use-Case Intake: From Idea to Approved Deployment (2026)

> The EU AI Act is phasing in on a rolling schedule, not a single go-live date: prohibited-use rules have applied since February 2025 and general-purpose model providers have had to publish capability evaluations since August 2025, but — after Regulation (EU) 2026/1744 postponed the original 2026/2027 dates — high-risk system obligations (conformity assessment, human oversight, logging), which carry fines up to 3% of global revenue, only start applying on 2 December 2027 (Annex III systems) and 2 August 2028 (Annex I systems). At the same time, GDPR enforcement on AI-generated personal data has accelerated — six significant decisions landed in 2024–25, including a 250 M EUR fine for a generative model that reproduced training data verbatim. For a technology consultant, this means every new AI use case arrives with two distinct compliance clocks running simultaneously: the client's internal approval gate and the regulator's. Missing either is a project-stopper, not a paperwork problem. The skill this lesson builds is an intake process that turns a vague "let's use AI for this" into a documented, risk-classified, approval-ready proposal before any model is called.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 75 (Responsible AI in practice), Phase 11 · 12 (Guardrails, safety and content filtering)
**Time:** ~45 minutes

## Learning Objectives

- Explain the production problem addressed by AI Use-Case Intake: From Idea to Approved Deployment (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## The Problem

A consulting team proposes an AI assistant that summarises customer complaints, flags escalation candidates, and drafts response emails. The project manager books a demo for week three. By week six, the legal department has halted the project: customer complaint data is special-category personal data under GDPR, the escalation flag may constitute automated decision-making with legal effect, and no data-processing agreement exists with the model vendor. The demo worked. The intake did not.

The failure is structural and repeatable. Teams evaluate AI on capability and time-to-demo while compliance review is added as a final-step gate — a gate positioned too late to be anything but a blocker. The engineering question is not how to avoid compliance; it is how to run the intake fast enough that the compliance answer is known by day two, not week six. A structured intake also surfaces information that makes the build better: knowing the use case is high-risk under the AI Act triggers logging, human-oversight, and explainability requirements that should shape the architecture from the start, not be bolted on after the fact.

## The Concept

### The three regulatory clocks every AI project faces

| Clock | Standard | Key trigger for consulting work | Penalty range |
|---|---|---|---|
| EU AI Act | Regulation 2024/1689, phased in through 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) per Regulation (EU) 2026/1744 | Deploying a "high-risk AI system" or a GPAI model | 1–3% global revenue; up to 7% for prohibited uses |
| GDPR / nFADP | GDPR 2016/679, CH nFADP 2023 | Processing personal data with AI; automated individual decisions | Up to 4% global revenue per violation |
| Internal governance | Company AI policy + InfoSec baseline | Any AI touching classified data, production systems, or customer data | Project halt, contract breach, reputational |

The clocks run in parallel. A use case can clear GDPR (no personal data, no automated decisions) and still be high-risk under the AI Act (e.g., AI used in critical infrastructure management). A use case can be low-risk under both regulations and still be blocked by an internal policy that prohibits sending any data to a cloud-hosted model. The intake must address all three.

### Risk classification: the EU AI Act pyramid

The Act stratifies AI systems into risk tiers under Article 6, plus a transparency layer that applies regardless of tier. Your first task on any new use case is to place it.

| Tier | Examples in consulting | Obligation |
|---|---|---|
| **Prohibited** (Art. 5) | Social scoring of individuals; real-time biometric surveillance in public; subliminal manipulation | Do not build. Full stop. |
| **High-risk** (Art. 6, via Annex I or Annex III) | CV screening / hiring tools; credit scoring; medical diagnosis support; critical infrastructure management; law enforcement; education assessment | Conformity assessment and EU declaration of conformity (Art. 43, 47), human oversight, explainability, logging, registration in EU database before deployment |
| **Transparency obligations** (Art. 50) | Chatbots and virtual assistants (Art. 50(1)); deepfakes and synthetic content (Art. 50(4)) | Disclose that the person is interacting with an AI system; label AI-generated or manipulated content |
| **Minimal-risk** | Customer FAQ chatbot; internal knowledge search; code completion | No mandatory AI Act obligation beyond Art. 50 where it applies; voluntary code of practice |

GPAI models (Claude, GPT-4o, Gemini, and similar) sit outside this deployment-risk pyramid: Chapter V (Art. 51–56) regulates them per model, not per use case — capability evaluations, copyright summaries, and systemic-risk mitigations for models trained above 10^25 FLOP.

The practical consulting heuristic: if the AI output can affect a legal right, a safety outcome, or an employment/credit/education decision, assume high-risk and validate. If unsure, check both Annex I and Annex III of the AI Act — together they define the high-risk categories (Annex I: AI as a safety component of products already covered by EU harmonisation legislation; Annex III: the stand-alone list of use cases such as biometrics, employment, and law enforcement).

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

Phase 11 · 75 describes the full compliance workflow. This lesson adds the front-end classification step that determines which compliance path to take. The sequence:

1. **Describe the use case** in one paragraph: who, what data, what decision, what output, what human action follows.
2. **Classify against the AI Act pyramid.** Use `code/main.py` to get the tier and the resulting obligation list.
3. **Check the GDPR triggers.** Does it process personal data? Automated decision with legal effect? Is a DPA needed? Is a cross-border transfer involved?
4. **Apply internal gates.** Data classification of inputs; human-in-the-loop design; logging plan.
5. **Document and route.** The intake document goes to legal, InfoSec, and the project sponsor before architecture decisions are made.

The guardrails layer built in Phase 11 · 12 is where intake decisions are operationalised: a use case approved only for Internal data gets an input filter that blocks Confidential content at runtime. The model-system-dataset cards described in Phase 18 · 26 are the documentation artefact that captures these decisions for the lifecycle of the system.

### Current model landscape and compliance implications

In 2026, the dominant frontier models are Claude Sonnet/Opus 4.x (Anthropic), GPT-4o and o3 (OpenAI), and Gemini 2.x (Google). All three vendors have published data-processing agreements and EU Standard Contractual Clauses. However, DPA availability does not mean automatic compliance — you must sign the DPA, configure data residency where available (EU endpoints exist for Azure OpenAI, Vertex AI, and Anthropic via AWS/Azure), and verify that no input data is used for training (all three vendors offer this opt-out under enterprise tiers).

Open-weight models (Llama 4, Mistral Large 2) deployed on company-owned infrastructure sidestep the DPA requirement but introduce a different obligation: the company becomes the model operator under the AI Act and is fully responsible for all downstream harms from the model's outputs.



## Further Reading

- [EU AI Act full text — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689) — Annex III lists all high-risk categories; Article 5 lists all prohibited uses.
- [European Data Protection Board — Guidelines on automated decision-making](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines_en) — authoritative GDPR Article 22 interpretation.
- [EU AI Office — GPAI model compliance](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) — the implementation guidance and codes of practice for GPAI providers and deployers.
- [NIST AI Risk Management Framework 1.0](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) — the US complement to the EU Act; adopted as a baseline reference in the AI governance policies of most large multinational enterprises our teams encounter, typically alongside the EU framework.
- [ISO/IEC 42001:2023 — AI Management System standard](https://www.iso.org/standard/81230.html) — the international management-system standard for AI; increasingly required in enterprise procurement and audit.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the production problem addressed by AI Use-Case Intake: From Idea to Approved Deployment (2026).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Apply the lesson's decision or implementation workflow to a concrete case.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Measure quality, cost, latency, and risk with explicit acceptance criteria.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the production problem addressed by AI Use-Case Intake: From Idea to Approved Deployment (2026),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Measure quality, cost, latency, and risk with explicit acceptance criteria,” and cite a repeatable check rather than relying on visual inspection alone.
