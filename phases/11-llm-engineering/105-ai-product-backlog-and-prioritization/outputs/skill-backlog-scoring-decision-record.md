# Backlog Scoring Decision Record — Paste-and-Use Template

Use this template at the start of every LLM-assisted prioritization session.
Fill it in during the session. Commit the completed file to your product repo
as the authoritative record for this scoring run.

---

## 1. Session metadata

| Field | Value |
|---|---|
| Date | |
| Facilitator | |
| Attendees | |
| Backlog snapshot (Jira filter / export name) | |
| Model used for scoring assistance | |
| Previous decision record (link) | |

---

## 2. Scoring weights — set before scoring begins

These weights reflect this quarter's business priorities. Change them here;
do not change them mid-session to fix a ranking you dislike.

| Dimension | Weight | Rationale |
|---|---|---|
| Value (business impact) | | |
| Risk adjustment (1 − risk) | | |
| Dependency multiplier per unresolved blocker | | |

Weight validity check:
- [ ] Value weight + Risk weight = 1.0
- [ ] Dependency multiplier is between 0.1 and 0.5 (outside this range, recheck)
- [ ] Weights approved by product lead before scoring

---

## 3. Item scoring table

Add one row per item. Columns map directly to the scoring formula.

| ID | Title | Value (1–5) | Effort (1–5) | Risk (0–1) | Blockers (IDs) | Composite | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

Scoring formula used:
```
composite = ((value/5 × w_v) + (1 − risk) × w_r) / (effort × (1 + n_blockers × dep_mult)) × 10
```

---

## 4. Dependency snapshot

List all blocking relationships at the time of scoring. Confirm with engineers
before treating dependencies as final.

| Item blocked | Blocked by | Confirmed by engineer? | Notes |
|---|---|---|---|
| | | [ ] | |

Dependency flags to check:
- [ ] Any item has depth > 2 (long blocker chain — schedule risk)
- [ ] Any item has fan-in >= 3 (force multiplier — prioritize early)
- [ ] Circular dependency detected (cannot rank; must break the cycle first)

---

## 5. Risk flags

Items where risk >= 0.4. For each, record the human disposition.

| ID | Title | Risk score | Risk type | Human disposition |
|---|---|---|---|---|
| | | | Tech debt / Data / Security / Reversibility / Regulatory | Accept / Mitigate / Defer |

---

## 6. Compliance and mandatory items

Items that must ship regardless of composite score (regulatory, contractual, SLA).

| ID | Title | Mandate source | Target date |
|---|---|---|---|
| | | | |

These items are placed in the roadmap first, then scored items fill the remaining capacity.

---

## 7. Final ranked order

Copy the output of the scoring function here. Do not edit the ordering — use
section 8 (overrides) for any changes.

| Rank | ID | Title | Composite |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## 8. Overrides

Any item moved from its scored position must have a written rationale here.
This is the most important section: it is where organizational judgment is
recorded.

| ID | Scored rank | Override rank | Rationale | Approved by |
|---|---|---|---|---|
| | | | | |

Override checklist:
- [ ] Override is not "stakeholder preferred it" without a business argument
- [ ] Override does not break a dependency chain (check section 4)
- [ ] Override is not reversing a weight decision — if you find yourself
      overriding many items, reconsider the weights instead

---

## 9. LLM-assisted scoring review

For each item where the model's score differed from a human reviewer's
intuition by more than 1 point, record the discrepancy.

| ID | Model score | Human intuition | Cause of gap | Resolution |
|---|---|---|---|---|
| | | | Vague description / Missing context / Model hallucination | Clarified description / Kept model score / Used human score |

Rule: if more than 20% of items have discrepancies, the item descriptions
are too vague for reliable scoring. Rewrite them before the next session.

---

## 10. Sign-off

| Role | Name | Decision |
|---|---|---|
| Product lead | | Approved / Approved with overrides / Rejected |
| Engineering lead | | Dependencies confirmed / Issues flagged |
| Stakeholder | | Reviewed |

Committed to repo: [ ] yes — link: ___________
