# Parallel / Swarm / Networked Architectures

> Contrast with supervisor: no central decider. Agents read a shared event bus, pick up work asynchronously, write results back. LangGraph explicitly supports "Swarm Architecture" for decentralized, dynamic environments. Matrix (arXiv:2511.21686) represents both control and data flow as serialized messages passed through distributed queues to eliminate the orchestrator bottleneck. The tradeoff is explicit: determinism and traceability for scalability. Swarm fits tasks with many independent sub-problems; it does not fit tasks that need a single coherent plan.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 05 (Supervisor Pattern), Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Parallel / Swarm / Networked Architectures
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Supervisor scales to a few workers. What about hundreds? The supervisor itself becomes the bottleneck: every decision about who does what funnels through one agent. One slow plan step stalls the whole system.

Swarm architectures flip the design. Instead of a central planner dispatching work, workers pick work off a shared queue. The "coordination" is baked into the event bus semantics. No orchestrator; the system scales until the queue does.

## Concept

### The shape

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

No orchestrator. Each worker repeats: pull a task, process, write result (and optionally enqueue follow-ups).

### When swarm fits

- **Many independent tasks.** Scraping, transforming, classifying. Tasks do not depend on each other.
- **Variable-duration work.** If some tasks take 100ms and others take 10s, a swarm balances load automatically — fast workers pull next jobs. A supervisor has to anticipate duration.
- **Throughput over determinism.** You care about total completion time, not strict ordering.

### When swarm fails

- **Ordered workflows.** If step 3 needs step 2's output, a swarm risks step 3 firing before step 2 is done.
- **Global-plan tasks.** Complex research questions benefit from a planner. A swarm of researchers produces independent facts, not a coherent report.
- **Debugging.** With no central log and asynchronous work, reproducing a bug is expensive.

### Matrix (arXiv:2511.21686)

Matrix is the 2025 paper that takes swarm to its natural conclusion: both control flow and data flow are serialized messages on distributed queues. No central coordinator. Fault tolerance comes from message durability. Scalability is the message broker's problem, not the system's.

Contribution: a programming model where multi-agent coordination is "what message topic does this agent subscribe to?" rather than "which agent does the supervisor pick next?" This makes the system look like a pub/sub event mesh.

### LangGraph's Swarm Architecture

LangGraph 2025 docs explicitly describe "Swarm Architecture" as one of the multi-agent patterns: agents are nodes, but edges form a directed graph with cycles and any node can be activated from the pool. A worker picks from available work by condition, not by supervisor assignment.

### Failure mode: starvation and hot-spotting

If all workers pull the fastest-available task, long-running tasks never get picked until they are the only ones left. Classic queue starvation.

Mitigations:
- Priority queues with explicit aging (increase priority with wait time).
- Worker specialization: some workers only take "long" tasks.
- Back-pressure: limit how many fast tasks enter the queue.

### The content-based routing link

Swarm pairs naturally with content-based routing (Lesson 22). Instead of a generic queue, have one queue per message type. Specialist workers subscribe only to their type. This is the basis for message-bus architectures that scale to thousands of agents.




## Build It

Reconstruct **Parallel / Swarm / Networked Architectures** by following `Task` on a graph with edges (0,1) and (1,2). Run `python3 main.py` and verify that degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly.

## Use It

Call `Task` from a small caller with a graph with edges (0,1) and (1,2). Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-swarm-fit.md` with the command `python3 main.py`, the accepted input shape (a graph with edges (0,1) and (1,2)), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — explicit swarm support
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) — full message-passing swarm
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system) — why a specific production system explicitly chose supervisor over swarm
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) — the event-driven actor rewrite, closer to swarm than v0.2's GroupChat

## Exercises

Keep two runs side by side for **Parallel / Swarm / Networked Architectures**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using a graph with edges (0,1) and (1,2). Follow `Task`, `fake_work`, `run_sequential`. Expect degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind Parallel / Swarm / Networked Architectures**.
2. **Run a two-value comparison.** Repeat the command after changing only the edge list: use the same graph with an isolated node 3. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation a graph with no edges. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-swarm-fit.md` and add a worked example using a graph with edges (0,1) and (1,2). Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Parallel / Swarm / Networked Architectures** should contain:

- the `python3 main.py` output for a graph with edges (0,1) and (1,2), with `Task`, `fake_work`, `run_sequential` traced to the value or shape that supports **Explain the coordination mechanism behind Parallel / Swarm / Networked Architectures**;
- a before/after comparison for the edge list, where the same graph with an isolated node 3 changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for a graph with no edges that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-swarm-fit.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
