# Capstone 06 — DevOps Troubleshooting Agent for Kubernetes

> AWS's DevOps Agent went GA, Resolve AI published its K8s playbooks, NeuBird demoed semantic monitoring, and Metoro tied AI SRE to per-service SLOs. The production shape is settled: an alert webhook fires, an agent reads telemetry, walks a graph of K8s objects, ranks root-cause hypotheses, and posts a Slack brief with approval buttons. Read-only by default. Every remediation gated by a human. This capstone is that agent, evaluated on 20 synthetic incidents and compared against AWS's Agent on three shared cases.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools and MCP), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## Learning Objectives

- Define measurable acceptance criteria for Capstone 06 — DevOps Troubleshooting Agent for Kubernetes
- Integrate the required components into one self-terminating workflow
- Exercise happy paths, edge cases, and failure recovery with reproducible fixtures
- Package the verified result as a reusable curriculum artifact

## Problem

The 2025-2026 SRE narrative became: "AI agents triage incidents, humans approve remediations." AWS DevOps Agent, Resolve AI, NeuBird, Metoro, PagerDuty AIOps all ship this shape in production. The agent reads Prometheus metrics, Loki logs, Tempo traces, kube-state-metrics, and a knowledge graph of K8s objects. It produces a ranked root-cause hypothesis with telemetry citations in under five minutes. It never executes destructive commands without explicit human approval through Slack.

Most of the hard work is scoping and safety, not reasoning. The agent needs a read-only-by-default RBAC surface, a hardened MCP tool server, and audit logs of every command considered vs executed. It needs to know when it is outside its depth and escalate. And it has to run cheap enough that OOM-kill cascades do not generate a $5k agent bill.

## Concept

The agent operates on a knowledge graph. Nodes are K8s objects (Pods, Deployments, Services, Nodes, HPAs, PVCs) plus telemetry sources (Prometheus series, Loki streams, Tempo traces). Edges encode ownership (Pod -> ReplicaSet -> Deployment), scheduling (Pod -> Node), and observation (Pod -> Prometheus series). The graph is kept fresh by a kube-state-metrics sync and re-sampled on every alert.

When an alert fires, the agent root-causes from the affected object. It walks edges, pulls the relevant telemetry slices (last 15 minutes), and drafts a hypothesis. The hypothesis is ranked by evidence: how many telemetry citations support it, how recent, how specific. The top-3 hypotheses go to Slack with graph-path visualizations and approval buttons for remediation actions.

Remediation is gated. Allowed default actions are read-only. Destructive actions (scaling down, rolling back, deleting Pods) require Slack approval; ArgoCD rollback hooks require an auth token the agent never holds. The audit log records every command the agent *considered* — not just executed — so the review process catches near-misses.

## Architecture

```
PagerDuty / Alertmanager webhook
           |
           v
     FastAPI receiver
           |
           v
   LangGraph root-cause agent
           |
           +---- read-only MCP tools ----+
           |                             |
           v                             v
   K8s knowledge graph              telemetry slices
     (Neo4j / kuzu)              Prometheus, Loki, Tempo
   ownership + scheduling          last 15m, scoped
           |
           v
   hypothesis ranking (evidence weight)
           |
           v
   Slack brief + approval buttons
           |
           v (approved)
   ArgoCD rollback hook / PagerDuty escalate
           |
           v
   audit log: considered vs executed, every command
```

## Stack

- Observability sources: Prometheus, Loki, Tempo, kube-state-metrics
- Knowledge graph: Neo4j (managed) or kuzu (embedded) of K8s objects + telemetry edges
- Agent: LangGraph with per-tool allow-list, read-only by default
- Tool transport: FastMCP over StreamableHTTP; separate server for destructive tools behind approval gate
- Models: Claude Sonnet 4.6 for root-cause reasoning, Gemini 2.5 Flash for log summarization
- Remediation: ArgoCD rollback webhook, PagerDuty escalate, Slack approval card
- Audit: append-only structured log (considered, executed, approved, outcome)
- Deployment: K8s deployment with its own narrow RBAC role; separate namespace




## Further Reading

- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/aws/aws-devops-agent-helps-you-accelerate-incident-response-and-improve-system-reliability-preview/) — the canonical 2026 reference
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) — the competitor reference
- [NeuBird semantic monitoring](https://www.neubird.ai) — semantic-graph approach
- [Metoro AI SRE](https://metoro.io) — SLO-first production framing
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) — the cluster-state source
- [LangGraph](https://langchain-ai.github.io/langgraph/) — reference agent orchestrator
- [FastMCP](https://github.com/jlowin/fastmcp) — Python MCP server framework
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) — the gated remediation target

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Define measurable acceptance criteria for Capstone 06 — DevOps Troubleshooting Agent for Kubernetes.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Integrate the required components into one self-terminating workflow.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Exercise happy paths, edge cases, and failure recovery with reproducible fixtures.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Define measurable acceptance criteria for Capstone 06 — DevOps Troubleshooting Agent for Kubernetes,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Exercise happy paths, edge cases, and failure recovery with reproducible fixtures,” and cite a repeatable check rather than relying on visual inspection alone.
