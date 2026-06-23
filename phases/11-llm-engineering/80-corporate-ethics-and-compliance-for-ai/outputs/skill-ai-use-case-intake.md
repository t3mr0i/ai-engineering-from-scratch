# AI Use-Case Intake — One-Page Decision Aid

Use this worksheet at the start of every new AI initiative, before architecture decisions or vendor selection. Complete all four sections; route to the contacts listed before proceeding.

---

## Step 1: Describe the Use Case (one paragraph)

Fill in the blanks:

> "We want to use AI to **[action]** on **[data]**, producing **[output]**, so that **[actor]** can **[decision or action]**. The AI output **[does / does not]** directly determine an outcome for a person."

---

## Step 2: EU AI Act Tier Classification

| Check | Yes / No | If Yes → Tier |
|---|---|---|
| Does it involve real-time biometric identification in public spaces? | | **Prohibited — stop here** |
| Does it involve social scoring of individuals? | | **Prohibited — stop here** |
| Does it operate in: employment/HR, credit/insurance, health, education, critical infrastructure, law enforcement, migration? | | **High-Risk** |
| Does it deploy a third-party foundation model (Claude, GPT-4o, Gemini, etc.) as a component? | | **GPAI** |
| None of the above? | | **Minimal-Risk** |

### Obligations by tier

| Tier | Before go-live |
|---|---|
| **Prohibited** | Do not proceed. Escalate to legal immediately. |
| **High-Risk** | Conformity assessment; EU database registration; human oversight mechanism; 10-year logging; explainability; FRIA if public sector. |
| **GPAI** | Verify provider's capability evaluation and copyright summary. Confirm systemic-risk mitigations if provider model exceeds 10^25 FLOP training compute. |
| **Minimal-Risk** | Self-declaration of conformity; internal documentation; incident-response plan. |

---

## Step 3: GDPR Trigger Checklist

| Trigger | Active? | Required action |
|---|---|---|
| AI processes personal data | [ ] | Establish lawful basis; update privacy notice; apply data minimisation. |
| Third-party model + personal data in input | [ ] | Sign Data Processing Agreement (Art. 28) before first API call. |
| Personal data sent to non-EU model endpoint | [ ] | Confirm EU SCC or adequacy decision covers the vendor and region. |
| Special-category data (health, biometric, ethnicity …) | [ ] | Art. 9(2) exception or explicit consent; DPIA mandatory. |
| Output significantly affects or creates legal effect for a person | [ ] | Implement Art. 22 controls: human oversight, right to explanation, right to contest. |
| Training or fine-tuning on personal data | [ ] | Verify purpose-limitation compatibility; separate consent or legal basis needed. |

---

## Step 4: Internal Control Gates

All three gates must be cleared before design or development begins.

| Gate | Cleared? | Who clears it | Notes |
|---|---|---|---|
| **Data classification** | [ ] | InfoSec / CISO | Map every input to Public / Internal / Confidential / Secret. Confidential or Secret requires CISO approval and a private/isolated model endpoint. |
| **DPA signed** | [ ] | Legal | Vendor DPA must exist before any personal data is sent to an external model API. Check also that data-residency configuration matches the DPA. |
| **Logging designed** | [ ] | Engineering lead | Log: prompt (sanitised), response, model ID + version, timestamp, user identity. High-Risk systems: retain 10 years. All others: minimum 12 months for incident response. |

---

## Routing Matrix

| Tier + Gaps | Route to | Timeline |
|---|---|---|
| Prohibited | Legal + project sponsor | Same day; project halt |
| High-Risk, any gate open | Legal + InfoSec + project sponsor | Before sprint 1 |
| High-Risk, all gates clear | Legal sign-off on conformity path + CISO | Before architecture review |
| GPAI or Minimal, any gate open | InfoSec + Legal | Within 5 business days |
| GPAI or Minimal, all gates clear | Engineering lead | Proceed to design |

---

## Quick Reference: Model Vendor DPA Status (as of 2026)

| Vendor | DPA available | EU data residency option | SCCs included |
|---|---|---|---|
| Anthropic (Claude) | Yes (enterprise) | AWS EU / Azure EU regions | Yes |
| OpenAI (GPT-4o, o3) | Yes (enterprise) | Azure OpenAI — EU regions | Yes |
| Google (Gemini) | Yes | Vertex AI — EU regions | Yes |
| Meta (Llama 4, self-hosted) | N/A — you are the operator | Your infrastructure | N/A |

Self-hosted open-weight models: no DPA needed for the model itself, but all GDPR obligations (lawful basis, data minimisation, logging, access controls) still apply to the data you process with it. You become the AI Act operator.

---

## Intake Document Checklist

Before routing, confirm the intake document contains:

- [ ] One-paragraph use-case description (Step 1)
- [ ] AI Act tier with evidence (Step 2)
- [ ] GDPR trigger list with Yes/No for each (Step 3)
- [ ] Three gate statuses with named owners (Step 4)
- [ ] Proposed human-in-the-loop step and the actor who can overrule
- [ ] Logging plan (fields, retention period, access controls)
- [ ] Named project sponsor who accepts residual risk

**Route completed document to: Legal, InfoSec, Project Sponsor — before any vendor selection or architecture decision.**
