# AI Cost and Value Economics: From Token Price to Business Case (2026)

> Claude Sonnet 4.6 costs $3 per million input tokens; Claude Opus 4.7 costs $15. At first glance the choice is a five-fold price difference on a commodity. In practice it is a decision about where your total cost actually lives — and token price is rarely the dominant term. A system prompt cached via prompt caching costs roughly 10% of a cache-miss read. A use case that would cost $40,000/month on frontier models costs under $3,000 when a smaller routed model handles 80% of traffic. By 2026, most organisations that have moved past proof-of-concept have found the same structural problem: an AI initiative that cleared a business case on a spreadsheet fails a production cost audit because nobody modelled input growth, cache hit rates, or the difference between p50 and p99 latency at scale. This lesson frames the economics decision end-to-end, from token-level arithmetic to the business-value denominator that determines whether any cost is acceptable at all.

**Type:** Learn
**Languages:** Python (stdlib — cost model, routing policy, value-case calculator)
**Prerequisites:** Phase 17 · 14 (Prompt semantic caching), Phase 17 · 16 (Model routing)
**Time:** ~45 minutes

## The Problem

Teams benchmark LLM costs per query, build a spreadsheet at anticipated volume, and present a compelling cost-per-transaction number to a steering committee. Three months into production they are over budget. The spreadsheet assumed a flat distribution of query complexity, no ramp-up in context length as conversations grow, a 100% cache miss rate (conservative) or a 100% cache hit rate (optimistic), and a cost-per-value ratio that was never validated against what users actually produce with the output. The real cost grew; the realised value did not.

The engineering question is not "what does this call cost" — it is: what is the full cost structure of this system under realistic traffic, and does the value produced justify that structure at the margin you need? Those are two separate calculations that most teams collapse into one, and the collapse is where budgets fail. Getting both right requires knowing which cost levers actually move the number (it is almost never raw token price), and framing value in terms a finance partner can sign off on — time saved, decisions improved, risk reduced — rather than "it's faster."

## The Concept

### The cost stack

LLM operational cost has four layers. Token price is only one of them.

| Layer | What drives it | Typical leverage |
|---|---|---|
| **Token price** | Model tier × input/output token counts | High if over-using frontier; low once right-sized |
| **Cache economics** | Prompt structure, TTL, hit rate, cache write cost | Often the single highest-leverage lever in production |
| **Routing overhead** | Classifier model cost, latency impact of routing | Low if classifier is cheap; negative ROI if routing adds latency without savings |
| **Operational overhead** | Retries, rate-limit handling, observability tokens (log payloads), fallback calls | Invisible in benchmarks; often 10–25% of raw token cost at scale |

The practical order of operations: right-size the model first (routing policy), then optimise cache structure, then tune operational overhead. Chasing per-token price without addressing the other layers is like negotiating a fuel discount while leaving the engine running overnight.

### Model tiers and the right-sizing decision

As of mid-2026, the major providers each publish a three-tier structure: a frontier model, a mid-tier, and a fast/cheap tier. Anthropic's current lineup spans Haiku (fast/cheap), Sonnet (mid-tier, strong coding and reasoning), and Opus (frontier, highest capability). The 2026 pricing reference point: Sonnet 4.6 at $3/$15 per million tokens (input/output), Opus 4.7 at $15/$75.

Right-sizing uses a routing policy (Phase 17 · 16) to match query complexity to model tier. The economics only work if the routing classifier is cheaper than the savings it generates. A classifier that costs $0.001 per call and diverts 60% of queries from Opus ($0.015/call) to Sonnet ($0.003/call) produces a saving of $0.0072 per diverted call net of classifier cost. At one million queries per month that is $7,200/month — from the routing decision alone, before any prompt optimisation.

Three routing signals are reliable in production: query length (short queries rarely need Opus), task category (creative vs. structured extraction vs. code), and a confidence score from a lightweight classifier trained on your own traffic. Using all three adds robustness; the category signal alone is often sufficient to start.

### Cache economics in detail

Prompt caching (Phase 17 · 14) is the highest-leverage lever for most production systems because system prompts, retrieved context, and few-shot examples are large, expensive to re-send, and stable within a session. The economics:

- **Cache write cost** is typically 25% of input token price (you pay to write the block once).
- **Cache read cost** is typically 10% of input token price (you pay far less each subsequent hit).
- **Break-even** is at two reads per cached block: write at 0.25 + one read at 0.10 = 0.35 total vs. 2 × 1.0 = 2.0 for two uncached reads. By the second read you have already paid for itself.

