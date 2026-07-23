# AI Risk Management: Owners, Controls, and Audit Evidence (2026)

> In 2026, the EU AI Act's General-Purpose AI (GPAI) obligations are in force, and the first wave of enterprise AI governance audits has surfaced a consistent finding: teams that deployed LLMs in 2024-2025 cannot demonstrate *who owned the risk* when a model output caused a material business error. Ownership ambiguity — not model capability — is the dominant control failure. NIST AI RMF 1.0 and ISO 42001:2023 both treat "risk ownership" as a non-negotiable first step before any technical control. The practical gap is that most software engineers know how to ship AI features but have never written a risk register entry, classified a model output by consequence level, or issued a policy exception with audit evidence. This lesson closes that gap.

**Type:** Learn
**Languages:** Python (stdlib — risk classifier + control gap analyzer)
**Prerequisites:** Phase 11 · 29 (Decision-making with AI), Phase 17 · 25 (Security and secrets audit)
**Time:** ~45 minutes

## The Problem

A consulting team ships a contract-summary feature backed by claude-sonnet-4-5. Six months later, a lawyer flags that the model dropped a termination clause from one summary. The incident review asks: who approved deploying this model for legal text? What was the stated risk level? What human review step was required before the summary left the system? No one can answer any of the three questions. The feature is correct 99.1% of the time; the 0.9% failure cost six figures.

The engineering question is not "how do we get to 100%." It is: **for a given AI output, which consequence level does it occupy, who is the named owner of that risk, what control operates at that level, and what evidence proves the control ran?** Without those four answers, the AI system is unauditable — and an unauditable system cannot satisfy GPAI transparency obligations, ISO 42001 clause 6.1, or a client's security questionnaire. The consequence is not theoretical: procurement teams in regulated industries now routinely reject AI features that cannot produce a controls evidence package.

## Three named failure shapes (what we keep seeing in 2026 audits)

The pattern below is consistent enough across the engagements we review that it has earned names. Names are composites; no client is identified.

**Failure shape 1: the contract reviewer at an insurer.** A team classifies contract clause extraction as L1 ("the lawyer reviews the summary before it goes out") and ships it. In practice, the LLM summary is attached to a ticket and routed to a junior associate who clicks "looks fine" on roughly 80% of summaries within the same 24-hour window the LLM produced them — a confirmation bias loop, not a review. Three months in, a termination-for-convenience clause is silently dropped. The classification was correct; the *control* (a human review by a qualified reviewer before legal text leaves the system) was never actually operated. The audit finding is not "your classification is wrong" — it is "your evidence shows the control as defined did not run." The remediation is not "more L1 controls"; it is qualifying the reviewer, separating the review window from the model's output, and instrumenting the ticketing system so that the reviewer ID, the input summary, and the decision are jointly retrievable.

**Failure shape 2: the CRM RAG at a logistics firm.** A retrieval-augmented system suggests next-best-action prompts to a sales team. Classified L0 ("informational — humans always act on it"). No exception record, no expiry. Eighteen months later the system has been wired into the quote-creation workflow and is auto-populating pricing tier suggestions. Nobody re-classified. The original L0 risk register entry is still on file and is what the auditor reads. The control that *should* have been re-evaluated at the moment the output started driving a financial decision never was. This is the most common silent reclassification: same code, new consequence level, no governance change. The diagnostic is straightforward — list the *downstream decisions* each output feeds, not the systems it lives in. A pricing tier suggestion that pre-fills a quote form is not "informational" in any sense an L0 register covers.

**Failure shape 3: the prompt workshop at a public-sector team.** A two-day internal workshop produces forty prompt templates and a shared notion page titled "AI use cases." Every line in the notion page is a use case; none has an owner. When the external auditor asks for the risk register, the team sends the notion page. The auditor's first finding: "this is a backlog, not a register — there is no field for consequence level, no field for owner, no field for evidence type, no field for exception status." Forty entries, zero auditable rows. The control failure is not the prompts — it is the absence of a *schema* in the system-of-record. A register with a schema can be empty and still be auditable (the auditor can verify that no use cases have been deployed off-register); a backlog with rich prose and no schema cannot be audited at any volume.

