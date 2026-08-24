# Indirect Prompt Injection — Production Attack Surface

> Indirect prompt injection embeds instructions inside external content consumed by an agent. A [2026 survey](https://www.mdpi.com/2078-2489/17/1/54) synthesizes the threat and defense literature. [*The Attacker Moves Second*](https://arxiv.org/abs/2510.18108) evaluated 12 published defenses with adaptive attacks and reports attack-success rates above 90% against defenses that had appeared robust under non-adaptive evaluation. This is why keyword filters and one-shot red teams are insufficient evidence.

**Type:** Build
**Languages:** Python (stdlib, IPI attack + defense harness)
**Prerequisites:** Phase 18 · 12 (PAIR), Phase 14 (agent engineering)
**Time:** ~75 minutes

## Learning Objectives

- Define indirect prompt injection and describe three common delivery vectors.
- Explain why user-input filters miss IPI entirely.
- Describe the "information flow control" framing as the 2026 defense paradigm.
- State the finding of Nasr et al. (October 2025) on adaptive attack success against published IPI defenses.

## The Problem

Direct prompt injection requires the attacker to reach the user or their prompt. IPI requires neither: the attacker places a payload in any content the agent might read — a web page, an email in the inbox, a GitHub issue, a product review. The agent picks it up during normal operation and executes the instructions. The user is the messenger, not the intent.

## The Concept

### Three delivery vectors

- **Retrieval-augmented generation (RAG).** Attacker publishes a document; the retrieval step fetches it; the prompt concatenates it before the user question; the model executes the attacker's instructions.
- **Inbox / document workflows.** Attacker sends an email to the user; the agent reads emails; the prompt includes the email body; the model follows the email's instructions.
- **Tool output.** Attacker controls a tool the agent uses (e.g., a web search that returns an attacker-controlled result); the tool output contains instructions; the agent's control flow follows them.

The three share a structural property: the attacker controls a fragment of the prompt without touching the user-facing input.

### Why user-input filters miss it

An IPI payload does not appear in the user's input. It appears in the retrieved content. If the filter is gated on user input, the payload bypasses it. If the filter is gated on all content that reaches the model, it must apply to arbitrary retrieved text — which is expensive and produces false positives against legitimate content that happens to contain imperative-voice language.

### Information Flow Control (IFC) for AI

The 2026 defense paradigm borrows from classical OS security. Treat every content source as a security label. Label the user's query as "trusted." Label retrieved content as "untrusted." Treat the model's control flow as an information flow: actions triggered by untrusted content must be ratified by trusted input before execution.

CaMeL (Microsoft 2025), ConfAIde (Stanford 2024), and the NDSS 2026 IPI-defense paper operationalize IFC in different ways. The common principle: as long as code and data share the same context window, containment is the goal, not prevention.

### The Attacker Moves Second

[Nasr et al.](https://arxiv.org/abs/2510.18108) tested 12 published IPI defenses with adaptive gradient, reinforcement-learning, random-search, and human attacks. The paper reports attack-success rates above 90% against defenses that had originally appeared near-zero under their published evaluations.

The methodological lesson: publish a defense only with adaptive-attack evaluation. Static-attack benchmarks are not evidence of robustness; the attacker gets to know the defense.

### Real incidents

Lesson 25 covers EchoLeak (CVE-2025-32711, CVSS 9.3) — the first publicly documented zero-click IPI in Microsoft 365 Copilot. CamoLeak (CVSS 9.6) in GitHub Copilot Chat. CVE-2025-53773 in GitHub Copilot. Production deployments are being compromised by IPI in the field, not just in benchmarks.

### OWASP and NIST framing

OWASP LLM Top 10 (2025) ranks prompt injection (direct + indirect) as LLM01, the #1 application-layer threat. NIST AI SPD 2024 calls indirect prompt injection "generative AI's greatest security flaw."

### Where this fits in Phase 18

Lessons 12-14 are model-centric jailbreaks. Lesson 15 is the system-centric attack that dominates 2026 production deployments. Lesson 16 covers the defensive tooling. Lesson 25 covers the specific CVE narrative.



## Further Reading

- [MDPI Information 17(1):54 — Indirect Prompt Injection Survey (January 2026)](https://www.mdpi.com/2078-2489/17/1/54) — 2023-2025 synthesis
- [Nasr et al. — The Attacker Moves Second (joint OpenAI/Anthropic/DeepMind, October 2025)](https://arxiv.org/abs/2510.18108) — adaptive attack evaluation
- [Greshake et al. — Not what you've signed up for (arXiv:2302.12173)](https://arxiv.org/abs/2302.12173) — the original IPI paper
- [OWASP — LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) — prompt injection ranked LLM01
