# Deep Q-Networks (DQN)

> 2013: Mnih trained one Q-learning network on raw pixels, beat every classical RL agent on seven Atari games. 2015: extended to 49 games, published in Nature, sparked the deep-RL era. DQN is Q-learning plus three tricks that make function approximation stable.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 04 (Q-learning, SARSA)
**Time:** ~75 minutes

## Learning Objectives

- Formulate Deep Q-Networks (DQN) in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

Tabular Q-learning needs a separate Q-value for every (state, action) pair. A chess board has ~10⁴³ states. An Atari frame is 210×160×3 = 100,800 features. Tabular RL dies at thousands of states, let alone billions.

The fix is obvious in hindsight: replace the Q-table with a neural network, `Q(s, a; θ)`. But obvious-in-hindsight took decades. Naive function approximation with Q-learning diverges under the "deadly triad" — function approximation + bootstrapping + off-policy learning. Mnih et al. (2013, 2015) identified three engineering tricks that stabilize learning:

1. **Experience replay** decorrelates transitions.
2. **Target network** freezes the bootstrap target.
3. **Reward clipping** normalizes gradient magnitudes.

DQN on Atari was the first time a single architecture with a single hyperparameter set solved dozens of control problems from raw pixels. Everything "deep-RL" built since — DDQN, Rainbow, Dueling, Distributional, R2D2, Agent57 — is stacked on top of this three-trick base.

## The Concept

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**The objective.** DQN minimizes the one-step TD loss on a neural Q-function:

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ` = online network, updated every step by gradient descent. `θ^-` = target network, periodically copied from `θ` (every ~10,000 steps). `D` = replay buffer of past transitions.

**The three tricks, in order of importance:**

**Experience replay.** A ring buffer of `~10⁶` transitions. Each training step samples a minibatch uniformly at random. This breaks temporal correlation (successive frames are nearly identical), lets the network learn from rare rewarding transitions many times, and decorrelates consecutive gradient updates. Without it, on-policy TD with a neural net diverges on Atari.

**Target network.** Using the same network `Q(·; θ)` on both sides of the Bellman equation makes the target move every update — "chasing your own tail." The fix: keep a second network `Q(·; θ^-)` with frozen weights. Every `C` steps, copy `θ → θ^-`. This stabilizes the regression target for thousands of gradient steps at a time. Soft updates `θ^- ← τ θ + (1-τ) θ^-` (used in DDPG, SAC) are a smoother variant.

**Reward clipping.** Atari reward magnitudes vary from 1 to 1000+. Clipping to `{-1, 0, +1}` stops any single game from dominating the gradient. Wrong when reward magnitude matters; fine for Atari where only sign matters.

**Double DQN.** Hasselt (2016) fixes maximization bias: use the online net to *select* the action, the target net to *evaluate* it.

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

Drop-in replacement, consistently better. Use it by default.

**Other improvements (Rainbow, 2017):** prioritized replay (sample high-TD-error transitions more), dueling architecture (separate `V(s)` and advantage heads), noisy networks (learned exploration), n-step returns, distributional Q (C51/QR-DQN), multi-step bootstrapping. Each adds a few percent; the gains are roughly additive.




## Further Reading

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602) — the 2013 NeurIPS workshop paper that kicked off deep RL.
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) — the Nature paper, 49-game DQN.
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) — DDQN.
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581) — dueling DQN.
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) — the stacked-tricks paper.
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html) — clear modern exposition.
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) — the textbook treatment of the "deadly triad" (function approximation + bootstrapping + off-policy) that DQN's target network and replay buffer are designed to tame.
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) — reference single-file DQN used in ablation studies; good to read alongside this lesson's from-scratch version.
