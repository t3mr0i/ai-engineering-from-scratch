# AI Architecture Decision Record — Governance Cheat Sheet

One-page reference for consultants and engineers. Fill in the template, run the validator, commit to `/docs/adr/`.

---

## AI ADR Template

```markdown
# [AI-ADR-NNN] <Short title describing the decision>

**Status:** proposed | accepted | deprecated | superseded | under-re-evaluation
**Date:** YYYY-MM-DD
**Owner:** <Named person or team — must be a real human, not "the AI team">
**Review date:** YYYY-MM-DD  <!-- hard deadline; AI models move faster than annual reviews -->

## Context
<!-- What forces drive this decision? Include:
     - Use case and traffic volume (requests/day, tokens/request)
     - Data classification (public / internal / confidential / restricted)
     - Regulatory scope (DSGVO, EU AI Act risk class, sector-specific rules)
     - Latency and availability SLA -->

## Decision
<!-- The specific choice made. Be precise:
     - Model id + version pinned (e.g. claude-haiku-4-20250514), or document
       why a versionless alias is acceptable and note the behavioral-drift risk.
     - Vendor and tier (shared-multi-tenant / dedicated-provisioned / self-hosted)
     - Inference region (required for data-residency claims)
     - Context-window and prompt-caching strategy -->

## Cost Projection
| Parameter | Value |
|---|---|
| Avg prompt tokens / request | |
| Avg completion tokens / request | |
| Daily requests | |
| Price — input ($/MTok) | |
| Price — output ($/MTok) | |
| **Projected monthly cost** | **$X,XXX** |
| Cost ceiling (triggers re-evaluation) | $X,XXX |

Formula: `(prompt_tokens * daily_reqs * 30 / 1_000_000 * input_price) + (completion_tokens * daily_reqs * 30 / 1_000_000 * output_price)`

## Alternatives Evaluated
| Model / approach | Why not chosen |
|---|---|
| | |

Do not write "we evaluated X". Record the benchmark or metric that ruled it out.

## Consequences
<!-- Expected outcomes, known trade-offs, monitoring plan -->

## Trigger Conditions (required — all four must be filled)

| Category | Condition | Required action |
|---|---|---|
| **Cost** | Monthly spend exceeds $X,XXX or price increase >Y% | Re-evaluate tier; consider efficient-tier alternative |
| **Capability** | Cheaper tier reaches benchmark score Z on task eval | Downgrade to efficient tier; re-validate quality |
| **Compliance** | Vendor changes residency/training opt-out policy | Legal review within 14 days; suspend if unresolved |
| **Deprecation** | Model EOL announced | Evaluate successor within 30 days; migrate before EOL |
```

---

## Validation Checklist

Run before marking an ADR "accepted":

- [ ] `id` is unique in the register (format: `AI-ADR-NNN`)
- [ ] `owner` is a named person or team, not a role alias
- [ ] `model_id` includes version (not just `claude-sonnet` — use `claude-sonnet-4-20250514`)
- [ ] `inference_endpoint_type` is one of: shared-multi-tenant / dedicated-provisioned / self-hosted
- [ ] Cost projection is computed at **production** request volume, not prototype volume
- [ ] Projected monthly cost is below the ceiling — if not, the ADR status should be "under-re-evaluation"
- [ ] All four trigger categories are filled (cost, capability, compliance, deprecation)
- [ ] `review_date` is set and is less than 6 months out for frontier-reasoning tier choices
- [ ] At least two alternatives are documented with specific rejection criteria
- [ ] For data classified "confidential" or higher: residency region is specified and vendor commitment is referenced

---

## Model Tier Quick Reference

| Tier | When to choose | Cost signal | Lock-in risk | Review frequency |
|---|---|---|---|---|
| Frontier reasoning | Complex multi-step reasoning; measurable quality gap over lower tiers | $15–75/MTok input | High | Quarterly |
| Frontier general | Standard production workloads; good quality at reasonable cost | $3–15/MTok input | Medium | Every 6 months |
| Efficient | High-volume, latency-sensitive, batch; quality difference is not decision-relevant | $0.20–1.00/MTok input | Low | Annually |
| Self-hosted | Air-gapped; strict residency; cost ceiling hit; GPU infra available | Near-zero marginal | None | On major version change |

---

## Portfolio Register (maintain one per product/programme)

| ADR id | Decision summary | Tier | Status | Owner | Next review | Monthly cost |
|---|---|---|---|---|---|---|
| AI-ADR-001 | | | | | | |
| AI-ADR-002 | | | | | | |

**Portfolio governance rule:** If total accepted-ADR monthly cost exceeds programme budget by >10%, the highest-cost frontier-reasoning ADR must be reviewed first — a tier downgrade almost always has higher ROI than any other optimisation.

---

## Data Classification x Endpoint Matrix

| Data class | Allowed endpoint types | Residency requirement |
|---|---|---|
| Public | Shared-multi-tenant, dedicated, self-hosted | None |
| Internal | Shared-multi-tenant (with data-processing addendum), dedicated, self-hosted | Preferred EU / home region |
| Confidential | Dedicated-provisioned or self-hosted only | Contractually specified region |
| Restricted / PII | Self-hosted or dedicated with encryption-at-rest commitment | Contractually specified + auditable |

---

## Common Mistakes

**"We'll revisit later."** Without a review date and an owner, no review happens. Set the date at decision time.

**Versionless model aliases.** `claude-sonnet` is not a version. Behavior can shift across updates without a code change on your side. Pin to a dated checkpoint or document why you accept behavioral drift.

**Prototype volume in cost projections.** A prototype sending 100 requests/day at $10/month becomes $1,000/month at 10,000 requests/day. Always project at expected production volume.

**No alternatives recorded.** "We evaluated several models" is not a decision record. The document must show what you measured and why it ruled the alternative out.

**Trigger conditions that are not actionable.** "If costs get too high" is not a trigger. "$5,000/month" is a trigger.
