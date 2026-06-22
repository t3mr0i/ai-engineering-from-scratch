# AI Security Threat Triage for Business Proposals (2026)

> The Gartner AI security incident index for 2025 logged 340 documented cases where AI-enabled products leaked sensitive data, were hijacked via prompt injection, or silently acquired permissions the business team never approved. The majority were discovered not in pen tests but in production — after customer data had moved. In 2026, almost every consulting engagement that touches AI will surface a proposal involving sensitive data, an external API, or user-supplied text routed into a model. The question is not whether those proposals carry risk; they do by design. The question is whether the business team can name the specific risk category before the project reaches an architecture review, because a triage done at ideation costs an hour and a triage done after three months of development costs a quarter.

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

## Use It

`code/main.py` implements the triage scorer as a deterministic, stdlib-only program. It defines a `UseCase` dataclass with a description and four optional keyword signals, a `score_category()` function that maps keyword presence to severity ratings, and a `triage()` function that applies the composite verdict logic. The driver runs three synthetic use cases — a benign internal analytics tool, a mid-risk document summariser, and a high-risk autonomous CRM agent — and prints a triage card for each, ending with a `HEADLINE:` summary that matches the claims in Exercise 1.

## Ship It

`outputs/skill-ai-threat-triage.md` is a one-page triage card template for working consultants and product engineers. It contains the four-category table, the severity rating guide, the composite verdict logic, and a blank triage card ready to fill in for any proposed use case. It is designed to be the first document produced in any AI feature discussion that involves real data or external systems.

## Exercises

1. Run `code/main.py`. Two of the three sample use cases trigger a `HARD STOP`. For each, identify the specific category and matched signal that caused the stop. Use case 1 produces `PROCEED WITH CONDITIONS` — which signal drove that verdict, and what condition does the triage card require before scoping continues?

2. The triage scorer flags "upload" and "user provides" as signals for untrusted input injection. Run the code and change the description of the document summariser so it removes those signals. Does the verdict change? What does this tell you about the limits of keyword-based triage?

3. Take an AI feature your team has discussed or is currently scoping. Write a one-paragraph use-case description and run it through the four-category scoring by hand (without the code). Which categories does it touch? Is the verdict `PROCEED`, `PROCEED WITH CONDITIONS`, or `HARD STOP`?

4. The OWASP LLM Top 10 item "Excessive Agency" maps to both external tool access and identity ambiguity in this triage model. Read the OWASP description at owasp.org/www-project-top-10-for-large-language-model-applications. Name one mitigation OWASP recommends that the triage card's conditions list should require for any `HIGH`-severity external tool access finding.

5. You present a triage card with a `HARD STOP` verdict to a product manager who responds: "We'll add input sanitisation and that fixes it." Using the language from the "Untrusted input injection" subsection above, explain in two sentences why that response does not clear the stop condition.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Threat triage | "A quick security check" | A structured, documented assessment of which LLM risk categories a use case touches, producing an auditable verdict before scoping continues |
| Prompt injection | "Hackers manipulate the AI" | Attacker-controlled text reaching a model prompt that redirects the model's behaviour; indirect injection arrives via documents or tool outputs, not direct user input |
| Excessive agency | "The AI has too many permissions" | OWASP LLM06: a model is granted more tool access, data access, or authority than the task requires, amplifying the blast radius of any failure |
| Sensitive data exposure | "PII leak" | Any model processing of data that is regulated, confidential, or commercially sensitive — broader than personal data alone |
| Identity ambiguity | "Acting on behalf of" | The model executes actions using a service credential that does not accurately represent the authorisation level of the human it claims to represent |
| HARD STOP | "We need security sign-off" | A triage verdict meaning no further scoping, prototyping, or stakeholder commitment may occur until a security architect clears the identified risk |
| Blast radius | "How bad could it be" | The maximum scope of damage if the identified risk is exploited: records affected, systems reachable, financial exposure |
| OWASP LLM Top 10 | "The AI security standard" | A community-maintained ranked list of the most critical security risks in LLM applications; current edition 2025 |

## Further Reading

- [OWASP LLM Top 10 (2025)](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — the canonical ranked list of LLM application security risks with technical descriptions and mitigations.
- [NIST AI Risk Management Framework (AI RMF 1.0)](https://airc.nist.gov/) — the US federal framework for AI risk governance; maps closely to the triage categories at an organisational level.
- [ISO/IEC 27001:2022 Annex A](https://www.iso.org/standard/82875.html) — information security controls standard; Annex A section A.5 covers information classification relevant to the sensitive data category.
- [Anthropic — Claude's approach to trust and safety](https://trust.anthropic.com/) — documentation on Anthropic's model-level controls, relevant when assessing which mitigations can be delegated to the model vs. which must be architectural.
- [PortSwigger Web Security Academy — Prompt Injection](https://portswigger.net/web-security/llm-attacks) — technical lab environment for understanding prompt injection attack shapes; recommended for technical team members reviewing the triage findings.
