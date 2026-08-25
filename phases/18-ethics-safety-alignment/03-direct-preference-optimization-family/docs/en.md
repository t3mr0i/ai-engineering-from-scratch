# The Direct Preference Optimization Family

> Rafailov et al. (2023) showed RLHF's optimum has a closed form in terms of the preference data, so you can skip the explicit reward model and optimize the policy directly. That insight spawned a family — IPO, KTO, SimPO, ORPO, BPO — each fixing a failure mode of DPO. In 2026, direct alignment algorithms ship more frontier post-training runs than PPO. But the over-optimization curve from Lesson 2 still applies: DAAs do not escape Goodhart, they just move where it bites.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 minutes

## Learning Objectives

- Derive the DPO closed form from the RLHF-with-KL optimum.
- State the failure mode each of IPO, KTO, SimPO, ORPO, BPO fixes in DPO.
- Distinguish "implicit reward gap" from "preference strength" and explain why IPO's identity mapping matters.
- Explain why Rafailov et al. (NeurIPS 2024) prove DAAs over-optimize despite having no explicit RM.

## The Problem

The RLHF objective (Lesson 1):

```
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

has a known optimum:

```
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

So the reward is implicitly defined by the ratio of the optimal policy to the reference:

```
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

Substitute this into the Bradley-Terry preference likelihood and the partition function `Z(x)` cancels because it depends only on `x`. What remains is a loss in the policy parameters alone — no reward model needed. That is DPO.

The wrinkle: the derivation assumes the optimum is reachable, the preference data is in-distribution, and the reference policy is the true mode anchor. None of these hold exactly. Every family member fixes a different violated assumption.

## The Concept

### DPO (Rafailov et al., 2023)

```
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

What can go wrong:

- The implicit reward gap `beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)` is unbounded. A tiny preference can produce an arbitrarily large gap.
- The loss drives chosen and rejected log-probs in opposite directions. It can push the chosen absolute log-prob down as long as the rejected falls faster. This is the Degraded Chosen Response phenomenon.
- Out-of-distribution preferences (rare rare pair vs rare rare pair) produce arbitrary implicit rewards.

### IPO (Azar et al., 2024)

Identity Preference Optimization replaces the log-sigmoid with an identity mapping on the preference probability. The loss becomes a squared-error on a bounded target:

```
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

The margin is bounded by `1/(2 beta)`. Preference strength and implicit-reward gap are proportional. No blow-up.

### KTO (Ethayarajh et al., 2024)

Kahneman-Tversky Optimization drops pairwise structure entirely. Given a single labeled output and a binary "desirable" or "undesirable" signal, it maps to a prospect-theory utility:

```
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

with different weights for gains and losses (loss aversion). Benefit: you can use unpaired data, which is far more plentiful.

### SimPO (Meng et al., 2024)

Simple Preference Optimization aligns the training signal with generation. Remove the reference policy entirely and normalize log-likelihood by length:

```
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

with a margin `gamma` to stabilize. The length normalization removes the incentive to exploit DPO's length-bias failure mode (longer `y_w` gives a larger log-prob gap by construction).

### ORPO (Hong et al., 2024)

Odds-Ratio Preference Optimization adds a preference term to the standard SFT negative log-likelihood:

```
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

No reference policy — the SFT term is the regularizer. Train in a single stage from the base model to the aligned model. No separate SFT checkpoint.

### BPO (ICLR 2026 submission, OpenReview id=b97EwMUWu7)

[BPO](https://arxiv.org/abs/2506.03557) identifies the Degraded Chosen Responses problem: DPO can preserve the ranking `y_w > y_l` while lowering the absolute log-probability of `y_w`. The paper reports a 10.1-percentage-point accuracy improvement over DPO for Llama-3.1-8B-Instruct on its mathematical-reasoning evaluations.

### The universal result: DAAs still over-optimize

Rafailov et al. "Scaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms" (NeurIPS 2024) trained policies with DPO, IPO, SLiC on multiple datasets across KL budgets. The gold-reward-vs-KL curves have the same Gao et al. peak-and-collapse shape. The implicit reward queries out-of-distribution samples during training; KL regularization does not stabilize this.

DAAs do not escape Goodhart. They change the surface where it bites from "reward model over-optimized" to "reference policy ratio over-optimized." The universal fix — better data, ensembles, early stopping — applies to both.

### Choosing among them (2026)

- If you have large paired preference data: DPO with conservative beta, SimPO if length bias is evident.
- If you have unpaired binary feedback: KTO.
- If you want a single-stage pipeline from a base model: ORPO.
- If you see degraded chosen log-probs in DPO logs: BPO.
- If preference strengths vary widely and DPO is saturating: IPO.

Every lab runs all five on a battery and picks the winner per task. There is no reason the optimum is the same for math reasoning and safety.



## Build It

Reconstruct **The Direct Preference Optimization Family** by following `softmax` on x=0.5 with the demo defaults. Run `python3 main.py` and verify that the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump.

## Use It

Call `softmax` from a small caller with x=0.5 with the demo defaults. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-preference-loss-selector.md` with the command `python3 main.py`, the accepted input shape (x=0.5 with the demo defaults), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) — IPO
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)

## Exercises

This lab follows `softmax` and `logsoftmax` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using x=0.5 with the demo defaults. Follow `softmax`, `logsoftmax`, `sigmoid`. Expect the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump; capture the first printed shape, metric, status, or summary field and state which part supports **Derive the DPO closed form from the RLHF-with-KL optimum.**.
2. **Change the controlled parameter.** Repeat the command after changing only the learning rate: use the same run with learning rate 0.1 instead of 0.01. Predict the direction of the change, then compare the two output values. Explain why **State the failure mode each of IPO, KTO, SimPO, ORPO, BPO fixes in DPO.** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation a zero gradient or an already-minimized point. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Distinguish "implicit reward gap" from "preference strength" and explain why IPO's identity mapping matters.** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-preference-loss-selector.md` and add a worked example using x=0.5 with the demo defaults. Include the input contract, one expected output field, and a named acceptance check for **Explain why Rafailov et al. (NeurIPS 2024) prove DAAs over-optimize despite having no explicit RM.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **The Direct Preference Optimization Family** should contain:

- the `python3 main.py` output for x=0.5 with the demo defaults, with `softmax`, `logsoftmax`, `sigmoid` traced to the value or shape that supports **Derive the DPO closed form from the RLHF-with-KL optimum.**;
- a before/after comparison for the learning rate, where the same run with learning rate 0.1 instead of 0.01 changes the observation in the direction predicted by **State the failure mode each of IPO, KTO, SimPO, ORPO, BPO fixes in DPO.**;
- a recorded result for a zero gradient or an already-minimized point that matches the implementation’s validation or empty-result contract and explains the evidence for **Distinguish "implicit reward gap" from "preference strength" and explain why IPO's identity mapping matters.**; and
- an updated `outputs/skill-preference-loss-selector.md` example with a concrete input, expected output field, and acceptance check tied to **Explain why Rafailov et al. (NeurIPS 2024) prove DAAs over-optimize despite having no explicit RM.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
