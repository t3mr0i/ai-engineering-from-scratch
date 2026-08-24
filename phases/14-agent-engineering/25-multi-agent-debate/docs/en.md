# Multi-Agent Debate and Collaboration

> Du et al. (ICML 2024, "Society of Minds") run N model instances that independently propose answers, then iteratively critique each other over R rounds to converge. Improves factuality, rule-following, reasoning. Sparse topology beats full mesh on token cost.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 05 (Self-Refine and CRITIC)
**Time:** ~60 minutes

## Learning Objectives

- Explain the debate protocol: N proposers, R rounds, converge on a shared answer.
- Describe why debate improves factuality, rule-following, and reasoning.
- Explain sparse topology: not every debater needs to see every other.
- Implement a stdlib debate over a scripted LLM with full-mesh and sparse variants; measure token cost vs accuracy.

## The Problem

Self-Refine (Lesson 05) is one model critiquing itself — risks groupthink. CRITIC (Lesson 05) grounds critique in external tools — not always available. Debate introduces a third mode: multiple instances, cross-critique, convergence by disagreement.

## The Concept

### Society of Minds (Du et al., ICML 2024)

- N model instances independently propose answers to the same question.
- Over R rounds, each model reads the others' proposals and critiques them.
- Models update their answers based on the critiques.
- After R rounds, return the convergent answer.

Original experiments used N=3, R=2 due to cost. Accuracy improves with more agents and more rounds on hard problems (MMLU, GSM8K, Chess Move Validity, biography generation).

Cross-model combinations beat single-model debates: ChatGPT + Bard together > either alone.

### Sparse topology

"Improving Multi-Agent Debate with Sparse Communication Topology" (arXiv:2406.11776, 2024-2025) showed full-mesh debate is not always optimal. Sparse topologies (star, ring, hub-and-spoke) can match accuracy at lower token cost. Each debater sees only a subset of peers.

Implications:

- Full mesh N=5, R=3 = 5 × 3 = 15 proposals, each reading 4 peers = 60 critique ops.
- Star N=5, R=3 (one hub + 4 spokes) = 15 proposals, spokes read only the hub = 12 critique ops.

### When debate helps

- **Factuality.** N independent proposals, cross-check reduces hallucination.
- **Rule-following.** Chess move validity — one model misses a rule, others catch it.
- **Open-ended reasoning.** Multiple framings narrow in on the right answer.

### When debate hurts

- **Latency-sensitive UX.** N × R serial rounds is latency you may not have.
- **Cost-sensitive scale.** N × R tokens per question.
- **Simple factual lookups.** One lookup is cheaper than five debates.

### 2026 practical instantiations

- **Anthropic orchestrator-workers** (Lesson 12) — one variant of debate with a synthesis step.
- **LangGraph supervisor** (Lesson 13) — central router + specialist agents can implement debate as a node.
- **OpenAI Agents SDK** (Lesson 16) — agents handoff back and forth for iterative critique.
- **Multi-agent evals** — pair debate + evaluator-optimizer for eval signal.

### Where this pattern goes wrong

- **Convergence collapse.** All agents converge on the first wrong answer. Mitigate with required disagreement rounds.
- **Hub failure.** In a star topology, a bad hub corrupts everyone. Rotate or use multiple hubs.
- **Prompt homogenization.** All agents use the same prompt; they produce the same answers. Use diverse prompts and/or models.




## Further Reading

- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) — canonical multi-agent debate
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) — sparse topology results
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — orchestrator-workers as a debate variant
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — single-model self-critique counterpart

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the debate protocol: N proposers, R rounds, converge on a shared answer.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Describe why debate improves factuality, rule-following, and reasoning.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Explain sparse topology: not every debater needs to see every other.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the debate protocol: N proposers, R rounds, converge on a shared answer,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Explain sparse topology: not every debater needs to see every other,” and cite a repeatable check rather than relying on visual inspection alone.
