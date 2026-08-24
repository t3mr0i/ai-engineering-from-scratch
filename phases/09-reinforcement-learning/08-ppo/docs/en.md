# Proximal Policy Optimization (PPO)

> A2C throws away each rollout after one update. PPO wraps the policy gradient in a clipped importance ratio so you can do 10+ epochs on the same data without the policy exploding. Schulman et al. (2017). Still the default policy-gradient algorithm in 2026.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 minutes

## Learning Objectives

- Formulate Proximal Policy Optimization (PPO) in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

A2C (Lesson 07) is on-policy: the gradient `E_{π_θ}[A · ∇ log π_θ]` requires data sampled from the *current* `π_θ`. Take one update, and `π_θ` changes; the data you used is now off-policy. Re-use it and your gradient is biased.

Rollouts are expensive. On Atari, one rollout across 8 envs × 128 steps = 1024 transitions and a dozen seconds of environment time. Throwing that away after one gradient step is wasteful.

Trust Region Policy Optimization (TRPO, Schulman 2015) was the first fix: constrain each update so the KL divergence between old and new policy stays below `δ`. Theoretically clean, but requires a conjugate-gradient solve per update. Nobody runs TRPO in 2026.

PPO (Schulman et al. 2017) replaces the hard trust-region constraint with a simple clipped objective. One extra line of code. Ten epochs per rollout. No conjugate gradients. Good-enough theoretical guarantees. Nine years later it is still the default policy-gradient algorithm for everything from MuJoCo to RLHF.

## The Concept

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**The importance ratio.**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

This is the likelihood ratio of the new policy vs the policy that collected the data. `r_t = 1` means no change. `r_t = 2` means the new policy is twice as likely to take `a_t` as the old.

**The clipped surrogate.**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

Two terms:

- If the advantage `A_t > 0` and the ratio tries to grow past `1 + ε`, the clip flattens the gradient — don't push a good action further than `+ε` above old probability.
- If the advantage `A_t < 0` and the ratio tries to grow past `1 - ε` (meaning we would make a bad action more likely compared to its clipped reduction), the clip caps the gradient — don't push a bad action below `-ε`.

The `min` handles the other direction: if the ratio has moved in the *beneficial* direction, you still get the gradient (no clipping on the side that would hurt you).

Typical `ε = 0.2`. Plot the objective as a function of `r_t`: a piecewise-linear function with a flat roof on the "good side" and a flat floor on the "bad side."

**The full PPO loss.**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

Same actor-critic structure as A2C. Three coefficients, usually `c_v = 0.5`, `c_e = 0.01`, `ε = 0.2`.

**The training loop.**

1. Collect `N × T` transitions across `N` parallel envs for `T` steps each.
2. Compute advantages (GAE), freeze them as constants.
3. Freeze `π_{θ_old}` as a snapshot of current `π_θ`.
4. For `K` epochs, for each minibatch of `(s, a, A, V_target, log π_old(a|s))`:
   - Compute `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`.
   - Apply `L^{CLIP}` + value loss + entropy.
   - Gradient step.
5. Discard the rollout. Return to step 1.

`K = 10` and minibatches of 64 is a standard hyperparameter set. PPO is robust: the exact numbers rarely matter within ±50%.

**KL-penalty variant.** The original paper proposed an alternative using an adaptive KL penalty: `L = L^{PG} - β · KL(π_θ || π_old)` with `β` adjusted based on observed KL. The clipping version became dominant; the KL variant survives in RLHF (where KL to the reference policy is a separate constraint you always want anyway).




## Further Reading

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) — the paper.
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) — TRPO, PPO's predecessor.
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) — every PPO hyperparameter ablated.
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) — InstructGPT; the PPO-in-RLHF recipe.
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) — clean modern exposition with PyTorch.
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) — reference single-file PPO used by many papers.
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) — the production recipe for PPO on language models; read alongside Lesson 09 (RLHF).
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) — the "37 code-level optimizations" paper; which PPO tricks are load-bearing and which are folklore.
