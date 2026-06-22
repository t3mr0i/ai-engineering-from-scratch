# How AI Systems Actually Work: A Practitioner's Map (2026)

> As of 2026, large language models power tools that more than 750 million people use weekly — yet most discussions about AI in business contexts still conflate four structurally different things: machine learning, foundation models, generative AI, and agentic systems. Each has a different cost profile, failure mode, and governance obligation. A consulting team that cannot distinguish them will scope projects incorrectly, underestimate risk, and misread vendor proposals. The EU AI Act entered full enforcement in 2026, meaning misclassification of an AI system's type now has direct legal consequences. The goal here is not encyclopedic coverage — Phase 2, Phase 7, and Phase 8 handle the technical depth — it is the map: which concept lives where, what each one can and cannot do, and which questions a practitioner must answer before committing a client to any of them.

**Type:** Learn
**Languages:** Python (stdlib — AI system type classifier + risk flag evaluator)
**Prerequisites:** Phase 2 · 01 (What is machine learning), Phase 8 · 01 (Generative models taxonomy)
**Time:** ~45 minutes

## The Problem

The typical failure in client-facing AI work is not technical — it is categorical. A stakeholder asks for "an AI that reads our contracts and flags risks." That request could be answered with a keyword rule, a fine-tuned classifier, a retrieval-augmented generator, or an autonomous agent. Each answer implies a different build timeline, data requirement, compliance burden, and operational cost. Choosing the wrong one — or worse, not knowing the options exist — is not a neutral error. It produces either a solution that cannot do what was promised, or one that can do far more than the client has governed.

The engineering and consulting question for 2026 is not "can we use AI here." It is: what type of AI system does this use case actually require, what are the realistic limits of that type, and what governance checkpoints must exist before it touches production data? This lesson gives you the vocabulary and decision framework to answer that question in a client room.

## The Concept

### Four layers of the AI landscape

Most confusion in business AI conversations comes from treating these four layers as synonyms:

| Layer | What it is | Key property | Primary failure mode |
|---|---|---|---|
| **Machine learning** | Statistical models trained on labeled or unlabeled data to make predictions | Requires curated training data; output is a score or class | Distribution shift — the world changes, the model does not |
| **Foundation models** | Very large models pre-trained on broad data, adapted for downstream tasks | Few-shot capable; expensive to train, cheap(er) to run | Hallucination; overconfident on out-of-distribution inputs |
| **Generative AI** | Foundation models used to produce new content (text, code, images, audio) | Open-ended output; hard to constrain format/content reliably | Output verification — generated content looks authoritative but may be wrong |
| **Agentic AI** | Models that plan, use tools, and take actions across multiple steps | Composition of capabilities; higher blast radius | Compounding errors; prompt injection; exfiltration via legitimate channels |

These layers nest: an agentic system is usually built on a generative foundation model, which is a form of machine learning. But the risks and governance needs at each layer are additive, not interchangeable. A project at the agentic layer inherits all the ML risks plus all the generative risks, and adds new ones.

### Current model landscape (mid-2026)

The frontier has consolidated around a small number of providers. For practical consulting work, the landscape practitioners encounter looks like this:

| Provider | Flagship models (2026) | Typical deployment |
|---|---|---|
| Anthropic | Claude Opus 4.x, Sonnet 4.x, Haiku 4.x; Fable 5 | API, Claude.ai, enterprise |
| OpenAI | GPT-4o, o3, o4-mini | API, ChatGPT, Azure OpenAI |
| Google | Gemini 2.5 Pro/Flash | API, Workspace, Vertex AI |
| Meta | Llama 4 (open weights) | Self-hosted, cloud fine-tuning |
| Mistral | Mistral Large (open weights) | Self-hosted, cloud |

The open-weight tier (Meta, Mistral) matters specifically for clients with strict data residency requirements — the model runs inside the client's own infrastructure. Closed-API models offer higher capability at the frontier but require data to leave the client's environment. This is a governance decision, not a technical one, and it must be resolved before architecture begins. Phase 11 · 27 covers the vendor landscape in full; this lesson frames the decision.

### What generative models can and cannot do

Practitioners in 2026 regularly overpromise generative AI because they test it on easy cases. The honest capability map:

**Reliable at:**
- Summarization of well-structured documents when the source is provided in context
- Code generation for standard patterns with working tests to verify against
- Draft generation for templated content (reports, emails, meeting notes)
- Classification and extraction when the schema is precisely defined in the prompt

**Unreliable without mitigations:**
- Arithmetic and multi-step numerical reasoning (models still make calculation errors; use code execution instead)
- Real-time information (knowledge cutoffs; use retrieval, see Phase 11 · 06)
- Citing specific sources accurately (models confabulate citations; always verify against retrieved text)
- Consistent formatting under adversarial or ambiguous inputs (use structured output APIs)

**Cannot do by design:**
- Access proprietary systems without explicit tool integration
- Guarantee factual accuracy without a retrieval or verification layer
- Remember prior interactions without memory tooling

The practical rule: **generative AI is a strong first-pass generator; it is not a reliable terminal verifier.** Any use case that requires the AI to be the last check before a consequential decision needs a human or a deterministic system in the loop.

### Agentic AI: where the risk profile shifts

An LLM calling tools to take actions is categorically different from an LLM answering questions. The blast radius expands with each tool added. Phase 15 · 10 covers permission modes in detail; the foundational point here is:

- A chatbot that gives a wrong answer wastes time.
- An agent that takes a wrong action can modify files, send emails, make API calls, or charge a card — and the action may be irreversible.

