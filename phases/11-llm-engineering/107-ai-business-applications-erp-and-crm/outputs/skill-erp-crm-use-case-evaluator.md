# ERP/CRM AI Use-Case Evaluator

One-page decision aid for Technology Consulting engagements. Fill in during or immediately after the scoping workshop. Produce one grid per candidate use case.

---

## Step 1 — Describe the use case

| Field | Value |
|---|---|
| Use-case name | |
| Business capability | |
| Sponsoring business unit | |
| Target platform(s) | |
| Proposed go-live | |

---

## Step 2 — Identify the platforms and data

**Platforms touched** (tick all that apply):

- [ ] SAP S/4HANA Cloud
- [ ] SAP SuccessFactors
- [ ] SAP BTP / AI Core
- [ ] Salesforce Sales/Service Cloud (core CRM)
- [ ] Salesforce Data Cloud
- [ ] Salesforce Agentforce (autonomous agent tier)
- [ ] Microsoft Dynamics 365 Finance/Operations
- [ ] Microsoft Dynamics 365 CE (Sales/Service)
- [ ] Copilot Studio / Azure OpenAI
- [ ] External LLM endpoint (non-platform)
- [ ] Other: _______________

**Data types involved** (tick all that apply):

- [ ] Operational / transactional (non-sensitive)
- [ ] PII (names, contact data, identifiers)
- [ ] Financial / accounting records
- [ ] HR / employee data
- [ ] Legally privileged (contracts, legal advice)
- [ ] Export-controlled / trade compliance

---

## Step 3 — Classify the integration pattern

Pick exactly one. If the use case spans multiple patterns across its phases, evaluate the highest-tier pattern.

| Pattern | Description | Select |
|---|---|---|
| Read + Summarize | LLM reads data, produces human-readable output. No writes. | [ ] |
| Read + Recommend | LLM produces a recommendation; a human takes action. | [ ] |
| Write-back (user-confirmed) | LLM proposes; human reviews and commits the write. | [ ] |
| Autonomous (bounded workflow) | Agent executes a predefined workflow step; no per-step human review. | [ ] |
| Autonomous (open-ended) | Agent selects actions dynamically; write access to live records. | [ ] |

---

## Step 4 — Evaluate the four axes

Complete one row per axis. Use G/A/R and write the specific reason in the notes column.

| Axis | Status (G/A/R) | Notes / blocking reason |
|---|---|---|
| **System boundary** | | How many platforms? Same vendor? Cross-vendor integration contract needed? |
| **Data ownership** | | Is the data owner named? Are there multiple data domains? |
| **Integration pattern** | | Which tier (see Step 3)? What approval level is required? |
| **Compliance** | | Any sensitive data types? Is the data residency contract confirmed for this scope? |

**RAG guide:**

| Axis | Green | Amber | Red |
|---|---|---|---|
| System boundary | Single platform | Two platforms, same vendor | Three+ platforms or cross-vendor |
| Data ownership | Owner confirmed, single domain | Owner confirmed, multiple domains | Owner not confirmed |
| Integration pattern | Read-only (summarize or recommend) | Write-back confirmed or autonomous bounded | Autonomous open-ended |
| Compliance | No sensitive types | Sensitive types, residency confirmed | Sensitive types, residency not confirmed |

---

## Step 5 — Overall readiness call

| Readiness | Criteria | Next step |
|---|---|---|
| **READY** | All four axes Green | Proceed to solution design |
| **CONDITIONAL** | Any Amber, no Red | Document named mitigations; re-evaluate when mitigations are in place |
| **BLOCKED** | Any Red | Redesign use case or park; do not proceed to design |

**Overall readiness:** [ ] READY  [ ] CONDITIONAL  [ ] BLOCKED

**Blocking / conditional axis(es):**

**Named mitigations (for Amber axes):**

---

## Platform-specific flags

Check these before finalising the readiness call.

**SAP:**
- [ ] Is the use case accessing data through SAP Joule / Business AI, or does it need direct ABAP access? (Direct ABAP = custom OData/BAPI required — add to integration scope.)
- [ ] Is AI Core the target hosting layer? Confirm BTP subaccount data residency region matches contract.
- [ ] Does the use case cross module boundaries (e.g., FI + MM + HR)? Cross-module = multiple data owner sign-offs required.

**Salesforce:**
- [ ] Is the use case using Agentforce autonomous agents or Einstein Copilot (read + draft)? Autonomous agents = elevated change tier.
- [ ] Does the use case require Salesforce Data Cloud? Confirm Data Cloud license and data mapping scope.
- [ ] Is any LLM call routing outside Salesforce Shield? If yes, external DPA required.

**Microsoft Dynamics 365 / Copilot Studio:**
- [ ] Is the use case reading Finance and Operations data? Confirm Dataverse link configuration for F&O — separate from CE apps.
- [ ] Are premium connectors required? Confirm Copilot Studio premium licensing.
- [ ] Is the Azure OpenAI endpoint in the same Azure tenancy as Dataverse? If not, treat as external LLM routing.

---

## Approver checklist by integration pattern

| Pattern | Functional owner | IT/architecture | Data owner | Compliance | Executive |
|---|---|---|---|---|---|
| Read + Summarize | Required | Recommended | Recommended | Recommended | — |
| Read + Recommend | Required | Required | Required | Required | — |
| Write-back (confirmed) | Required | Required | Required | Required | — |
| Autonomous (bounded) | Required | Required | Required | Required | Recommended |
| Autonomous (open-ended) | Required | Required | Required | Required | Required |

---

## Re-evaluation trigger

Re-run this grid (do not inherit the previous result) when any of the following change during delivery:

- Integration pattern tier increases (e.g., pilot was read-only, production adds write-back)
- A new platform is added to the use case
- Data types change (e.g., operational data during design, PII confirmed in data mapping)
- Data residency contract is amended

**Evaluated by:** ________________  **Date:** ________________  **Use-case version:** ________________
