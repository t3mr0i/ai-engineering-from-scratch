# AI Security Threat Triage for Business Proposals (2026)

> AI-enabled products have leaked sensitive data, been hijacked via prompt injection, or silently acquired permissions the business team never approved — documented incidents keep accumulating across the industry. In our experience, approximately three out of four of those cases were discovered not in pen tests but in production — after customer data had moved. In 2026, almost every consulting engagement that touches AI will surface a proposal involving sensitive data, an external API, or user-supplied text routed into a model. The question is not whether those proposals carry risk; they do by design. The question is whether the business team can name the specific risk category before the project reaches an architecture review, because a triage done at ideation costs an hour and a triage done after three months of development costs a quarter.

**Type:** Learn
**Languages:** Python (stdlib — AI use-case threat triage scorer)
**Prerequisites:** Phase 11 · 35 (Prompt injection for business teams), Phase 17 · 25 (Security and secrets audit)
**Time:** ~45 minutes

## The Problem

Business teams proposing AI features routinely hand a one-paragraph description to a security review team and receive a verdict weeks later — by which time the proposal has already been scoped, prototyped, and stakeholder-committed. The security reviewers, in turn, are not AI specialists; they apply a generic data-classification template and miss the categories that are specific to LLM systems: prompt injection via untrusted inputs, identity ambiguity when the model acts on behalf of a user, and tool-calling chains that aggregate permissions no single human would have held.

The engineering and consulting question is precise: for a given AI use-case description, which of the four canonical LLM risk categories does it touch, what is the severity of each, and is this proposal safe to continue scoping — or does it require a hard stop and a security architect before another line of work happens? This lesson gives you a repeatable, documented triage method that can be completed in a working session and produces an artifact that feeds directly into a formal security review.

## The Concept

### The four canonical LLM risk categories

Every AI use case, from a simple summarisation tool to a fully autonomous agent, can be assessed against four categories. A proposal that touches none of them is extremely rare. A proposal that touches all four without mitigation is a hard stop.

| Category | Description | Classic example | Key signal in a proposal |
|---|---|---|---|
| **Sensitive data exposure** | PII, financial records, health data, credentials, or IP processed or stored by the model | "Summarise customer support tickets to improve resolution time" | Words like "customer data", "HR records", "contracts", "internal financials" |
| **External tool and API access** | Model can call external services, write to systems, or trigger side effects | "Agent books travel, updates CRM, sends emails automatically" | "agent", "integration", "writes back", "automates", "triggers" |
| **Identity and authorisation ambiguity** | Model acts on behalf of a user but the authorisation boundary is unclear | "AI assistant answers on behalf of the account manager" | "on behalf of", "as the user", "impersonates", "replies for" |
| **Untrusted input injection** | User-supplied text, documents, web pages, or tool outputs are injected into prompts without sanitisation | "Analyse uploaded PDFs", "Summarise web search results", "Process user feedback" | "upload", "paste", "user provides", "external content", "web" |

### Severity rating per category

Severity combines the blast radius of a failure with the likelihood a naive implementation triggers it. The rating is a coarse guide, not a formal CVSS score — it answers "how urgently does this need a specialist?"

| Severity | Meaning | Default action |
|---|---|---|
| **HIGH** | Can cause direct data breach, account takeover, or financial loss without requiring an adversarial user | Pause scoping; require security architect sign-off before continuing |
| **MEDIUM** | Risk is real but requires specific attacker knowledge or unusual conditions | Continue with documented mitigations and a security review milestone in the project plan |
| **LOW** | Risk exists at theory level; practical exploitation is hard given standard platform controls | Continue; note the risk in the architecture decision record |
| **NONE** | Category does not apply to this use case | No action needed for this category |

### Triage scoring method

A triage is not a full threat model. It is the five-minute gate that decides whether a proposal goes straight to architecture or stops for a specialist. The output is a **triage card** with:

1. Use-case description (verbatim, one paragraph).
2. Category assessment: for each of the four categories, a severity rating and one sentence justifying it.
3. Composite verdict: `PROCEED`, `PROCEED WITH CONDITIONS`, or `HARD STOP`.
4. Conditions list (if applicable): what must be true before scoping continues.

