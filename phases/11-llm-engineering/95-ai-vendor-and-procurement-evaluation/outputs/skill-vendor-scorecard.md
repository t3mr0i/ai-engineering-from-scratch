# AI Vendor Scorecard — Decision Aid for Procurement Engagements

Use this one-pager to structure a vendor evaluation working session. Build the scorecard, run the hard gates, then re-quote under real traffic. A score without a document reference is an assumption, not an evaluation; a quote without the deployment SLA is not a quote.

## Procurement failure shapes (run the gates, then run the cost model)

These are the failure patterns the code in `code/main.py` makes visible. Spot them in the procurement paper, not after the contract is signed.

- **Demo-data disqualification** — Vendor scores top on capability because the eval was run on anonymized data; the DPA permits training on customer data by default. The disqualification arrives at legal review, not at the scorecard. Run the gates first.
- **Statement of Applicability gap** — Vendor cites ISO 27001; the SoA excludes the inference API. Ask for the SoA, not the certificate.
- **Batch-price quote** — Quote is 20-40% below the real-time comparison; the SLA is batch and the deployment is real-time. Re-quote under the actual deployment SLA.
- **Fine-tuning tax** — Lift of 8-12 points from fine-tuning costs 5-10x the original investment to migrate later. Estimate the exit before the fine-tune starts.
- **Context window creep** — Pricing model uses 2K-token prompts; production averages 8K. Use production traffic, not demo traffic.

---

## Six-Dimension Scorecard Template

Score each vendor 0-4 on every dimension. Multiply by the weight for your profile. Sum for a weighted total. Rank by total.

| Dimension | Weight (adjust) | Vendor A | Vendor B | Vendor C | Evidence required |
|---|---|---|---|---|---|
| Model capability | — | /4 | /4 | /4 | Task-representative eval set; latency p50/p95 |
| Data handling & residency | — | /4 | /4 | /4 | Signed DPA; subprocessor list; region map |
| Security posture | — | /4 | /4 | /4 | SOC 2 Type II report; ISO 27001 cert + SoA scope |
| Compliance certifications | — | /4 | /4 | /4 | Cert matrix; EU AI Act readiness doc |
| Integration & lock-in | — | /4 | /4 | /4 | API surface analysis; fine-tuned model portability |
| Economics & exit planning | — | /4 | /4 | /4 | Token price at 2x and 10x traffic; switching cost estimate |
| **Weighted total** | **1.00** | | | | |

---

## Weight Profiles by Engagement Type

Copy the appropriate column into the "Weight" column above.

| Dimension | Regulated enterprise | Consulting internal tool | Startup / prototype |
|---|---|---|---|
| Model capability | 0.10 | 0.25 | 0.30 |
| Data handling | 0.25 | 0.15 | 0.05 |
| Security posture | 0.25 | 0.15 | 0.05 |
| Compliance certs | 0.20 | 0.10 | 0.05 |
| Integration / lock-in | 0.10 | 0.20 | 0.25 |
| Economics | 0.10 | 0.15 | 0.30 |
| **Sum** | **1.00** | **1.00** | **1.00** |

---

## Per-Dimension Evidence Checklist

### Model capability
- [ ] Eval set built from real production prompts (minimum 50 examples, domain-expert scored)
- [ ] Latency measured under realistic concurrency (not single-request lab test)
- [ ] Comparison run on the same eval set for all shortlisted models

### Data handling and residency
- [ ] Signed DPA in hand (not "available on request")
- [ ] Subprocessor list reviewed — GPU cloud providers named and acceptable
- [ ] "No training on customer data" commitment is in the DPA, not just marketing copy
- [ ] Data residency region confirmed as EU or acceptable jurisdiction
- [ ] Data subject rights mechanism documented (deletion, access)

### Security posture
- [ ] SOC 2 Type II report available (not Type I); bridge letter for currency
- [ ] ISO 27001 certificate — Statement of Applicability reviewed, inference API in scope
- [ ] BSI C5 confirmation if German public-sector client
- [ ] CMEK (bring-your-own-key) available if client requires it
- [ ] VPC/PrivateLink ingress available if client forbids public internet routing
- [ ] Audit log specification: retention period, fields, SIEM export format

### Compliance certifications
- [ ] GDPR data processor obligations covered (DPA with controller/processor split)
- [ ] EU AI Act readiness documentation — GPAI transparency obligations if applicable
- [ ] If client application falls under Annex III (high-risk AI), conformity assessment path confirmed
- [ ] ISO 42001 (AI management system) — ask if not yet certified, document the gap

### Integration and lock-in
- [ ] API compatibility: does vendor expose an OpenAI-compatible endpoint?
- [ ] Tool-calling format: proprietary or standard? Migration cost estimated.
- [ ] Fine-tuned model export: can weights be extracted if you leave the vendor?
- [ ] Vendor-specific features used: list them and assess portability impact
- [ ] Integration abstraction layer in place (route via configurable base URL, not hardcoded vendor SDK)

### Economics and exit planning
- [ ] Token pricing confirmed for real-time inference (not batch)
- [ ] Context window cost modelled at production scale (include system prompt + history)
- [ ] Batch vs. real-time pricing distinction documented — do not mix in TCO comparison
- [ ] Egress/data-transfer cost included in cost model
- [ ] Switching cost estimated: re-integration engineering, model re-evaluation, downtime risk

---

## Hard Gates (Automatic Disqualification)

These are non-negotiable for regulated or GDPR-scope engagements. Any vendor failing a hard gate is removed from the shortlist before scoring.

| Gate | Threshold | Rationale |
|---|---|---|
| Signed DPA | Must have before first non-anonymized API call | GDPR Art. 28 processor obligation |
| No training on customer data | Must be in the DPA, not just marketing | Data minimisation; IP protection |
| SOC 2 Type II | Must cover the inference API endpoint | Security assurance; audit trail |
| ISO 27001 SoA covers inference API | The SoA must list the inference API in scope, not just the corporate IT org | "SoA gap" failure shape |
| BSI C5 | Required for German public-sector clients | Procurement law; BSI recommendation |
| EU data residency | Required if data classification prohibits third-country transfers | GDPR Chapter V; Schrems II |

---

## Common Mistakes to Avoid

- Scoring model capability from benchmark tables instead of a task-representative eval set. Benchmark rankings rotate quarterly.
- Accepting batch pricing quotes when the deployment requires real-time inference.
- Treating a marketing DPA FAQ as a signed Data Processing Agreement.
- Checking the ISO 27001 certificate number without reviewing the Statement of Applicability scope.
- Ignoring lock-in risk because "we can always switch later" — document the switching cost estimate now.

---

## Output Artefacts for a Procurement Working Session

1. Completed scorecard (this template, filled in)
2. Evidence file: one document per dimension per vendor, referenced by filename
3. Hard-gate log: which vendors were disqualified and at which gate (use `code/main.py` Part 2)
4. Cost-trap re-quote: each shortlisted vendor's quoted vs effective monthly TCO under production traffic (use `code/main.py` Part 3)
5. Ranking matrix: vendors by profile (use `code/main.py` in this lesson to generate)
6. Recommendation memo: recommended vendor + profile used + top-3 risks
