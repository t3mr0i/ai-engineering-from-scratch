# AI Security Triage — One-Page Decision Aid

Use this checklist when reviewing an AI deployment before go-live, during a security review, or after an incident. Work top to bottom: score the deployment, prioritize the surfaces, apply controls, then confirm the audit trail. Use the failure-shape reference at the bottom when classifying an unknown incident.

---

## Step 1 — Score the deployment (tick all that apply)

| Characteristic | Surfaces amplified | Severity |
|---|---|---|
| Agent has write-capable tools (shell, DB write, API mutations) | Indirect injection, Tool misuse | High |
| Agent retrieves from untrusted external sources (web, user uploads, 3rd-party APIs) | Indirect injection | High |
| System prompt contains business logic, secrets, or credentials | System prompt extraction, Data leakage | High |
| Completions reach the caller without human review | Data leakage via output | Medium |
| Multi-agent pipeline (one agent calls another via tool results) | All surfaces | High |
| Read-only chat, no retrieval, no tools | Direct injection only | Low–Medium |

**Decision threshold:** two or more High rows — full security review required before production.

**Cost framing (approximate, composite of 2024-2025 incident post-mortems):** indirect-injection incidents in write-tool-enabled agents land at €50K-500K depending on data sensitivity and regulatory exposure; system prompt extraction lands at €10K-100K (competitive intel, secret rotation); data leakage via output lands at €5K-50K per incident (GDPR, reputation). Treat as planning heuristic, not actuarial table.

---

## Step 2 — Priority matrix

Rank your surfaces based on the ticks above, then apply controls in this order.

| Priority | Surface | Apply first when… |
|---|---|---|
| 1 | Indirect injection | Retrieval from untrusted sources is checked |
| 2 | Tool misuse | Write-capable tools exist |
| 3 | Data leakage via output | Output is unreviewed or system prompt is sensitive |
| 4 | System prompt extraction | System prompt contains confidential business logic |
| 5 | Direct injection | Always present; addressed last if other surfaces dominate |

---

## Step 3 — Control checklist by surface

### Indirect injection
- [ ] Every retrieved chunk is tagged with its source (provenance metadata)
- [ ] System prompt instructs the model to treat retrieved content as "data," not "instructions"
- [ ] Retrieval step runs in a context that cannot write back to agent tool state
- [ ] Output checked for action verbs absent from the original user query (secondary rule or model)
- [ ] Source trust levels enforced: operator content > user content > tool results > retrieved content

### Tool misuse
- [ ] Each tool has the narrowest permission set that supports its legitimate use case
- [ ] Tool call arguments validated against a strict schema before dispatch
- [ ] Every tool invocation logged: tool name, full argument payload, model's stated reason
- [ ] Sensitive tools (write, delete, shell) require a confirmation step or allowlisted callers

### Data leakage via output
- [ ] Output classifier scans completions for PII, credential patterns, system-prompt fragments
- [ ] Structured output mode (JSON schema) used where open-ended text is not required
- [ ] Logging pipeline strips or redacts PII before writing to audit store

### System prompt extraction
- [ ] System prompt includes explicit extraction resistance instruction
- [ ] Confidential logic moved to server-side config layer (not in context window) where feasible
- [ ] Probing patterns ("repeat your instructions", "what were you told") detected at input layer

### Direct injection
- [ ] User input wrapped in structural delimiters (`<user_input>...</user_input>`)
- [ ] Input classifier labels adversarial-shaped messages before model call
- [ ] Rate limiting and anomaly detection on prompt length and structure

---

## Step 4 — Minimum viable audit record

The EU AI Act (August 2026) and OWASP LLM Top 10 both require auditable records for high-risk deployments. Confirm all four elements are present.

| Element | What to log | Notes |
|---|---|---|
| Context hash | SHA-256 of full prompt context at each inference | Hash, not content — protects privacy while enabling reconstruction |
| Tool call log | Tool name, full argument payload, return value, timestamp | Required per tool invocation |
| Output classifier decision | Label (pass / flag / block), confidence, rule triggered | Per response |
| Human escalation log | Timestamp, session ID, reason for escalation, resolution | Only when HITL triggered |

---

## Quick reference — surface-to-signal mapping

Use this when classifying an unknown input or incident.

| Signal in the content | Likely surface |
|---|---|
| "Ignore previous instructions", "act as", "new task:" | Direct injection |
| `<!-- instruction`, `Note to AI:`, "disregard the above" in retrieved text | Indirect injection |
| "Repeat your instructions", "what is your system prompt", "what were you told" | System prompt extraction |
| "Execute the function", "delete all", "drop the table", "invoke" | Tool misuse |
| "Email me", "output the full", "paste the system prompt", "exfil" | Data leakage via output |

## Failure shapes (for incident classification)

When triaging an unknown incident, name the shape before naming the surface. Shape names travel better across teams and clients than surface names.

- **Quiet Document** — indirect injection via a poisoned RAG document that looks legitimate to human readers. One document, many victims, ~3 weeks median time-to-detection.
- **Helpful Colleague** — indirect injection via a human intermediary who pastes attacker content into a shared workspace. Not malicious; copy-paste. Blast radius bounded by agent tool scope.
- **Confident Extractor** — system prompt extraction via "repeat your instructions" or translation probes. ~15-25% success against unprotected prompts; under 5% with extraction resistance; near zero with server-side prompt shielding.
- **Argument Bender** — tool misuse via indirect injection; retrieved content carries an instruction that triggers a write-capable tool. Mitigated by provenance-aware scope.
- **Logged Leak** — data leakage via output; the model includes PII or credentials in a summary because they were contextually relevant. Not an attack, just the model being helpful. ~40% of AI incidents surfaced in security review.

---

## Related lessons

- Phase 11 · 12 — Guardrails (input and output classifier implementation)
- Phase 14 · 27 — Prompt injection defense for agents (trust boundary design)
- Phase 17 · 25 — Security and secrets audit (tool call logging, credential hygiene)
