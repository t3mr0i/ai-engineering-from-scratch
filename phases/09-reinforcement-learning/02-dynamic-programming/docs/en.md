# Dynamic Programming — Policy Iteration & Value Iteration

> Dynamic programming is RL with cheating. You already know the transition and reward functions; you just iterate the Bellman equation until `V` or `π` stops moving. It is the benchmark every sampling-based method tries to approach.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## The Problem

You have an MDP with a known model: you can query `P(s' | s, a)` and `R(s, a, s')` for any state-action pair. An inventory manager knows the demand distribution. A board game has deterministic transitions. A gridworld is four lines of Python. You have a *model*.

Model-free RL (Q-learning, PPO, REINFORCE) was invented for the case where you don't have a model — you can only sample from the environment. But when you do have one, there are faster, better methods: dynamic programming. Bellman designed them in 1957. They still define correctness: when people say "optimal policy for this MDP," they mean the policy DP would return.

You need them in 2026 for three reasons. First, every tabular environment in RL research (GridWorld, FrozenLake, CliffWalking) is solved with DP to produce the gold-standard policy. Second, exact values let you *debug* sampling methods: if Q-learning's estimate for `V*(s_0)` disagrees with the DP answer by 30%, your Q-learning has a bug. Third, modern offline RL and planning methods (MCTS, AlphaZero's search, model-based RL in Phase 9 · 10) all iterate a Bellman backup over a learned or given model.

## The Concept

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**Two algorithms, both fixed-point iteration on Bellman.**

**Policy iteration.** Alternates two steps until the policy stops changing.

1. *Evaluation:* given policy `π`, compute `V^π` by repeatedly applying `V(s) ← Σ_a π(a|s) Σ_{s',r} P(s',r|s,a) [r + γ V(s')]` until it converges.
2. *Improvement:* given `V^π`, make `π` greedy w.r.t. `V^π`: `π(s) ← argmax_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`.

Convergence is guaranteed because (a) each improvement step either keeps `π` the same or strictly increases `V^π` for some state, (b) the space of deterministic policies is finite. Usually converges in ~5–20 outer iterations even for large state spaces.

**Value iteration.** Collapses evaluation and improvement into one sweep. Apply the Bellman *optimality* equation:

`V(s) ← max_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

Repeat until `max_s |V_{new}(s) - V(s)| < ε`. Extract the policy at the end by taking the greedy action. Strictly faster per iteration — no inner evaluation loop — but typically needs more iterations to converge.

**Generalized policy iteration (GPI).** The unifying framing. Value function and policy are locked in a two-way improvement loop; any method that drives both toward mutual consistency (async value iteration, modified policy iteration, Q-learning, actor-critic, PPO) is an instance of GPI.

**Why `γ < 1` matters.** The Bellman operator is a `γ`-contraction in the sup-norm: `||T V - T V'||_∞ ≤ γ ||V - V'||_∞`. Contraction implies unique fixed point and geometric convergence. Drop `γ < 1` and you lose the guarantee — you need a finite horizon or an absorbing terminal state.


## Use It

In 2026, DP is the correctness baseline and the inner loop of planners:

| Use case | Method |
|----------|--------|
| Solve a small tabular MDP exactly | Value iteration (simpler) or policy iteration (fewer outer steps) |
| Verify a Q-learning / PPO implementation | Compare to DP-optimal V* on a toy environment |
| Model-based RL (Phase 9 · 10) | Bellman backup on a learned transition model |
| Planning in AlphaZero / MuZero | Monte Carlo Tree Search = async Bellman backup |
| Offline RL (CQL, IQL) | Conservative Q-iteration — DP with a penalty on OOD actions |

Every time someone says "the optimal value function," they mean "the DP fixed point." When you see `V*` or `Q*` in a paper, picture this loop.

## Ship It

Save as `outputs/skill-dp-solver.md`:

```markdown
---
name: dp-solver
description: Solve a small tabular MDP exactly via policy iteration or value iteration. Report convergence behavior.
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

Given an MDP with a known model, output:

1. Choice. Policy iteration vs value iteration. Reason tied to |S|, |A|, γ.
2. Initialization. V_0, starting policy. Convergence sensitivity.
3. Stopping. Sup-norm tolerance ε. Expected number of sweeps.
4. Verification. V*(s_0) computed exactly. Greedy policy extracted.
5. Use. How this baseline will be used to debug/evaluate sampling-based methods.

Refuse to run DP on state spaces > 10⁷. Refuse to claim convergence without a sup-norm check. Flag any γ ≥ 1 on an infinite-horizon task as a guarantee violation.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy iteration | "DP algorithm" | Alternating evaluation (`V^π`) and improvement (greedy `π` w.r.t. `V^π`) until the policy stops changing. |
| Value iteration | "Faster DP" | Bellman optimality backup applied in one sweep; converges to `V*` geometrically. |
| Bellman operator | "The recursion" | `(T V)(s) = max_a Σ P (r + γ V(s'))`; a `γ`-contraction in sup-norm. |
| Contraction | "Why DP converges" | Any operator `T` with `\|\|T x - T y\|\| ≤ γ \|\|x - y\|\|` has a unique fixed point. |
| GPI | "Everything is DP" | Generalized Policy Iteration: any method driving `V` and `π` to mutual consistency. |
| Synchronous update | "Jacobi-style" | Use old `V` throughout a sweep; cleanly analyzable but slower. |
| In-place update | "Gauss-Seidel-style" | Use `V` as it's being updated; converges faster in practice. |

## Further Reading

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) — the canonical presentation of policy iteration and value iteration.
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) — rigorous treatment of contraction-mapping arguments.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) — modified policy iteration and its convergence analysis.
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) — the original policy iteration paper.
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) — the bridge from DP to approximate-DP / deep RL used by every subsequent lesson.
