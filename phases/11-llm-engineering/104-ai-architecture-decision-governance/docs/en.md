# AI Architecture Decision Records: Governing Model, Vendor, and Boundary Choices (2026)

> By 2026 the average enterprise AI stack contains seven distinct model providers, three inference tiers, and at least two shadow deployments the architecture team does not know about. Decisions made in a 30-minute sprint — which model, which vendor, where the security boundary sits — calcify into multi-year cost and compliance constraints. The Architecture Decision Record (ADR) format, used in software since Nygard (2011), extends naturally to AI-specific concerns: model substitutability, data-residency obligations, cost ceilings, and vendor-lock risk. An AI ADR captures the context, the options genuinely evaluated, the decision made, and — critically — the signals that would force a re-evaluation. Without this paper trail, governing AI spend, auditing for regulatory compliance (EU AI Act, DSGVO), and safely onboarding new models becomes archaeology.

**Type:** Learn
**Languages:** Python (stdlib — AI ADR validator and decision-register simulator)
**Prerequisites:** Phase 11 · 14 (Model Context Protocol), Phase 14 · 36 (Scope contracts)
**Time:** ~45 minutes

## The Problem

Teams shipping AI features in 2026 face a governance gap that has no direct analogue in traditional software: the model they chose last quarter may be deprecated, may have shifted its outputs across a minor vendor update (in our experience this happens roughly every 6–9 months for major providers), may now cost 40% more per million tokens, or may have introduced a new residency restriction. None of these are bugs in the team's code. All of them can invalidate the original decision rationale within months.

The consulting question is not whether to document AI architecture decisions — the question is *what* to record so the document stays useful when conditions change. A decision log that records only "we picked GPT-4o because it was the best model" fails at the first contract renewal. A good AI ADR records the boundary conditions — the cost threshold above which the decision reverts, the latency SLA the model was measured against, the data-classification level the vendor was assessed at. These boundary conditions are the living part of the document; without them the ADR is a museum exhibit, not a governance tool.

## The Concept

### What an AI ADR captures

A traditional ADR has five fields: status, context, decision, consequences, and alternatives considered. An AI ADR adds four AI-specific fields:

| Field | Traditional ADR | AI ADR extension |
|---|---|---|
| **Status** | Proposed / Accepted / Deprecated | + Superseded-by-model-version, Under-re-evaluation |
| **Context** | System forces driving the decision | + Data classification, residency constraint, regulatory scope |
| **Decision** | The choice made | + Model id + version pinned, vendor tier, inference endpoint type |
| **Consequences** | Expected outcomes and trade-offs | + Cost ceiling ($/1k tokens × expected volume), latency SLA measured |
| **Alternatives** | Options genuinely evaluated | + Models benchmarked, scores recorded (not just "we evaluated X") |
| **Trigger conditions** | (not in traditional ADR) | Events that mandate re-evaluation: price change >20%, model deprecation, residency violation, security finding |
| **Owner** | (not in traditional ADR) | Named person or team accountable for the next re-evaluation |
| **Review date** | (not in traditional ADR) | Hard date for scheduled re-evaluation; AI models move faster than annual architecture reviews |

### Model selection as a documented trade-off

The 2026 model landscape stratified into four tiers. Naming current models is useful for calibration — but the ADR must record the *criteria* so it survives the model being superseded:

| Tier | Representative 2026 models | Typical use case | Lock-in risk |
|---|---|---|---|
| **Frontier reasoning** | Claude Opus 4.x, Fable 5 | Complex multi-step agentic tasks, legal/medical reasoning | High: specialty APIs, pricing volatility |
| **Frontier general** | Claude Sonnet 4.x, GPT-4.1 | Daily production: chat, code, document processing | Medium: OpenAI-compatible APIs reduce lock-in |
| **Efficient** | Claude Haiku 4.x, Gemini Flash 2.x | High-volume, latency-sensitive, batch classification | Low: multiple substitutes, price parity common |
| **On-premises / self-hosted** | Llama 4 Scout/Maverick, Mistral Medium 3 | Residency-strict, air-gapped, cost ceiling hit | Lowest: no vendor dependency |

The ADR for a frontier-reasoning choice must explicitly note what would trigger downgrade to efficient tier — typically a cost threshold, a latency relaxation, or a model-capability threshold at which the cheaper model becomes sufficient.

### Vendor security boundaries

Security boundaries in AI are not the same as in traditional software. Three categories require explicit documentation:

