# Reward Modeling & RLHF

> Humans cannot write a reward function for "good assistant response," but they can compare two responses and pick the better one. Fit a reward model to those comparisons, then RL the language model against it. Christiano 2017. InstructGPT 2022. The recipe that turned GPT-3 into ChatGPT. In 2026 it is mostly being replaced by DPO — but the mental model stays.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 minutes

## Learning Objectives

- Formulate Reward Modeling & RLHF in terms of states, actions, rewards, and objectives
- Implement the central update rule from first principles
- Trace learning signals through a self-terminating experiment
- Evaluate convergence, stability, and exploration trade-offs

## The Problem

You trained a language model on the next-token-prediction objective. It writes grammatical English. It also lies, rambles, and refuses to refuse. You cannot fix this with more pretraining — web text is the problem, not the cure.

You want a *scalar reward* that says "response A is better than response B for instruction X." Writing that reward function by hand is impossible. "Helpfulness" is not a closed-form expression over tokens. But humans can compare two outputs and mark a preference. That is cheap to collect at scale.

RLHF (Christiano et al. 2017; Ouyang et al. 2022) converts preferences into a reward model, then optimizes the LM via PPO against that reward. In three steps: SFT → RM → PPO. It is the recipe that shipped ChatGPT, Claude, Gemini, and every other aligned-LLM in 2023–2025.

In 2026 the PPO step is mostly replaced by DPO (Phase 10 · 08) because it is cheaper and nearly as good for alignment tuning. But the *reward model* piece still underlies every Best-of-N sampler, every RL-from-verifiable-rewards pipeline, and every reasoning model using a process reward model. Understand RLHF and you understand the entire alignment stack.

## The Concept

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1: Supervised Fine-Tuning (SFT).** Start from a pretrained base model. Fine-tune on human-written demonstrations of the target behavior (instruction-following responses, helpful replies, etc.). Result: a model `π_SFT` that is *biased toward good behavior* but still has an unbounded action space.

**Stage 2: Reward Model training.**

- Collect pairs of responses `(y_+, y_-)` to prompts `x`, labeled by humans as "y_+ is preferred over y_-."
- Train a reward model `R_φ(x, y)` to assign higher scores to `y_+`.
- Loss: the **Bradley-Terry pairwise logistic**:

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ is the sigmoid. The difference in reward implies a log-odds of preference. BT has been the standard since 1952 (Bradley-Terry) and is the dominant choice in modern RLHF.

- `R_φ` is usually initialized from the SFT model with a scalar head on top. Same transformer backbone; a single linear layer outputs the reward.

**Stage 3: PPO against the RM with KL penalty.**

- Initialize the trainable policy `π_θ` from `π_SFT`. Keep a frozen *reference* `π_ref = π_SFT`.
- Reward at the end of a response `y`:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  The KL penalty prevents `π_θ` from drifting arbitrarily from `π_SFT` — it is a *regularizer*, not a hard trust region. `β` typically `0.01`-`0.05`.
- Run PPO (Lesson 08) with this reward. Advantages are computed on the token-level trajectory, but the RM scores only the full response.

**Why the KL?** Without it, PPO will happily find reward-hacking strategies — the RM was only trained on in-distribution completions. An out-of-distribution response might score higher than any human-written one. The KL keeps `π_θ` near the manifold where the RM was trained. It is the single most important knob in RLHF.

**2026 status:**

- **DPO** (Rafailov 2023): closed-form algebra collapses Stage 2+3 into a single supervised loss over preference data. No RM, no PPO. Same quality on alignment benchmarks for a fraction of the compute. Covered in Phase 10 · 08.
- **GRPO** (DeepSeek 2024–2025): PPO with a group-relative baseline instead of a critic, reward from a *verifier* (code runs / math answer matches) instead of a human-trained RM. Dominant for reasoning models. Covered in Phase 9 · 12.
- **Process reward models (PRMs):** score partial solutions (each reasoning step), used in both RLHF and GRPO variants for reasoning.
- **Constitutional AI / RLAIF:** use an aligned LLM to generate preferences instead of humans. Scales the preference budget.




## Further Reading

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) — the paper that started RLHF.
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) — the recipe behind ChatGPT.
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) — earlier RLHF for summarization.
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) — DPO; the post-RLHF default in 2026.
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) — RLAIF and self-critique loop.
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) — the HH paper.
- [Hugging Face TRL library](https://huggingface.co/docs/trl) — production `RewardTrainer` and `PPOTrainer`. Read the trainer source for the adaptive-KL and value-head details.
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf) by Lambert, Castricato, von Werra, Havrilla — the canonical walk-through of the three-stage pipeline with diagrams.
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl) — the library; `examples/` has end-to-end RLHF scripts for Llama, Mistral, and Qwen.
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) — the reward-hypothesis view; essential prerequisite for thinking about reward hacking.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Formulate Reward Modeling & RLHF in terms of states, actions, rewards, and objectives.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central update rule from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Trace learning signals through a self-terminating experiment.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Formulate Reward Modeling & RLHF in terms of states, actions, rewards, and objectives,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Trace learning signals through a self-terminating experiment,” and cite a repeatable check rather than relying on visual inspection alone.