The shared root cause across all three: the team treated governance as a documentation exercise rather than as a control *system*. The system is what the auditor inspects; the documentation is a side effect. A register that cannot answer "who owns this, what level is it, where is the evidence" for a random row in under sixty seconds is not a register — it is a write-only log.

A note on why this is showing up now. The EU AI Act's GPAI obligations became enforceable in 2025; the first round of third-party ISO 42001 audits for AI management systems is underway in 2026; and procurement security questionnaires in regulated verticals (banking, insurance, public sector) now ask for AI control evidence by name. A feature that ships without auditable controls can still be technically excellent and still be removed from a vendor shortlist — not because the model failed, but because no one can prove the controls that surround it ran. The downstream consequence is also asymmetric: the cost of producing a controls evidence package retroactively is roughly an order of magnitude higher than producing it at design time, because the evidence was never logged.

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

For most consulting work, you will encounter all three simultaneously: a German bank subject to GPAI obligations, building on a US-hosted model provider that follows NIST RMF, seeking ISO 42001 certification for their AI management system. The control structure above satisfies all three, because all three require ownership, stated controls, and evidence — they differ only in terminology and audit formality. The practical translation table: NIST's GOVERN function ≈ ISO 42001 clause 5 (leadership) and clause 6 (planning); NIST's MANAGE function ≈ ISO 42001 clause 8 (operation); EU AI Act Articles 9-15 for high-risk systems are the most prescriptive of the three and the place where a sloppy mapping will be caught.

### Model selection and risk level — quantified

Model choice is itself a risk control parameter, not only a performance parameter. The 2026 trade-off space is concrete enough to put numbers on (approximate, vendor list prices as of mid-2026; check current pricing before any bid):

| Model | Approx. cost per 1M input tokens | Approx. latency (p50, 4K context) | Fit for L-level |
|---|---|---|---|
| claude-haiku-4-5 | ~$1 | ~0.6 s | L0–L1 (latency- or cost-bound) |
| claude-sonnet-4-5 / 4-6 | ~$3 | ~1.4 s | L1–L2 |
| claude-opus-4 | ~$15 | ~3 s | L2–L3 |
| fable-5 (frontier) | ~$20–25 | ~4 s | L2–L3, highest-stakes |

The pattern in our experience: a 5–10x capability lift between haiku and opus on legal/financial extraction benchmarks translates to roughly 2–4x fewer human-review escalations on L2 work. Whether that pays for the 15x cost premium depends on the cost of the review step. For a 5-minute lawyer review at €80/hour, the break-even is ~6 hours of saved review per 1,000 inferences — achievable on most L2 workloads, not achievable on most L1 workloads. Deploying a lower-capability model on an L3 task without increasing the review gate is a policy exception that requires a named owner and a written justification. The model's benchmark score is not a substitute for a risk classification. Phase 11 · 29 covers how to frame model selection as a decision under uncertainty; this lesson adds the governance wrapper that makes that decision auditable.

### Policy exceptions: the audit trap

The most common control finding is not "no controls exist" — it is "controls exist on paper, exceptions were taken in practice, exceptions were never documented." The lifecycle of a policy exception must be:

1. **Identify the deviation** — name exactly which control is being relaxed and why (time pressure, model confidence above threshold, cost constraint).
2. **Assess residual risk** — if the normal control were in place, what would it catch? What is the probability and consequence of a miss at this frequency without it?
3. **Name an owner** — who accepts this residual risk on behalf of the organization? Their name, not their team.
4. **Set an expiry** — a date by which the exception is reviewed or expires. Six months is a common default; three months for L2 exceptions; never open-ended.
5. **Log it** — in a queryable system (not a chat thread, not a shared doc with edit history off).

