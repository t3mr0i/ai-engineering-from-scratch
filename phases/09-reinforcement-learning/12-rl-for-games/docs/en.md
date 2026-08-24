# RL for Games — AlphaZero, MuZero, and the LLM-Reasoning Era

> 1992: TD-Gammon beat human champions at backgammon with pure TD. 2016: AlphaGo beat Lee Sedol. 2017: AlphaZero dominated chess, shogi, and Go from scratch. 2024: DeepSeek-R1 proved the same recipe, with GRPO replacing PPO, works on reasoning. Games are the benchmark that drives every breakthrough in this phase.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 05 (DQN), Phase 9 · 08 (PPO), Phase 9 · 09 (RLHF), Phase 9 · 10 (MARL)
**Time:** ~120 minutes

## Learning Objectives

- Formulate RL for Games — AlphaZero, MuZero, and the LLM-Reasoning Era in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

Games have everything RL wants. Clean reward (win/loss). Infinite episodes (self-play resets). Perfect simulation (the game *is* the simulator). Discrete or small continuous action spaces. Multi-agent structure that forces adversarial robustness.

And games are how every major RL breakthrough was tested. TD-Gammon (backgammon, 1992). Atari-DQN (2013). AlphaGo (2016). AlphaZero (2017). OpenAI Five (Dota 2, 2019). AlphaStar (StarCraft II, 2019). MuZero (learned model, 2019). AlphaTensor (matrix multiplication, 2022). AlphaDev (sorting algorithms, 2023). DeepSeek-R1 (math reasoning, 2025) — the latest demonstration that game-RL techniques work on text.

This capstone surveys the three landmark architectures — AlphaZero, MuZero, and GRPO — through a single unifying lens: **self-play + search + policy improvement**. Each generalizes the previous; GRPO in particular is AlphaZero's recipe applied to LLM reasoning, with tokens as actions and mathematical verification as the win signal.

## The Concept

![AlphaZero ↔ MuZero ↔ GRPO: same loop, different environments](../assets/rl-games.svg)

**The unifying loop.**

```
while True:
    trajectory = self_play(current_policy, search)     # play game against self
    policy_target = search.improved_policy(trajectory) # search improves raw policy
    policy_net.update(policy_target, value_target)     # supervised on search output
```

**AlphaZero (2017).** Silver et al. Given a game (chess, shogi, Go) with known rules:

- Policy-value network: one tower `f_θ(s) → (p, v)`. `p` is a prior over legal moves. `v` is the expected game outcome.
- Monte Carlo Tree Search (MCTS): at each move, expand a tree of possible continuations. Use `(p, v)` as the prior + bootstrap. Select nodes by UCB (PUCT): `a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`.
- Self-play: play games agent-vs-agent. At move `t`, the MCTS visit distribution `π_t` becomes the policy training target.
- Loss: `L = (v - z)² - π · log p + c · ||θ||²`. `z` is the game outcome (+1 / 0 / -1).

Zero human knowledge. Zero handcrafted heuristics. A single recipe that mastered chess, shogi, and Go after a few tens of millions of self-play games each.

**MuZero (2019).** Schrittwieser et al. Removes the requirement that the rules are known.

- Instead of a fixed environment, learn a *latent dynamics model* `(h, g, f)`:
  - `h(s)`: encode observation to latent state.
  - `g(s_latent, a)`: predict next latent state + reward.
  - `f(s_latent)`: predict policy prior + value.
- MCTS runs in the *learned latent space*. Same search, same training loop.
- Works on Go, chess, shogi *and* Atari — one algorithm, no rule knowledge.

**Stochastic MuZero (2022).** Adds stochastic dynamics and chance nodes; extends to backgammon-class games.

**Muesli, Gumbel MuZero (2022-2024).** Improvements on sample efficiency and deterministic search.

**GRPO (2024-2025).** DeepSeek-R1 recipe. Same AlphaZero-shaped loop, applied to language-model reasoning:

