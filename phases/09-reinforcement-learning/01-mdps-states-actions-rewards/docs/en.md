# MDPs, States, Actions & Rewards

> A Markov Decision Process is five things: states, actions, transitions, rewards, a discount. Everything in RL — Q-learning, PPO, DPO, GRPO — optimizes over this shape. Learn it once, read the rest of reinforcement learning for free.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## Learning Objectives

- Formulate MDPs, States, Actions & Rewards in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

You are writing a chess bot. Or an inventory planner. Or a trading agent. Or the PPO loop that trains a reasoning model. Four different domains, one surprising fact: all four collapse to the same mathematical object.

Supervised learning gives you `(x, y)` pairs and asks you to fit a function. Reinforcement learning gives you no labels — only a stream of states, the actions you took, and a scalar reward. Did the move win the game? Did the restock decision save money? Did the trade make a profit? Did the token the LLM just produced lead to a higher reward from the judge?

You cannot learn from this stream until you formalize it. "What I saw," "what I did," "what happened next," "how good that was" — each has to become an object you can reason about. That formalization is a Markov Decision Process. Every RL algorithm in this phase, including the RLHF and GRPO loops at the end, optimizes over this shape.

## The Concept

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**The five objects.**

- **States** `S`. Everything the agent needs to decide. In GridWorld, the cell. In chess, the board. In an LLM, the context window plus any memory.
- **Actions** `A`. The choices. Move up/down/left/right. Play a move. Emit a token.
- **Transitions** `P(s' | s, a)`. Given state `s` and action `a`, the distribution over next state. Deterministic in chess, stochastic in inventory, almost-deterministic in LLM decoding.
- **Rewards** `R(s, a, s')`. The scalar signal. Win = +1, loss = -1. Revenue minus cost. The log-likelihood ratio term in GRPO.
- **Discount** `γ ∈ [0, 1)`. How much future reward counts vs present. `γ = 0.99` buys a horizon of ~100 steps; `γ = 0.9` buys ~10.

**The Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`. The future depends only on the present state. If it does not, the state representation is incomplete — not a failure of the method, a failure of the state.

**Policies and returns.** A policy `π(a | s)` maps states to action distributions. The return `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …` is the discounted sum of future rewards. The value `V^π(s) = E[G_t | s_t = s]` is the expected return starting from `s` under policy `π`. The Q-value `Q^π(s, a) = E[G_t | s_t = s, a_t = a]` is the expected return starting with a specific action. Every RL algorithm estimates one of these two, then improves `π` accordingly.

**The Bellman equations.** The fixed-point equations that everything in this phase uses:

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

These split expected return into "this step's reward" plus "discounted value of where you land." Recursive. Every algorithm in Phase 9 either iterates this equation to convergence (dynamic programming), samples from it (Monte Carlo), or bootstraps it one step (temporal difference).




## Further Reading

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) — the textbook. Ch. 3 covers MDPs and Bellman equations; Ch. 1 motivates the reward hypothesis that underlies every subsequent lesson.
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) — the origin of the Bellman equation.
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) — concise MDP primer from a deep-RL angle.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) — the operations-research reference on MDPs and exact solution methods.
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) — the cleanest derivation of MDPs as a dynamic-programming specialization.
