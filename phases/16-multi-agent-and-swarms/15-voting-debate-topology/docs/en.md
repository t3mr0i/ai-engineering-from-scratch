# Voting, Self-Consistency, and Debate Topology

> The cheapest aggregation: sample N independent agents, majority-vote. Wang et al. 2022 self-consistency did this with one model sampled N times. Multi-agent extends it with **heterogeneous** agents to escape monoculture — different models, different prompts, different temperatures, different contexts. Beyond majority vote, debate topology matters: MultiAgentBench (arXiv:2503.01935, ACL 2025) evaluated star / chain / tree / graph coordination and found **graph best for research**, with a "coordination tax" past ~4 agents. AgentVerse (ICLR 2024) documents two emergent patterns — volunteer behaviors and conformity behaviors — and conformity is both a feature (finding consensus) and a risk (groupthink, Lesson 24). This lesson maps the topology space, builds each variant, and measures the coordination tax.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 14 (Consensus and BFT)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Voting, Self-Consistency, and Debate Topology
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Debate can improve accuracy (Du et al., arXiv:2305.14325). It can also degrade it. Whether debate helps depends on four structural choices:

1. Who talks to whom (topology).
2. How many rounds (Du 2023: both rounds and agents matter independently).
3. Whether agents are heterogeneous (different base models break monoculture).
4. Whether an adversarial voice is present (steel-manning vs. straw-manning).

Teams that bolt "run 5 agents and vote" onto a task often regress vs. a single agent. The failures are not random. They track topology and heterogeneity. This lesson is the topology map.

## Concept

### Self-consistency, the single-model baseline

Wang et al. 2022 ("Self-Consistency Improves Chain of Thought Reasoning") sampled the same model N times at temperature > 0 and majority-voted on reasoning-path answers. The result on GSM8K: substantial gains with N=40 samples over a single greedy decode. Self-consistency is the single-agent precursor to multi-agent voting.

Limit: self-consistency uses one base model. Errors are correlated by construction. If the model has a systematic bias, all N samples share it.

### Multi-agent vote, the heterogeneous extension

Replace N samples with N *different* agents. Different base models (Claude, GPT, Llama), different prompts, different tool access. The benefit: uncorrelated errors. The cost: different agents cost different amounts; coordinating them adds overhead.

The canonical 2026 name for heterogeneous debate is **A-HMAD** — Adversarial Heterogeneous Multi-Agent Debate. Not universally adopted, but papers use the term for "different models debate, which reduces correlated errors from monoculture collapse."

### The four topologies

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

Star: one hub, all others talk only to hub. Equivalent to supervisor-worker without back-channel.
Chain: linear, each agent sees the prior one's output. Pipeline-like.
Tree: hierarchical, used by hierarchical agent systems (Lesson 06).
Graph: any-to-any. Includes fully-connected clique and arbitrary DAGs.

### The coordination tax (MultiAgentBench)

MultiAgentBench (MARBLE, ACL 2025, arXiv:2503.01935) benchmarked star, chain, tree, graph on a task suite including research, coding, and planning. Key measured results:

- **Graph** topology wins on research tasks. Information flows any-to-any; agents can critique each other.
- **Star** wins on fast-answer factual tasks. Hub filters and consolidates.
- **Chain** wins on stepwise pipelines (staged refinement).
- **Coordination tax** appears past ~4 agents in graph topology. Wall-clock and token cost grow faster than quality.

The 4-agent ceiling is empirical, not fundamental. It reflects 2026 LLM context capacity: each agent's context fills with peers' outputs, and marginal value of adding agent N+1 drops once everyone can see everyone.

### Multi-Agent Debate Strategies ("Should we be going MAD?")

arXiv:2311.17371 is the 2023 survey of MAD strategies. Key finding replicated by others: MAD variants that are *structurally similar* to self-consistency (independent sampling + aggregation) often underperform self-consistency when using the same budget. MAD helps most when agents are genuinely heterogeneous and the debate has adversarial structure (one agent argues against).

### AgentVerse emergent patterns

AgentVerse (ICLR 2024, https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) documents two behaviors that emerge from multi-agent debate even without explicit design:

- **Volunteer.** An agent offers help ("I can take the next step") unprompted. Useful: it allocates work to the most-capable agent for a subtask.
- **Conformity.** An agent adjusts its stance to match a critic, even when the critic is wrong. This is the debate-equivalent of sycophancy (Lesson 14).

Conformity is why debate-until-agreement rewards bullies. Bounded rounds with a separate judge mitigate.

### Heterogeneity: the actual knob that moves accuracy

A 2024-2026 pattern in the practical literature: swapping one of your N agents for a different base model gives a bigger accuracy bump than increasing N by 1. The intuition is monoculture — each new independent-error source is worth more than an additional correlated sample.

In the limit, heterogeneity beats numerosity. Three different models beat five copies of one model on most tasks that have clean ground truth.

### Jury methods

The Sibyl framework (cited in Minsky-LLM literature) formalizes a "jury" — a small set of specialized agents that refine answers by voting at each stage. Unlike plain majority vote, a jury has roles: one agent cross-examines, one supplies context, one scores plausibility. Jury methods are a midpoint between plain vote (cheap, monoculture-prone) and full MAD (expensive, conformity-prone).

### When vote-with-debate dominates

- The question has ground truth (fact, math, code behavior). Vote convergence is meaningful.
- Agents can access different sources or tools (heterogeneity is available).
- Rounds are bounded (2-3 typical) and there is a separate judge or verifier.
- Budget allows 3-5 agents. Beyond 5-7 on graph topology, coordination tax dominates.

### When vote-with-debate hurts

- The question is opinion-shaped. Agents converge to whichever answer looks most confident, not most correct.
- All agents share a base model. Monoculture makes consensus meaningless.
- Rounds are unbounded. Conformity wins every time.
- The task is simple. A single agent with self-consistency at N=5 is cheaper and as accurate.




## Build It

Reconstruct **Voting, Self-Consistency, and Debate Topology** by following `SimAgent` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `SimAgent` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-topology-picker.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171) — single-model baseline
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325) — both agents AND rounds matter independently
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) — topology benchmark showing graph best for research, chain for pipelines
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) — MAD-strategy survey; finds MAD often loses to self-consistency at equal budget
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) — volunteer and conformity emergent patterns
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) — reference benchmark implementation

## Exercises

Use `SimAgent` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `SimAgent`, `answer`, `RunResult`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind Voting, Self-Consistency, and Debate Topology**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-topology-picker.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Voting, Self-Consistency, and Debate Topology** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `SimAgent`, `answer`, `RunResult` traced to the value or shape that supports **Explain the coordination mechanism behind Voting, Self-Consistency, and Debate Topology**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-topology-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
