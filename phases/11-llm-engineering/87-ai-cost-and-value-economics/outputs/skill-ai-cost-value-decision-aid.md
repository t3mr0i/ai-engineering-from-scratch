# AI Cost & Value Decision Aid

One-page reference for scoping and defending an LLM system budget.

---

## Cost Layer Checklist

Work through each layer before finalising a cost estimate. Token price alone
is never the complete picture.

| Layer | Questions to answer | Common mistake |
|---|---|---|
| **Token price** | Which model tier? Input:output ratio at p50 and p99? | Using p50 average; p99 long-tail calls dominate spend |
| **Cache economics** | Is the system prompt stable across users? What is the expected hit rate? | Embedding user-specific data in the system prompt, preventing all caching |
| **Routing** | Is there a complexity distribution in your traffic? What does a classifier cost? | No routing — 100% of traffic hits frontier even for trivial queries |
| **Operational overhead** | Retry rate, fallback calls, observability payload size? | Forgetting that logged payloads double effective token volume |

Rule of thumb: API token spend is 40–70% of total LLM operating cost in production. Budget the rest.

---

## Cache Hit Rate — The Single Highest-Leverage Lever

| Scenario | Cache hit rate | Relative cost vs 0% hit rate |
|---|---|---|
| System prompt changes every user | 0% | 1.0x (baseline) |
| Session-level caching (same user) | 40–60% | ~0.55x |
| Shared system prompt, high reuse | 70–90% | ~0.30x |

**Make your system prompt cacheable:**
- [ ] Remove timestamps, user names, and per-session state from the system prompt
- [ ] Move personalisation to the user turn
- [ ] Verify the static prefix is identical byte-for-byte across calls
- [ ] Monitor cache hit rate as a first-class production metric

---

## Routing Policy Decision Tree

```
Query arrives
  |
  +-- Category = COMPLEX_REASONING?          --> OPUS
  |
  +-- Routing confidence < 0.70?             --> OPUS
  |
  +-- Total tokens < 600 AND confidence > 0.85
      AND category in {EXTRACTION, SHORT_QA} --> HAIKU
  |
  +-- Otherwise                              --> SONNET
```

Check monthly: traffic mix drifts. A routing policy tuned on month-1 data
may route suboptimally by month-4.

---

## Value Denominator Worksheet

Fill this before presenting a cost number to a finance or steering audience.

| Field | Your value |
|---|---|
| Task name | |
| Baseline time per task (minutes) | |
| AI-assisted net time (incl. review) | |
| FTE hourly rate (fully loaded, USD) | |
| Gross saving per task (USD) | |
| Useful output rate (%) | |
| API cost per task (USD) | |
| **Net saving per task (USD)** | |
| Monthly volume | |
| **Monthly net saving (USD)** | |
| Implementation / integration cost (USD) | |
| **Payback period (months)** | |

Key distinction: **net** time saved = gross time saved minus time to review and
correct AI output. Gross numbers fail finance review; net numbers survive it.

---

## The Three Questions Any Finance Partner Will Ask

1. **"What is your cost per useful output, not per query?"**
   Compute: total API cost / count of outputs that meet acceptance criteria.
   A 12% rejection rate turns a $0.05/query cost into a $0.057/useful-output cost.

2. **"What is the production cost at 3x your forecast volume?"**
   Compute marginal cost at scale. If your routing policy and cache structure
   cannot scale with traffic, the unit economics break at growth.

3. **"What happens to the cost model if hit rate drops to 30%?"**
   Stress-test the cache assumption. Product changes (A/B tests, personalisation
   features, new markets) commonly break caching without warning.

---

## Production KPI Set

| KPI | Target | Alert threshold |
|---|---|---|
| Cache hit rate | >70% for shared system prompts | <50% for 2 consecutive days |
| Cost per useful output | Within 10% of model | >20% above model |
| Routing accuracy | >95% on held-out eval set | <90% |
| Monthly API spend | Within 10% of forecast | >80% of monthly budget mid-month |
| Useful output rate | >90% | <85% |

---

## FinOps Minimum Viable Setup

- [ ] Every API call tagged: use-case, team, model tier, environment (prod/dev/eval)
- [ ] Spend alert at 80% of monthly budget (not at the limit)
- [ ] Cost dashboard shows cost-per-useful-output, not just cost-per-query
- [ ] Routing policy reviewed monthly against actual traffic distribution
- [ ] Evaluation pipeline budget is a separate line item — not absorbed into token spend

---

*Cross-references: Phase 17 · 14 (Prompt caching), Phase 17 · 16 (Model routing), Phase 17 · 27 (FinOps for LLMs)*