- "Game": answer a math / coding / reasoning problem. "Win" = verifier (test case passes, numerical answer matches) returns 1.
- Policy: the LLM. Actions: tokens. State: prompt + response-so-far.
- No critic (PPO-style V_φ). Instead, for each prompt, sample `G` completions from the policy. Compute reward for each. Use the **group-relative advantage** `A_i = (r_i - mean_r) / std_r` as the signal for REINFORCE-style update.
- KL penalty to reference policy to prevent drift (like RLHF).
- Full loss:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

No reward model, no critic, no MCTS. Group-relative baseline replaces all three. Matches or exceeds PPO-RLHF quality on reasoning benchmarks at a fraction of the compute.

**The R1 recipe in full.** DeepSeek-R1 (DeepSeek 2025) is two models in one paper:

- **R1-Zero.** Start from the DeepSeek-V3 base model. No SFT. Apply GRPO directly with two reward components: *accuracy reward* (rule-based — did the final answer parse to the correct number / did the code pass unit tests) and *format reward* (did the completion wrap its chain-of-thought in `<think>…</think>` tags). Over thousands of steps, average response length grows from ~100 to ~10,000 tokens and math benchmark scores climb to near-o1-preview levels. The model learns to reason from scratch. The downside: its chains of thought are often unreadable, mix languages, and lack stylistic polish.
- **R1.** Fix R1-Zero's readability problems with a four-stage pipeline:
  1. **Cold-start SFT.** Collect a few thousand long-CoT demonstrations with clean formatting. Supervised-finetune the base model on them. This gives a readable starting point.
  2. **Reasoning-oriented GRPO.** Apply GRPO with the accuracy+format rewards plus a *language-consistency* reward to prevent code-switching.
  3. **Rejection sampling + SFT round 2.** Sample ~600K reasoning trajectories from the RL checkpoint, keep only those with correct final answers and readable CoT, and combine with ~200K non-reasoning SFT examples (writing, QA, self-cognition). Fine-tune the base again.
  4. **Full-spectrum GRPO.** One more RL round covering both reasoning (rule-based rewards) and general alignment (helpfulness/harmlessness preference-based rewards).

The result matches o1 on AIME and MATH-500 at open weights, and is small enough to distill. The same paper also releases six distilled dense models (Qwen-1.5B through Llama-70B) by SFT'ing on R1's reasoning traces — no RL at the student. Distillation of a strong RL teacher consistently beats RL from scratch at the student's scale.

**Why GRPO instead of PPO for reasoning.** Three reasons in the DeepSeekMath paper (Feb 2024): (1) no value network to train, halving memory; (2) the group baseline naturally handles the sparse end-of-trajectory reward that reasoning tasks produce; (3) per-prompt normalization makes advantages comparable across problems of wildly different difficulty, which PPO's single critic cannot.

**Search-free vs search-based.** Games have branched:

- *Perfect-information games with long horizons* (Go, chess): still search-based. AlphaZero / MuZero dominate.
- *LLM reasoning*: no MCTS yet in production; GRPO on full rollouts, best-of-N for inference compute. Process reward models (PRMs) hint at step-level search being added back.




## Further Reading

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270).
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404).
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4).
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z).
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300) — the paper that introduced GRPO and the group-relative baseline.
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) — the full four-stage R1 recipe plus the R1-Zero ablation.
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) — CFR + deep-learning at scale.
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343) — the paper that started it all.
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) — the production reference for applying GRPO with custom reward functions.
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) — open replication of the R1 recipe at multiple scales.
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) — the textbook framing for self-play, search, and "designed reward" that R1 instantiates at LLM scale.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Formulate RL for Games — AlphaZero, MuZero, and the LLM-Reasoning Era in terms of states, actions, rewards, and objectives.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central update rule from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace learning signals through a self-terminating experiment.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Formulate RL for Games — AlphaZero, MuZero, and the LLM-Reasoning Era in terms of states, actions, rewards, and objectives,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace learning signals through a self-terminating experiment,” and cite a repeatable check rather than relying on visual inspection alone.