**Data-in-transit and data-at-rest.** Does the vendor use prompts for training by default? (Anthropic: no for API, opt-in for Consumer. OpenAI: no for API with data processing addendum.) Which region are embeddings stored in? For EU clients this is a DSGVO question, not an engineering preference.

**Inference endpoint type.** Shared multi-tenant inference (cheapest, default for most APIs), dedicated provisioned throughput (predictable latency, data not mixed across tenants), and on-premises/BYOC (strongest isolation, highest ops cost). The ADR must record which tier was selected and why — "we use the shared endpoint because this data is public-domain and cost sensitivity is high" is a decision. Leaving it implicit is a gap.

**Model updates and behavioral drift.** Unlike a pinned library version, a cloud model at the same API endpoint can change behavior in a minor update. The ADR should record whether the team relies on a pinned-version endpoint (where the vendor offers one), a versionless alias, or a self-hosted checkpoint. Behavioral regression is not hypothetical: Anthropic, OpenAI, and Google have all documented cases where prompt outputs shifted across updates.

### Cost governance as a first-class concern

Token economics in 2026 span four orders of magnitude: frontier reasoning at $15–75/MTok input, efficient models at $0.20–1.00/MTok, open-weights self-hosted at near-zero marginal cost. The ADR for a model choice must project cost at expected production volume, not at prototype volume, and must set a ceiling that triggers re-evaluation.

A practical governance formula:

```
monthly_cost = (avg_prompt_tokens + avg_completion_tokens) * daily_requests * 30
             / 1_000_000 * price_per_mtok
```

This is not sophisticated modelling — it is the minimum calculation that prevents a 10× traffic spike from becoming a budget surprise. The Phase 11 · 14 MCP lesson covers how context-window management affects token count; that lesson's output feeds directly into this calculation.

### The re-evaluation trigger pattern

The single most-skipped section of an AI ADR is the trigger conditions. Without them, decisions remain "accepted" indefinitely because no one owns the review. Four standard trigger categories:

1. **Cost trigger.** Monthly spend exceeds ceiling, or provider changes price by more than the documented threshold (commonly 20–30%).
2. **Capability trigger.** A new model on the efficient tier reaches the benchmark score the team measured at selection time (motivating a downgrade that saves cost with no quality regression).
3. **Compliance trigger.** Vendor adds or removes a residency region, changes training-data opt-out policy, or is named in a regulatory finding relevant to the use case.
4. **Deprecation trigger.** Provider announces end-of-life for the model version used. Lead time for enterprise providers is typically 6–12 months; the ADR should record the EOL date at selection time.

Phase 14 · 36 (scope contracts) covers the analogous pattern for agent capability boundaries — the same "trigger → re-evaluate → update" loop applies here at the architecture level.

### Registering decisions across a portfolio

A single ADR is a document. A register of ADRs across a product portfolio is a governance tool. The minimal register has five columns per decision:

| ADR id | Decision summary | Status | Owner | Next review |
|---|---|---|---|---|
| AI-ADR-001 | Sonnet 4.x for document classification | Accepted | Platform team | 2026-09-01 |
| AI-ADR-002 | Dedicated throughput for PII-adjacent data | Accepted | Security architect | 2027-01-01 |
| AI-ADR-003 | On-prem Llama 4 for air-gapped legal review | Proposed | AI lead | 2026-07-15 |

A register in this form makes the portfolio auditable: a compliance officer can read which data touched which vendor, and when that decision was last reviewed. It also makes portfolio-level cost governance possible — summing the cost projections across all accepted ADRs gives a budget floor, which is useful input to annual planning.

The MCP lesson (Phase 11 · 14) established that tool-call boundaries are a form of scope contract. An AI ADR for an MCP-based system should record the MCP server endpoints used, the data classification of what flows through each, and the vendor for each server — because a third-party MCP server is a vendor relationship even if it looks like a library.

## Use It

`code/main.py` is a deterministic, stdlib-only model of two decisions this lesson covers:

1. An **ADR validator** that checks a candidate ADR dict for completeness — required fields, trigger conditions, cost projection, and owner — and returns a structured gap report.
2. A **portfolio register simulator** that maintains a list of AI ADRs, flags overdue reviews, and prints a cost-governance summary (total projected monthly spend across accepted decisions).

No network, no model calls. The goal is to make the *governance policy* explicit and runnable, so engineers can wire it into a CI check or a pre-merge hook.

## Ship It

