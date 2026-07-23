# AI Use Case Triage: From Discovery to Prioritized Backlog (2026)

> McKinsey's 2025 State of AI survey found that organizations with a structured triage process reached production roughly 2.4x faster than teams that went straight from "idea" to "build." The gap is not model capability — the commodity risk in 2026 is not picking the wrong model, it is investing six weeks of engineering time in a use case a back-of-envelope calculation would have ruled out in an afternoon. This lesson gives you that calculation, and the structured process around it that converts a raw idea list into a prioritized, sponsor-ready backlog you can defend in one meeting.

**Type:** Learn
**Languages:** Python (stdlib — use-case scoring and triage engine)
**Prerequisites:** Phase 11 · 32 (AI use-case identification workshop), Phase 11 · 10 (Evaluation basics)
**Time:** ~50 minutes

## The Problem

Two failure modes dominate real engagements, and they look nothing alike in the room but rhyme at the autopsy.

**Failure mode A — over-enthusiasm.** A discovery workshop produces twenty candidate use cases, all of which look good in a slide deck. The team picks one to build based on who argued loudest. Six months later the project is cancelled because the process being automated was too exception-heavy for a language model, or because the business owner moved on and no one could quantify the value.

**Failure mode B — analysis paralysis.** A different team builds a rigorous scoring model with twelve weighted criteria, spends two weeks collecting data, and by the time a prioritized list exists the business sponsor has commissioned a competitor to prototype something instead.

The engineering question for 2026 is not "how do we score use cases" — it is: what is the minimum viable triage that rules out the bad ones fast, surfaces the two or three worth building, and produces an artifact the sponsor can sign off on in a single meeting?

## The Failure Shape: The Contract Reviewer at an Insurer

A composite drawn from three anonymised engagements, named so we can talk about it:

> **The contract reviewer at a mid-size insurer** ran a six-week LLM project to triage inbound commercial-loan agreements. The team picked the use case because the volume was visible (14,000 contracts a year), the executive sponsor was enthusiastic, and a Sonnet-class model extracted clause summaries cleanly in the eval set. They shipped a pilot. Three months in: a junior underwriter flagged that the model had silently re-classified a "change-of-control" clause as a standard assignment clause. The contract language was unusual; the eval set had nothing like it. Legal refused to sign off on the output. The build was correct, the eval was insufficient, and the use case was real but the stage-3 feasibility gate ("Do we have a SME who can label 50-100 examples spanning the unusual-clause distribution?") had been answered yes by an SME who only reviewed common clauses. **The lesson:** Stage 3 is not a checklist you can tick in a 30-minute call. The SME question is "can you label the *hard* examples, not just the easy ones?" If the answer is "I haven't seen those yet," the gate is no, even if the team's enthusiasm is yes.

The shape of this failure — "feasibility gate waved through on common-case evidence, eval set never covered the long tail" — is the single most common reason a triage passes a project that then fails in production. Naming it helps: the **common-case smuggle**.

## The Concept

### The triage funnel

Use case identification is a funnel, not a scoring matrix. Each stage is designed to fail fast on different failure modes, so effort scales with promise.

| Stage | Question answered | Output | Typical time |
|---|---|---|---|
| **0 — Capture** | What do we have? | Raw idea list (no filter) | 2-hour workshop |
| **1 — LLM fit** | Is this even an LLM problem? | Ideas that pass technical filter | 30 minutes |
| **2 — Value estimate** | Is the prize worth chasing? | Back-of-envelope ROI per idea | 1-2 hours |
| **3 — Feasibility scan** | Can we build it with the data/infra we have? | Go / No-go per idea | 1 day |
| **4 — Risk screen** | Will legal/compliance let us ship it? | Cleared candidates | 1-2 days |
| **5 — Scoring & ranking** | In what order do we build? | Prioritized backlog | 1 meeting |

