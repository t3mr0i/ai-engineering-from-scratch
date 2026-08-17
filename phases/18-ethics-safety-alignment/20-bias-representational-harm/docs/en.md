# Bias and Representational Harm in LLMs

> Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Computational Linguistics 2024, arXiv:2309.00770). Foundational 2024 survey distinguishing representational harms (stereotypes, erasure) from allocational harms (unequal resource distribution) and categorizing evaluation metrics as embedding-based, probability-based, or generated-text-based. 2024-2025 empirical: An et al. (PNAS Nexus 4(3):pgaf089, March 2025) measure intersectional gender x race bias across GPT-3.5 Turbo, GPT-4o, Gemini 1.5 Flash, Claude 3.5 Sonnet, Llama 3-70B on automated resume evaluation for 20 entry-level jobs, finding Black women scored best and Black men worst. WinoIdentity (COLM 2025, arXiv:2508.07111) extends coreference-resolution bias evaluation to intersectional identities with an uncertainty-based fairness measure. Yu & Ananiadou 2025 identify gender-correlated neurons in FFN-value, FFN-query, and attention-value layers; Ahsan & Wallace 2025 use SAEs to reveal clinical racial bias. Meta-critique (arXiv:2508.11067): 10-year literature disproportionately focuses on binary-gender bias.

**Type:** Build
**Languages:** Python (stdlib, toy embedding-based bias probe)
**Prerequisites:** Phase 05 (word embeddings), Phase 18 · 01 (instruction following)
**Time:** ~60 minutes

## Learning Objectives

- Define representational vs allocational harm and give one example of each in an LLM deployment.
- Name the three evaluation-metric categories from Gallegos et al. 2024 and describe one metric from each.
- Describe intersectionality and why WinoIdentity's uncertainty-based coreference-resolution fairness measurement addresses gaps in single-axis bias evaluation.
- Describe two mechanistic-interpretability approaches to bias (gender-correlated neurons, SAE features).

## The Problem

The previous lessons cover deliberate harm (jailbreaks, scheming) and safety governance. Bias is harm that emerges without intent — from training data distributions, from prompt framing, from accumulated design choices. Measuring and reducing it is a distinct methodological challenge from adversarial robustness.

## The Concept

### Representational vs allocational

- **Representational harm.** Stereotypes, erasure, demeaning portrayals. An LLM that depicts nurses as exclusively female is producing representational harm.
- **Allocational harm.** Unequal material outcomes. An LLM that scores Black applicants' resumes systematically lower is producing allocational harm.

These are not the same. A model can be "representationally unbiased" (produces diverse portrayals) while being "allocationally biased" (makes unequal recommendations). Evaluations need to measure both.

### Three evaluation-metric categories (Gallegos et al. 2024)

- **Embedding-based.** WEAT-style tests on pre-RLHF embeddings. Measures statistical associations between identity terms and attribute terms. Limited: measures the representation, not the behaviour.
- **Probability-based.** Log-likelihood of stereotype-confirming vs stereotype-violating completions. Decoder-side measurement. Captures some behavioural bias.
- **Generated-text-based.** Downstream-task measurement on generated text. Resume-scoring, recommendation writing, dialogue. Most ecologically valid; hardest to reproduce.

### Intersectionality

Bias evaluation on "gender" misses the bias that only fires on (gender, race) pairs. An et al. 2025 measure intersectional gender x race bias in automated resume scoring and find the opposite of the naive expectation: Black women score *best* of all intersectional groups (+0.379 points, +1.7 percentage points hiring probability), while Black men score *worst* (−0.303 points). The authors emphasise this as a disadvantage specifically for Black men — a result single-axis (gender-only or race-only) evaluation would not surface, since it only appears at the intersection.

WinoIdentity (COLM 2025) extends the Winogender/WinoBias tradition of coreference-resolution bias evaluation to intersectional identities, using an uncertainty-based fairness measure. It tests whether the model's uncertainty over which entity a pronoun refers to differs across intersectional identity tuples — not just the point prediction. This catches cases where the model resolves coreference correctly on average but with systematically different confidence for some intersectional groups.

### Mechanistic approaches

2024-2025 interpretability work opens bias to mechanistic intervention:

- **Gender neurons (Yu & Ananiadou 2025).** Specific FFN-value, FFN-query, and attention-value neurons correlate with gender-specific behaviours. Ablating these neurons reduces gender-gap metrics with limited capability cost.
- **Clinical racial bias via SAEs (Ahsan & Wallace 2025).** Sparse autoencoder features decompose the internal representation into interpretable dimensions; race-correlated features can be identified and suppressed.

### The meta-critique

The 10-year literature review (arXiv:2508.11067, 2025) surveys 189 bias-evaluation papers and finds the field disproportionately focuses on binary-gender bias: 79.9% (151/189) cover gender, against 30.2% for race/ethnicity, 20.6% for age, 19.1% for religion, and 13.2% for nationality. Disability and multi-lingual identity barely register. The meta-critique argues that narrow focus can harm marginalized groups by neglect: a model well-debiased on binary gender may be badly biased on dimensions nobody checked. It also finds an academia-industry gap: only 10.6% (20/189) of papers include recommendations for implementing their findings in production systems, so a documented mitigation method existing in the literature is no guarantee it ever reaches a deployed model.

### Where this fits in Phase 18

Lessons 20-21 cover bias and fairness formally. Lesson 22 covers privacy. Lesson 23 covers watermarking. These are the user-harm layer complementing the earlier deception/safety layer.



## Further Reading

- [Gallegos et al. — Bias and Fairness in LLMs: A Survey (arXiv:2309.00770, Computational Linguistics 2024)](https://arxiv.org/abs/2309.00770) — canonical survey
- [An et al. — Intersectional resume-evaluation bias (PNAS Nexus, March 2025)](https://academic.oup.com/pnasnexus/article/4/3/pgaf089/8111343) — five-model intersectional study
- [WinoIdentity — uncertainty-based intersectional coreference-resolution fairness (arXiv:2508.07111, COLM 2025)](https://arxiv.org/abs/2508.07111) — new benchmark
