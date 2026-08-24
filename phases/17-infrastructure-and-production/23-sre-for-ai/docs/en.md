# SRE for AI — Multi-Agent Incident Response, Runbooks, Predictive Detection

> AI SRE uses LLMs grounded in infrastructure data (logs, runbooks, service topology) via RAG to automate investigation, documentation, and coordination phases. The 2026 architecture pattern is multi-agent orchestration — specialized agents (logs, metrics, runbooks) coordinated by a supervisor; AI proposes hypotheses and queries, humans approve judgment calls. Datadog Bits AI and Azure SRE Agent ship this as managed products. Runbooks are evolving: NeuBird Hawkeye uses adversarial evaluation (two models analyze the same incident; agreement = confidence, disagreement = uncertainty); operational memory persists across team changes. Auto-remediation stays cautious: AI suggests, humans approve. Fully autonomous action is narrow (restart pod, rollback specific deploy) with tight guardrails — anyone selling "set it and forget it" is overselling. Emerging frontier: pre-incident prediction. Prediction is feasible on telemetry-rich stacks (logs + metrics + deploy events); the constraint is always actuation, not detection — predictions without an action policy are dashboards, not SRE.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## Learning Objectives

- Diagram the multi-agent AI SRE architecture: supervisor + specialized agents (logs, metrics, runbooks) + human approval gate.
- Explain why auto-remediation is narrow (restart pod, revert deploy) rather than broad (re-architect service).
- Name the adversarial evaluation pattern (NeuBird Hawkeye): two models agree = confidence; disagree = escalate.
- State the operational constraint: predictions without actuation are just dashboards.

## The Problem

An on-call engineer gets paged at 3 a.m. "High error rate in checkout." They check Datadog, Loki, three runbooks, the deploy log. 30 minutes later they realize the root cause is a vLLM OOM from a KV cache spike. They restart the pod; error clears.

In 2026 the first 20 minutes of that investigation are automatable. Grouping logs by service, correlating to recent deploys, matching against runbooks — all are RAG + tool-use. A supervised agent can do first-pass triage and present a hypothesis before the human opens Datadog.

Fully autonomous remediation is a different problem. Restart pod: safe. Scale GPU pool: safe if policy allows. Re-architect the service: absolutely not. The discipline is drawing the narrow line.

## The Concept

### Multi-agent architecture

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

Supervisor breaks the incident into sub-queries. Specialized agents have tool access (log search, PromQL, doc retrieval). Supervisor synthesizes, presents hypothesis + evidence to human. Human approves or redirects.

### Auto-remediation scope

**Safe (narrow)**: restart pod, revert specific deploy, scale pool within pre-approved bounds, enable pre-approved feature flag.

**Not safe (broad)**: change service topology, modify resource limits, deploy new code, change IAM, alter databases.

Anyone selling "set it and forget it" is overselling. The safe set grows as AI SRE matures, but the boundary is real.

### Adversarial evaluation (NeuBird Hawkeye)

Two models independently analyze the same incident. If they agree on root cause, confidence is high. If they disagree, escalate to human with both hypotheses visible. Simple pattern, effective filter against hallucinated root causes.

### Operational memory

Team turnover is the silent kill of traditional SRE — tribal knowledge leaves. AI SRE stores runbooks + post-mortems in a vector DB; agents retrieve on every new incident. When new engineers join, the AI has full history.

### Pre-incident prediction

LLM-based early-warning is feasible on telemetry-rich stacks: logs + GPU temps + deploy events + error rates all feed the same model. Published claims of 89%+ lead-time accuracy on test sets circulate in vendor blogs and conference talks; treat any specific number as unverified until you re-measure on your own data.

Reality check: predictions without actuation are dashboards. The operational question is "when we predict, what do we do?" Pre-emptive drain? Pager? Auto-scale? The answer is policy-specific.

### Products in 2026

- **Datadog Bits AI** — managed SRE copilot inside Datadog.
- **Azure SRE Agent** — Azure-native.
- **NeuBird Hawkeye** — adversarial eval + operational memory.
- **PagerDuty AIOps** — triage + deduplication.
- **Incident.io Investigations** — root-cause hypothesis generation, powered by its Nexus system model.

### Runbooks as code

Runbooks evolve from Confluence pages to versioned markdown with structured sections (symptom, hypothesis, verify, act). Structured runbooks feed better RAG retrieval. Start any AI-SRE rollout by turning unstructured runbooks into structured.

### Numbers you should remember

- Multi-agent triage: supervisor + (logs, metrics, runbooks) + human.
- Safe auto-remediation set: restart pod, revert deploy, scale within bounds.
- Adversarial eval: two models independent; agreement = confidence.
- Early-warning lead time: vendor claims of 10-15 min exist; verify on your own data.



## Further Reading

- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Diagram the multi-agent AI SRE architecture: supervisor + specialized agents (logs, metrics, runbooks) + human approval gate.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Explain why auto-remediation is narrow (restart pod, revert deploy) rather than broad (re-architect service).
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Name the adversarial evaluation pattern (NeuBird Hawkeye): two models agree = confidence; disagree = escalate.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Diagram the multi-agent AI SRE architecture: supervisor + specialized agents (logs, metrics, runbooks) + human approval gate,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Name the adversarial evaluation pattern (NeuBird Hawkeye): two models agree = confidence; disagree = escalate,” and cite a repeatable check rather than relying on visual inspection alone.
