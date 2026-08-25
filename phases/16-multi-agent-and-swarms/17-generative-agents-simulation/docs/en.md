# Generative Agents and Emergent Simulation

> Park et al. 2023 (UIST '23, arXiv:2304.03442) populated **Smallville**, a sandbox of 25 agents, with a three-part architecture: **memory stream** (natural-language log), **reflection** (higher-level syntheses the agent generates about its own stream), and **plan** (day-level behavior, then sub-plans). The landmark result was the Valentine's Day party emergence: one agent seeded with "wants to throw a Valentine's Day party," without further scripting, produced invitations spread through the population, coordinated dates, and the party happened — from 24 agents who started with no knowledge of it. Ablations show all three components are required for believability. The documented failures are spatial-norm errors (entering closed stores, sharing single-person bathrooms). This is the reference architecture for agent simulations and multi-agent social evaluation in 2026.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Generative Agents and Emergent Simulation
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Most multi-agent systems are tightly-scripted teams: planner plans, coder codes, reviewer reviews. That works for well-defined tasks. It does not capture the emergent, unscripted behavior that arises when agents have memory, priorities, and an open world. Research, society simulation, and increasingly game AI need this second kind.

The Smallville architecture is the benchmark for it. Until Park 2023, the best agent simulations were shallow script-followers; after it, the pattern is the default for generative agents in open worlds. If you build an agent simulation in 2026, you are either using Smallville's three components or explicitly justifying why you are not.

## Concept

### The three components

**Memory stream.** An append-only log of observations, actions, reflections, and plans. Each entry has a timestamp, a type, a description (natural language), and derived metadata: **recency**, **importance** (self-rated 1-10 by the agent), and **relevance** (cosine similarity to current query).

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

Memory retrieval combines the three scores: `score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`. Top-k entries enter the current prompt.

**Reflection.** Periodically (every N memories or on important events), the agent generates higher-order syntheses from recent memories. Reflection entries go back into the stream and are retrievable like any other memory. This is how agents build "understandings" — the architecture's equivalent of long-term beliefs.

**Plan.** Top-down decomposition. First, a day-level plan in broad strokes ("go to work, have dinner with Klaus"). Then hour-level plans. Then action-level plans. Plans are revisable: when an observation contradicts a plan, the agent replans the affected segment.

### Why all three matter (ablation)

Park et al. ran ablations dropping each of observation, reflection, and plan. Each ablation hurts believability:

- Without **observation** the agent misses context and acts on stale beliefs.
- Without **reflection** the agent cannot form higher-order beliefs; interactions stay shallow.
- Without **plan** behavior becomes reactive noise; goals dissipate.

Believability scores from human raters are highest with all three; dropping any one produces a measurable regression.

### The Valentine's Day emergence

One agent, Isabella Rodriguez, is seeded with the goal "wants to throw a Valentine's Day party at Hobbs Cafe on Feb 14 at 5pm." The 24 other agents receive no such seed. Over simulated days:

1. Isabella's plan includes inviting people.
2. Each invitation becomes an observation in a neighbor's memory stream.
3. That neighbor's reflection generates beliefs: "Isabella is throwing a party."
4. The neighbor's plan incorporates "attend party on Feb 14."
5. Neighbors tell other neighbors. The invitation spreads without central coordination.
6. At 5pm on Feb 14, several agents converge at Hobbs Cafe.

This is emergence in the technical sense: system-level behavior (a party) arose from local interactions (bilateral invitations + individual planning) without a central orchestrator.

### The documented failure modes

Park et al. explicitly document:

- **Spatial norm errors.** Agents walk into closed stores. Agents try to use the same single-person bathroom. Agents eat in rooms not intended for eating. The model does not infer social-physical norms from the environment alone.
- **Memory overflow.** Deep simulation runs cause memory-retrieval cost to grow. Practical remedy: periodic memory compaction (summarize-and-prune) and decay on low-importance entries.
- **Reflection hallucination.** Reflections can invent relationships that do not exist in the memory stream. Mitigation: include source memory ids in reflection prompts and verify at retrieval time.

These are production-relevant failure modes: any 2026 agent simulation inherits them.

### Three-component implementation rules

1. **Memory is append-only.** Never mutate a memory entry. Corrections are new entries.
2. **Importance scores are cheap.** Call the LLM to rate importance 1-10 at write time. Cache the score.
3. **Retrieval is ranked, not filtered.** Top-k by combined score; do not use hard filters (which lose context).
4. **Reflection runs periodically.** Trigger when the sum of importance of unprocessed memories exceeds a threshold (e.g., 150).
5. **Plans are revisable.** When a new observation contradicts a plan, regenerate the affected segment only, not the whole plan.

### Generative agents beyond Smallville

The 2024-2026 follow-up literature extends the architecture:

- **Multi-agent social simulation for policy / market research.** Smallville-like populations simulate user behavior in response to features. Faster than A/B tests; accuracy is contested.
- **NPC AI for games.** RPGs with Smallville agents produce emergent storylines instead of scripted quests.
- **Generative-agent evaluation benchmarks.** Rather than task accuracy, the metric becomes believability + coherence of behavior over long runs.

The architecture is the reference. Extensions swap components (vector store for memory, retrieval-augmented reflection, neurosymbolic plan) but keep the three-part structure.

### Why this matters for multi-agent engineering

Smallville is the proof of concept that multi-agent emergence is cheap when the components are right. The architecture has now been replicated on open-source models (smaller LLMs lose believability gracefully, not sharply). Any production system that needs **emergent social behavior** uses this shape. Any system that needs **tight task execution** uses the supervisor / roles / primitives patterns from earlier in this phase.




## Build It

Reconstruct **Generative Agents and Emergent Simulation** by following `Memory` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `Memory` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-simulation-designer.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Park et al. — Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) — the reference architecture
- [UIST '23 paper page](https://dl.acm.org/doi/10.1145/3586183.3606763) — publication venue
- [Smallville code release](https://github.com/joonspk-research/generative_agents) — reference Python implementation
- [Hayes-Roth 1985 — A Blackboard Architecture for Control](https://www.sciencedirect.com/science/article/abs/pii/0004370285900639) — prior art for structured-memory agents

## Exercises

Keep two runs side by side for **Generative Agents and Emergent Simulation**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using the smallest valid record {"id": 1}. Follow `Memory`, `Plan`, `Agent`. Expect validation names the missing field or rejects the request; it must not silently accept an incomplete record; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind Generative Agents and Emergent Simulation**.
2. **Run a two-value comparison.** Repeat the command after changing only the optional field: use the same record with one optional field changed. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation a record missing the required "id" field. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-simulation-designer.md` and add a worked example using the smallest valid record {"id": 1}. Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Generative Agents and Emergent Simulation** should contain:

- the `python3 main.py` output for the smallest valid record {"id": 1}, with `Memory`, `Plan`, `Agent` traced to the value or shape that supports **Explain the coordination mechanism behind Generative Agents and Emergent Simulation**;
- a before/after comparison for the optional field, where the same record with one optional field changed changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for a record missing the required "id" field that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-simulation-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
