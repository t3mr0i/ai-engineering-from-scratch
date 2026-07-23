# AI Operations: Triage Signals, Runbooks, and Incident Response (2026)

> In 2026 the average gap between an AI quality regression and its detection in production is on the order of 40-60 minutes — long enough to affect thousands of requests. Most teams have some monitoring; the gap is triage. Engineers look at L1 latency (fine), L1 error rate (fine), L4 NPS (lagging), and conclude nothing is wrong. Meanwhile a provider's silent rolling update has shrunk summarisation outputs by 40 percent and no L3 metric exists to catch it. AI incidents fail at the category level before they fail at the technical level: the on-call engineer reaches for the wrong runbook, or no runbook at all, and spends the first hour re-establishing basic facts.

**Type:** Learn
**Languages:** Python (stdlib — incident signal classifier + runbook router)
**Prerequisites:** Phase 17 · 13 (LLM observability), Phase 17 · 23 (SRE for AI)
**Time:** ~45 minutes

## The Problem

Three weeks after an AI feature ships, the product owner notices satisfaction is down 12 percent. The on-call engineer checks latency, error rate, and throughput on the existing SRE dashboard. All three are clean. By the time someone samples 50 outputs by hand and realises outputs are 40 percent shorter than last week, an afternoon has been lost. The provider's status page shows nothing. The team's own dashboards show nothing. The only signal that would have caught it — an L3 output-length distribution panel — was never wired up because nobody owned it.

This is the failure shape we keep seeing across deployments. Anthropic, OpenAI, and Google have each issued post-mortems for silent provider-side regressions since 2024; the pattern is consistent: a model version ships under the same alias, outputs shift in subtle ways (shorter, more refusals, different formatting), and no alarm fires because the L1 dashboard cannot see content. The consulting question is sharper than "set up better dashboards." It is: **what is the minimum viable AI incident response process, and how do you bootstrap it inside an existing SRE org that has never operated an LLM feature before?** The answer depends on classifying the incident within five minutes, reaching for the right runbook, and having a rollback path validated before anything breaks.

## The Concept

### Four incident categories

Every AI production incident falls into one of four buckets. Misidentifying the bucket sends you down the wrong runbook, which is why the triage step is load-bearing.

| Category | What breaks | Typical first signal | First responder |
|---|---|---|---|
| **Quality** | Output content — too short, wrong language, hallucinated facts, dropped context, style drift | User-facing satisfaction drop; LLM-as-judge score drop; output-length distribution shift; manual spot-check | ML engineer / product owner |
| **Cost** | Token spend or API bill spikes beyond budget | Cost per request alert; provider invoice anomaly; context-length p95 shift | Platform engineer |
| **Tool-use / agentic** | Agent calls wrong tool, loops, takes unintended actions, exceeds permission scope | Tool-call error rate; unexpected side-effects in downstream systems; budget exhaustion | Agent ops / platform engineer |
| **Safety** | Harmful, biased, or policy-violating outputs | Trust & safety classifier score; manual escalation from support; regulatory flag | Safety lead / legal |

Triage means assigning the category within five minutes of declaring an incident. If you cannot, your first task is to get enough signal — usually by sampling 20-50 recent model outputs and reading them.

### A named failure shape: "the silent drift"

The single most common production AI incident in our engagement work is not a crash and not a hallucination. It is **silent drift** — a quality regression large enough to affect users but invisible to L1 dashboards because it shows up in *content*, not in *transport*.

The contract reviewer at an insurer ran a Claude-based clause extractor against 40,000 contracts per quarter. The team had L1 (latency, error rate) and L4 (claims-handler satisfaction) on a single Grafana board. In late May 2026 the model provider did a silent rolling update on the Sonnet alias — outputs got 38 percent shorter on average. Latency improved. Errors were flat. The L4 satisfaction score drifted down 11 percent over two weeks, but the quarterly survey was the next datapoint. By the time anyone looked, claims handlers had been pasting summaries that omitted renewal clauses. Three renewal clauses were missed on high-value contracts; legal flagged it before any customer harm, but the post-mortem ran to 14 pages and the team had to retroactively re-run summarisation on three weeks of output.