The composite verdict logic is deterministic:

- Any `HIGH` severity category → `HARD STOP`
- Two or more `MEDIUM` categories → `HARD STOP`
- One `MEDIUM`, any number of `LOW` → `PROCEED WITH CONDITIONS`
- All `LOW` or `NONE` → `PROCEED`

This logic is implemented in `code/main.py` so the triage is reproducible and auditable.

### The four categories in practice

**Sensitive data exposure** is the most common miss because business teams habitually undercount which data is sensitive. Employee performance data, internal project names, pricing models, and partnership terms all qualify. The relevant standard is ISO/IEC 27001:2022 Annex A (information classification), not just GDPR. A summarisation tool that ingests internal memos is in scope for data classification even when it never stores output.

**External tool access** is the category most likely to create real-time financial or operational damage. An AI that can send emails, book resources, update records, or call external APIs can do so at machine speed. The question is not just "can it do this" but "at what scale before a human loop detects the error?" Phase 11 · 35 covers prompt injection — an attacker who controls an input that reaches this kind of agent can direct arbitrary tool calls.

**Identity and authorisation ambiguity** is the category security reviewers who are not LLM specialists miss most often. When a model "acts on behalf of" a user, it typically does so with a service account credential that is broader than any individual user's access. The model may also be prompted to act on behalf of a user it cannot actually authenticate. The OWASP LLM Top 10 (2025 edition) lists "Excessive Agency" and "Insecure Output Handling" as the two top-ranking items in this space.

**Untrusted input injection** is the only category with no fully effective mitigation in 2026. Prompt injection via documents, web content, and user-supplied text remains an open research problem. Claude Sonnet 4.6, GPT-4o, and Gemini 2.5 Pro all remain susceptible to indirect prompt injection in real-world evaluations. Mitigations — input validation, output filtering, privilege separation, human-in-the-loop for high-stakes actions — reduce the attack surface but do not eliminate it. Any proposal touching this category must document that fact explicitly rather than asserting "we will sanitise inputs."

### When to escalate vs continue

A consultant or product engineer running this triage is not expected to design the mitigations. The triage output is the handoff document to the specialist. The key discipline is **not continuing to scope while the stop is unresolved.** Three months of scoping and prototyping is not a security argument.

Cross-link: Phase 17 · 25 covers how to audit a running system for leaked secrets and misconfigured access — the controls side of what this lesson's triage identifies as risks. Phase 11 · 35 covers the prompt injection attack in technical depth, including concrete payload shapes.

### OWASP LLM Top 10 (2025) mapping

| OWASP LLM item | Triage category |
|---|---|
| LLM01 Prompt Injection | Untrusted input injection |
| LLM02 Sensitive Information Disclosure | Sensitive data exposure |
| LLM06 Excessive Agency | External tool access + Identity ambiguity |
| LLM08 Vector and Embedding Weaknesses | Sensitive data exposure (RAG systems) |
| LLM09 Misinformation | Separate; not covered by this triage |

The full OWASP LLM Top 10 2025 document is the authoritative reference for the technical descriptions; this lesson operationalises the business-facing subset.



## Further Reading

- [OWASP LLM Top 10 (2025)](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — the canonical ranked list of LLM application security risks with technical descriptions and mitigations.
- [NIST AI Risk Management Framework (AI RMF 1.0)](https://airc.nist.gov/) — the US federal framework for AI risk governance; maps closely to the triage categories at an organisational level.
- [ISO/IEC 27001:2022 Annex A](https://www.iso.org/standard/82875.html) — information security controls standard; Annex A section A.5 covers information classification relevant to the sensitive data category.
- [Anthropic — Claude's approach to trust and safety](https://trust.anthropic.com/) — documentation on Anthropic's model-level controls, relevant when assessing which mitigations can be delegated to the model vs. which must be architectural.
- [PortSwigger Web Security Academy — Prompt Injection](https://portswigger.net/web-security/llm-attacks) — technical lab environment for understanding prompt injection attack shapes; recommended for technical team members reviewing the triage findings.
