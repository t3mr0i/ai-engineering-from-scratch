# Chaos Engineering for LLM Production

> Chaos engineering for LLMs is its own discipline in 2026. Prerequisites before running experiments in production: defined SLI/SLO, trace+metric+log observability, automated rollback, runbooks, on-call. Architecture has four planes: control (experiment scheduler), target (services, infra, data stores), safety (guards + abort + traffic filters), observability (metrics + traces + logs), feedback (into SLO adjustments). Guardrails are mandatory: burn-rate alerts pause experiments if daily error-budget burn > 2x expected; suppression windows + trace-ID correlation dedupe alert noise. Cadence: weekly small canary + SLO review; monthly game day + postmortem; quarterly cross-team resilience audit + dependency mapping. LLM-specific experiments: memory overload, network failures, provider outages, malformed prompts, KV cache eviction storms. Tooling: Harness Chaos Engineering (LLM-derived recommendations, blast-radius downscaling, MCP tool integration); LitmusChaos (CNCF); Chaos Mesh (CNCF Kubernetes-native).

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 17 · 23 (SRE for AI), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Learning Objectives

- Name the five chaos engineering prerequisites (SLI/SLO, observability, rollback, runbooks, on-call) and explain why skipping any breaks the practice.
- Diagram the four planes (control, target, safety, observability) and the feedback loop into SLO.
- Enumerate five LLM-specific experiments (memory overload, network fail, provider outage, malformed prompt, KV eviction storm).
- Pick a tool — Harness, LitmusChaos, Chaos Mesh — given stack.

## The Problem

Chaos testing in traditional stacks is established. LLM stacks add new failure modes. A 4K-token prompt with a poison character stalls the tokenizer for 12 seconds. An upstream provider 429s; your gateway retries; your service OOMs on retry-amplified concurrency. A KV cache eviction storm under burst load causes re-prefill cascades that saturate compute.

None of these show up in unit tests. Chaos engineering is how you discover them before users do.

## The Concept

### Prerequisites

Don't run chaos in production without:

1. **SLI/SLO** — defined service-level indicators and objectives.
2. **Observability** — traces, metrics, logs, wired to dashboards.
3. **Automated rollback** — Phase 17 · 20 policy-flag rollback.
4. **Runbooks** — structured, Phase 17 · 23.
5. **On-call** — someone to respond.

Missing any means chaos becomes real incident.

### Four planes + feedback

**Control plane** — experiment scheduler (Litmus workflow, Chaos Mesh schedule, Harness UI).

**Target plane** — services, pods, nodes, load balancers, data stores.

**Safety plane** — kill switch, suppression windows, blast-radius limits, error-budget gates.

**Observability plane** — normal metrics + trace-ID correlation to distinguish chaos-induced from natural failures.

**Feedback loop** — findings feed back into SLO adjustment, runbook updates, code fixes.

### Guardrails are mandatory

- **Burn-rate alert**: pause experiment if daily error-budget burn exceeds 2x expected.
- **Suppression windows**: silence non-experiment alerts in the blast radius during experiment.
- **Trace-ID correlation**: all experiment-induced errors carry a tag so on-call can dedupe.

### Five LLM-specific experiments

1. **Memory overload** — force a KV cache preemption storm by sending long-context requests with high concurrency. Observe: does the service gracefully shed or crash?

2. **Network failure** — cut connectivity between inference gateway and provider. Observe: does fallback kick in within SLA? (Phase 17 · 19)

3. **Provider outage simulation** — 100% 429 from OpenAI. Observe: does routing failover to Anthropic? (Phase 17 · 16, 19)

4. **Malformed prompt** — inject tokenizer-stalling payload (e.g., deeply nested unicode, huge UTF-8 codepoint). Observe: does a single request lock up a worker?

5. **KV eviction storm** — force eviction by saturating vLLM block budget. Observe: does LMCache recover or does service degrade?

### Cadence

- **Weekly** — small canary experiments in staging, maybe 5% prod.
- **Monthly** — scheduled game day on a specific scenario; cross-team attendance; postmortem.
- **Quarterly** — cross-team resilience audit; dependency map update.

### Tooling

- **Harness Chaos Engineering** — commercial; AI-derived experiment recommendations; blast-radius downscaling; MCP tool integration.
- **LitmusChaos** — CNCF graduated; Kubernetes workflow-based.
- **Chaos Mesh** — CNCF sandbox; Kubernetes-native CRD style.
- **Gremlin** — commercial; broad support.
- **AWS FIS** / **Azure Chaos Studio** — managed cloud offerings.

### Starting small

First experiment: pod-kill one decode replica under steady traffic. Observe rerouting and recovery. If this works and looks safe, graduate to network chaos.

First LLM-specific experiment: inject one provider 429 for 5 minutes. Observe fallback. Most teams discover their fallback wasn't fully tested.

### Numbers you should remember

- Four planes: control, target, safety, observability.
- Burn-rate pause: 2x expected daily budget burn.
- Cadence: weekly canary, monthly game day, quarterly audit.
- Five LLM experiments: memory, network, provider, malformed prompt, KV storm.



## Further Reading

- [DevSecOps School — Chaos Engineering 2026 Guide](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs (book)](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos (CNCF)](https://litmuschaos.io/)
- [Chaos Mesh (CNCF)](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Name the five chaos engineering prerequisites (SLI/SLO, observability, rollback, runbooks, on-call) and explain why skipping any breaks the practice.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Diagram the four planes (control, target, safety, observability) and the feedback loop into SLO.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Enumerate five LLM-specific experiments (memory overload, network fail, provider outage, malformed prompt, KV eviction storm).

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Name the five chaos engineering prerequisites (SLI/SLO, observability, rollback, runbooks, on-call) and explain why skipping any breaks the practice,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Enumerate five LLM-specific experiments (memory overload, network fail, provider outage, malformed prompt, KV eviction storm),” and cite a repeatable check rather than relying on visual inspection alone.