The lesson is not "buy better monitoring." It is that L3 — AI-specific quality metrics sitting between transport (L1) and business outcome (L4) — is the rung most teams skip, and the rung where silent drift lives. An LLM-as-judge score panel plus an output-length distribution panel would have caught the regression in minutes. The team's existing L1 dashboard could not.

### The signal hierarchy

Not all metrics are equally actionable. This hierarchy extends the standard RED model with AI-specific layers above and below it.

| Layer | Signals | Lag | Action threshold |
|---|---|---|---|
| **L4 — business** | Satisfaction score, task-completion rate, downstream conversion | Hours to days | Incident review; no immediate rollback |
| **L3 — AI quality** | LLM-as-judge coherence/relevance score, hallucination rate, output-length p50/p95 distribution | Minutes (if streaming) | P2 if >10 percent drop for 5+ minutes |
| **L2 — platform** | Token cost per request, context-length p95, prompt-template error rate | Seconds | P2 on cost; P1 if prompt rendering fails |
| **L1 — infrastructure** | API latency p99, error rate 5xx, timeout rate | Seconds | P1 thresholds same as classical SRE |

The most common gap is the missing L3 layer. Teams have L1 (provider API latency) and L4 (NPS) but nothing in between. An LLM-as-judge quality gate at L3 closes the gap. Phase 17 · 13 covers how to implement the judge; this lesson covers what to do when it fires.

### Runbooks

A runbook is a bounded checklist an on-call engineer can execute without deep ML knowledge. Each of the four categories needs one. The structure is identical across all four: **Detect → Scope → Diagnose → Mitigate → Escalate → Post-mortem**.

**Quality runbook (excerpt)**

1. Pull the last 50 model outputs from your log store. Compute mean output length and LLM-as-judge score; compare to a 7-day rolling baseline.
2. Check the provider's status page and changelog. Silent model updates — provider swaps the serving version under the same alias — account for roughly a quarter to a third of quality regressions in our experience.
3. If the provider is clean, `git log --since=<incident_start>` on the prompt template repo. A prompt-template deploy in the incident window is the next most common cause.
4. If both are clean, sample inputs: is there a new input distribution shift (a new traffic source, a new language, a new customer segment)?
5. Mitigation: roll back the prompt template if changed; otherwise pin the model version explicitly (e.g. `claude-sonnet-4-6-20260501` rather than the family alias).
6. Escalate to ML engineer if no root cause found within 30 minutes.

**Cost runbook (excerpt)**

1. Pull cost-per-request telemetry for the last 24 hours. Find the inflection point.
2. Check context-length p95 at the inflection point. A prompt template bug that inlines raw conversation history is the most common cause.
3. Check whether a new feature flag was rolled out that changed system prompt length.
4. Mitigation: revert the template or disable the feature flag. Apply hard token limits (`max_tokens`) to the generation call if the bleed continues.
5. Alert finance if the overrun crosses a pre-agreed threshold — teams should set this number before the incident, not during.

**Tool-use / agentic runbook (excerpt)**

1. Pull tool-call logs for the incident window. Compute tool-call error rate and mean tool-call count per session.
2. Identify whether the agent looped (same tool called more than N times without state change) or diverged (called a tool outside its declared scope).
3. Check whether any MCP server was updated or its schema changed in the incident window. Schema drift is the leading cause of unexpected tool selection.
4. Mitigation: disable the affected tool via the permission layer (Phase 15 · 10). Re-enable only after the schema is reconciled. Reduce `max_turns` as a temporary guard.
5. Escalate to agent ops if the agent took an irreversible side-effect (Phase 15 · 16 covers checkpoint and rollback controls).

**Safety runbook (excerpt)**

1. Flag the session IDs associated with the safety signal. Do not delete logs — preserve for audit.
2. Disable the feature for the affected user segment while investigation continues.
3. Check whether the safety-classifier threshold was recently changed (a common performance-optimisation move that inadvertently raises the false-negative rate).
4. Escalate to Safety lead within 15 minutes, regardless of root cause.
5. Do not mitigate safety incidents by tweaking the system prompt alone — treat as a model-level issue until proven otherwise.

### Severity, ownership, and escalation tree

Adapting PagerDuty-style severity to AI incidents:

