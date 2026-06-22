# AI Risk Management: Owners, Controls, and Audit Evidence (2026)

> In 2026, the EU AI Act's General-Purpose AI (GPAI) obligations are in force, and the first wave of enterprise AI governance audits has surfaced a consistent finding: teams that deployed LLMs in 2024-2025 cannot demonstrate *who owned the risk* when a model output caused a material business error. Ownership ambiguity — not model capability — is the dominant control failure. NIST AI RMF 1.0 and ISO 42001:2023 both treat "risk ownership" as a non-negotiable first step before any technical control. The practical gap is that most software engineers know how to ship AI features but have never written a risk register entry, classified a model output by consequence level, or issued a policy exception with audit evidence. This lesson closes that gap.

**Type:** Learn
**Languages:** Python (stdlib — risk classifier + control gap analyzer)
**Prerequisites:** Phase 11 · 29 (Decision-making with AI), Phase 17 · 25 (Security and secrets audit)
**Time:** ~45 minutes

## The Problem

A consulting team ships a contract-summary feature backed by claude-sonnet-4-5. Six months later, a lawyer flags that the model dropped a termination clause from one summary. The incident review asks: who approved deploying this model for legal text? What was the stated risk level? What human review step was required before the summary left the system? No one can answer any of the three questions. The feature is correct 99.1% of the time; the 0.9% failure cost six figures.

The engineering question is not "how do we get to 100%." It is: **for a given AI output, which consequence level does it occupy, who is the named owner of that risk, what control operates at that level, and what evidence proves the control ran?** Without those four answers, the AI system is unauditable — and an unauditable system cannot satisfy GPAI transparency obligations, ISO 42001 clause 6.1, or a client's security questionnaire. The consequence is not theoretical: procurement teams in regulated industries now routinely reject AI features that cannot produce a controls evidence package.

## The Concept

### Consequence levels and the ownership map

Every AI output belongs to exactly one consequence level. The level determines the minimum human-review gate, the required audit trail, and who can sign a policy exception.

| Level | Description | Example output | Min review gate | Exception authority |
|---|---|---|---|---|
| **L0 — Informational** | No action taken without further human decision; decorative or exploratory | Suggested search tags, content summaries for internal notes | None required | Team lead |
| **L1 — Operational** | Drives a repeatable internal workflow; reversible if caught within 24 h | Draft email to a client, generated test cases, ticket classification | Async spot-check (>5% sample) | Chapter / practice lead |
| **L2 — Consequential** | Influences an external-facing or financial decision; not trivially reversible | Contract clause extraction, cost estimates, compliance flag | Synchronous human review before delivery | Domain SME |
| **L3 — High-stakes** | Irreversible or safety-adjacent; regulatory or legal exposure if wrong | Medical triage, legal document, AML alert, code deployed to production | Named human sign-off + documented rationale | VP / Risk owner |

The mapping is not the model's job. It is the product team's job, done once per output type at design time, not at runtime. A model that decides its own consequence level provides no governance value.

### The four required control elements

NIST AI RMF GOVERN 1.1 and ISO 42001 clause 6.1.2 share a common structure. For each AI use case, you need:

1. **Named risk owner** — a person (not a team, not a role, not "the AI team") accountable for the consequence level and the adequacy of the control. The owner signs policy exceptions. They are in the audit trail.
2. **Stated control** — the specific gate that reduces the risk to accepted residual. Examples: "a certified analyst reviews every L2 output before it leaves the system," "100% of L3 outputs require written rationale in the ticket." Vague controls ("we have human oversight") do not satisfy ISO 42001 clause 8.4.
3. **Evidence artifact** — proof that the control ran: a review timestamp + reviewer ID, a signed-off ticket, a quality-gate log entry. If the evidence is not machine-readable and queryable, the auditor will treat the control as unevidenced.
4. **Policy exception record** — when the team accepts a risk above the normal threshold (faster review cadence, no synchronous gate at L2), a written exception must exist naming the owner, the justification, the residual risk acknowledgment, and an expiry date. Policy exceptions without expiry dates silently become permanent — one of the most common findings in AI governance audits.

### Where the standards converge

Three frameworks are active in enterprise AI governance in 2026. Knowing which one your client or employer uses saves time in a controls review:

| Framework | Primary use | Risk classification | Audit mechanism |
|---|---|---|---|
| **NIST AI RMF 1.0** | US federal / US-regulated | Four functions: GOVERN, MAP, MEASURE, MANAGE | Profile-based; organization defines evidence | 
| **ISO 42001:2023** | International / EU supply chain | Clause 6.1 risk assessment; Annex B controls | Formal management system; third-party certification possible |
| **EU AI Act (GPAI)** | EU market / GPAI model providers | Risk categories: prohibited, high-risk, GPAI | Transparency obligations; conformity assessment for high-risk |

For most consulting work, you will encounter all three simultaneously: a German bank subject to GPAI obligations, building on a US-hosted model provider that follows NIST RMF, seeking ISO 42001 certification for their AI management system. The control structure above satisfies all three, because all three require ownership, stated controls, and evidence — they differ only in terminology and audit formality.

### Model selection and risk level

Model choice is itself a risk control parameter, not only a performance parameter. In 2026, the choice set is concrete:

- **claude-haiku-4-5** — low latency, lower cost; appropriate for L0-L1 tasks where spot-check review suffices.
- **claude-sonnet-4-5 / claude-sonnet-4-6** — balanced capability; appropriate for L1-L2 tasks where synchronous review is available.
- **claude-opus-4 / fable-5** — highest capability; appropriate for L2-L3 tasks where accuracy improvement justifies cost and the review gate is already required.

