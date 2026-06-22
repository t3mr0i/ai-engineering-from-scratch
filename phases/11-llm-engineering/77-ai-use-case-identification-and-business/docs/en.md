# AI Use Case Triage: From Discovery to Prioritized Backlog (2026)

> McKinsey's 2025 State of AI survey found that organizations with a structured use-case triage process reached production 2.4x faster than those that went straight from "idea" to "build." The gap is not model capability — it is the absence of a decision gate that separates high-ROI, technically feasible projects from the long tail of plausible-sounding but economically marginal ones. By 2026, the commodity risk is not building on the wrong model; it is investing six weeks of engineering time in a use case that a back-of-envelope calculation would have ruled out in an afternoon. This lesson gives you that calculation — and the structured process around it that converts a raw idea list into a prioritized, sponsor-ready backlog.

**Type:** Learn
**Languages:** Python (stdlib — use-case scoring and triage engine)
**Prerequisites:** Phase 11 · 32 (AI use-case identification workshop), Phase 11 · 10 (Evaluation basics)
**Time:** ~45 minutes

## The Problem

The first failure mode is over-enthusiasm: a discovery workshop produces twenty candidate use cases, all of which look good in a slide deck, and the team picks one to build based on who argued loudest in the room. Six months later the project is cancelled because the process it was automating turned out to be too exception-heavy for a language model, or because the business owner moved on and no one could quantify the value to justify continued investment.

The second failure mode is analysis paralysis: the team builds a rigorous scoring model with twelve weighted criteria, spends two weeks collecting data to populate it, and by the time a prioritized list exists the business sponsor has lost patience and commissioned a competitor to prototype something instead. The engineering question for 2026 is not "how do we score use cases" — it is: what is the minimum viable triage that rules out the bad ones fast, surfaces the two or three worth building, and produces an artifact the sponsor can sign off on in a single meeting?

## The Concept

### The triage funnel

Use case identification is a funnel, not a scoring matrix. Each stage is designed to fail fast on different failure modes, so effort scales with promise.

| Stage | Question answered | Output | Typical time |
|---|---|---|---|
| **0 — Capture** | What do we have? | Raw idea list (no filter) | 2-hour workshop |
| **1 — LLM fit** | Is this even an LLM problem? | Ideas that pass technical filter | 30 minutes |
| **2 — Value estimate** | Is the prize worth chasing? | Back-of-envelope ROI per idea | 1-2 hours |
| **3 — Feasibility scan** | Can we build it in the data/infra we have? | Go / No-go per idea | 1 day |
| **4 — Risk screen** | Will legal/compliance let us ship it? | Cleared candidates | 1-2 days |
| **5 — Scoring & ranking** | In what order do we build? | Prioritized backlog | 1 meeting |

The key discipline: do not let stage-5 work (detailed scoring) happen at stage-1 scale. This sounds obvious and is violated in the majority of real engagements.

### Stage 1 — LLM fit

Not every automation problem is an LLM problem. Three questions reveal fit quickly:

1. **Is the task language-shaped?** LLMs excel at reading, writing, classifying, extracting, and transforming natural language and code. If the task is fundamentally a lookup, a calculation, or a sensor-reading pipeline, a simpler deterministic system wins.
2. **Is human judgment involved?** If the current process requires expert judgment that is hard to make explicit (contract review, clinical note summarization, technical proposal scoring), that is a signal of LLM fit — provided the judgment is recoverable from text. If the judgment requires physical inspection or real-time sensor data, it is not.
3. **Is variance acceptable?** LLMs produce variable output. Some tasks have zero tolerance for variance (tax calculation, regulatory reporting). Others are built around it (drafting, brainstorming, synthesis). If variance must be zero, the task requires a hybrid where LLM output is always rule-verified downstream.

A use case that fails any of these three questions should be classified as "wrong tool" and handed off to a simpler automation track. Keeping it on the LLM backlog wastes feasibility-scan effort on the wrong architecture.

### Stage 2 — Value estimate

The back-of-envelope ROI model has two lines:

```
Annual value = volume × time_saved_minutes × FTE_rate_per_minute × automation_rate
Annual cost  = (token_cost_per_task × volume) + (engineering_months × monthly_rate) + ops_overhead
```

