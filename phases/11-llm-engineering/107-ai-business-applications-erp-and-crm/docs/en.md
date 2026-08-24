# AI Use-Case Evaluation in ERP and CRM Systems (2026)

> SAP and Salesforce together run the operational core of most large enterprises: order-to-cash, procure-to-pay, field service, and customer journeys. By 2026, both vendors have embedded LLM surfaces directly into these platforms — SAP Joule is generally available across S/4HANA Cloud, Salesforce Agentforce ships autonomous AI agents inside Sales and Service Cloud, and Microsoft 365 Copilot reaches Dynamics 365 workloads through the same Copilot Studio orchestration layer. The consequence is that a Technology Consulting engagement cannot treat AI as a separate initiative layered on top of these systems: the question is now where inside the ERP or CRM the AI surface sits, who owns the data it touches, and which system boundary it crosses. An AI use case that looks straightforward in isolation — "summarize this customer case" — turns out to share a data pipeline with a compliance-controlled ledger the moment you map the actual integration. Getting the system boundary and data ownership map right before a use case enters the backlog is the single highest-leverage analytical move in this space.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 50 (AI process analysis and automation design), Phase 11 · 24 (Use-case spotting and automation discovery)
**Time:** ~90 minutes

## Learning Objectives

- Explain the production problem addressed by AI Use-Case Evaluation in ERP and CRM Systems (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## The Problem

Most AI use-case evaluations for ERP and CRM programs fail at the boundary. A use case gets scoped in a workshop against a business capability ("reduce case handling time in Service Cloud"), moves into a business case, and only surfaces its real constraints when a solution architect maps the integration: the LLM needs to read order history from S/4HANA, but S/4HANA order records are GDPR-relevant, the data sits in a different tenant, and the proposed connector is not on the platform team's approved integration catalog. The use case is not wrong — the evaluation was incomplete. The project absorbs months of rework.

The opposite failure mode is excessive caution: a use case that would comfortably run inside a single platform, touching only process-owned data, gets parked in a security review queue because no one produced a clear, documented boundary map and data ownership classification. Both failures trace to the same gap: the AI evaluation treats the use case as a stand-alone AI artifact rather than as a node in a graph of systems, data owners, APIs, and compliance constraints. In ERP and CRM consulting, the craft is producing that graph before committing to implementation.

## The Concept

### The evaluation framework

AI use cases in enterprise systems have four independent assessment axes. All four must be green or explicitly risk-accepted before a use case enters design:

| Axis | What to evaluate | Common failure |
|---|---|---|
| **System boundary** | Which platforms does the use case touch? Cross-platform = cross-team contract | Assuming the same vendor means the same tenant or the same API surface |
| **Data ownership** | Who is the data controller for each input and output? | LLM output repopulates a field whose owner is a different business unit |
| **Integration pattern** | Read-only retrieval, write-back, or autonomous action? | Pilot is read-only; production requires write-back — re-evaluation skipped |
| **Compliance classification** | PII, financial data, legally privileged, export-controlled? | PII data routed through a foundation model API with no data-processing agreement |

The four axes are independent: a use case can have a single-system boundary and still fail on data ownership (two cost-center owners share the same ERP table). A use case with a clean compliance profile can still fail on integration pattern (autonomous write-back requires a different approval tier than read-only retrieval).

### Platform anatomy: SAP

SAP's AI layer in 2026 runs through **SAP Joule**, the conversational AI assistant embedded in S/4HANA Cloud and SuccessFactors. Joule's architecture is relevant to use-case evaluation:

- Joule connects to S/4HANA business data through the **SAP Business AI** foundation layer, not through direct ABAP function modules. A use case that needs custom business logic must expose that logic as an SAP BAPI or OData service — Joule does not traverse ABAP stacks directly.
- The **AI Core** service (BTP) is the hosting layer for custom models and RAG pipelines inside the SAP ecosystem. Enterprises that need domain-specific fine-tuning or retrieval over proprietary SAP data run those workloads in AI Core, not in an external cloud.
- **Data residency**: SAP BTP's AI Core is a multi-tenant service with regional data centers. Contracts must specify residency at the BTP subaccount level before any PII or financially sensitive data enters a Joule extension.
- Cross-system integration within SAP (e.g., a Joule use case that needs FI data and HR data) goes through the **SAP Integration Suite**, which imposes its own data-flow governance. A use case that sounds like a single query to a consultant is often two system-boundary crossings inside SAP's own landscape.

### Platform anatomy: Salesforce

Salesforce's AI layer in 2026 is **Agentforce**. Agentforce ships autonomous agents — distinct from Einstein Copilot, which was the 2024 conversational assistant. The distinction matters to consultants:

- **Einstein Copilot** (now a component inside Agentforce) answers questions and drafts content inside the Salesforce UI. It reads CRM data. Write-back is user-initiated.
- **Agentforce autonomous agents** execute multi-step tasks — routing cases, sending emails, updating records, booking meetings — with no user in the loop per step. This is a categorically different integration pattern: the agent holds a Salesforce credential and can commit writes at the frequency of the trigger, not the frequency of a human click.
- **Data Cloud** is Salesforce's unified data layer. A use case that needs customer journey context beyond what lives in the core CRM objects (Accounts, Cases, Opportunities) will require a Data Cloud license and a data mapping exercise. In our experience, the majority of Agentforce scoping workshops we observe start from a use-case sketch that quietly assumes Data Cloud is in the contract when it is not.
- **External LLM routing**: Agentforce can route to external LLMs via MuleSoft or the Apex HTTP callout pattern. Any external routing must be evaluated under the Salesforce Shield or equivalent contract and must confirm that customer data is not retained by the external model endpoint.

### Platform anatomy: Microsoft Dynamics 365 + Copilot Studio

Microsoft's enterprise AI story in 2026 converges through **Copilot Studio** — the same orchestration layer used to build custom Copilot extensions for Microsoft 365 also deploys agents into Dynamics 365 Sales, Customer Service, and Finance. The integration with Azure OpenAI Service is native: connectors route business data from Dataverse (the underlying data platform) to the model endpoint inside the same Azure tenancy, which simplifies data residency but does not eliminate it. Use cases must still verify:

- Which Dataverse environment the agent reads (Dev/Test/Prod is a separate environment in Dataverse — not just a flag).
- Whether the use case requires Copilot Studio premium connectors (licensed separately from the base Dynamics 365 SKU).
- Whether the agent's actions touch the **Finance and Operations** apps (formerly Dynamics 365 ERP): these have a separate Dataverse link configuration and separate data boundary from the CX-side apps.

### Integration patterns and their approval tiers

Not all AI use cases carry the same change-management weight. A clear typology prevents misalignment on scope during the engagement:

| Pattern | Definition | Typical approval tier |
|---|---|---|
| **Read + Summarize** | LLM reads structured/unstructured data, produces a human-readable summary. No system writes. | Standard change — functional stakeholder approval |
| **Read + Recommend** | LLM produces a recommendation surfaced to a human who acts. Decision remains human. | Standard change + data owner sign-off |
| **Write-back (user-confirmed)** | LLM proposes a field update; a human reviews and commits the write. | Elevated change — process owner + IT approval |
| **Autonomous action (within workflow)** | Agent executes a predefined workflow step (e.g., route a case, send a notification) without per-step human review, but within a bounded process scope. | Elevated change + compliance review |
| **Autonomous action (open-ended)** | Agent reasons about goals and selects actions dynamically. Write access to live business records. | Executive change + security review + data ethics sign-off |

Engagements that start with "Read + Summarize" frequently encounter scope creep toward "Autonomous action" when a business sponsor sees the demo. The classification must be re-evaluated when the integration pattern changes — it is not a one-time assessment.

### Data ownership in shared ERP landscapes

ERP systems are multi-tenanted by function: Finance owns the GL, Procurement owns PO records, HR owns employee master data, all in the same system. A use case that reads across these domains crosses data ownership boundaries even without crossing a system boundary. The relevant standard for mapping this is the **RACI-for-data** approach from data governance practice: for each data element the AI use case reads or writes, identify the Responsible party (the person accountable for data quality), the Accountable party (the business owner), and the compliance classification.

This maps directly to the work covered in Phase 11 · 50 (process decomposition and data flow tracing). The addition here is the AI-specific write path: an AI use case that writes back to an ERP field must have the data owner of that field as an approver, not just the IT integration team. In SAP landscapes this often means involving the FI/CO process lead even when the use case sits in the Procurement module.

### Mapping use cases to the evaluation grid

The practical deliverable from a use-case evaluation workshop is not a business case — it is a filled-in evaluation grid: system boundary, data ownership, integration pattern, and compliance classification, plus a RAG status (Green / Amber / Red) per axis. A use case with all four axes Green proceeds to design. Amber axes are explicitly risk-accepted with named mitigations. Red axes mean the use case is redesigned or parked. Phase 11 · 24 covers the upstream spotting work; this lesson defines what to evaluate once a candidate use case is on the table.



## Further Reading

- [SAP Business AI documentation](https://help.sap.com/docs/sap-ai-core) — AI Core, Joule, and BTP AI services; the canonical reference for SAP data residency and integration patterns.
- [Salesforce Agentforce documentation](https://help.salesforce.com/s/articleView?id=ai.agentforce_overview.htm) — architecture, action types, and data governance for autonomous Salesforce agents.
- [Microsoft Copilot Studio documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/) — agent authoring, Dataverse connectors, and Dynamics 365 integration patterns.
- [European Data Protection Board — Guidelines on AI and personal data](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines_en) — the current GDPR interpretive guidance most relevant to LLM use cases on ERP data.
- [TOGAF 10 — Data Architecture](https://www.opengroup.org/togaf) — the enterprise architecture standard referenced by most large SAP and Salesforce system integrators for data ownership and integration governance.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the production problem addressed by AI Use-Case Evaluation in ERP and CRM Systems (2026).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Apply the lesson's decision or implementation workflow to a concrete case.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Measure quality, cost, latency, and risk with explicit acceptance criteria.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the production problem addressed by AI Use-Case Evaluation in ERP and CRM Systems (2026),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Measure quality, cost, latency, and risk with explicit acceptance criteria,” and cite a repeatable check rather than relying on visual inspection alone.
