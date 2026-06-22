# AI Operations: Triage Signals, Runbooks, and Incident Response (2026)

> In 2026, teams running AI features in production report that the average time between a model quality regression and its detection is 47 minutes — long enough to affect thousands of users. The gap is not a monitoring gap; most teams have some metrics. The gap is a *triage* gap: engineers do not know which signal to look at first, whether a spike is a model issue or a data issue, or who owns the page at 2 a.m. AI incidents fail at the category level before they fail at the technical level. A repeatable AI operations practice needs four runbooks — quality, cost, tool-use, and safety — and a clear escalation tree that does not assume the on-call engineer understands transformer internals.

**Type:** Learn
**Languages:** Python (stdlib — incident signal classifier + runbook router)
**Prerequisites:** Phase 17 · 13 (LLM observability), Phase 17 · 23 (SRE for AI)
**Time:** ~45 minutes

## The Problem

An AI feature ships. Three weeks later the product owner notices that a key satisfaction metric is down 12 percent. The on-call engineer looks at latency (fine), error rate (fine), throughput (fine). The classic SRE dashboard tells them nothing is wrong. The real issue is that a model provider did a silent rolling update and the summarisation task has been producing outputs 40 percent shorter than before — which no one was measuring. By the time the incident is declared, the team has lost an afternoon to establishing basic facts: what broke, when, and where in the stack.

This is not a hypothetical. Anthropic, OpenAI, and Google have each issued post-mortems for provider-side silent regressions since 2024. The consulting question is sharper than "set up better dashboards." It is: **what is the minimum viable AI incident response process, and how do you bootstrap it inside an existing SRE org that has never operated an LLM feature before?** The answer depends on how you classify the incident, which runbook you reach for, and whether you have a rollback mechanism already validated before anything goes wrong.

## The Concept

### Four incident categories

Every AI production incident falls into one of four categories. Misidentifying the category sends you down the wrong runbook, which is why the triage step is load-bearing.

| Category | What breaks | Typical first signal | First responder |
|---|---|---|---|
| **Quality** | Output content — too short, wrong language, hallucinated facts, dropped context | User-facing satisfaction metric; LLM-as-judge score drop; manual spot-check | ML engineer / product owner |
| **Cost** | Token spend or API bill spikes beyond budget | Cost per request alert; provider invoice anomaly; context-length histogram shift | Platform engineer |
| **Tool-use / agentic** | Agent calls wrong tool, loops, takes unintended actions, violates permission scope | Tool-call error rate; unexpected side-effects in downstream systems; budget exhaustion | Agent ops / platform engineer |
| **Safety** | Harmful, biased, or policy-violating outputs | Trust & safety classifier score; manual escalation from support; regulatory flag | Safety lead / legal |

Triage means assigning the category within five minutes of declaring an incident. If you cannot assign a category, your first task is to get enough signal to do so — usually by sampling 20–50 recent model outputs and eyeballing them.

### The signal hierarchy

Not all metrics are equally actionable. This hierarchy applies to AI feature incidents; it extends the standard RED (Rate, Errors, Duration) model with AI-specific layers above and below it.

| Layer | Signals | Lag | Action threshold |
|---|---|---|---|
| **L4 — business** | Satisfaction score, task-completion rate, downstream conversion | Hours–days | Incident review; no immediate rollback |
| **L3 — AI quality** | LLM-as-judge coherence/relevance score, hallucination rate, output-length distribution | Minutes (if streaming) | P2 if >10% drop for 5+ minutes |
| **L2 — platform** | Token cost per request, context-length p95, prompt-template error rate | Seconds | P2 on cost; P1 if prompt rendering fails |
| **L1 — infrastructure** | API latency p99, error rate 5xx, timeout rate | Seconds | P1 thresholds same as classical SRE |

The most common gap is the missing L3 layer. Teams have L1 (provider API latency) and L4 (NPS), but nothing in between. An LLM-as-judge quality gate at L3 closes that gap. Phase 17 · 13 covers implementing the judge; this lesson covers what to do when it fires.

### Runbooks

A runbook is a bounded checklist that an on-call engineer can execute without deep ML knowledge. Each of the four categories needs one. The structure is identical across all four: **Detect → Scope → Diagnose → Mitigate → Escalate → Post-mortem**.

**Quality runbook (excerpt)**