`outputs/skill-ai-adr-governance.md` is a one-page decision aid: a fill-in-the-blank AI ADR template, a trigger-condition checklist, and a cost-projection formula. Paste it into a new Confluence page or a `/docs/adr/` directory and start the first decision record.

## Exercises

1. Run `code/main.py`. Which sample ADR fails validation, and which field is missing? Add that field to the dict literal in the source and re-run to confirm it passes.

2. The portfolio summary prints a total projected monthly cost. Change the daily request volume for one ADR to 50,000 and re-run. What does the new total cost tell you about which tier decision is the highest-leverage review target?

3. Write a one-paragraph AI ADR for a model choice you have made or seen made in your current project. Include at least one trigger condition. Compare it to the template in `outputs/skill-ai-adr-governance.md` — what field did you omit first?

4. The concept section lists four trigger categories. Identify a real model or vendor change from the past 12 months (a price change, deprecation announcement, or residency update) and describe which ADR trigger it would have fired, and what the documented response would have been.

5. Phase 11 · 14 (MCP) introduces tool-call boundaries between systems. An MCP server at your company routes to an external AI vendor. Sketch the AI ADR for that server: what fields differ from a direct model-API ADR, and what new compliance question appears?

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| ADR | "Architecture doc" | Architecture Decision Record: a structured log of one decision, its context, alternatives, and consequences |
| Trigger condition | "When to revisit" | A specific, measurable event that mandates re-evaluating an accepted decision |
| Dedicated throughput | "Reserved capacity" | An inference endpoint where your traffic is isolated from other tenants; stronger data-boundary guarantees, higher cost |
| Behavioral drift | "The model changed" | Observable shift in model outputs across an API update at the same endpoint, without a version change in the caller |
| Data residency | "Where data lives" | Regulatory or contractual constraint specifying the geography where data may be stored and processed |
| Model tier | "Which model" | A capability-and-cost bracket (frontier reasoning / frontier general / efficient / self-hosted) used to reason about substitutability |
| Cost ceiling | "Budget line" | A documented monthly-spend threshold above which the current model choice must be re-evaluated |
| Portfolio register | "Decision log" | A centralized list of all active AI ADRs with status, owner, and next-review date |

## Consultant field notes

Five patterns a senior consultant sees across engagements — the shapes that recur regardless of model, vendor, or industry.

- **The prompt that worked in the demo but failed in production.** A small, hand-tuned prompt shipped beautifully in a 50-row evaluation; the same prompt degraded once it met real user phrasing, which is messier, multilingual, and adversarial. The decision an ADR should have recorded was not the prompt — it was the evaluation set. Without a frozen eval, "the model works" is unfalsifiable.
- **The RAG that returned the right doc but the wrong paragraph.** The retriever hit the right source; the chunker split across a table, a list, and a sentence that contradicted the answer. The architecture looked correct in the diagram. Lesson: ADRs must record chunking and retrieval policy alongside the model choice, because the model was rarely the bottleneck.
- **The vendor pilot that never made it past the security review.** A two-week proof-of-value produced a working integration, then stalled in legal and infosec for six months. The ADR was written after the pilot, not before — and the security boundary had no documented owner. Lesson: the ADR must exist before the pilot, with at least the data classification named, or the pilot is sunk cost.
- **The use case everyone approved but nobody wanted.** A steering committee signed off on a high-value use case; the end users routed around it within a quarter. There was no ADR for the rollout, no owner for adoption, and no measurement of whether the feature was used. Lesson: an ADR without an adoption owner is a procurement document, not a governance document.
- **The AI feature that hit a cost ceiling in month two.** Volume was underestimated in the cost projection — typically because the prototype volume, not production volume, was used. The ADR's cost ceiling fired exactly as designed, but the team had no cheaper tier benchmarked and no migration plan. Lesson: every ADR must record the cheaper fallback model, not just the chosen one.

## Further Reading

- [Documenting Architecture Decisions — Michael Nygard (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — the original ADR post; the template this lesson extends.
- [adr.github.io](https://adr.github.io) — the open-source ADR tooling hub; `adr-tools`, schema formats, and community extensions.
- [Anthropic — Model deprecations and versioning](https://docs.claude.com/en/api/versioning) — Anthropic's versioning policy and model lifecycle timelines.
- [EU AI Act — Official text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — the regulation that makes AI decision traceability a legal obligation for high-risk systems in the EU.
- [NIST AI Risk Management Framework (AI RMF 1.0)](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) — the US federal framework for AI governance; Govern and Map functions align directly with the ADR practice described here.
