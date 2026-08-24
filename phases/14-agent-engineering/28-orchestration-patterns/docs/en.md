# Orchestration Patterns: Supervisor, Swarm, Hierarchical

> Four orchestration patterns recur across 2026 frameworks: supervisor-worker, swarm / peer-to-peer, hierarchical, debate. Anthropic's guidance: "It's about building the right system for your needs." Start simple; add topology only when a single agent plus five workflow patterns is insufficient.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 25 (Multi-Agent Debate)
**Time:** ~60 minutes

## Learning Objectives

- Name the four recurring orchestration patterns and when each fits.
- Describe the 2026 LangChain recommendation: tool-call-based supervision vs supervisor libraries.
- Explain Anthropic's "build the right system" rule and how it gates topology choice.
- Implement all four in stdlib against a common scripted LLM.

## The Problem

Teams reach for "multi-agent" before they need it. Four patterns recur across frameworks; once you can name them, you can pick the right one — or skip topology entirely.

## The Concept

### Supervisor-worker

- A central routing LLM dispatches to specialist agents.
- Decides: loop back to self, hand off to specialist, terminate.
- Specialists do not talk to each other; all routing goes through the supervisor.

Frameworks: LangGraph `create_supervisor`, Anthropic orchestrator-workers, CrewAI Hierarchical Process.

**2026 LangChain recommendation:** do supervision through direct tool calls rather than `create_supervisor`. Gives finer context engineering control — you decide exactly what each specialist sees.

### Swarm / peer-to-peer

- Agents hand off directly via a shared tool surface.
- No central router.
- Lower latency than supervisor (fewer hops).
- Harder to reason about (no single point of control).

Frameworks: LangGraph swarm topology, OpenAI Agents SDK handoffs (when all agents can hand off to all others).

### Hierarchical

- Supervisors managing sub-supervisors managing workers.
- Implemented as nested subgraphs in LangGraph; nested crews in CrewAI.
- Scales to large agent populations at the cost of operational complexity.

When you need it: when a single supervisor's context budget cannot hold descriptions of all specialists.

### Debate

- Parallel proposers + iterative cross-critique (Lesson 25).
- Not really orchestration — more verification — but shows up as a topology choice in frameworks.

### CrewAI Crew vs Flow

CrewAI formalizes two deployment modes:

- **Flow** for deterministic event-driven automation (recommended starting point for production).
- **Crew** for autonomous role-based collaboration.

This is orthogonal to the four patterns above but maps to topology: Flow is typically supervisor or hierarchical; Crew is typically supervisor with an LLM router.

### Anthropic's guidance

"Success in the LLM space isn't about building the most sophisticated system. It's about building the right system for your needs."

Decision order:

1. Single agent + workflow patterns (Lesson 12) — start here.
2. Supervisor-worker — when you have 2-4 specialists.
3. Swarm — when latency matters more than reasoning clarity.
4. Hierarchical — only when supervisor context budget fails.
5. Debate — when accuracy matters more than cost.

### Where this pattern goes wrong

- **Topology-first thinking.** "We need multi-agent" before identifying what problem multi-agent solves.
- **Bouncing handoffs in swarm.** A -> B -> A -> B. Use hop counters.
- **Fake hierarchy.** Three layers because "enterprise"; two actual teams. Collapse.




## Further Reading

- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — five patterns + agent vs workflow
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — supervisor, swarm, hierarchical
- [CrewAI docs](https://docs.crewai.com/en/introduction) — Crew vs Flow
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) — debate pattern

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Name the four recurring orchestration patterns and when each fits.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Describe the 2026 LangChain recommendation: tool-call-based supervision vs supervisor libraries.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Explain Anthropic's "build the right system" rule and how it gates topology choice.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Name the four recurring orchestration patterns and when each fits,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Explain Anthropic's "build the right system" rule and how it gates topology choice,” and cite a repeatable check rather than relying on visual inspection alone.
