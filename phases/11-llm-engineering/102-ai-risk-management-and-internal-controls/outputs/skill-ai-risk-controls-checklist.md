# AI Risk Controls Checklist

One-page decision aid for a working consultant or engineer. Use at kickoff, pre-deployment review, or when a client requests a controls evidence package.

---

## Step 1: Classify the output type

Answer four questions about the output type (not per-inference — do this once per use case).

| Question | Yes triggers |
|---|---|
| Is the output irreversible or safety-adjacent? | **L3** immediately |
| Does an error create legal, regulatory, or compliance exposure? | **L3** immediately |
| Does the output directly influence a financial decision or document? | **L2** |
| Does the output leave the system to a client, without a human gate before it does? | **L2** |
| Does the output leave the system, but a human always decides before acting on it? | **L1** |
| None of the above apply | **L0** |

**Use the highest applicable level. Do not average.**

---

## Step 2: Apply the minimum review gate

| Level | Minimum gate | Evidence artifact |
|---|---|---|
| L0 | None required | None required |
| L1 | Async spot-check, >5% sample | Spot-check log: date, reviewer, sample size |
| L2 | Synchronous review before delivery | Review ticket: reviewer ID, timestamp, outcome |
| L3 | Named human sign-off + documented rationale | Sign-off record: person, title, rationale text, date |

---

## Step 3: Confirm all four control elements exist

For each AI use case, you need all four. Check them now.

- [ ] **Named risk owner** — a single person (name + title), not a team or role.
- [ ] **Stated control** — one specific sentence describing the gate. "We have human oversight" is not a stated control.
- [ ] **Evidence artifact** — a machine-queryable record type that proves the control ran. Named the system where it lives.
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

**An exception with no expiry date silently becomes permanent. This is the most common audit finding.**

---

## Step 5: Model selection alignment

| Level | Appropriate model tier | Notes |
|---|---|---|
| L0-L1 | claude-haiku-4-5 or equivalent | Latency and cost primary; spot-check is sufficient |
| L1-L2 | claude-sonnet-4-5 / claude-sonnet-4-6 | Balanced; synchronous review compensates for residual error |
| L2-L3 | claude-opus-4 / fable-5 | Higher accuracy reduces review burden at L3; cost justified by consequence |

Deploying a lower-capability model than the level warrants is a policy exception. Document it.

---

## Minimum audit evidence package

When a client or auditor asks for evidence:

| What they need | Where it lives |
|---|---|
| Consequence level classification | Use-case design document or risk register |
| Named risk owner (person, title, date of assignment) | Risk register |
| Stated control description | Use-case design document |
| Sample evidence artifacts (covering the audit period) | Review logs / case management system |
| Active policy exceptions (with expiry dates) | Exception log |

A table describing where evidence lives is the minimum acceptable response. Actual retrieval on demand is what auditors will ask for next.

---

## Framework quick-reference

| Framework | Where it applies | Key clause for this checklist |
|---|---|---|
| NIST AI RMF 1.0 | US federal / US-regulated | GOVERN 1.1 (ownership), MANAGE 1.3 (evidence) |
| ISO 42001:2023 | International / EU supply chain | Clause 6.1.2 (risk treatment), Clause 8.4 (monitoring) |
| EU AI Act GPAI | EU market | Article 53 (transparency), Article 55 (systemic risk) |