| Severity | Definition | Response SLO | Who owns the page |
|---|---|---|---|
| **P1** | Production AI feature down, agent took irreversible side-effect, or producing harmful output | 5 min ack, 30 min mitigation | On-call platform engineer + safety lead |
| **P2** | Quality or cost regression >10 percent sustained for >5 min | 15 min ack, 2 h mitigation | On-call ML engineer |
| **P3** | Quality degradation detected in non-critical path | Next business day | Product owner + ML engineer |
| **P4** | Monitoring gap identified (no regression yet) | Scheduled sprint | ML engineer |

One rule that prevents the most common safety failure: **a safety signal is always at least P1, regardless of traffic volume.** Two affected users matters differently from a quality regression affecting two users.

### Rollback controls and model versioning

Phase 15 · 16 covers checkpoint and rollback for agentic systems. For non-agentic LLM features, the equivalent controls are:

- **Model version pinning.** All major providers expose an explicit version suffix in 2026 (`claude-sonnet-4-6-20260501`, `gpt-4o-2026-01`, `gemini-2-5-pro-2026-04`). Pin the version in your configuration, not the family alias. Automatic upgrades are a convenience that becomes a risk in production.
- **Prompt template versioning.** Treat system prompts as code. They must be in version control, deployed through CI, and rollbackable with a one-line config change. A prompt template that lives only in a database table or a SaaS prompt-store UI is unrollbackable mid-incident.
- **Shadow evaluation.** Before rolling out a new model version, route 5 percent of traffic to the new version in parallel and compare L3 quality metrics to the baseline for 24 hours. This is the AI analogue of canary deployment. Phase 17 · 23 covers implementation in more detail.

### Numbers worth knowing

Rough 2026 ranges from our deployment work, accurate within a factor of two:

- **Cost per 1K output tokens.** Closed-weight frontier (Opus 4.x class): ~$15. Sonnet 4.x class: ~$3. Open-weight served on your own GPU: $0.30-$1.00 fully loaded (GPU + electricity + ops). The gap is real but shrinkable with batching and prefix caching.
- **Latency.** Sonnet 4.x class p50 ~600 ms, p99 ~2.5 s for 1K-token outputs. Opus 4.x roughly 2x. Open-weight served locally: ~80-200 ms p50, p99 highly dependent on your batching.
- **Context windows.** Most frontier models support 200K-1M tokens. The cost lesson: a 500K context call is not 500x a 1K call — it is roughly 8-15x in our experience, and p99 latency moves more than cost does. Set context-length p95 alerts before you set cost alerts; latency is what users feel first.
- **Silent regression rate.** Provider-side silent quality drift of 5-15 percent on a major alias, 1-2 times per year, is roughly what we have observed across multiple vendors since 2024. Pin your version.

### Building the AI ops practice inside an existing SRE org

Most organisations adopting LLM features in 2026 do not start from scratch. They have an existing SRE or platform-engineering practice with established tooling. The integration path:

1. **Add L3 metrics to existing dashboards.** One panel for LLM-as-judge score and one for output-length distribution is sufficient to start.
2. **Register AI incident categories in your incident management system.** Do not let AI incidents land in a generic "application error" bucket.
3. **Write the four runbooks before the first incident.** Teams that write runbooks post-incident write worse ones, because the cognitive load biases the writeup toward the failure mode just seen.
4. **Run a game-day exercise.** Simulate a silent model regression in a staging environment and see whether the team detects it within the SLO. Phase 17 · 13 and Phase 17 · 23 together cover the tooling side.
5. **Agree on rollback authority.** Who is allowed to disable an AI feature in production unilaterally? This must be decided before the incident, not during.

## Consultant field notes

Patterns a senior consultant recognises by name. None of them are subtle after you have seen them once.

