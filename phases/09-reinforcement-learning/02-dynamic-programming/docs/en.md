# Dynamic Programming — Policy Iteration & Value Iteration

> Dynamic programming is RL with cheating. You already know the transition and reward functions; you just iterate the Bellman equation until `V` or `π` stops moving. It is the benchmark every sampling-based method tries to approach.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## Learning Objectives

- Formulate Dynamic Programming — Policy Iteration & Value Iteration in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

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




## Build It

Reconstruct **Dynamic Programming — Policy Iteration & Value Iteration** by following `states` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `states` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-dp-solver.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) — the canonical presentation of policy iteration and value iteration.
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) — rigorous treatment of contraction-mapping arguments.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) — modified policy iteration and its convergence analysis.
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) — the original policy iteration paper.
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) — the bridge from DP to approximate-DP / deep RL used by every subsequent lesson.

## Exercises

Use `states` as the trace: start from the smallest valid record {"id": 1}, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the smallest valid record {"id": 1}. Follow `states`, `apply_move`, `perpendiculars`. Expect validation names the missing field or rejects the request; it must not silently accept an incomplete record; capture the first printed shape, metric, status, or summary field and state which part supports **Formulate Dynamic Programming — Policy Iteration & Value Iteration in terms of states, actions, rewards, and objectives**.
2. **Vary one named input.** Repeat the command after changing only the optional field: use the same record with one optional field changed. Predict the direction of the change, then compare the two output values. Explain why **Implement the central update rule from first principles** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation a record missing the required "id" field. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace learning signals through a self-terminating experiment** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-dp-solver.md` and add a worked example using the smallest valid record {"id": 1}. Include the input contract, one expected output field, and a named acceptance check for **Evaluate convergence, stability, and exploration trade-offs**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Dynamic Programming — Policy Iteration & Value Iteration** should contain:

- the `python3 main.py` output for the smallest valid record {"id": 1}, with `states`, `apply_move`, `perpendiculars` traced to the value or shape that supports **Formulate Dynamic Programming — Policy Iteration & Value Iteration in terms of states, actions, rewards, and objectives**;
- a before/after comparison for the optional field, where the same record with one optional field changed changes the observation in the direction predicted by **Implement the central update rule from first principles**;
- a recorded result for a record missing the required "id" field that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace learning signals through a self-terminating experiment**; and
- an updated `outputs/skill-dp-solver.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate convergence, stability, and exploration trade-offs**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
