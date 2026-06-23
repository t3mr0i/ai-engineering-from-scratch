# Green AI Checklist: Sustainable LLM Systems

A one-page decision aid for architecture reviews and consulting engagements.
Work through the four levers in order — each has a different cost of change.

---

## Lever 1: Serving Region

**Question:** Is this workload in the lowest-carbon region compatible with its latency requirement?

| Check | Go | No-go |
|---|---|---|
| Latency requirement | < 500ms SLA allows regional flexibility | Hard < 100ms SLA may constrain region choice |
| Data residency | Region is compliant with data locality rules | Region violates GDPR / sovereignty requirements |
| Carbon intensity | Region < 150 gCO2eq/kWh (see table below) | Region > 300 gCO2eq/kWh with no latency reason |
| Batch vs. real-time | Batch inference → route to lowest-carbon region | Interactive sessions → nearest acceptable region |

**Reference carbon intensity (2025-2026 estimates):**

| Region | gCO2eq/kWh | Cloud labels |
|---|---|---|
| Nordic (SE/NO) | ~27 | aws:eu-north-1, azure:norwayeast |
| France | ~58 | aws:eu-west-3, azure:francecentral |
| US West (OR) | ~115 | aws:us-west-2, azure:westus2 |
| Germany | ~340 | aws:eu-central-1, azure:germanywestcentral |
| US East (VA) | ~370 | aws:us-east-1, azure:eastus |
| SE Asia (SG) | ~430 | aws:ap-southeast-1, azure:southeastasia |
| India (MU) | ~580 | aws:ap-south-1, azure:centralindia |
| Australia (SY) | ~620 | aws:ap-southeast-2, azure:australiaeast |

Action: check cloud provider carbon dashboard before finalizing region. For AWS: Customer Carbon Footprint Tool. For Azure: Emissions Impact Dashboard. For GCP: Carbon Footprint.

---

## Lever 2: Model Tier

**Question:** Is the model tier matched to the task's actual complexity?

| Task type | Appropriate tier | Anti-pattern |
|---|---|---|
| Long-context reasoning, synthesis, agentic planning | Heavyweight (Opus 4.x, Fable 5) | — |
| Structured generation, summarization, Q&A | Midweight (Sonnet 4.6, Gemini Pro 2.x) | Routing here to heavyweight for "safety" |
| Classification, extraction, routing, short-form | Lightweight (Haiku 4.x, Gemini Flash 2.x) | Running high-volume extraction on heavyweight |
| Narrow, repetitive, known output distribution | Fine-tune or local model | None of the above |

**Tier selection checklist:**
- [ ] Does the task require multi-step reasoning or > 10k token context? If no, heavyweight is overkill.
- [ ] Is output a structured schema (JSON, classification label, short answer)? Lightweight handles this.
- [ ] Has the lighter-tier model been validated on a representative sample (n >= 100) before routing live traffic?
- [ ] Is there a fallback to a heavier model for confidence-scored low outputs?

Relative compute: midweight ~0.1-0.2× heavyweight; lightweight ~0.02-0.05×. Energy cost is proportional.

---

## Lever 3: Prompt Efficiency

**Question:** Does every token in this prompt contribute to output quality?

**Three patterns to eliminate:**

| Pattern | Symptom | Fix |
|---|---|---|
| Context stuffing | Full document in prompt when only one section is needed | Use RAG; pass only retrieved chunks |
| Verbose instruction padding | Filler phrases ("Please carefully...", "As an expert...") | Delete; write declarative imperatives only |
| Unconstrained output length | No format or length directive; model writes paragraphs | Add: `Return JSON: {key: value}` or `One sentence.` |

**Prompt efficiency review:**
- [ ] Count tokens before and after removing filler phrases. Any > 10% savings? Remove them.
- [ ] Is there an explicit output format instruction? Add one if not.
- [ ] Is the full document being passed when a retrieval step could narrow it? Add RAG if yes.
- [ ] Target: equivalent output quality at 40-60% of the current token count (achievable on most structured tasks).

---

## Lever 4: Caching and Call Volume

**Question:** Are repeat or near-repeat queries hitting the model when a cached response would serve?

| Cache type | Coverage | Complexity | When to use |
|---|---|---|---|
| Exact-match | Low (identical input only) | Trivial | Only for templated, deterministic queries |
| Semantic (vector similarity) | Medium-high (20-60% hit rate on production RAG) | Medium | Any high-volume RAG or Q&A system |
| Application-layer dedup | Variable | Low-medium | Batch jobs, ETL pipelines with near-identical inputs |

**Caching checklist:**
- [ ] What is the estimated cache hit rate for this workload? (Instrument before assuming.)
- [ ] Is the semantic similarity threshold calibrated? (Too loose: wrong answers served. Too tight: low hit rate.)
- [ ] Are cache invalidation rules defined? (Stale cache for time-sensitive content is a correctness risk.)
- [ ] Is cache storage cost accounted for in the ROI calculation?

---

## Quick SCI Calculation

```
SCI = (E × I + M) / R

E = energy per call (kWh) = tokens_per_call / 1000 × energy_per_1k_tokens
    Midweight tier: ~0.0015 kWh / 1k tokens
I = grid carbon intensity of serving region (gCO2eq/kWh) — see table above
M = embodied carbon (usually negligible for API-based workloads; set to 0 for first pass)
R = functional unit: per call, per user session, per document processed

Example: 1,000 tokens, midweight, US East (370 gCO2eq/kWh):
  E = 0.0015 kWh
  SCI = 0.0015 × 370 / 1 = 0.555 gCO2eq per call
  At 1M calls/month: 555 kg CO2/month
  Same workload in Nordic region (27 gCO2eq/kWh): 40.5 kg CO2/month
  Region switch saves 514.5 kg CO2/month — no code change required.
```

---

## Architecture Review Questions

Use these in design reviews and client workshops:

1. What is the grid carbon intensity of each serving region this workload touches?
2. For each LLM call in the system: what is the task type, and what is the model tier? Is the tier justified?
3. What is the average token count per request? Has it been measured, or estimated?
4. Is there a semantic cache in front of the model? What is the measured or projected hit rate?
5. What is the current SCI for this workload? Is it tracked in any observability dashboard?
6. For batch or async workloads: is there a mechanism to route to the lowest-carbon region at scheduling time?

---

## Related Lessons

- Phase 17 · 02 — Inference platform economics (cost/performance tradeoff of tier selection)
- Phase 17 · 16 — Model routing (runtime dynamic tier selection architecture)
- Phase 17 · 27 — FinOps for LLMs (cost controls, proportional to emissions)
- Phase 15 · 13 — Cost governors (runtime budget kill switches)