1. **The silent drift.** A provider swaps the serving version under the same alias; L1 transport metrics are clean; L4 satisfaction drifts over weeks. Only L3 catches it. If you do not have L3, you have a slow-motion incident.
2. **The prompt-as-config antipattern.** A system prompt lives in a SaaS prompt-store UI edited by product marketing. When the prompt changes the quality regression lands in production before anyone in engineering sees the diff. The fix is version control + CI deploy, not a better UI.
3. **The threshold-lowering trap.** A team tunes the safety classifier threshold down to reduce false positives (a performance win). The false-negative rate climbs; harmful outputs increase; the incident is filed against the model, not against the threshold change. Always check recent threshold edits first on a safety page.
4. **The MCP schema drift.** An MCP server bumps its tool schema. The agent picks the wrong tool, or fails the schema validation and retries 50 times. The fix is pinning the MCP schema version in config, the same way you pin the model version.
5. **The missed kill switch.** An AI feature is producing harmful output. The on-call engineer wants to disable it. There is no documented individual with rollback authority, so three people start a thread to discuss it. The feature runs for another 40 minutes. Decide who can pull the plug before the incident.
6. **The game-day gap.** A team swears their monitoring will catch a silent regression. They have never tested it. They run the game-day exercise and discover their LLM-as-judge panel is three weeks stale because nobody owned it. Write the test, then run the test, then act on the result.

## Use It

`code/main.py` is a deterministic, stdlib-only model of the two decisions this lesson is about:

1. An **incident signal classifier** that takes a set of observed metric deltas and assigns the incident to one of the four categories, with the reasoning shown.
2. A **runbook router** that takes a category plus a set of checked conditions and prints the next step — encoding the Detect → Scope → Diagnose → Mitigate → Escalate chain as an executable policy.

The driver ends with a synthetic *silent drift* incident where a team *should* have caught the regression earlier — demonstrating the failure shape the lesson is built around. No model, no network. The point is to make the decision policy explicit and runnable, the same way Phase 15 · 10 made the permission classifier runnable.

## Ship It

`outputs/skill-ai-incident-triage.md` is a one-page decision aid: signal-to-category mapping, runbook checklist per category, severity table — formatted for pasting into a team runbook wiki or printing for a war-room wall.


## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Incident category | "What kind of outage" | One of four buckets: quality, cost, tool-use, or safety — determines which runbook to open |
| L3 AI quality layer | "AI-specific monitoring" | LLM-as-judge scores and output-distribution metrics sitting between infrastructure (L1) and business (L4) |
| LLM-as-judge | "Using AI to score AI" | A secondary LLM call that scores model output against a rubric; the standard low-latency quality proxy in 2026 |
| Silent drift | "Provider surprise" | A provider serving a different model version without a breaking-change notice; leading cause of unexplained quality regressions |
| Silent model update | "Provider surprise" | Same shape as silent drift; the term preferred in provider post-mortems |
| Model version pinning | "Locking the model" | Using an explicit dated version suffix in the API call so provider rollouts do not affect production automatically |
| Shadow evaluation | "Canary for LLMs" | Routing a small traffic fraction to a new model version and comparing L3 metrics before full rollout |
| Runbook | "The procedure" | A bounded, on-call-executable checklist: Detect → Scope → Diagnose → Mitigate → Escalate → Post-mortem |
| Rollback authority | "Who can pull the plug" | The pre-agreed individual or role allowed to disable an AI feature in production unilaterally during an incident |
| Threshold-lowering trap | "Tuning the safety dial" | Lowering the safety classifier threshold to cut false positives; raises false negatives; the next safety incident is filed against the model, not the threshold |
| MCP schema drift | "Tools changed underneath us" | MCP server schema bumped without coordination; agent picks wrong tool or loops on validation errors |
| Kill switch | "Emergency stop" | The pre-agreed mechanism to disable an AI feature mid-incident, including documented ownership |

## Further Reading

- [Google SRE Book — Chapter 14: Managing Incidents](https://sre.google/sre-book/managing-incidents/) — the foundation incident management model this lesson adapts for AI.
- [Anthropic — Model changelog and version pinning](https://docs.claude.com/en/docs/about-claude/models) — the canonical reference for pinning Claude model versions with dated suffixes.
- [OpenAI — Production best practices](https://platform.openai.com/docs/guides/production-best-practices) — OpenAI's own guide to monitoring, rollback, and safety in deployment.
- [NIST AI Risk Management Framework (AI RMF 1.0)](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) — the US federal framework for AI risk management; the GOVERN function maps directly to incident ownership and escalation tree design.
- [PagerDuty — Incident Response Docs](https://response.pagerduty.com/) — the operational incident response playbook this lesson's severity table and runbook structure are adapted from.