In our 2026 audit-sample work, the median age of an "undated exception" — a documented deviation with no expiry — at the time the auditor flagged it was 11 months. Open-ended exceptions are not the same as exceptions that have been reviewed and renewed; they are exceptions that no one has been forced to re-justify. Practically, the easiest way to enforce an expiry is to make the register reject active exceptions older than 180 days (or 90 for L2) without a renewal entry — not because the renewal is the right answer, but because the renewal forces the conversation that *should* have happened at the start. This is covered explicitly in Phase 17 · 25 (security and secrets audit) in the context of technical secrets management. The same structure applies here to AI output risk.

### Reading an audit evidence package

When a client or internal auditor asks for evidence that controls ran, the response must include:

- The consequence level classification for the output type (not per-output, per type).
- The named risk owner (person, title, date of assignment).
- The stated control description.
- A sample of evidence artifacts (review logs, sign-off tickets, quality-gate records) covering the audit period.
- Any policy exceptions active during the period, including expiry dates and owners.

A table is not evidence. A table *describing* where evidence lives and how to retrieve it is the minimum acceptable response. Actual retrieval on demand is what an auditor will ask for.

### The reclassification trigger

A common engineering instinct is to treat the consequence level as a property of the *model*. It is not. It is a property of the *output's downstream effect on a decision*. Three events should force a re-classification review, regardless of whether the model has changed:

1. **A new downstream consumer.** A CRM RAG originally consumed only by a sales rep is now consumed by a quoting tool. Re-classify.
2. **A change in the data the output influences.** An extraction tool that used to feed an internal wiki now feeds a regulatory filing. Re-classify.
3. **A change in reversibility.** A test-case generator whose output is no longer reviewed before being merged into a regression suite. Re-classify.

The test is one question: *if this output were wrong, what decision would be made differently, and by whom, and how hard would it be to walk back?* If the answer to "how hard would it be to walk back" is "we'd have to re-run the customer's billing cycle" — that is an L2 minimum, regardless of the model's benchmark score.

### A working decision flow for a pre-deployment review

When you are reviewing a feature before it ships, walk it through the four questions in order. The order matters; each question presupposes the previous one has a real answer.

1. **What is the consequence level, and which attribute set it?** If you cannot name the attribute, you have not classified — you have guessed. Re-classify.
2. **Who is the named owner?** If the answer is a team, a role, or "the AI team," the feature is not ready. The owner must be a person, must be senior enough to sign an exception at the assigned L-level, and must be in the audit trail.
3. **What is the stated control, and can you retrieve evidence of it having run?** Walk the auditor through the query that retrieves the evidence before the auditor asks. If you cannot, the control is a posture, not a control.
4. **Are there any active exceptions, and are they within their expiry window?** Exceptions older than the window without renewal are findings waiting for the auditor.

In our experience, features that pass all four checks are *rare*. Most features pass one or two and fail the others. The fix is always the same shape: name the thing, attach a date, make it queryable. The cost of doing this at design time is minutes; the cost of doing it after an incident is weeks and a write-up.



## Further Reading

- [NIST AI Risk Management Framework 1.0](https://airc.nist.gov/) — the GOVERN, MAP, MEASURE, MANAGE functions; profiles and playbooks.
- [ISO 42001:2023 overview (ISO.org)](https://www.iso.org/standard/81230.html) — the AI management system standard; clause 6.1 and Annex B controls.
- [EU AI Act — official text (EUR-Lex)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — GPAI obligations in Title VIII; high-risk system requirements in Title III.
- [Anthropic — Claude usage policies](https://www.anthropic.com/aup) — the model provider's own risk classification (prohibited, restricted, allowed with conditions); useful input to your consequence level mapping.
- [ENISA — AI Cybersecurity Risks (2024)](https://www.enisa.europa.eu/) — threat landscape for AI systems; maps cleanly to the control-gap categories in this lesson.
