# Actor-Critic — A2C and A3C

> REINFORCE is noisy. Add a critic that learns `V̂(s)`, subtract it from the return, and you get an advantage that has the same expectation but far lower variance. That is actor-critic. A2C runs it synchronously; A3C runs it across threads. Both are the mental model for every modern deep-RL method.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 minutes

## The Problem

Vanilla REINFORCE works, but its variance is terrible. Monte Carlo returns `G_t` can swing over a factor of 10 between episodes. Multiplying that noise by `∇ log π` and averaging produces a gradient estimator that takes thousands of episodes to move the policy the same distance you could move it with far fewer DQN updates.

The variance comes from using raw returns. If you subtract a baseline `b(s_t)` — any function of state, including a learned value — the expectation is unchanged and the variance drops. The best tractable baseline is `V̂(s_t)`. Now the quantity multiplying `∇ log π` is the *advantage*:

`A(s, a) = G - V̂(s)`

An action is good if it produced above-average return; bad if below. REINFORCE with a learned critic is *actor-critic*. The critic gives the actor a low-variance teacher. This is every deep-policy method after 2015 (A2C, A3C, PPO, SAC, IMPALA).

## The Concept

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**Two networks, one shared loss:**

- **Actor** `π_θ(a | s)`: the policy. Sampled to act. Trained with policy gradient.
- **Critic** `V_φ(s)`: estimates expected return from state. Trained to minimize `(V_φ(s) - target)²`.

**The advantage.** Two standard forms:

- *MC advantage:* `A_t = G_t - V_φ(s_t)`. Unbiased, higher variance.
- *TD advantage:* `A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`. Biased (uses `V_φ`), far lower variance. Also called the *TD residual* `δ_t`.

**n-step advantage.** Interpolate between the two:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1` is pure TD. `n = ∞` is MC. Most implementations use `n = 5` for Atari, `n = 2048` for PPO on MuJoCo.

**Generalized Advantage Estimation (GAE).** Schulman et al. (2016) proposed an exponentially weighted average over all n-step advantages:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

with `λ ∈ [0, 1]`. `λ = 0` is TD (low variance, high bias). `λ = 1` is MC (high variance, unbiased). `λ = 0.95` is the 2026 default — tune until the bias/variance dial is where you want it.

**A2C: synchronous advantage actor-critic.** Collect `T` steps across `N` parallel environments. Compute advantages for each step. Update actor and critic on the combined batch. Repeat. The simpler, more-scalable sibling of A3C.

**A3C: asynchronous advantage actor-critic.** Mnih et al. (2016). Spawn `N` worker threads, each running an env. Each worker computes gradients locally on its own rollout, then asynchronously applies them to a shared parameter server. No replay buffer needed — workers decorrelate by running different trajectories. A3C proved you could train on CPUs at scale. In 2026, GPU-based A2C (batched parallel envs) dominates because GPUs want large batches.

**The combined loss.**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

Three terms: policy-gradient loss, value regression, entropy bonus. `c_v ~ 0.5`, `c_e ~ 0.01` are canonical starting points.


## Use It

A2C/A3C are rarely the final choice in 2026 but they are the architecture everything later refines:

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

If you see "advantage" in a 2026 paper, think actor-critic.

## Ship It

Save as `outputs/skill-actor-critic-trainer.md`:

```markdown
---
name: actor-critic-trainer
description: Produce an A2C / A3C / GAE configuration for a given environment, with advantage estimation and loss weights specified.
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

Given an environment and compute budget, output:

1. Parallelism. A2C (GPU batched) vs A3C (CPU async) and the number of workers.
2. Rollout length T. Steps per env per update.
3. Advantage estimator. n-step or GAE(λ); specify λ.
4. Loss weights. `c_v` (value), `c_e` (entropy), gradient clip.
5. Learning rates. Actor and critic (separate if using).

Refuse single-worker A2C on environments with horizon > 1000 (too on-policy, too slow). Refuse to ship without advantage normalization. Flag any run with `c_e = 0` and observed entropy < 0.1 as entropy-collapsed.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Actor | "The policy net" | `π_θ(a\|s)`, updated by policy gradient. |
| Critic | "The value net" | `V_φ(s)`, updated by MSE regression to returns / TD targets. |
| Advantage | "How much better than average" | `A(s, a) = Q(s, a) - V(s)` or its estimators. Multiplier for `∇ log π`. |
| TD residual | "δ" | `δ_t = r + γ V(s') - V(s)`; one-step advantage estimate. |
| GAE | "The interpolation knob" | Exponentially weighted sum of n-step advantages, parameterized by `λ`. |
| A2C | "Synchronous actor-critic" | Batched across envs; one gradient step per rollout. |
| A3C | "Async actor-critic" | Worker threads push gradients to a shared param server. Original paper; less common in 2026. |
| Bootstrap | "Use V at the horizon" | Truncate the rollout, add `γ^n V(s_{t+n})` to close the sum. |

## Further Reading

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) — A3C, the original async actor-critic paper.
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) — GAE.
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) — foundations; pair this with Ch. 9 on function approximation when the critic is a neural net.
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) — scalable distributed actor-critic with V-trace off-policy correction.
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) — production A2C/PPO implementations worth reading.
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) — the foundational convergence result for the two-timescale actor-critic decomposition.