Both numbers are rough. The point is not accuracy — it is whether the ratio is 10:1, 2:1, or less than 1:1. A 10:1 ratio survives aggressive assumption-challenging. A 2:1 ratio dies on the first CFO review. Anything below 1:1 is a research project and should be labelled honestly.

For 2026 pricing: Claude Sonnet 4.x runs at approximately $3/MTok in, $15/MTok out; Haiku 4 at $0.80/$4. A typical document-processing task at 2,000 tokens in + 500 tokens out costs roughly $0.014 per call at Sonnet pricing, $0.004 at Haiku. At 50,000 calls per year that is $700 vs. $200 in token cost — often an order of magnitude below the labour cost avoided. Run the numbers before assuming cost is the binding constraint.

### Stage 3 — Feasibility scan

Five questions, each with a binary answer. One "no" does not kill the use case, but it adds a dependency that must be resolved before sprint 1.

| Question | What a "no" means |
|---|---|
| Do we have the input data and can we access it? | Data engineering work before prototype |
| Is the output format deterministic enough to evaluate? | Need to define an eval rubric first (Phase 11 · 10) |
| Is the latency requirement compatible with LLM inference? | Need streaming, caching (Phase 11 · 11), or async architecture |
| Do we have a subject-matter expert who can label 50-100 examples? | No eval = no shipping; block until resolved |
| Is there a working prototype path that does not require fine-tuning? | Fine-tuning adds 3-6 weeks and a training-data requirement |

A use case that has all five "yes" answers is a quick win. A use case with three "no" answers is a strategic project. Strategic projects are not ruled out — but they require a different plan, a different budget, and a different sponsor conversation.

### Stage 4 — Risk screen

The EU AI Act (effective August 2026) classifies AI systems into four risk tiers. Any use case that touches a high-risk category (recruitment, credit scoring, critical infrastructure, law enforcement, medical devices, biometrics) requires a conformity assessment and is not a quick win regardless of ROI.

| EU AI Act tier | Examples | Minimum compliance action |
|---|---|---|
| **Unacceptable risk** (banned) | Social scoring, real-time biometric surveillance in public | Do not build |
| **High risk** | CV screening, loan decisioning, safety-critical systems | Conformity assessment, human oversight, audit trail |
| **Limited risk** | Chatbots, deepfakes | Transparency obligation (disclose AI use) |
| **Minimal risk** | Spam filters, document summarisation | No specific obligation |

Beyond the Act: internal data classification matters equally. A use case that requires feeding customer PII into an external model API needs a data processing agreement and a DPIA under GDPR. If those do not exist, the use case is blocked regardless of its ROI.

For the risk screen in a triage context, the output is one of three: `green` (no special process), `amber` (needs legal/compliance review before proceeding), or `red` (blocked or requires architectural redesign to proceed).

### Stage 5 — Scoring and ranking

After the funnel, surviving candidates are typically three to eight use cases. Score them on three dimensions:

| Dimension | Weight | What to measure |
|---|---|---|
| **Business value** | 40% | Estimated annual value (Stage 2) normalized to 1-10 |
| **Implementation speed** | 35% | Number of feasibility blockers; inverse (fewer = faster) |
| **Strategic fit** | 25% | Does it demonstrate capability the organization wants to grow? |

Composite score = (value × 0.4) + (speed × 0.35) + (fit × 0.25). The top two or three by composite score form the quick-win sprint plan. The next two or three become strategic project proposals. Everything else goes to a "revisit in 6 months" pile.

Do not present the scoring matrix to a business sponsor. Present the conclusion: "Here are the two use cases we recommend starting with, here is why, and here is what we need from you to start next Monday." The matrix is your working document, not the deliverable.

### Quick wins vs strategic projects

The single most useful classification a triage produces is not a ranking — it is the quick-win / strategic-project split.

**Quick win criteria:** all feasibility boxes ticked, ROI ratio > 5:1, risk screen green, prototype possible in 2-3 weeks with existing data and a Sonnet-class model out of the box.

**Strategic project criteria:** one or more feasibility dependencies, ROI ratio 2-5:1, requires fine-tuning or RAG pipeline or compliance review, value is high enough to justify the setup cost.

