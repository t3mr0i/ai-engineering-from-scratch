# AI Risk Controls Checklist

One-page decision aid for a working consultant or engineer. Use at kickoff, pre-deployment review, or when a client requests a controls evidence package. Bring a printed copy to the workshop.

---

## Step 1: Classify the output type

Answer four questions about the output type (not per-inference — do this once per use case, and *re-do it whenever the downstream effect on a decision changes*).

| Question | Yes triggers |
|---|---|
| Is the output irreversible or safety-adjacent? | **L3** immediately |
| Does an error create legal, regulatory, or compliance exposure? | **L3** immediately |
| Does the output directly influence a financial decision or document? | **L2** |
| Does the output leave the system to a client, without a human gate before it does? | **L2** |
| Does the output leave the system, but a human always decides before acting on it? | **L1** |
| None of the above apply | **L0** |

**Use the highest applicable level. Do not average.** The classification is a design-time decision, not a per-inference one. The model does not get a vote.

---

## Step 2: Apply the minimum review gate

| Level | Minimum gate | Evidence artifact |
|---|---|---|
| L0 | None required | None required |
| L1 | Async spot-check, >5% sample | Spot-check log: date, reviewer, sample size |
| L2 | Synchronous review before delivery | Review ticket: reviewer ID, timestamp, outcome |
| L3 | Named human sign-off + documented rationale | Sign-off record: person, title, rationale text, date |

A review step that runs *after* the same model that produced the output is a confirmation step, not a control. L2 reviews require a qualified human reviewer independent of the model's confidence.

---

## Step 3: Confirm all four control elements exist

For each AI use case, you need all four. Check them now.

- [ ] **Named risk owner** — a single person (name + title), not a team or role. If you cannot fill this in, the use case is not ready to ship.
- [ ] **Stated control** — one specific sentence describing the gate. "We have human oversight" is not a stated control; "A certified analyst reviews every L2 output before delivery" is.
- [ ] **Evidence artifact** — a machine-queryable record type that proves the control ran. Name the system where it lives and the query that retrieves it.
- [ ] **Policy exception record** (if any deviation from the above) — see Step 4.

If any box is unchecked, the use case is not audit-ready. Assign an owner for the gap before the next deployment.

---

## Step 4: Policy exception checklist

If your team is taking an exception (relaxing a control for any reason):

- [ ] Name the exact control being relaxed.
- [ ] State the reason (time pressure, cost, confidence threshold, etc.).
- [ ] Assess residual risk: what would the normal control have caught, at what probability?
- [ ] Name the exception owner (person, not team).
- [ ] Set an expiry date. Default: 90 days for L2; 180 days for L1. No open-ended exceptions.
- [ ] Log the record in a queryable system. Not a chat thread or shared doc.

**An exception with no expiry date silently becomes permanent. Median age at audit in our 2026 sample: 11 months. This is the most common audit finding.**

---

## Step 5: Model selection alignment (2026 pricing, approximate)

| Level | Appropriate model tier | Approx. cost per 1M input tokens | Notes |
|---|---|---|---|
| L0–L1 | claude-haiku-4-5 or equivalent | ~$1 | Latency and cost primary; spot-check is sufficient |
| L1–L2 | claude-sonnet-4-5 / claude-sonnet-4-6 | ~$3 | Balanced; synchronous review compensates for residual error |
| L2–L3 | claude-opus-4 / fable-5 | ~$15–25 | Higher accuracy reduces review burden at L3; cost justified by consequence |

In our experience, the 5–10x capability lift between haiku and opus on legal/financial extraction translates to roughly 2–4x fewer human-review escalations on L2 work. Whether the model premium pays for itself depends on the cost of the review step. Deploying a lower-capability model than the level warrants is a policy exception. Document it.

---

## Minimum audit evidence package

When a client or auditor asks for evidence:

| What they need | Where it lives |
|---|---|
| Consequence level classification (per type, current) | Use-case design document or risk register |
| Named risk owner (person, title, date of assignment) | Risk register |
| Stated control description | Use-case design document |
| Sample evidence artifacts (covering the audit period) | Review logs / case management system |
| Active policy exceptions (with expiry dates) | Exception log |

A table describing where evidence lives is the minimum acceptable response. Actual retrieval on demand — the auditor names a date range and a use case, you produce the artifacts — is what auditors will ask for next.

---

## Silent reclassification — the most common 2026 finding

If the downstream effect of an output changes (e.g. an L0 "informational hint" is wired into a financial workflow and starts auto-populating pricing), the consequence level must be re-assigned. Same code, new consequence. The original L0 risk register entry is what the auditor reads; if it has not been updated, the finding is yours. Re-classify at the moment the output's downstream effect on a decision changes, not at the moment the model changes.

---

## Framework quick-reference

| Framework | Where it applies | Key clause for this checklist |
|---|---|---|
| NIST AI RMF 1.0 | US federal / US-regulated | GOVERN 2.1 (ownership), MANAGE 1.3 (evidence) |
| ISO 42001:2023 | International / EU supply chain | Clause 6.1.2 (risk treatment), Clause 8.4 (monitoring) |
| EU AI Act GPAI | EU market | Article 53 (transparency), Article 55 (systemic risk) |

---

## Field patterns to recognize on sight

- **"The AI team owns it"** — nobody owns it.
- **"We have human oversight"** — not a stated control.
- **A notion page of use cases** — a backlog, not a register.
- **A documented exception with no expiry** — a permanent control removal no one re-justified.
- **A junior reviewer clicking "looks fine" inside 24 hours of the LLM output** — confirmation bias, not a control.
- **An L0 entry whose output now drives a financial decision** — silent reclassification.
