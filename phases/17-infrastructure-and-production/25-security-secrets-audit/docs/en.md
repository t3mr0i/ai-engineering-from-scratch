# Security — Secrets, API Key Rotation, Audit Logs, Guardrails

> Eliminate secret sprawl via centralized vaults (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault). Never store credentials in config files, env files in VCS, spreadsheets. Use IAM roles over static keys; OIDC for CI/CD. The AI-gateway pattern is the 2026 solution: apps → gateway → model provider, with gateway pulling credentials from vault at runtime. Rotate in vault and all apps pick up in minutes — no redeploys, no Slack "who has the new key" messages. Rotation policy ≤90 days; scan with TruffleHog / GitGuardian / Gitleaks on every commit. Zero-trust: MFA, SSO, RBAC/ABAC, short-lived tokens, device posture. PII scrubbing uses entity recognition to mask PHI/PII before forwarding; consistent tokenization (Mesh approach) maps sensitive values to stable placeholders so the LLM preserves code/relationship semantics. Network egress: LLM services in dedicated VPC/VNet subnet whitelisting only `api.openai.com`, `api.anthropic.com` etc; block all other outbound. The 2026 incident driver: Vercel supply-chain attack via compromised CI/CD credentials exfiltrated env vars across thousands of customer deployments.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Learning Objectives

- Enumerate the four secret-management anti-patterns (config files in VCS, hardcoded env, spreadsheets, static keys) and name their replacements.
- Explain the AI-gateway-pulls-from-vault pattern as 2026 production standard.
- Implement a PII scrubber with consistent tokenization (same value → same placeholder) so semantics survive.
- Name the 2026 Vercel supply-chain incident and what it taught about CI/CD credential hygiene.

## The Problem

An intern commits `.env` with API keys. They delete it quickly. The keys are already in git history — GitGuardian scan catches it, your rotation process is "Slack the team, update 40 config files, redeploy all services." 8 hours later, half your services are live and half are waiting for deploy windows.

Separately, user prompts include "My SSN is 123-45-6789." Prompt goes to OpenAI. You have a BAA but your internal policy is to mask PII before forwarding. You didn't.

Separately, your EKS cluster's LLM pod can reach any internet host. Someone exfils data via DNS lookup to an attacker-controlled domain. Nothing blocked it.

Security for LLM services has to address all three vectors. Vault-backed credentials. PII scrubbing. Network egress filtering. Audit logs.

## The Concept

### Centralized vault + IAM-role pull

**Vault**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager. One source of truth.

**IAM role**: app/gateway authenticates via its IAM identity, not a static key. Vault returns the secret for the lifetime of the token.

**The AI-gateway pattern**: gateway pulls `OPENAI_API_KEY` from vault at request time. Rotate in vault; next request gets the new key. No redeploys.

### Rotation policy ≤ 90 days

All API keys, vault root tokens, CI/CD credentials. Automated rotation where possible. Manual rotation logged and tracked.

### Secret scanning

- **TruffleHog** — regex + entropy on commits.
- **GitGuardian** — commercial, high accuracy.
- **Gitleaks** — OSS, runs in CI.

Run on every commit. Block PR if new secret detected.

### Zero-trust posture

- MFA required on all accounts.
- SSO via SAML/OIDC.
- RBAC (role-based) or ABAC (attribute-based) for fine grained access.
- Short-lived tokens (hours, not days).
- Device posture — only corp devices with disk encryption.

### PII / PHI scrubbing

Before the prompt leaves your infra:

1. Entity recognition (spaCy NER, Presidio, commercial).
2. Mask matched entities: `"My SSN is 123-45-6789"` → `"My SSN is [SSN_TOKEN_A3F]"`.
3. Consistent tokenization (Mesh approach): same value maps to the same placeholder so the LLM preserves relationships.
4. Optional reverse mapping for LLM response.

Static regex filters catch basic patterns; NER catches more. Use both.

### Input + output guardrails

Input: block known jailbreaks, forbidden topics; rate-limit per-user.

Output: regex scrub for leaked secrets (API key patterns, email patterns in refusal contexts), classifier for policy violations.

### Network egress whitelist

LLM services in a dedicated subnet:
- Whitelist: `api.openai.com`, `api.anthropic.com`, vector DB endpoints, vault endpoints.
- Everything else: drop.
- DNS via allowlist-only resolver (avoid DNS-tunneling exfil).

### Audit log

Immutable log of every LLM call with:
- Timestamp.
- User / tenant.
- Prompt hash (not raw prompt for privacy).
- Model + version.
- Token counts.
- Cost.
- Response hash.
- Any guardrail trips.

Retain per regulatory requirement (SOC 2 1 year, HIPAA 6 years).

### The 2026 Vercel incident

Supply-chain attack: compromised CI/CD credentials exfiltrated env vars across thousands of customer deployments. Lesson: CI/CD credentials are prod-equivalent. Store in vault. Scope narrowly. Rotate aggressively.

### Numbers you should remember

- Rotation policy: ≤ 90 days.
- Scan on every commit: TruffleHog / GitGuardian / Gitleaks.
- Vercel 2026: CI/CD creds compromised → thousands of customer env vars leaked.
- Audit log retention: SOC 2 = 1 year, HIPAA = 6 years.



## Build It

Reconstruct **Security — Secrets, API Key Rotation, Audit Logs, Guardrails** by following `Scrubber` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `Scrubber` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-llm-security-plan.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Doppler — Advanced LLM Security](https://www.doppler.com/blog/advanced-llm-security)
- [Portkey — Manage LLM API keys with secret references](https://portkey.ai/blog/secret-references-ai-api-key-management/)
- [Datadog — LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [JumpServer — Secrets Management Best Practices 2026](https://www.jumpserver.com/blog/secret-management-best-practices-2026)
- [Microsoft Presidio](https://github.com/microsoft/presidio) — PII detection and anonymization.
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)

## Exercises

Work from the smallest fixture that the Security — Secrets, API Key Rotation, Audit Logs, Guardrails demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `Scrubber`, `scrub`, `AuditEntry`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Enumerate the four secret-management anti-patterns (config files in VCS, hardcoded env, spreadsheets, static keys) and name their replacements.**.
2. **Perturb one field.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Explain the AI-gateway-pulls-from-vault pattern as 2026 production standard.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Implement a PII scrubber with consistent tokenization (same value → same placeholder) so semantics survive.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-llm-security-plan.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Name the 2026 Vercel supply-chain incident and what it taught about CI/CD credential hygiene.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Security — Secrets, API Key Rotation, Audit Logs, Guardrails** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `Scrubber`, `scrub`, `AuditEntry` traced to the value or shape that supports **Enumerate the four secret-management anti-patterns (config files in VCS, hardcoded env, spreadsheets, static keys) and name their replacements.**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Explain the AI-gateway-pulls-from-vault pattern as 2026 production standard.**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Implement a PII scrubber with consistent tokenization (same value → same placeholder) so semantics survive.**; and
- an updated `outputs/skill-llm-security-plan.md` example with a concrete input, expected output field, and acceptance check tied to **Name the 2026 Vercel supply-chain incident and what it taught about CI/CD credential hygiene.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
