# CoE Operating Model — Decision Aid

Paste this into a client kickoff, a CoE design workshop, or a portfolio health review.
One page. All tables. No slides required.

---

## 1. Readiness Checklist (run this first)

Score one point per signal present. Each signal has an associated weight — the
highest-weight absent signal is the highest-leverage next action.

| Signal | Weight | Present? |
|---|---|---|
| CoE is formally funded with >= 2 dedicated FTE | 25 | |
| Standards are enforced in CI (eval thresholds, cost tagging, security baseline) | 25 | |
| Asset library (prompts, harnesses, scaffolds) is in active use by >= 2 teams | 20 | |
| Champion network active: >= 1 champion per BU with 20% dedicated sprint time | 20 | |
| Monthly portfolio review + quarterly standards review are running | 10 | |

**Scoring:**

| Score | Maturity Level | Recommended next action |
|---|---|---|
| 0–19 | 1 — Ad hoc | Secure formal funding and appoint a CoE lead |
| 20–44 | 2 — Opportunistic | Move standards from documents into CI enforcement |
| 45–69 | 3 — Systematic | Activate champion network with dedicated time |
| 70–89 | 4 — Differentiated | Instrument and surface asset reuse metrics to leadership |
| 90–100 | 5 — Transformational | Focus on model retirement planning and external benchmarking |

---

## 2. Ownership Boundary Table

Use this to resolve "who decides this?" disputes before they become political.

| Decision type | Owner | Notes |
|---|---|---|
| Model tier policy, eval thresholds, security baseline | CoE Platform | Non-negotiable; enforced in CI |
| Prompt wording within approved templates | Delivery Team | Teams own their domain edge cases |
| Sprint prioritization within approved cost envelope | Delivery Team | No CoE approval needed |
| Model retirement / provider EOL response | CoE Platform | Triggers asset library review cycle |
| New use case funding | Joint — DRI: CoE Lead | Portfolio-level; CoE lead breaks ties |
| Security incident response | CoE Platform first | CoE updates standard; delivery team patches under CoE direction |
| Evaluation dataset content | Delivery Team | CoE owns the harness; team owns the test cases |
| Framework/SDK choice within approved list | Delivery Team | CoE approves the list; team picks from it |

**Joint decisions are the seam where things fall through. Always name a single DRI before the meeting ends.**

---

## 3. Champion Program Minimum Requirements

A champion program without these three inputs will burn out champions within 6 months:

| Requirement | Minimum | Why it matters |
|---|---|---|
| Dedicated time | 20% of sprint capacity | Champions absorb CoE work on top of delivery load without this |
| Escalation path | Direct async channel to CoE lead; 24-hour SLA | Without it, standards conflicts fester and champions route around the CoE |
| Recognition | Named in BU performance review framework | Without it, BU managers pull champions back to delivery |

Champion responsibilities:
- Apply CoE standards to local projects; surface conflicts back to central team.
- Identify new use cases; submit to monthly portfolio review.
- Run at least one local knowledge session per quarter.
- Provide ground-truth signal: which standards are being bypassed and why.

---

## 4. Governance Cadence Template

| Cadence | Forum | Standing agenda |
|---|---|---|
| Weekly | CoE core team standup | Asset pipeline status; open champion escalations; model/API change watch |
| Monthly | Portfolio review with BU leads | Pilot health (green/yellow/red); kill/scale/pivot decisions; cost attribution review |
| Quarterly | Standards review | Eval threshold tuning; model tier policy update; security baseline refresh |
| Ad hoc | Incident review | Any production failure — root cause, standard update, asset patch |

The monthly portfolio review is the decision moment most organizations skip. Without it, stalled pilots drift for quarters.

---

## 5. Asset Library Health Check

Run this for every asset in the library on the quarterly standards review cadence:

| Check | Pass condition |
|---|---|
| Owner is named | Yes — a named person, not a team alias |
| Last review date | Within 3 months for actively used assets; within 6 months for all others |
| Eval score against CoE threshold | >= threshold on current model version |
| Model version pinned | The asset's eval was run against a specific named model version |
| Teams using it | At least one team actively uses it (otherwise archive it) |

If any check fails: freeze the asset (mark as "under review"), notify consuming teams, assign the owner to remediate within one sprint.

---

## 6. Quick Reference: Model Tier Policy (2026 default)

Adjust thresholds for your client's cost and risk profile.

| Tier | Model | Default use case | Override trigger |
|---|---|---|---|
| Frontier | Opus 4.x | Complex agentic tasks, long-horizon planning | Task requires deep multi-step reasoning or tool orchestration |
| Mid-range | Sonnet 4.x | Interactive workloads, code generation, summarization | Default choice for most production integrations |
| Fast | Haiku 4.x | High-volume classification, routing, short extraction | Cost or latency constraints override quality preference |
| On-premises / local | Client-hosted model | Data-sensitive contexts where data may not leave perimeter | PII, legal hold, or regulatory data handling policy requires it |

All model calls must be tagged with team, project, and cost center before reaching the gateway. Untagged calls are rejected.
