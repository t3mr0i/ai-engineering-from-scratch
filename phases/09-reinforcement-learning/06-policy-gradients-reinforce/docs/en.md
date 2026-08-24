# Policy Gradient — REINFORCE from Scratch

> Stop estimating value. Parameterize the policy directly, compute the gradient of expected return, step uphill. Williams (1992) wrote it in one theorem. It is why PPO, GRPO, and every LLM RL loop exist.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 minutes

## Learning Objectives

- Formulate Policy Gradient — REINFORCE from Scratch in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

Q-learning and DQN parameterize the *value* function. You pick actions by `argmax Q`. That is fine for discrete actions and discrete states. It breaks when actions are continuous (which `argmax` over a 10-dimensional torque?) or when you want a stochastic policy (`argmax` is deterministic by construction).

Policy gradients parameterize the *policy* instead. `π_θ(a | s)` is a neural net that outputs a distribution over actions. Sample from it to act. Compute the gradient of expected return with respect to `θ`. Step uphill. No `argmax`. No Bellman recursion. Just gradient ascent on `J(θ) = E_{π_θ}[G]`.

The REINFORCE theorem (Williams 1992) tells you this gradient is computable: `∇J(θ) = E_π[ G · ∇_θ log π_θ(a | s) ]`. Run an episode. Compute the return. Multiply by `∇ log π_θ(a | s)` at every step. Average. Gradient-ascent. Done.

Every LLM-RL algorithm in 2026 — PPO, DPO, GRPO — is a refinement of REINFORCE. Understanding it in your fingers is the prerequisite for the rest of this phase, and for Phase 10 · 07 (RLHF implementation) and Phase 10 · 08 (DPO).

## The Concept

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**The policy gradient theorem.** For any policy `π_θ` parameterized by `θ`:

`∇J(θ) = E_{τ ~ π_θ}[ Σ_{t=0}^{T} G_t · ∇_θ log π_θ(a_t | s_t) ]`

where `G_t = Σ_{k=t}^{T} γ^{k-t} r_{k+1}` is the discounted return from step `t`. The expectation is over full trajectories `τ` sampled from `π_θ`.

**The proof is short.** Differentiate `J(θ) = Σ_τ P(τ; θ) G(τ)` under the expectation. Use `∇P(τ; θ) = P(τ; θ) ∇ log P(τ; θ)` (the log-derivative trick). Factor `log P(τ; θ) = Σ log π_θ(a_t | s_t) + environment terms that do not depend on θ`. The environment terms vanish. Two lines of algebra give you the theorem.

**Variance reduction tricks.** Vanilla REINFORCE has murderous variance — returns are noisy, `∇ log π` is noisy, their product is very noisy. Two standard fixes:

1. **Baseline subtraction.** Replace `G_t` with `G_t - b(s_t)` for any baseline `b(s_t)` that does not depend on `a_t`. Unbiased because `E[b(s_t) · ∇ log π(a_t | s_t)] = 0`. Typical choice: `b(s_t) = V̂(s_t)` learned by a critic → actor-critic (Lesson 07).
2. **Reward-to-go.** Replace `Σ_t G_t · ∇ log π_θ(a_t | s_t)` with `Σ_t G_t^{from t} · ∇ log π_θ(a_t | s_t)`. Only future returns matter for a given action — past rewards contribute zero-mean noise.

Combined, you get:

`∇J ≈ (1/N) Σ_{i=1}^{N} Σ_{t=0}^{T_i} [ G_t^{(i)} - V̂(s_t^{(i)}) ] · ∇_θ log π_θ(a_t^{(i)} | s_t^{(i)})`

which is REINFORCE with a baseline — the direct ancestor of A2C (Lesson 07) and PPO (Lesson 08).

**Softmax policy parameterization.** For discrete actions, the standard choice:

`π_θ(a | s) = exp(f_θ(s, a)) / Σ_{a'} exp(f_θ(s, a'))`

where `f_θ` is any neural net that outputs a score per action. The gradient has a clean form:

`∇_θ log π_θ(a | s) = ∇_θ f_θ(s, a) - Σ_{a'} π_θ(a' | s) ∇_θ f_θ(s, a')`

i.e., score of the taken action minus its expected value under the policy.

**Gaussian policy for continuous actions.** `π_θ(a | s) = N(μ_θ(s), σ_θ(s))`. `∇ log N(a; μ, σ)` has a closed form. That is all Phase 9 · 07's SAC needs.




## Further Reading

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) — the original REINFORCE paper.
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) — the modern policy-gradient theorem with function approximation.
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) — textbook presentation.
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) — clear pedagogical exposition with PyTorch code.
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) — variance-reduction and the natural-gradient view that connects REINFORCE to the trust-region family (TRPO, PPO).

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Formulate Policy Gradient — REINFORCE from Scratch in terms of states, actions, rewards, and objectives.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central update rule from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace learning signals through a self-terminating experiment.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Formulate Policy Gradient — REINFORCE from Scratch in terms of states, actions, rewards, and objectives,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace learning signals through a self-terminating experiment,” and cite a repeatable check rather than relying on visual inspection alone.

## Guided Demo

Use the [10–15 minute guided demo](demo.md) to predict an invariant, run the canonical entrypoint, change one variable, and probe a failure case.
