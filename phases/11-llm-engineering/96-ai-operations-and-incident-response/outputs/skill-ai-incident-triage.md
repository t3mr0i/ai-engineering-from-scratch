# AI Incident Triage — Decision Aid

One-page reference for on-call engineers and AI ops leads. Paste into your runbook wiki or print for the war room.

---

## Step 0 — Declare and categorise (within 5 minutes)

Ask these four questions in order. Stop at the first "yes."

| Question | Yes → category |
|---|---|
| Did the safety classifier fire (score ≥ 0.7) or did a user escalate harmful output? | **SAFETY** — P1 mandatory |
| Did token cost or context length spike >20% from baseline? | **COST** |
| Did tool-call error rate spike or did the agent loop? | **TOOL-USE** |
| Did LLM-as-judge score drop >10% or output length shift >25%? | **QUALITY** |
| None of the above | Spot-sample 20 outputs, then re-check |

---

## Severity table

| Severity | AI trigger | Ack SLO | Mitigation SLO | Owns the page |
|---|---|---|---|---|
| P1 | Safety signal; agent irreversible side-effect | 5 min | 30 min | Platform eng + Safety lead |
| P2 | Quality or cost >10% for >5 min; agent loop | 15 min | 2 h | On-call ML eng |
| P3 | Quality degradation, non-critical path | Next business day | Sprint | Product owner + ML eng |
| P4 | Monitoring gap (no regression yet) | Sprint planning | — | ML eng |

**Rule:** a safety signal is always P1, regardless of traffic volume or scope.

---

## Runbook — QUALITY

1. Sample 50 recent outputs. Compute mean output length and LLM-as-judge score vs 7-day baseline.
2. Check provider status page and changelog. **Silent model update?** → pin explicit model version (e.g. `claude-sonnet-4-6-20260501`).
3. `git log --since=<incident_start>` on prompt template repo. **Changed?** → roll back.
4. Check input distribution: new traffic source or language shift?
5. ESCALATE to ML engineer if no root cause in 30 min.
6. Post-mortem: add a model-version pin to config and a shadow-evaluation gate to CI.

---

## Runbook — COST

1. Pull cost-per-request telemetry for last 24 h. Find the inflection point time.
2. Check context-length p95 at the inflection point. >30% spike → prompt bug inlining conversation history.
3. Check feature flags deployed in the incident window. **Changed?** → revert.
4. Apply `max_tokens` hard limit immediately if spend is still climbing.
5. Alert finance if overrun crosses the pre-agreed threshold (set this number now, not during the incident).
6. Post-mortem: add context-length p95 alert to your L2 dashboard.

---

## Runbook — TOOL-USE / AGENTIC

1. Pull tool-call logs. Compute tool-call error rate and mean calls-per-session.
2. **Agent looped?** (same tool >N times, no state change) → set `max_turns` guard; disable the looping tool via permission layer (Phase 15 · 10).
3. Check MCP server schema version in the incident window. **Schema changed?** → roll back schema; reconcile before re-enabling.
4. Check for irreversible side-effects in downstream systems.
5. ESCALATE to agent ops if irreversible side-effect confirmed (Phase 15 · 16 rollback controls).
6. Post-mortem: add tool-call-per-session p99 alert; pin MCP schema version in config.

---

## Runbook — SAFETY

1. Flag all session IDs. Preserve logs — do not delete, even partially.
2. Disable the AI feature for the affected segment **immediately** — do not wait for root cause.
3. Check whether the safety-classifier threshold was recently lowered. **Yes?** → revert.
4. ESCALATE to Safety lead within **15 minutes** — mandatory.
5. Treat as model-level issue until proven otherwise. Prompt-only mitigations are insufficient.
6. Post-mortem: file a safety incident report per your regulatory/compliance framework.

---

## Signal reference — where to look

| Signal | Dashboard layer | Lag | Alert threshold |
|---|---|---|---|
| LLM-as-judge score | L3 AI quality | Minutes | Drop >10% for 5+ min → P2 |
| Output-length distribution | L3 AI quality | Minutes | Shift >25% → investigate |
| Cost per request | L2 Platform | Seconds | Spike >20% → P2 |
| Context-length p95 | L2 Platform | Seconds | Spike >30% → check prompt bug |
| Tool-call error rate | L2 Platform | Seconds | Spike >20% → P2 |
| API latency p99 / 5xx rate | L1 Infrastructure | Seconds | Standard SRE thresholds → P1 |
| Safety classifier score | L3 AI quality | Seconds | ≥0.70 → P1 unconditional |

---

## Pre-incident checklist (do this now, not during the incident)

- [ ] Model version is pinned with a dated suffix in all production configs
- [ ] System prompt / prompt template is in version control and rollbackable via CI
- [ ] LLM-as-judge score and output-length p50 are on the primary dashboard (L3 layer)
- [ ] All four runbooks are written and linked from the incident management system
- [ ] Rollback authority is documented: name(s) of who may disable the AI feature unilaterally
- [ ] Shadow evaluation (canary) gate is in place before each model-version upgrade
- [ ] A game-day exercise has been run: can the team detect a silent model regression within SLO?