The agentic risk checklist for a client proposal has four gates:

1. **Blast radius** — what can the agent actually reach? (file system scope, API permissions, data access)
2. **Reversibility** — can every action it takes be undone? If not, which cannot?
3. **Oversight** — is there a human checkpoint before irreversible actions, and is it enforced technically or only by policy?
4. **Injection surface** — what external text can the agent read? Anything it reads is a potential prompt injection vector (Phase 18 · 15).

### Responsible AI: from principle to obligation

The responsible AI conversation shifted significantly between 2024 and 2026. The EU AI Act moved from compliance preparation to enforcement. The key practitioner obligations for consulting work in EU-operating clients:

- **Risk classification is mandatory.** AI systems are classified as unacceptable risk (prohibited), high risk (conformity assessment, registration, documentation), limited risk (transparency obligations), or minimal risk. Getting this wrong is a legal exposure.
- **High-risk systems** include AI in employment decisions, credit scoring, education, critical infrastructure, law enforcement, and certain safety components. A model that flags which contracts to renew may be high-risk.
- **Transparency obligations** apply to generative AI at limited risk: users must know when content is AI-generated.
- **Technical documentation and logging** are required for high-risk systems; this is not optional and cannot be retrofitted cheaply.

Phase 11 · 18 and Phase 18 · 24 cover the regulatory detail. The point here is that the AI Act makes system-type classification a legal act, not just a design decision.

### The three questions a consultant must answer first

Before any AI project enters scoping or estimation, three questions must have written answers:

1. **What type of AI system is this?** (classifier, generator, agent — with which tools, which data access)
2. **What is the ground truth?** (How will anyone know if the system is wrong, and how quickly?)
3. **What does a failure cost?** (wrong answer vs. wrong action; reversible vs. irreversible; regulatory vs. reputational)

If the answer to question 2 is "we will trust the output," the project is not ready to begin. If the answer to question 3 is "we have not assessed this," it is a risk that must be disclosed before sign-off.

## Use It

`code/main.py` is a deterministic, stdlib-only model of the two decisions this lesson is about:

1. An **AI system type classifier** that takes a use case description (expressed as structured inputs: output type, data access, action capability, multi-step planning) and routes it to the correct AI system layer, with the reasoning shown.
2. A **risk flag evaluator** that applies the agentic risk checklist (blast radius, reversibility, oversight, injection surface) and produces a PROCEED / REVIEW / BLOCK verdict for a proposed AI deployment.

No network, no models — the point is to make the classification and risk logic explicit and runnable.

## Ship It

`outputs/skill-ai-system-type-classifier.md` is a one-page decision aid: a table mapping use case characteristics to system type, the four agentic risk gates in checklist form, and the EU AI Act risk tier quick-reference. Paste it into a project kickoff or client workshop.

## Exercises

1. Run `code/main.py`. Which use case in the sample set is classified as agentic, and which as a simple classifier? Find the one input flag that, if changed, moves a use case from "generative" to "agentic" — what does that flag represent in a real project?

2. The risk evaluator blocks one sample deployment and requests review on another. Find both. For the blocked one, name the specific gate it fails and describe a concrete mitigation that would allow it to proceed.

3. A client asks you to build an AI that reads incoming customer emails, looks up their account in a CRM, drafts a reply, and sends it. Map this to the four AI layers. Which layer is it primarily? What is the blast radius? What oversight gate would you require before the send action?

4. A colleague says "the model is GPT-4o, it is very accurate, we do not need a human review step." Using the capability map in this lesson, construct a one-paragraph counter-argument that does not require technical depth — it should work in a client room with non-technical stakeholders.

5. Look up your client organization's or LHIND's internal AI governance policy. Find where it addresses system-type classification and responsible AI checkpoints. Does it distinguish between limited-risk and high-risk systems as defined by the EU AI Act? Note any gaps.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Machine learning | "Training the AI" | Statistical model fitting: mapping inputs to outputs via optimization on examples |
| Foundation model | "The underlying model" | A large model pre-trained on broad data, adapted for tasks via prompting or fine-tuning |
| Hallucination | "Making things up" | A model generating plausible-looking but factually incorrect content with no indication of uncertainty |
| Agentic AI | "Autonomous AI" | A model that plans and takes actions via tools across multiple steps, with compounding state |
| Prompt injection | "Jailbreaking" | Attacker-controlled text in model input that overrides the system's intended instructions |
| EU AI Act | "AI regulation" | EU regulation in force 2026: classifies AI systems by risk tier with mandatory compliance obligations for high-risk systems |
| RAG | "Giving the AI your data" | Retrieval-Augmented Generation: pairing a generator with a retrieval step to ground outputs in specific documents |
| Blast radius | "How bad can it get" | The scope of real-world impact if an AI system takes an incorrect action |

## Further Reading

- [Anthropic — Claude model overview](https://docs.claude.com/en/docs/about-claude/models) — current model naming, context windows, and capability tiers for Claude.
- [EU AI Act — official text and guidance](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) — the regulation, risk tier definitions, and enforcement timeline.
- [NIST AI Risk Management Framework (AI RMF)](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) — the US complement to EU AI Act; used in many enterprise risk assessments.
- [Anthropic — Claude's model specification](https://www.anthropic.com/news/claudes-constitution) — how Anthropic frames model values and constraints; useful for explaining responsible AI design to clients.
- [arXiv — "A Survey of Large Language Models" (Zhao et al.)](https://arxiv.org/abs/2303.18223) — the canonical academic survey of LLM architecture, training, and capabilities; well-maintained with updates.