The structural implication: cache hit rate matters far more than token price. A system with a 70% cache hit rate on a 2,000-token system prompt at Opus prices is cheaper per effective call than a system with 0% hit rate at Haiku prices with the same prompt. In our experience, roughly 7 out of 10 teams shipping LLM features in 2026 still do not log cache hit rate as a first-class metric; it should be a first-class metric in every LLM cost dashboard.

The single biggest structural mistake is a system prompt that is different for every user, preventing any caching at all. Common causes: embedding user name or current timestamp in the system prompt, personalisation that belongs in the user turn, or dynamic injection of per-session state into the static prefix.

### The value denominator

Cost is only meaningful relative to value. The framing that survives finance review:

| Value type | Measurement approach | Common trap |
|---|---|---|
| **Time saved** | Baseline task time × FTE rate × task volume | Counting gross time; the real number is net after time to review/correct AI output |
| **Decision quality** | Error rate reduction × cost per error | Requires a baseline; most teams skip it and can't defend the number later |
| **Risk reduction** | Regulatory penalty avoidance × probability reduction | Conservative estimates survive more scrutiny than aggressive ones |
| **Revenue enablement** | New product/feature made possible, capacity freed | Hardest to isolate; use it as secondary support, not primary case |

The ratio that matters is **cost per unit of value created**, not cost per query. A system that costs $0.05/query but produces zero reviewable output for 40% of queries has an effective cost-per-useful-output of $0.083. A system that costs $0.12/query with a 95% useful-output rate costs $0.126 per useful output — and the second system may have a lower total-cost-of-ownership at scale despite the higher per-query price.

### Total cost of ownership beyond token spend

Production AI systems accrue cost outside the API bill:

- **Observability infrastructure** — logging payloads for debugging adds token-equivalent data volume. Plan for a Datadog / OpenTelemetry pipeline that samples rather than logs everything.
- **Evaluation and red-teaming** — a continuous eval pipeline (Phase 14 · 38-style adversarial testing) is not optional in regulated industries. Budget it explicitly.
- **Prompt engineering labour** — iterating a system prompt to reduce average output tokens by 15% is a non-trivial engineering effort with a real payback period.
- **Human review at threshold** — any use case requiring human-in-the-loop adds FTE cost that must be in the model.

A useful rule of thumb: API token spend is typically 40–70% of total LLM operating cost in a mature production system. Planning as if it is 100% understates the true cost by 1.4–2.5×.

### FinOps practices for LLM systems

FinOps for LLMs (Phase 17 · 27) introduces practices from cloud financial management: tagging, showback, chargeback, and anomaly alerting. The LLM-specific adaptations:

- **Tag every API call** with use-case, team, model tier, and environment. Without tagging, you cannot separate dev traffic from prod or attribute cost to a specific product line.
- **Set spend alerts at 80% of monthly budget**, not at the limit. An alert at the limit fires after the overage, not before.
- **Track cost-per-useful-output** as the primary KPI, not cost-per-query. This is the metric that survives a business review.
- **Review routing policy monthly** against actual traffic distributions. Traffic mix drifts; a routing policy tuned on month-1 data may be suboptimal by month-4.

## Use It

`code/main.py` models the three core decisions this lesson is about in a single runnable program:

1. A **cost model** that computes per-call cost under different cache-hit-rate assumptions, showing how hit rate dominates the per-query cost curve.
2. A **routing policy simulator** that applies a simple three-signal rule to a set of synthetic queries and shows the cost difference between "always Opus" and the routed outcome.
3. A **value-case calculator** that takes a time-saved scenario and computes break-even volume, cost-per-useful-output, and payback period.

Run it to see concrete numbers that match the claims in the exercises.

## Ship It

`outputs/skill-ai-cost-value-decision-aid.md` is a one-page paste-and-use decision aid for a consultant or engineer scoping an AI system: a cost-layer checklist, a value-denominator worksheet, and the three questions any finance partner will ask before signing off on an LLM budget.

## Exercises

1. Run `code/main.py`. Part 1 compares Opus (at varying cache hit rates) against Sonnet with zero caching. There is no crossover: Sonnet uncached is always cheaper per query. Explain in two sentences why this is the expected result — and what it means for the decision of when to use Opus in production at all.