Deploying a lower-capability model on an L3 task without increasing the review gate is a policy exception that requires a named owner and a written justification. The model's benchmark score is not a substitute for a risk classification. Phase 11 · 29 covers how to frame model selection as a decision under uncertainty; this lesson adds the governance wrapper that makes that decision auditable.

### Policy exceptions: the audit trap

The most common control finding is not "no controls exist" — it is "controls exist on paper, exceptions were taken in practice, exceptions were never documented." The lifecycle of a policy exception must be:

1. **Identify the deviation** — name exactly which control is being relaxed and why (time pressure, model confidence above threshold, cost constraint).
2. **Assess residual risk** — if the normal control were in place, what would it catch? What is the probability and consequence of a miss at this frequency without it?
3. **Name an owner** — who accepts this residual risk on behalf of the organization? Their name, not their team.
4. **Set an expiry** — a date by which the exception is reviewed or expires. Six months is a common default; three months for L2 exceptions.
5. **Log it** — in a queryable system (not a chat thread, not a shared doc with edit history off).

This is covered explicitly in Phase 17 · 25 (security and secrets audit) in the context of technical secrets management. The same structure applies here to AI output risk.

### Reading an audit evidence package

When a client or internal auditor asks for evidence that controls ran, the response must include:

- The consequence level classification for the output type (not per-output, per type).
- The named risk owner (person, title, date of assignment).
- The stated control description.
- A sample of evidence artifacts (review logs, sign-off tickets, quality-gate records) covering the audit period.
- Any policy exceptions active during the period, including expiry dates and owners.

A table is not evidence. A table *describing* where evidence lives and how to retrieve it is the minimum acceptable response. Actual retrieval on demand is what an auditor will ask for.

## Use It

`code/main.py` models the two decisions this lesson makes explicit:

1. A **consequence classifier** that takes an output-type description and routes it to L0-L3 using a deterministic rule set, showing which attribute triggered the classification.
2. A **control gap analyzer** that takes a use-case record (owner, control, evidence type, any exceptions) and identifies which of the four required elements are missing or deficient — including detecting open-ended exceptions with no expiry date.

No LLM calls, no network — the point is to make the governance policy runnable and inspectable, the same way Phase 15 · 10 made the permission classifier runnable.

## Ship It

`outputs/skill-ai-risk-controls-checklist.md` is a one-page, paste-and-use decision aid for a working consultant or engineer: classify an output type, identify the required control, check that the four elements exist, and produce the minimum viable evidence package. Bring it to a client kickoff or a pre-deployment review.

## Exercises

1. Run `code/main.py`. Which output type in the sample set classifies at L3? What single attribute triggered the upgrade from L2? Change that attribute in the code and verify the output drops to L2.

2. The control gap analyzer flags one use-case record as having a policy exception with no expiry date. Find it. Write a corrected exception record (in plain text) that would pass the analyzer.

3. Your team is deploying a claude-sonnet-4-6 feature that extracts action items from meeting transcripts and adds them to a project tracker. Classify the output type using the L0-L3 table. What is the minimum review gate? Who in your organization would be the named risk owner?

4. A client operating under ISO 42001:2023 asks for your AI feature's "risk treatment record." Using the four required control elements from this lesson, draft the record for one output type you work with. What evidence artifact would you point the auditor to?

5. Run `code/main.py` and read the HEADLINE output. The analyzer prints a summary of gap counts by category. Add a fifth sample use case to the `SAMPLE_CASES` list in the code — one that has all four elements correct and an exception that is still within its expiry window. Verify the analyzer reports zero gaps for it.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Consequence level | "Risk rating" | A fixed classification (L0-L3) assigned to an output *type* at design time, not per inference |
| Named risk owner | "The AI team owns it" | A single person — not a team — accountable for the control and authorized to sign exceptions |
| Policy exception | "We'll do it this way for now" | A written, expiry-dated record of a deviation from the stated control, with residual risk acknowledged |
| Audit evidence | "We have oversight" | A machine-queryable artifact proving the control ran: timestamp, reviewer ID, sign-off ticket |
| NIST AI RMF | "The US framework" | GOVERN / MAP / MEASURE / MANAGE functions for organizational AI risk management (v1.0, 2023) |
| ISO 42001 | "The AI management standard" | International management system standard for AI; clause 6.1 covers risk assessment and treatment |
| GPAI obligation | "EU AI Act rules" | Transparency and documentation requirements for providers of General-Purpose AI models in the EU market |
| Residual risk | "What's left after controls" | The risk that remains after a control runs; must be explicitly accepted by the named owner |

## Further Reading

- [NIST AI Risk Management Framework 1.0](https://airc.nist.gov/) — the GOVERN, MAP, MEASURE, MANAGE functions; profiles and playbooks.
- [ISO 42001:2023 overview (ISO.org)](https://www.iso.org/standard/81230.html) — the AI management system standard; clause 6.1 and Annex B controls.
- [EU AI Act — official text (EUR-Lex)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — GPAI obligations in Title VIII; high-risk system requirements in Title III.
- [Anthropic — Claude usage policies](https://www.anthropic.com/aup) — the model provider's own risk classification (prohibited, restricted, allowed with conditions); useful input to your consequence level mapping.
- [ENISA — AI Cybersecurity Risks (2024)](https://www.enisa.europa.eu/) — threat landscape for AI systems; maps cleanly to the control-gap categories in this lesson.
