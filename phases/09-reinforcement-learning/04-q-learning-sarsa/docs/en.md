# Temporal Difference — Q-Learning & SARSA

> Monte Carlo waits until the episode ends. TD updates after every step by bootstrapping the next value estimate. Q-learning is off-policy and optimistic; SARSA is on-policy and cautious. Both are one line of code. Both underpin every deep-RL method in this phase.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming), Phase 9 · 03 (Monte Carlo)
**Time:** ~75 minutes

## Learning Objectives

- Formulate Temporal Difference — Q-Learning & SARSA in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

Monte Carlo works but it has two expensive demands. It needs episodes that terminate, and it only updates after the final return is in. If your episode is 1,000 steps, MC waits 1,000 steps to update anything. It is high-variance, low-bias, and slow in practice.

Dynamic programming has the opposite profile — zero-variance bootstrapped backups — but requires a known model.

Temporal difference (TD) learning splits the difference. From a single transition `(s, a, r, s')`, form a one-step target `r + γ V(s')` and nudge `V(s)` toward it. No model. No complete episodes. Bias from using an approximate `V` on the RHS, but dramatically lower variance than MC and online updates from step one.

This is the pivot on which all of modern RL — DQN, A2C, PPO, SAC — turns. The rest of Phase 9 is layers of function approximation and tricks built on top of the one-step TD update you will write in this lesson.

## The Concept

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**The TD(0) update for V:**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

The bracketed quantity is the TD error `δ = r + γ V(s') - V(s)`. It is the online analogue of `G_t - V(s_t)` in MC. Convergence requires `α` satisfying Robbins-Monro (`Σ α = ∞`, `Σ α² < ∞`) and all states visited infinitely often.

**Q-learning.** An off-policy TD method for control:

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

The `max` assumes the *greedy* policy will be followed from `s'` onward, regardless of what action the agent actually takes. That decoupling makes Q-learning learn `Q*` while the agent explores via ε-greedy. Mnih et al. (2015) converted this into deep Q-learning on Atari (Lesson 05).

**SARSA.** An on-policy TD method:

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

The name is the tuple `(s, a, r, s', a')`. SARSA uses the action `a'` the agent *actually* takes next, not the greedy `argmax`. Converges to `Q^π` for whatever ε-greedy `π` is running, which in the limit `ε → 0` becomes `Q*`.

**The cliff-walking difference.** On the classic cliff-walking task (fall-off-cliff = reward -100), Q-learning learns the optimal path along the cliff edge but occasionally takes the penalty during exploration. SARSA learns a safer path one step away from the cliff because it factors exploration noise into its Q-value. With training, both reach optimal at `ε → 0`. In practice it matters: when exploration is actually happening at deployment, SARSA's behavior is more conservative.

**Expected SARSA.** Replace `Q(s', a')` with its expected value under `π`:

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

Lower variance than SARSA (no sample of `a'`), same on-policy target. Often the default in modern textbooks.

**n-step TD and TD(λ).** Interpolate between TD(0) and MC by waiting `n` steps before bootstrapping. `n=1` is TD, `n=∞` is MC. TD(λ) averages over all `n` with geometric weights `(1-λ)λ^{n-1}`. Most deep-RL uses `n` between 3 and 20.




## Build It

Reconstruct **Temporal Difference — Q-Learning & SARSA** by following `reset` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `reset` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-td-agent.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) — the original paper and convergence proof.
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) — TD(0), SARSA, Q-learning, Expected SARSA.
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) — fix for maximization bias.
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) — expected SARSA motivation.
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) — the paper that coined SARSA (then called "modified connectionist Q-learning").
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) — generalizes TD(0) to TD(n), the path from Q-learning to eligibility traces and, later, GAE in PPO.

## Exercises

Keep two runs side by side for **Temporal Difference — Q-Learning & SARSA**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `reset`, `step`, `epsilon_greedy`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Formulate Temporal Difference — Q-Learning & SARSA in terms of states, actions, rewards, and objectives**.
2. **Run a two-value comparison.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central update rule from first principles** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace learning signals through a self-terminating experiment** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-td-agent.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate convergence, stability, and exploration trade-offs**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Temporal Difference — Q-Learning & SARSA** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `reset`, `step`, `epsilon_greedy` traced to the value or shape that supports **Formulate Temporal Difference — Q-Learning & SARSA in terms of states, actions, rewards, and objectives**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central update rule from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace learning signals through a self-terminating experiment**; and
- an updated `outputs/skill-td-agent.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate convergence, stability, and exploration trade-offs**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
