# Swarm Optimization for LLMs (PSO, ACO)

> Bio-inspired optimization is returning in LLM research. [LMPSO](https://arxiv.org/abs/2504.09247) applies PSO to LLM-generated structured sequences. [Model Swarms](https://arxiv.org/abs/2410.11163) treats expert models as particles on a weight-space manifold and reports a 13.3% average gain over its evaluated baselines. [AMRO-S](https://arxiv.org/abs/2603.12933) applies ACO-inspired pheromone routing to specialist agents and reports a 4.7× speedup in its setting. This lesson implements the underlying algorithms and treats every paper result as a reproduction target, not a guaranteed production gain.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 09 (Parallel Swarm Networks), Phase 16 · 14 (Consensus and BFT)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Swarm Optimization for LLMs (PSO, ACO)
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

You have a prompt that scores 62% on your task eval. You want to improve it. The naive move is gradient-free manual tweaking, which scales badly. Reinforcement learning needs reward signals and enough rollouts to train. Backprop through prompts is not really possible — the prompt is a discrete string, not a differentiable parameter.

Classical bio-inspired optimization — PSO for continuous search spaces, ACO for path selection — was designed exactly for this regime: gradient-free, population-based, cheap per evaluation. Pair them with LLMs for the gradient-free search step, and you get a surprisingly practical optimizer.

The same patterns apply to agent *routing* in multi-agent systems. An ACO-style pheromone trail records which agent worked best on which task-type, lets the router exploit the trail, and decays pheromones so routes can be rediscovered.

## Concept

### PSO refresher (Kennedy & Eberhart 1995)

Particle Swarm Optimization: population of particles in a continuous search space. Each particle has position `x_i` and velocity `v_i`. Each iteration:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

Where `p_best` is particle's own best, `g_best` is swarm's best, `w, c1, c2` are inertia + cognitive + social weights, `r1, r2` are random factors.

### PSO on LLM outputs — LMPSO

arXiv:2504.09247 adapts PSO for LLM-generated structured outputs (math expressions, programs). Each particle is a candidate output. Velocity is a *prompt* that describes how to modify the current output toward the personal/global best. The LLM generates the new output from the velocity prompt. The "inertia" of the velocity is a prompt like "make small incremental changes."

This works well when:
- The output is structured (parseable, evaluable).
- Fitness is automatic (test runs, arithmetic evaluation).
- Population is small (~10-30 particles) so total LLM calls stay manageable.

It does not work well when fitness needs human review — the per-iteration cost becomes prohibitive.

### Model Swarms

[Model Swarms](https://arxiv.org/abs/2410.11163) takes PSO off the output layer and into the *model* layer. Each particle is an expert model; the swarm moves parameters toward the collective best through a gradient-free update. The paper reports a 13.3% average gain over 12 baselines on nine datasets with 200 instances per iteration.

The key insight is that LLM expert models are already nearby in a shared parameter manifold (adapter weights, LoRA deltas). PSO on this low-dimensional subspace is cheap and effective.

### ACO refresher (Dorigo 1992)

Ant Colony Optimization: ants traverse a graph; each path has a pheromone trail. Ant move probabilities weight by pheromone strength. Ants that complete the task deposit pheromone proportional to solution quality. Pheromone decays over time.

### AMRO-S — ACO for agent routing

arXiv:2603.12933 uses ACO for multi-agent routing. Each task-type is a "destination"; each agent is a possible route. Pheromones strengthen routes that produce good outputs. Key contributions:

- **Interpretable routing evidence.** Pheromone strength is a human-readable signal.
- **Quality-gated asynchronous update.** Pheromones update only after quality checks pass, decoupling inference from learning.
- **4.7x speedup** on the multi-agent routing benchmark.

The quality gate matters: without it, fast-but-wrong agents accrue pheromone, and the system locks in on bad routes.

### When to use PSO / ACO for LLMs

**Use PSO when:**
- Search space is continuous or maps to continuous parameters (prompt embeddings, LoRA weights, numeric generation parameters).
- Fitness is cheap and automatic.
- Population can be small (10-30).

**Use ACO when:**
- You have a routing or path-selection problem.
- Decisions reinforce over time (the same task types come back).
- You need interpretable evidence for routing decisions.

**Do not use either when:**
- Fitness requires human review (too expensive per iteration).
- The search space is discrete and combinatorial in a way that PSO does not cover (use genetic algorithms instead).
- Real-time decisions need strict latency (PSO/ACO converge slowly relative to single-pass heuristics).

### Why bio-inspired still wins

Gradient-based methods need differentiable signals. LLM outputs and routing decisions are not trivially differentiable. Pseudo-gradient methods (reinforcement-learned routers, DPO-style prompt tuners) work but need expensive training.

PSO and ACO need only an *evaluator* function. If you can score a candidate output or a routing decision, you can optimize over the space. That makes the bar for applicability much lower.

### Practical limits

- **Population budget.** N particles × T iterations × per-eval cost. For LLM evals at ~$0.02 / call, a 20-particle PSO running 50 iterations costs ~$20. Plan accordingly.
- **Exploration vs exploitation.** Pheromone decay rate and PSO inertia trade off; too fast decay → forget solutions; too slow → stuck on early local optima.
- **Catastrophic drift.** Both algorithms can converge and then diverge if fitness landscape shifts (new data distribution). Monitor best-fitness stability.




## Further Reading

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) — the 1995 PSO paper
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html) — 1992 ACO foundations
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) — PSO for structured LLM outputs
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) — PSO on model-weight subspace
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) — pheromone-driven routing with quality gate

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the coordination mechanism behind Swarm Optimization for LLMs (PSO, ACO).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central multi-agent interaction from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace messages, shared state, and verification decisions end to end.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the coordination mechanism behind Swarm Optimization for LLMs (PSO, ACO),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace messages, shared state, and verification decisions end to end,” and cite a repeatable check rather than relying on visual inspection alone.