The key discipline: do not let stage-5 work (detailed scoring) happen at stage-1 scale. This is obvious and is violated in the majority of real engagements.

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
Annual cost  = (token_cost_per_task × volume) + (engineering_months × monthly_rate) / 3 + ops_overhead
```

Both numbers are rough. The point is not accuracy — it is whether the ratio is 10:1, 2:1, or less than 1:1. A 10:1 ratio survives aggressive assumption-challenging. A 2:1 ratio dies on the first CFO review. Anything below 1:1 is a research project and should be labelled honestly.

**Current pricing, approximate.** In our experience on 2026 engagements, Claude Sonnet 4.x is roughly $3 / MTok in and $15 / MTok out; Haiku 4 is roughly $0.80 / MTok in and $4 / MTok out; Opus 4.x is roughly $15 / MTok in and $75 / MTok out. A typical document-processing call (2,000 tokens in + 500 tokens out) is approximately $0.014 at Sonnet, $0.004 at Haiku, $0.068 at Opus. At 50,000 calls per year that is $700 vs. $200 vs. $3,400 in token cost — usually an order of magnitude below the labour cost avoided, and almost never the binding constraint in early triage. **Where token cost becomes binding:** long-context RAG pipelines (10K+ tokens in per query) at high call volume, or agent loops that fan out 20-50 sub-calls per user request. In those shapes, the Stage 2 cost estimate should multiply the per-call token cost by the expected number of model calls per user task, not the number of user tasks. Mistaking per-task cost for per-call cost is the second most common Stage 2 error.

### Stage 3 — Feasibility scan

Five questions, each with a binary answer. One "no" does not kill the use case, but it adds a dependency that must be resolved before sprint 1.

| Question | What a "no" means |
|---|---|
| Do we have the input data and can we access it? | Data engineering work before prototype |
| Is the output format deterministic enough to evaluate? | Need to define an eval rubric first (Phase 11 · 10) |
| Is the latency requirement compatible with LLM inference? | Need streaming, caching (Phase 11 · 11), or async architecture |
| Do we have a subject-matter expert who can label 50-100 examples spanning the *hard* cases? | No eval = no shipping; block until resolved |
| Is there a working prototype path that does not require fine-tuning? | Fine-tuning adds 3-6 weeks and a training-data requirement |

A use case with all five "yes" answers is a quick win. A use case with three "no" answers is a strategic project. Strategic projects are not ruled out — but they require a different plan, a different budget, and a different sponsor conversation.

### Stage 4 — Risk screen

The EU AI Act (effective August 2026) classifies AI systems into four risk tiers. Any use case that touches a high-risk category (recruitment, credit scoring, critical infrastructure, law enforcement, medical devices, biometrics) requires a conformity assessment and is not a quick win regardless of ROI.

| EU AI Act tier | Examples | Minimum compliance action |
|---|---|---|
| **Unacceptable risk** (banned) | Social scoring, real-time biometric surveillance in public | Do not build |
| **High risk** | CV screening, loan decisioning, safety-critical systems | Conformity assessment, human oversight, audit trail |
| **Limited risk** | Chatbots, deepfakes | Transparency obligation (disclose AI use) |
| **Minimal risk** | Spam filters, document summarisation | No specific obligation |

Beyond the Act: internal data classification matters equally. A use case that requires feeding customer PII into an external model API needs a data processing agreement and a DPIA under GDPR. If those do not exist, the use case is blocked regardless of its ROI. In our experience, the DPIA conversation is what catches most "looks like a quick win" projects at the last gate — the data classification is a property of the data, not the model, and it is almost never flagged at the discovery workshop.

For the risk screen in a triage context, the output is one of three: `green` (no special process), `amber` (needs legal/compliance review before proceeding), or `red` (blocked or requires architectural redesign to proceed).

### Stage 5 — Scoring and ranking

After the funnel, surviving candidates are typically three to eight use cases. Score them on three dimensions:

| Dimension | Weight | What to measure |
|---|---|---|
| **Business value** | 40% | Estimated annual value (Stage 2) normalized to 1-10 |
| **Implementation speed** | 35% | Number of feasibility blockers; inverse (fewer = faster) |
| **Strategic fit** | 25% | Does it demonstrate capability the organization wants to grow? |

Composite score = (value × 0.4) + (speed × 0.35) + (fit × 0.25). The top two or three by composite score form the quick-win sprint plan. The next two or three become strategic project proposals. Everything else goes to a "revisit in 6 months" pile.

**Do not present the scoring matrix to a business sponsor.** Present the conclusion: "Here are the two use cases we recommend starting with, here is why, and here is what we need from you to start next Monday." The matrix is your working document, not the deliverable.

### Quick wins vs strategic projects

The single most useful classification a triage produces is not a ranking — it is the quick-win / strategic-project split.

**Quick win criteria:** all feasibility boxes ticked *and* the SME question answered on the hard examples, ROI ratio > 5:1, risk screen green, prototype possible in 2-3 weeks with existing data and a Sonnet-class model out of the box.

**Strategic project criteria:** one or more feasibility dependencies, ROI ratio 2-5:1, requires fine-tuning or RAG pipeline or compliance review, value is high enough to justify the setup cost.

Quick wins build organizational trust and generate real eval data. Strategic projects build real competitive advantage. You need both tracks, and you should name them honestly in the sponsor conversation. **Naming them dishonestly** — calling a strategic project a quick win to win the budget — is the third common failure shape, and the one most likely to end a consulting engagement.

For cross-lesson context: Phase 11 · 32 (the use-case identification workshop) is where the idea list is generated. Phase 11 · 10 (evaluation) is where you build the eval rubric that Stage 3 requires. Phase 11 · 11 (caching and cost) is where you refine the Stage 2 cost model once a prototype exists. Phase 17 · 27 (FinOps for LLMs) is where the cost model becomes an ongoing monitoring practice in production.

## Use It

`code/main.py` implements a deterministic, stdlib-only model of the triage funnel. It takes a list of candidate use cases, each described by a small set of structured attributes, and runs them through all five stages. The driver prints a stage-by-stage trace and then demonstrates the lesson's core insight: a use case that passes every gate on common-case evidence but fails the *hard-example* version of the SME question — the **common-case smuggle** failure shape from the contract reviewer at an insurer.

## Ship It

`outputs/skill-use-case-triage.md` is a one-page paste-and-use decision aid for a working consultant: a triage checklist that runs a single use case through all five stages and produces a sponsor-ready verdict with supporting numbers.


## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Use case triage | "Prioritization" | A staged funnel that eliminates bad candidates fast before detailed scoring |
| LLM fit | "Is this an AI problem?" | Whether the task is language-shaped, involves recoverable judgment, and tolerates variance |
| Back-of-envelope ROI | "Business case" | Volume × time saved × rate minus token + engineering cost; directional, not precise |
| Quick win | "Low-hanging fruit" | All feasibility gates green *on the hard examples*, ROI > 5:1, prototype in 2-3 weeks without fine-tuning |
| Strategic project | "Big initiative" | One or more feasibility dependencies; value justifies setup cost but requires a longer plan |
| Common-case smuggle | "SME signed off" | A use case whose eval covers only common cases passing the SME gate, while hard cases are absent |
| EU AI Act high-risk | "Regulated AI" | Eight categories requiring conformity assessment and human oversight before deployment |
| Composite score | "Overall ranking" | Weighted combination of value, speed, and fit — working document, not the sponsor deliverable |
| Feasibility blocker | "Dependency" | A specific missing input (data, eval rubric, latency headroom, SME) that must be resolved before sprint 1 |

## What to do Monday morning

You have a raw idea list, a sponsor on the calendar, and 60 minutes before the meeting. The minimum viable triage that gets you to a defensible sprint-1 recommendation in that meeting is shorter than the lesson suggests:

1. **Print the idea list, 25 use cases max.** If you have more, the workshop needs narrowing before triage.
2. **Stage 1 (15 minutes).** For each, ask the three LLM-fit questions out loud. One no = ruled out. Expect 30-40% to drop here.
3. **Stage 2 (20 minutes).** For the survivors, do the back-of-envelope ROI on the back of a single sheet per use case. Round aggressively; this is a directional filter, not a model. Expect another 20% to drop on ROI ratio < 2:1.
4. **Stage 3 (20 minutes).** Five binary questions per survivor. Pay attention to the SME question: ask the *hard* version, not the easy one. This is the gate where the common-case smuggle hides.
5. **Stage 4 (10 minutes).** Risk screen on what remains. A high-risk EU AI Act category or a missing DPIA is not a quick win, regardless of ROI.
6. **Stage 5 (10 minutes).** Composite score the survivors. Pick the top two for sprint 1; the next two become strategic-project proposals for the next budget cycle.

Total: ~75 minutes if the idea list is healthy, 90 if the workshop was loose. The deliverable to the sponsor is one paragraph per recommended use case, not the matrix. The matrix is your working document.

The most common time-saver in this hour: do Stage 2 *before* Stage 3. A use case with ROI < 2:1 is not worth a feasibility scan. The most common time-waster: doing Stage 5 with twelve criteria and no weights chosen yet. Pick weights, then score.

## Further Reading

- [EU AI Act — Official text and annexes](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — the authoritative source for risk tiers and conformity assessment requirements.
- [McKinsey — The state of AI](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai) — annual survey; use the most recent edition for current adoption benchmarks.
- [Anthropic — Claude model pricing](https://www.anthropic.com/pricing) — current token costs for Sonnet, Haiku, and Opus; use for Stage 2 cost models.
- [NIST AI Risk Management Framework (AI RMF 1.0)](https://airc.nist.gov/) — the US complement to the EU AI Act; useful when the audience is US-based or the project involves US federal procurement.
- [Google — Responsible AI practices](https://ai.google/responsibility/responsible-ai-practices/) — the published framework closest to what a consulting engagement will reference when the client already uses Google Cloud; pragmatic checklist format.

## Consultant field notes

- **The common-case smuggle.** A use case whose eval covers only the easy examples, signed off by an SME who has not seen the hard ones. Triage passes, production fails. Stage 3 SME question means "the *hard* examples," not "the average examples."
- **The ROI mirage.** Highest ROI ratio does not mean highest priority. Strategic fit and feasibility gates move a use case to the top of the backlog when ROI alone would have parked it; in our experience, the "obvious" ROI winner is usually a strategic project in disguise.
- **The DPIA ambush.** A use case passes every gate, the team is ready to sprint, and the data classification conversation at the end reveals the data flows through a third country without a DPA in place. Stage 4 has to happen *before* the sponsor meeting, not after the prototype.
- **The strategic-project red herring.** Calling a strategic project a quick win to win the budget is the fastest way to lose the sponsor's trust. Strategic projects are not failures — they are the right plan for the right work. Name them.
- **The cost-line misdirection.** Per-task cost and per-call cost are different when the system is an agent loop. A 20-step agent doing 50K tasks at 30 sub-calls each is 1.5M model calls, not 50K. Always multiply before dividing.
- **The composite-score trap.** A composite score is a working artifact for the team, not the deliverable for the sponsor. If you put the matrix in the deck, the sponsor will argue about the weights instead of the conclusion.
