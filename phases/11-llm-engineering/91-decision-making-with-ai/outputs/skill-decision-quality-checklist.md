# Decision-Quality Checklist for AI-Assisted Decisions

Paste this into a project kickoff, architecture review, or governance workshop.
Work through sections in order -- each section's output feeds the next.

The point of this checklist is to make the decision process explicit before a
single AI output is acted on. "We'll add oversight later" is the rubber-stamp
queue waiting to happen.

---

## 1. Classify the Decision Type

| Question | Answer |
|---|---|
| What action does the AI output trigger? | |
| Can the action be reversed within 24 hours at reasonable cost? | Yes / No |
| Does the action affect a named individual's livelihood, health, or legal status? | Yes / No |
| Does the use case appear in EU AI Act Annex III? | Yes / No / Unsure |

**Map to type:**

| Type | Reversible? | Individual impact? | Annex III? | Required process |
|---|---|---|---|---|
| Content recommendation | Yes | No | No | Soft filter + audit log |
| Document classification | Mostly | Internal | No | Threshold + review queue |
| Resource allocation | Rarely | Org-level | Sometimes | Uncertainty band + bias check + named approver |
| High-risk (credit / hiring / triage) | No | Yes | Yes | Full four-gate + HITL + audit trail |
| Irreversible | Never | Yes, permanent | Yes | Model provides evidence only; human decides |

In our experience roughly two-thirds of enterprise AI deployments land in the
resource-allocation or high-risk row once the use case is described in concrete
terms rather than demo terms.

---

## 2. Required Metric Signals

Before any action is taken, confirm you can retrieve all four signals from the
model or pipeline:

- [ ] **Point estimate** -- score / label / rank
- [ ] **ECE (Expected Calibration Error)** -- measured on a held-out calibration set that does not overlap training data; lookable up at decision time, not only in a quarterly slide
- [ ] **Prediction set width** -- conformal prediction interval or set size, normalised to [0, 1]
- [ ] **Subgroup parity gap** -- worst-case accuracy (or FPR / FNR) difference across protected attributes available in your evaluation set

If any signal is missing, note it as a gap and escalate before deployment.
Showing only the point estimate to a decision-maker is the contract-reviewer
failure shape in waiting.

---

## 3. Set Gate Thresholds (fill in for your use case)

| Gate | Metric | Your threshold | Basis |
|---|---|---|---|
| 1 -- Calibration | ECE | | e.g. 0.03 for high-risk decisions |
| 2 -- Uncertainty | Pred-set width | | e.g. 0.15 for high-risk; above 0.3 = "send to human" |
| 3 -- Bias | Subgroup parity gap | | e.g. 0.03 for high-risk; production audits routinely see 0.05-0.15 gaps |
| 4 -- Accountability | Named approver required? | Yes / No / Automated OK | Irreversible decisions: never AUTOMATED |

Tighten thresholds for higher-stakes decisions. Defaults from `code/main.py`
are a starting point, not a compliance floor. ECE above 0.05 on any
high-stakes use case means confidence scores should not be shown as-is.

---

## 4. HITL Interface Requirements

For decisions that require human review, the interface must satisfy all three:

- [ ] **Legible evidence package shown to approver:** input summary, point estimate, uncertainty interval, any triggered gate flags
- [ ] **Friction-appropriate interface:** high-stakes decisions get mandatory pause and an explicit confirmation step that is not skippable by default
- [ ] **Override is as easy as accept:** same number of clicks or fewer; override captures a free-text reason

Anti-pattern to avoid: daily batch approval queue where the human processes
100+ decisions without time to read each one. This is nominal oversight, not
meaningful oversight under EU AI Act Article 14. A queue of more than about
30 decisions per session per approver is the warning threshold from the field.

---

## 5. Audit Log -- Minimum Fields

Every decision (automated or human-reviewed) must emit a structured log entry:

| Field | Example value | Notes |
|---|---|---|
| `decision_id` | `D-0042` | Stable; used for appeal or audit lookup |
| `input_hash` | `a3f8c1d92b44` | SHA-256 prefix; detect input tampering |
| `model_version` | `v2.4.1` | Pinned artifact; must be reproducible |
| `point_estimate` | `0.73` | Raw model score |
| `ece` | `0.04` | At decision time, not quarterly |
| `pred_set_width` | `0.22` | At decision time |
| `subgroup_parity_gap` | `0.03` | Latest audit result for this model version |
| `gates_passed` | `[1, 2, 3]` | List of gates that cleared; 4 = all |
| `approver_id` | `credit-officer@co.de` | `AUTOMATED` only if decision type permits |
| `override` | `false` | True if approver accepted despite gate failure -- this is the rubber-stamp signal |
| `timestamp` | `2026-06-22T09:14:33Z` | UTC, millisecond precision |

Store in an append-only log. Retain for the period required by applicable law:
the automatically generated logs for at least 6 months (EU AI Act Article
19(1)); the underlying technical documentation for 10 years (Article 18).

---

## 6. Governance Checkpoints

Use this table in a sprint review or project gate:

| Checkpoint | Owner | Status |
|---|---|---|
| Decision type classified and documented | Tech lead | |
| All four metric signals available in staging | ML engineer | |
| Gate thresholds set and peer-reviewed | ML engineer + risk owner | |
| HITL interface reviewed for meaningful oversight | Product + compliance | |
| Audit log schema finalised and tested | Backend engineer | |
| EU AI Act / AI RMF mapping complete (if applicable) | Compliance | |
| Subgroup audit run on production-representative data | ML engineer | |
| Post-deployment monitoring schedule defined | Ops | |

---

## Quick-Reference: Key Standards

| Standard | Scope | Key obligation |
|---|---|---|
| EU AI Act (2024/1689) | EU; high-risk AI systems | Technical documentation (Art. 18, 10-year retention), human oversight (Art. 14), conformity assessment, audit trail logs (Art. 19(1), min. 6-month retention) |
| NIST AI RMF 1.0 | US federal; voluntary best practice | Govern, Map, Measure, Manage lifecycle |
| NIST SP 1270 | Bias measurement | Protected-attribute audit, disparity metrics |
| ISO/IEC 42001 | International; AI management systems | Management system standard for responsible AI |

---

## Six Failure Shapes to Name in a Review

When you walk into a project, ask whether any of these apply. Each has shown
up in more than one engagement.

- **The 92% aggregate trap.** Headline accuracy above 90% while a subgroup sits below 75%; no subgroup number on the dashboard.
- **The rubber-stamp queue.** More than ~30 decisions per session per approver; no legible evidence at decision time.
- **The prompt-drift disparity.** Subgroup outcomes shift over time with no model change; the prompts changed.
- **The RAG confidence laundering.** Confident prose over retrieved documents, but the retriever returned nothing; the model's confidence is in the prose, not the facts.
- **The calibration footnote.** ECE lives in the eval deck, not in the decision-time lookup.
- **The audit-after-the-fact.** Cannot reconstruct, from the stored record alone, what the model was, what it saw, and who approved.