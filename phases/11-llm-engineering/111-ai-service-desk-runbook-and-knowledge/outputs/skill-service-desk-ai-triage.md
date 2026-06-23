# Skill: Service Desk AI Triage — Decision Aid

One-page reference for assessing ticket classes and runbooks before committing to any automation investment.

---

## Four-Zone Triage Model

| Zone | Knowledge quality | Resolution determinism | Action |
|---|---|---|---|
| **A — Automate** | High (documented, retrievable) | High (low ambiguity) | Build runbook-driven automation; shadow mode first |
| **B — Augment** | High | Low (human decision required) | Surface the runbook; log analyst decisions for future training |
| **C — Document first** | Low | High | Knowledge capture is the sprint-0 task; no automation until score >= 7 |
| **D — Escalate / accept** | Low | Low | Route to L2/L3; AI flags pattern when volume crosses threshold |

**Quick test for Zone A:** Can a new analyst who has never seen this ticket type resolve it correctly using only the written procedure, with no phone calls? If no, it is not Zone A.

---

## Runbook Quality Scorecard

Score each dimension 0–2. Total out of 10.

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| **Completeness** | Missing steps; "contact X" unresolved | All steps listed; contacts named | Steps include expected outputs and validation signals |
| **Determinism** | "Depends on environment" with no branches | Branches explicit; conditions named | All documented failure modes covered |
| **Currency** | Last updated > 12 months; references EOL systems | Updated within 6 months | Linked to system change log; auto-stale detection |
| **Machine-readability** | Free prose; PDF; screenshots | Structured headings; numbered steps | Markdown/YAML with pre/post conditions |
| **Ownership** | No owner field | Named team | Named individual + review cadence |

**Thresholds:**
- Score **>= 7** → Zone A candidate (automate with shadow mode validation)
- Score **4–6** → Zone B only (analyst augmentation; no automated state changes)
- Score **< 4** → Zone C/D (document before touching automation tooling)

---

## Automation Readiness Checklist

Before going to production on any Zone A ticket class:

- [ ] Runbook score >= 7 independently verified by a second analyst
- [ ] Structured step extraction reviewed by an engineer (not just generated)
- [ ] Shadow mode run for >= 2 weeks; accuracy >= 90% vs. analyst resolutions
- [ ] Reopen rate monitoring in place (alert threshold: > 5% within 48 h)
- [ ] Human approval gate (HITL) configured for all state-changing actions for first 90 days
- [ ] Escalation path defined for out-of-scope inputs (what the automation cannot handle)
- [ ] Runbook linked to relevant CI/CD change management flow (drift detection)

---

## Knowledge Gap Identification — Quick Protocol

1. Pull top 30 recurring ticket clusters by volume (last 90 days).
2. For each cluster, retrieve the matching KB article (keyword or semantic search).
3. Feed cluster summary + KB article to Claude Sonnet 4.x: *"Identify steps in the ticket cluster not covered or contradicted by the KB article. Return a structured gap list."*
4. Aggregate gaps by type: missing steps | stale references | missing branches | no validation signal.
5. Create documentation tickets for each gap; prioritise by ticket volume × gap severity.

---

## Drift Detection — Ongoing Cadence

| Signal | Cadence | Owner | Action on trigger |
|---|---|---|---|
| Runbook linked to change ticket | Per CI/CD release | DevOps | Flag runbook for review before next automation run |
| Reopen rate > 5% within 48 h | Daily alert | Service Desk lead | Suspend automation; initiate runbook review |
| No runbook edit in 180 days | Monthly scan | Knowledge manager | Assign review task; mark runbook as stale |
| LLM freshness review vs. changelog | Monthly | Engineer + analyst | Update runbook; re-score; re-qualify if score changed |

---

## Common Failure Modes

| What teams say | What is actually happening | Fix |
|---|---|---|
| "The chatbot gives wrong answers" | Zone A automation applied to Zone B or C tickets | Re-triage; add HITL gate or pull automation back to augment only |
| "The POC worked but production failed" | Shadow mode skipped; edge cases not in demo set | Run 2-week shadow before go-live; measure on full ticket volume |
| "The runbook is accurate but the automation fails" | Machine-readability score was 0 or 1; prose not parseable | Rewrite runbook in structured markdown; re-score before re-generating |
| "Automation broke after the system upgrade" | No drift detection in place | Link runbook to change management; add reopen-rate alert |