1. Pull the last 50 model outputs from your log store and compute mean output length and LLM-as-judge score. Compare to the 7-day baseline.
2. Check the provider's status page and changelog. Silent model updates (provider switches the serving version without notice) account for roughly 30 percent of quality regressions.
3. If the provider is clean, check whether any prompt template was deployed in the incident window (`git log --since=<start>`).
4. If clean, sample inputs: is there a new input distribution shift (e.g., a new traffic source, a new language)?
5. Mitigation: roll back the prompt template if changed; otherwise pin the model version explicitly (most providers now expose a `-YYYYMMDD` suffix or a stable model alias).
6. Escalate to ML engineer if no root cause found within 30 minutes.

**Cost runbook (excerpt)**

1. Pull cost-per-request from your telemetry for the last 24 hours. Find the inflection point.
2. Check context-length p95 at the inflection point. A prompt template bug that inlines raw conversation history is the most common cause.
3. Check whether a new feature flag was rolled out that changed system prompt length.
4. Mitigation: revert the template or disable the feature flag. Apply hard token limits (`max_tokens`) to the generation call if bleeding continues.
5. Alert finance if the overrun crosses a defined threshold (teams should pre-define this number, not decide it during the incident).

**Tool-use / agentic runbook (excerpt)**

1. Pull tool-call logs for the incident window. Compute tool-call error rate and mean tool-call count per session.
2. Identify whether the agent looped (same tool called >N times in a session without progress) or diverged (called a tool outside its declared scope).
3. Check whether any MCP server was updated or its schema changed in the incident window — schema drift is the leading cause of unexpected tool selection.
4. Mitigation: disable the affected tool via the permission layer (Phase 15 · 10 covers permission modes). Re-enable after the schema is reconciled. Reduce `max_turns` as a temporary guard.
5. Escalate to agent ops if the agent took an irreversible side-effect (Phase 15 · 16 covers checkpoint and rollback controls).

**Safety runbook (excerpt)**

1. Flag the session IDs associated with the safety signal. Do not delete logs — preserve for audit.
2. Disable the feature for the affected user segment while investigation is in progress.
3. Check whether the safety-classifier threshold was recently changed (a common performance-optimisation move that inadvertently raises the false-negative rate).
4. Escalate to Safety lead within 15 minutes, regardless of root cause.
5. Do not mitigate safety incidents by tweaking the system prompt alone — treat as a model-level issue until proven otherwise.

### Severity, ownership, and escalation tree

Adapting PagerDuty-style severity to AI incidents:

| Severity | Definition | Response SLO | Who owns the page |
|---|---|---|---|
| **P1** | Production AI feature down or producing harmful output | 5 min ack, 30 min mitigation | On-call platform engineer + safety lead |
| **P2** | Quality or cost regression >10% sustained for >5 min | 15 min ack, 2 h mitigation | On-call ML engineer |
| **P3** | Quality degradation detected in non-critical path | Next business day | Product owner + ML engineer |
| **P4** | Monitoring gap identified (no regression yet) | Scheduled sprint | ML engineer |

One rule that prevents the most common failure: **a safety signal is always at least P1, regardless of traffic volume.** Two affected users matters differently from a quality regression affecting two users.

### Rollback controls and model versioning

Phase 15 · 16 covers checkpoint and rollback for agentic systems. For non-agentic LLM features, the equivalent controls are:

- **Model version pinning.** In 2026 all major providers expose an explicit version suffix (e.g., `claude-sonnet-4-6-20260501`, `gpt-4o-2026-01`). Pin the version in your configuration, not just the model family. Automatic upgrades are a convenience that becomes a risk in production.
- **Prompt template versioning.** Treat system prompts as code. They must be in version control, deployed through CI, and rollbackable with a one-line config change. A prompt template that lives only in a database table or a SaaS prompt-store UI is unrollbackable in the middle of an incident.
- **Shadow evaluation.** Before rolling out a new model version, route 5 percent of traffic to the new version in parallel and compare L3 quality metrics to the baseline for 24 hours. This is the AI analogue of canary deployment. Phase 17 · 23 covers its implementation in more detail.

### Building the AI ops practice inside an existing SRE org

Most organisations adopting LLM features in 2026 do not start from scratch. They have an existing SRE or platform-engineering practice with established tooling (Grafana, PagerDuty, Datadog, or similar). The integration path:

1. **Add L3 metrics to existing dashboards** — one panel for LLM-as-judge score and one for output-length distribution is sufficient to start.
2. **Register AI incident categories in your incident management system** — do not let AI incidents land in a generic "application error" bucket.
3. **Write the four runbooks before the first incident** — teams that write runbooks post-incident write worse ones, because the cognitive load of the incident biases toward the specific failure mode just seen.
4. **Run a game-day exercise** — simulate a silent model regression (swap the model version in a staging environment and see whether the team detects it within the SLO). Phase 17 · 13 and Phase 17 · 23 together cover the tooling side of this exercise.
5. **Agree on rollback authority** — who is allowed to disable an AI feature in production unilaterally? This must be decided before the incident, not during.

## Use It

`code/main.py` implements two deterministic, stdlib-only models of the core decisions in this lesson:

1. An **incident signal classifier** that takes a set of observed metric deltas and assigns the incident to one of the four categories (quality, cost, tool-use, safety), with the reasoning shown.
2. A **runbook router** that takes a category and a set of checked conditions and prints the next step — encoding the "Detect → Scope → Diagnose → Mitigate → Escalate" structure as an executable policy.

Running the program shows a synthetic incident from first signal to recommended action, making the triage logic explicit and inspectable without any ML knowledge.

## Ship It

`outputs/skill-ai-incident-triage.md` is a one-page decision aid: a signal-to-category mapping, a runbook checklist for each category, and a severity table — formatted for pasting into a team runbook wiki or printing for a war-room wall.

## Exercises

1. Run `code/main.py`. Which synthetic incident is classified as a safety incident rather than a quality incident? What single metric delta triggers the reclassification?

2. Run `code/main.py` again and trace the runbook router output for the cost incident. Which step corresponds to checking for a context-length spike, and what mitigation does the program recommend?

3. Your team's AI feature has L1 and L4 metrics but no L3 layer. Write a one-paragraph brief for your tech lead explaining why L3 is the missing rung, using the signal hierarchy table as supporting evidence.

4. A provider silently rolls out a new model version on a Friday evening. Your LLM-as-judge score drops 12 percent over 20 minutes. Walk through the quality runbook steps in order. At which step do you confirm the provider is the cause, and what is the fastest mitigation?

5. You are setting up AI incident response inside an existing SRE org for the first time. Using the five-step integration path from the lesson, identify the one step your organisation would likely skip and explain what incident scenario would expose that gap.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Incident category | "What kind of outage" | One of four buckets: quality, cost, tool-use, or safety — determines which runbook to open |
| L3 AI quality layer | "AI-specific monitoring" | LLM-as-judge scores and output-distribution metrics sitting between infrastructure (L1) and business (L4) |
| LLM-as-judge | "Using AI to score AI" | A secondary LLM call that scores model output against a rubric; the standard low-latency quality proxy in 2026 |
| Silent model update | "Provider surprise" | A provider serving a different model version without a breaking-change notice; leading cause of unexplained quality regressions |
| Model version pinning | "Locking the model" | Using an explicit dated version suffix in the API call so provider rollouts do not affect production automatically |
| Shadow evaluation | "Canary for LLMs" | Routing a small traffic fraction to a new model version and comparing L3 metrics before full rollout |
| Runbook | "The procedure" | A bounded, on-call-executable checklist: Detect → Scope → Diagnose → Mitigate → Escalate → Post-mortem |
| Rollback authority | "Who can pull the plug" | The pre-agreed individual or role allowed to disable an AI feature in production unilaterally during an incident |

## Further Reading

- [Google SRE Book — Chapter 14: Managing Incidents](https://sre.google/sre-book/managing-incidents/) — the foundation incident management model this lesson adapts for AI.
- [Anthropic — Model changelog and version pinning](https://docs.claude.com/en/docs/about-claude/models) — the canonical reference for pinning Claude model versions with dated suffixes.
- [OpenAI — Production best practices](https://platform.openai.com/docs/guides/production-best-practices) — OpenAI's own guide to monitoring, rollback, and safety in deployment.
- [NIST AI Risk Management Framework (AI RMF 1.0)](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) — the US federal framework for AI risk management; the "GOVERN" function maps directly to incident ownership and escalation tree design.
- [PagerDuty — Incident Response Docs](https://response.pagerduty.com/) — the operational incident response playbook that this lesson's severity table and runbook structure are adapted from.
