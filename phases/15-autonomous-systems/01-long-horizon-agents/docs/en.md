# The Shift from Chatbots to Long-Horizon Agents

> In 2023 a chatbot answered a question in one turn. In 2026 a frontier model routinely runs minutes to hours on a single task. METR's Time Horizon 1.1 benchmark (January 2026) puts Claude Opus 4.6 at 14+ hours of expert work at 50% reliability. The horizon has been doubling roughly every seven months since GPT-2. Every assumption we built around single-turn chat — context, trust, failure modes, cost, observability — breaks when runs last longer than lunch.

**Type:** Learn
**Languages:** Python (stdlib, horizon-curve simulator)
**Prerequisites:** Phase 14 · 01 (The Agent Loop)
**Time:** ~45 minutes

## The Problem

A chatbot is a stateless function. It takes a prompt, returns a reply, and forgets. Even RAG-equipped systems built through 2024 behave this way: they plan inside a single context window, take one action, and surface the result.

An autonomous agent is different in kind. It runs a loop. It decides when to stop. It spends money — real tokens, real GPU hours, real downstream side effects — during the run. Long-horizon agents amplify every aspect of this: cost grows, error probability grows per step, and the gap between what we can evaluate and what gets shipped widens.

The numbers from METR make this concrete. Between GPT-2 and Claude Opus 4.6, the time horizon (the human task length a model completes at 50% reliability) grew from seconds to half a workday. The doubling time sits near seven months. If the trend holds another year, the 50% horizon hits multi-day tasks. That is qualitatively different from anything the chatbot era designed for.

## The Concept

### The METR Time Horizon, in one paragraph

METR (ex-ARC Evals) fits a logistic curve to task-success probability against the log of expert human completion time. The horizon is the intersection of that curve with the 50% probability line. The suite (HCAST, RE-Bench, SWAA) spans 1-minute through 8+ hour expert tasks in software, cyber, ML research, and general reasoning. The result is a scalar that compresses capability into a single human-legible unit: "this model can do the kind of task an expert spends X hours on."

### What actually breaks when the horizon grows

- **Context.** A 14-hour run emits hundreds of thousands of tokens of observations, tool outputs, and reasoning traces. You can no longer carry the raw history; you need compression, checkpoints, and memory tiers (Phase 14 · 04-06).
- **Trust.** At one turn you can read the whole answer. At 1,000 turns you can't. The review surface shifts from "read the output" to "audit the trajectory."
- **Failure modes.** Short runs fail from capability limits. Long runs additionally fail from drift, loops, reward hacking, and eval-vs-deploy behavior gaps (see below). These failures are invisible until they compound.
- **Cost.** A 14-hour autonomous run of Claude Opus 4.6 at full tool use can burn the budget of a month of chat. Without budgets and kill switches (Lessons 13-14), a single runaway loop pays for a small team.
- **Observability.** Request logs are not enough. You need trajectory-level telemetry, action budgets, and canary tokens to catch silent misbehavior.

### Doubling times and what they imply

Past performance guarantees nothing, but the trend is too consistent to ignore. METR's fit (March 2025) puts the doubling at 7 months on HCAST-style tasks; the January 2026 update narrowed the confidence interval but did not change the slope. If the slope continues:

- 2026 horizon (Claude Opus 4.6 today): ~14 hours
- 2027 horizon (forecast): ~48 hours
- 2028 horizon (forecast): ~1 week

These are straight-line extrapolations, not predictions. They are the scale every design decision in this phase must at least survive.

### Eval-context gaming

The 2026 International AI Safety Report discusses frontier models distinguishing evaluation from deployment contexts. Anthropic's [alignment-faking study](https://arxiv.org/abs/2412.14093) measured faking in 12% of one baseline condition and up to 78% after a reinforcement-learning intervention. METR likewise cautions that its [reported time horizons](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) are idealized capability measurements, not deployment predictions.

Practical consequence: a horizon number is a capability ceiling, not a reliability floor. Production deployment requires your own evals on your own distribution, plus the kill-switches, budgets, HITL checkpoints, and canary tokens covered in the rest of this phase.

### Single-turn vs long-horizon, compared

| Property | Chatbot (single-turn) | Long-horizon agent |
|---|---|---|
| Run length | seconds | minutes to hours |
| Tokens per run | 10^3 | 10^5 to 10^7 |
| State | ephemeral | durable, checkpointed |
| Failure surface | model capability | capability + drift + loops + hacking |
| Review unit | final answer | trajectory |
| Cost profile | predictable | fat-tailed |
| Eval-vs-deploy gap | small | documented and growing |

Every row becomes a lesson in this phase.



## Further Reading

- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) — the original horizon paper and methodology.
- [METR Time Horizons benchmark (Epoch AI)](https://epoch.ai/benchmarks/metr-time-horizons) — current numbers, updated through 2026.
- [Anthropic — Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — internal view on horizon, alignment faking, and deployment gap.
- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) — HCAST, RE-Bench, SWAA suite specs.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — the priority hierarchy that governs long-horizon Claude behavior.
