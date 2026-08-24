# Monte Carlo Methods — Learning from Complete Episodes

> Dynamic programming needs a model. Monte Carlo needs nothing but episodes. Run the policy, watch the returns, average them. The simplest idea in RL — and the one that unlocks everything downstream.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## Learning Objectives

- Formulate Monte Carlo Methods — Learning from Complete Episodes in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

Dynamic programming is elegant, but it assumes you can query `P(s' | s, a)` for every state and action. Almost nothing in the real world works that way. A robot cannot analytically compute the distribution over camera pixels after a joint torque. A pricing algorithm cannot integrate over every possible customer reaction. An LLM cannot enumerate all possible continuations after a token.

You need a method that only needs the ability to *sample* from the environment. Run the policy. Get a trajectory `s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`. Use it to estimate values. That is Monte Carlo.

The shift from DP to MC is philosophically important: we move from *known model + exact backup* to *sampled rollouts + averaged return*. The variance jumps, but the applicability explodes. Every RL algorithm after this lesson — TD, Q-learning, REINFORCE, PPO, GRPO — is a Monte Carlo estimator at heart, sometimes with bootstrapping layered on top.

## The Concept

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**The core idea, in one line:** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)` where `G^{(i)}(s)` are observed returns following visits to `s` under policy `π`.

**First-visit vs every-visit MC.** Given an episode that visits state `s` multiple times, first-visit MC only counts the return from the first visit; every-visit MC counts all visits. Both are unbiased in the limit. First-visit is simpler to analyze (iid samples). Every-visit uses more data per episode and typically converges faster in practice.

**Incremental mean.** Instead of storing all returns, update the running average:

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

Reorganize: `V_new = V_old + α · (target - V_old)` with `α = 1/n`. Swap `1/n` for a constant step-size `α ∈ (0, 1)` and you get a non-stationary MC estimator that tracks changes in `π`. That move is the entire jump from MC to TD to every modern RL algorithm.

**Exploration is now a problem.** DP touched every state by enumeration. MC only sees states the policy visits. If `π` is deterministic, whole regions of the state space never get sampled, and their value estimates stay at zero forever. Three fixes, in historical order:

1. **Exploring starts.** Start each episode from a random (s, a) pair. Guarantees coverage; unrealistic in practice (you cannot "reset" a robot into an arbitrary state).
2. **ε-greedy.** Act greedy w.r.t. current Q, but with probability `ε` pick a random action. All state-action pairs get sampled asymptotically.
3. **Off-policy MC.** Collect data under a behavior policy `μ`, learn about target policy `π` via importance sampling. High variance, but it's the bridge to replay-buffer methods like DQN.

**Monte Carlo Control.** Evaluate → improve → evaluate, just like policy iteration, but evaluation is sampling-based:

1. Run `π`, get an episode.
2. Update `Q(s, a)` from observed returns.
3. Make `π` ε-greedy w.r.t. `Q`.
4. Repeat.

Converges to `Q*` and `π*` with probability 1 under mild conditions (every pair visited infinitely often, `α` satisfies Robbins-Monro).




## Further Reading

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) — the canonical treatment.
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) — first-visit vs every-visit analysis.
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) — off-policy MC and variance control.
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) — modern low-variance IS estimators.
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) — the first large-scale empirical demonstration of MC/TD self-play converging to superhuman play; conceptual precursor to every lesson in the second half of this phase.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Formulate Monte Carlo Methods — Learning from Complete Episodes in terms of states, actions, rewards, and objectives.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central update rule from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace learning signals through a self-terminating experiment.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Formulate Monte Carlo Methods — Learning from Complete Episodes in terms of states, actions, rewards, and objectives,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace learning signals through a self-terminating experiment,” and cite a repeatable check rather than relying on visual inspection alone.