Quick wins build organizational trust and generate real eval data. Strategic projects build real competitive advantage. You need both tracks, and you should name them honestly in the sponsor conversation.

For cross-lesson context: Phase 11 · 32 (the use-case identification workshop) is where the idea list is generated. Phase 11 · 10 (evaluation) is where you build the eval rubric that Stage 3 requires. Phase 11 · 11 (caching and cost) is where you refine the Stage 2 cost model once a prototype exists. Phase 17 · 27 (FinOps for LLMs) is where the cost model becomes an ongoing monitoring practice in production.

## Use It

`code/main.py` implements a deterministic, stdlib-only model of the triage funnel. It takes a list of candidate use cases, each described by a small set of structured attributes, and runs them through all five stages. Stage 1 outputs an LLM-fit verdict; Stage 2 computes back-of-envelope ROI; Stage 3 counts feasibility blockers; Stage 4 applies the risk screen; Stage 5 scores and ranks the survivors. The driver prints a stage-by-stage trace for each use case and ends with a HEADLINE that shows the quick-win shortlist and strategic project candidates.

## Ship It

`outputs/skill-use-case-triage.md` is a one-page paste-and-use decision aid for a working consultant: a triage checklist that runs a single use case through all five stages and produces a sponsor-ready verdict with supporting numbers.

## Exercises

1. Run `code/main.py`. Which use case is eliminated at Stage 1, and why? Change its `language_shaped` attribute to `True` and re-run — does it survive to Stage 5, and what rank does it reach?

2. The output shows one use case blocked at Stage 4 (risk screen amber or red). What change to the architecture description would move it to green? Name the GDPR mechanism and the EU AI Act tier that apply.

3. Estimate the annual token cost for a real use case in your current project or team: pick a document-processing task, estimate call volume and token counts, and use current Sonnet 4.x pricing. Is token cost above or below 10% of the labour cost avoided? What does that ratio imply for where to focus optimization effort?

4. Run `code/main.py` and find the use case with the highest ROI ratio but the lowest composite score. Explain in two sentences why ROI alone is not a sufficient ranking criterion, and which Stage 3 or Stage 4 factor is the bottleneck.

5. Pick a use case from your own work context. Fill in the five feasibility scan questions and the Stage 4 risk screen verbally. Would it be a quick win or a strategic project? What is the single biggest dependency that must be resolved before sprint 1 can start?

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Use case triage | "Prioritization" | A staged funnel that eliminates bad candidates fast before detailed scoring |
| LLM fit | "Is this an AI problem?" | Whether the task is language-shaped, involves recoverable judgment, and tolerates variance |
| Back-of-envelope ROI | "Business case" | Volume × time saved × rate minus token + engineering cost; directional, not precise |
| Quick win | "Low-hanging fruit" | All feasibility gates green, ROI > 5:1, prototype in 2-3 weeks without fine-tuning |
| Strategic project | "Big initiative" | One or more feasibility dependencies; value justifies setup cost but requires a longer plan |
| EU AI Act high-risk | "Regulated AI" | Eight categories requiring conformity assessment and human oversight before deployment |
| Composite score | "Overall ranking" | Weighted combination of value, speed, and fit — working document, not the sponsor deliverable |
| Feasibility blocker | "Dependency" | A specific missing input (data, eval rubric, latency headroom, SME) that must be resolved before sprint 1 |

## Further Reading

- [EU AI Act — Official text and annexes](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — the authoritative source for risk tiers and conformity assessment requirements.
- [McKinsey — The state of AI](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai) — annual survey; use the most recent edition for current adoption benchmarks.
- [Anthropic — Claude model pricing](https://www.anthropic.com/pricing) — current token costs for Sonnet, Haiku, and Opus; use for Stage 2 cost models.
- [NIST AI Risk Management Framework (AI RMF 1.0)](https://airc.nist.gov/) — the US complement to the EU AI Act; useful when the audience is US-based or the project involves US federal procurement.
- [Google — Responsible AI practices](https://ai.google/responsibility/responsible-ai-practices/) — the published framework closest to what a consulting engagement will reference when the client already uses Google Cloud; pragmatic checklist format.