2. Run `code/main.py` and look at the routing simulation. What is the projected monthly saving at 1M queries/month, and what fraction of queries are routed away from Opus? Add a new query to the sample set (choose a category and confidence value) and observe which tier it routes to. Verify your prediction against the routing policy in `route()`.

3. Your system prompt is 3,000 tokens and currently includes the current UTC timestamp. Describe the single change required to make it cacheable, and estimate the monthly saving at 500,000 queries/month using Sonnet 4.6 pricing ($3/M input tokens), assuming an 80% cache hit rate.

4. A product manager argues that the LLM feature "saves 30 minutes per user per week." Identify the two numbers you need to collect before you can put a dollar figure on that claim, and one reason the gross 30-minute estimate overstates the net saving.

5. You are asked to present a three-month LRN deployment cost forecast to a steering committee. List the five line items you must include beyond the raw token spend, and the metric you would propose as the primary production KPI.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Token price | "The cost of the model" | The per-million-token rate; one of four cost layers, not the total cost |
| Cache hit rate | "How often caching helps" | Fraction of input tokens served from cache; the dominant cost lever in production |
| Model routing | "Sending easy queries somewhere cheaper" | A policy that matches query complexity to the cheapest model tier that meets quality bar |
| Cost per useful output | "Real cost per transaction" | Total API cost divided by the count of outputs that meet acceptance criteria |
| Prompt caching | "Reusing the context" | Provider-side caching of a prefix block; reads cost ~10% of a full input pass |
| FinOps for LLMs | "Cloud cost management for AI" | Practices — tagging, showback, alerting — adapted from cloud FinOps to API spend |
| Break-even volume | "When does this pay for itself" | The query volume at which cost savings from a change exceed its implementation cost |
| Value denominator | "What we're measuring against" | The business unit (time, decisions, errors) against which cost per unit is computed |

## Consultant field notes

**The prompt that worked in the demo but failed in production.** A clean two-shot prompt with temperature 0.0 looked magical in five manual tests; the same prompt at 500K queries/month hits a cost ceiling because nobody modelled that the average input grew from 400 to 1,800 tokens as real users pasted context. Lesson: measure token length distribution under live traffic, not under the test set.

**The RAG that returned the right doc but the wrong paragraph.** Vector retrieval nailed the source document 95% of the time, but the chunking strategy surfaced a tangentially related paragraph instead of the operative clause, so the LLM cited confidently and answered wrong. Lesson: retrieval quality is a chunking problem first and an embedding-model problem second.

**The vendor pilot that never made it past the security review.** A six-week paid pilot produced a glowing value case and a champion in the business unit; the procurement and security review then surfaced data-residency, egress logging, and DPIA gaps that needed three more quarters to close. Lesson: loop in security and procurement before the pilot, not after the value case is written.

**The use case everyone approved but nobody wanted.** A steering committee approved the project, the budget cleared, and the model performed to spec — yet adoption stayed at 4% of the intended user base because the workflow sat one click outside the tool the team already used every day. Lesson: distribution is a design constraint; the cheapest model in the world cannot save a feature nobody opens.

**The AI feature that hit a cost ceiling in month two.** Month-one spend tracked at 60% of forecast and looked like headroom; month-two traffic tripled because the feature was embedded in a high-traffic surface, and the per-useful-output cost crossed the budget threshold the week finance started asking. Lesson: cost projections must model growth in eligible traffic, not just per-query efficiency.

## Further Reading

- [Anthropic API pricing](https://www.anthropic.com/pricing) — canonical source for current model prices; check before any cost model is committed to a slide deck.
- [Anthropic — Prompt caching guide](https://docs.claude.com/en/docs/build-with-claude/prompt-caching) — TTL, cache write/read cost structure, and design rules for cacheable prompts.
- [FinOps Foundation — FinOps Framework](https://www.finops.org/framework/) — the vendor-neutral framework for cloud financial management; the LLM adaptation in Phase 17 · 27 maps directly onto the inform/optimise/operate cycle.
- [Martin Fowler — Cost of software](https://martinfowler.com/articles/is-quality-worth-cost.html) — the broader argument for cost-of-quality accounting; the reasoning applies directly to "invest in prompt engineering to reduce output tokens."
- [OpenAI — Latency optimization](https://platform.openai.com/docs/guides/latency-optimization) — model-agnostic guidance on the same cache/route/trim levers; useful as a cross-vendor reference for the same structural decisions.
