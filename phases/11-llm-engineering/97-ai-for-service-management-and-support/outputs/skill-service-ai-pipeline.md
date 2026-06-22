# Service AI Pipeline — Deployment Checklist

One-page decision aid for consultants and engineers deploying LLM-assisted
service management. Use as a pre-deployment gate review or kickoff checklist.

---

## Pipeline Stages and Verification Gates

| Stage | What to verify before going live | Minimum bar |
|---|---|---|
| **1. Ticket extraction** | Schema coverage: do all required fields (intent, product, version, urgency, prior contact) extract correctly on a held-out sample of 200 real tickets? | ≥85% field extraction rate on each field |
| **2. Triage routing** | Calibration: at what confidence percentile does routing accuracy on your ticket distribution meet your SLA requirement? Set your ROUTE threshold there. | ≥92% routing accuracy at chosen threshold |
| **3. Knowledge retrieval** | Retrieval hit-rate: for your top 10 intent-product-version combinations, is the correct article in the top-3 results? | Hit-rate@3 ≥ 0.85 on labelled eval set |
| **4. Response generation** | Citation coverage: every procedural step in the draft cites a retrieved article. Zero uncited steps before surfacing. | Groundedness = 1.0 (hard gate) |
| **5. Quality gate** | Scorer latency: does the quality scorer return a verdict within your SLA window? Does it catch all known-bad response patterns in your eval set? | p95 latency within SLA; recall ≥0.90 on bad-response sample |

---

## Routing Policy Quick Reference

```
Confidence >= ROUTE_THRESHOLD  ->  ROUTE
  All fields extracted. Take model's top-1 queue assignment.
  Response draft may be sent after quality gate.

ESCALATE_THRESHOLD <= Confidence < ROUTE_THRESHOLD  ->  ROUTE_FLAG
  Route to best-guess queue. Hold response draft.
  Human confirms routing within N minutes before draft is released.

Urgency signal = P1  ->  ESCALATE (regardless of confidence)
  Direct to L2 on-call. Assemble incident handoff (see below).

Confidence < ESCALATE_THRESHOLD  ->  ESCALATE
  Unclassifiable ticket. Direct to L2 with raw text + partial extraction.
```

Typical thresholds calibrated on enterprise service desk distributions:
- `ROUTE_THRESHOLD`: 0.75
- `ESCALATE_THRESHOLD`: 0.30

Recalibrate every major product release cycle.

---

## P1 Urgency Signals (trigger immediate escalation)

Check ticket text for any of these (case-insensitive):

- "production down" / "complete outage"
- "data loss" / "data breach"
- "security breach" / "compromise"
- "all users" + negative verb ("can't", "locked", "unable")
- "SLA breach" / "SLA at risk"
- "critical" + production context

---

## Incident Handoff Template (L2 receives this, not a ticket thread)

| Field | Source | Example |
|---|---|---|
| **Incident summary** | Generated from extraction | "Grafana v2 alerting broken for Platform team since 09:00 CET" |
| **Customer impact** | Ticketing system + extraction | "12 affected users, Tier-1 customer, SLA expires 11:00 CET" |
| **Resolution attempts** | Ticket history | "Cleared alert cache 09:15; no change. Rule re-saved 09:30; no change." |
| **Similar incidents** | Knowledge retrieval (top-3 by intent-product-version) | Links to last 3 closed tickets with same combination |
| **Runbook pointer** | Knowledge retrieval (exact match on intent-product) | "Alerting → Grafana v2 → Alert rule evaluation failures, section 3.2" |
| **Escalation path** | Static config per queue | "Next: Platform-Engineering-Lead via PagerDuty P1 policy" |

---

## Common Failure Modes and Mitigations

| Failure mode | Where in pipeline | Mitigation |
|---|---|---|
| Confident routing to wrong queue | Stage 2 (triage) | Lower ROUTE_THRESHOLD; add review flag band; recalibrate monthly |
| Off-version article surfaces first | Stage 3 (retrieval) | Hard pre-filter by product-version tag before semantic ranking |
| Hallucinated procedural step in draft | Stage 4 (generation) | Enforce citation in system prompt; block any uncited step at quality gate |
| Quality scorer too slow for SLA | Stage 5 (quality gate) | Run scorer async; surface "scoring in progress" state to agent UI |
| Stale knowledge article appears current | Stage 3 (retrieval) | Secondary ranking penalty for articles older than last major version cut |
| Re-opened tickets treated as new | Stage 1 (extraction) | Prior-contact detection in extraction; auto-flag for escalation path |
| P1 signal missed in ticket body | Stage 2 (triage) | Maintain explicit P1 signal list; review false-negative rate weekly |

---

## Model Selection by Pipeline Stage (2026)

| Stage | Model class | Rationale |
|---|---|---|
| Extraction + triage | Haiku 4 (fast, cheap) | Low latency; structured output; validated against schema |
| Retrieval ranking | Embedding model (same provider) | Semantic similarity at scale |
| Response generation | Sonnet 4 or Opus 4 | Citation quality; follows structured generation instructions |
| Escalate path / handoff assembly | Sonnet 4 or Opus 4 | Only runs on confirmed high-value tickets; cost justified |

Run the small model on all tickets. Escalate to the large model only when
retrieval confidence is above threshold and the ticket is not on the P1 path
(P1 tickets go directly to on-call; no generation step needed).

---

## Pre-Deployment Review Checklist

- [ ] Extraction schema validated on 200+ real tickets from production distribution
- [ ] ROUTE_THRESHOLD calibrated to your SLA accuracy requirement
- [ ] Knowledge article corpus tagged by product version and access tier
- [ ] Retrieval hit-rate@3 verified on top 10 intent-product-version combinations
- [ ] Citation enforcement rule in generation system prompt; tested on bad-response eval set
- [ ] Quality scorer p95 latency within SLA window
- [ ] P1 urgency signal list reviewed by service desk lead
- [ ] Incident handoff template confirmed with L2 on-call team
- [ ] Human review queue staffed for ROUTE_FLAG volume (estimate from calibration run)
- [ ] Rollback plan: condition that triggers reverting to human-only routing
