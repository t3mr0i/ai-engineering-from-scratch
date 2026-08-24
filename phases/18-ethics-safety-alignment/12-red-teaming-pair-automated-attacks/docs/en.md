# Red-Teaming: PAIR and Automated Attacks

> Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419). PAIR — Prompt Automatic Iterative Refinement — is the canonical automated black-box jailbreak. An attacker LLM with a red-team system prompt iteratively proposes jailbreaks for a target LLM, accumulating attempts and responses in its own chat history as in-context feedback. PAIR typically succeeds within 20 queries, orders of magnitude more efficient than GCG (Zou et al.'s token-level gradient search) and without requiring white-box access. PAIR is now a standard baseline in JailbreakBench (arXiv:2404.01318) and HarmBench, alongside GCG, AutoDAN, TAP, and Persuasive Adversarial Prompt.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 18 · 01 (instruction-following), Phase 14 (agent engineering)
**Time:** ~75 minutes

## Learning Objectives

- Describe the PAIR algorithm: attacker system prompt, iterative refinement, in-context feedback.
- Explain why PAIR is strictly more efficient than GCG when the target is black-box.
- Name four other automated-attack baselines (GCG, AutoDAN, TAP, PAP) and state one distinguishing feature of each.
- Describe the JailbreakBench and HarmBench evaluation protocols and what "attack success rate" means under each.

## The Problem

Red-teaming used to be a manual activity. A small number of expert testers constructed adversarial prompts and tracked which ones worked. This does not scale: attack success rate needs a statistical sample, and the target is a moving target with every model release. PAIR operationalizes red-teaming as an optimization problem with a black-box target.

## The Concept

### PAIR algorithm

Inputs:
- Target LLM T (the model we are attacking).
- Judge LLM J (scores whether a response is a jailbreak).
- Attacker LLM A (the red-team optimizer).
- Goal string G: "respond with [harmful instruction]."
- Budget K (usually 20 queries).

Loop, for k in 1..K:
1. A is prompted with the goal G and the history of (prompt, response) pairs so far.
2. A emits a new prompt p_k.
3. Submit p_k to T; receive response r_k.
4. J scores (p_k, r_k) on the goal.
5. If score >= threshold, halt — jailbreak found.
6. Else, append (p_k, r_k) to A's history; continue.

Empirical result (NeurIPS 2023): >50% attack success rate against GPT-3.5-turbo, Llama-2-7B-chat; mean queries to success in the 10-20 range.

### Why PAIR is efficient

GCG (Zou et al. 2023) searches over adversarial token suffixes by gradient; it requires white-box model access and produces unreadable suffixes. PAIR is black-box and produces natural-language attacks that transfer across models. PAIR's in-context feedback lets the attacker learn from each rejection; GCG has no equivalent (each new token update has to rediscover prior progress).

### Related automated attacks

- **GCG (Zou et al. 2023, arXiv:2307.15043).** Token-level gradient search for adversarial suffixes. White-box, transferable, produces unreadable strings.
- **AutoDAN (Liu et al. 2023).** Evolutionary search over prompts, guided by a hierarchical objective.
- **TAP (Mehrotra et al. 2024).** Tree-of-attacks with pruning — branches multiple PAIR-style rollouts.
- **PAP (Zeng et al. 2024).** Persuasive Adversarial Prompts — encodes human persuasion techniques as prompt templates.

### JailbreakBench and HarmBench

Both (2024) standardize evaluation:

- JailbreakBench (arXiv:2404.01318). 100 harmful behaviors across 10 OpenAI-policy categories. Attack success rate (ASR) as the primary metric. Requires a judge (GPT-4-turbo, Llama Guard, or StrongREJECT).
- HarmBench (Mazeika et al. 2024). 510 behaviours across 7 categories, with semantic and functional harm tests. Compares 18 attacks against 33 models.

**Worked example (hypothetical).** A 90% attack-success rate at 200 queries is not comparable to 85% at 20 queries. ASR must be reported with a fixed query budget.

### Reason it matters for 2026 deployments

Every frontier lab now runs PAIR and TAP against production models before release. ASR trajectories appear in model cards (Lesson 26) and safety-case appendices (Lesson 18). The attack is not exotic — it is standard infrastructure.

### Where this fits in Phase 18

Lesson 12 is the automated-attack foundation. Lesson 13 (Many-Shot Jailbreaking) is a complementary length-exploit. Lesson 14 (ASCII Art / Visual) is an encoding attack. Lesson 15 (Indirect Prompt Injection) is the 2026 production attack surface. Lesson 16 covers the defensive-tooling counterparts (Llama Guard, Garak, PyRIT).



## Further Reading

- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) — PAIR paper, NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) — GCG paper
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) — standardized evaluation
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) — broader evaluation

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Describe the PAIR algorithm: attacker system prompt, iterative refinement, in-context feedback.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Explain why PAIR is strictly more efficient than GCG when the target is black-box.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Name four other automated-attack baselines (GCG, AutoDAN, TAP, PAP) and state one distinguishing feature of each.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Describe the PAIR algorithm: attacker system prompt, iterative refinement, in-context feedback,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Name four other automated-attack baselines (GCG, AutoDAN, TAP, PAP) and state one distinguishing feature of each,” and cite a repeatable check rather than relying on visual inspection alone.
