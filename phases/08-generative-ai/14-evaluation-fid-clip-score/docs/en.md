# Evaluation — FID, CLIP Score, Human Preference

> Every generative model leaderboard cites FID, CLIP score, and a win rate from a human-preference arena. Each number has a failure mode a determined researcher can game. If you do not know the failure modes, you cannot tell a real improvement from a gaming run.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 01 (Taxonomy), Phase 2 · 04 (Evaluation Metrics)
**Time:** ~45 minutes

## Learning Objectives

- Explain the probabilistic mechanism behind Evaluation — FID, CLIP Score, Human Preference
- Implement the lesson's core generative step from first principles
- Inspect samples and intermediate states to diagnose generation behavior
- Compare quality, diversity, stability, and compute trade-offs

## The Problem

A generative model is judged on *sample quality* and *conditioning adherence*. Neither has a closed-form measure. Your model has to render 10,000 images; something has to assign them numbers; you have to trust the numbers across model families, across resolutions, across architectures. Three metrics survived the 2014-2026 gauntlet:

- **FID (Fréchet Inception Distance).** A distance between two distributions — real and generated — in an Inception network's feature space. Lower is better.
- **CLIP score.** Cosine similarity between a generated image's CLIP-image embedding and a prompt's CLIP-text embedding. Higher is better. Measures prompt adherence.
- **Human preference.** Pit two models head-to-head on the same prompt, have humans (or a GPT-4-class model) pick the better one, aggregate to an Elo score.

You will also see: IS (inception score, largely retired), KID, CMMD, ImageReward, PickScore, HPSv2, MJHQ-30k. Each corrects for one failure of the previous.

## The Concept

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID — sample quality

Heusel et al. (2017). Steps:

1. Extract Inception-v3 features (2048-D) for N real images and N generated.
2. Fit a Gaussian to each pool: compute mean `μ_r, μ_g` and covariance `Σ_r, Σ_g`.
3. FID = `||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`.

Interpretation: Fréchet distance between two multivariate Gaussians in feature space. Lower = more similar distributions.

Failure modes:
- **Biased on small N.** FID is mean-squared over the feature distribution — small N under-estimates covariance, gives falsely low FID. Always use N ≥ 10,000.
- **Inception-dependent.** Inception-v3 was trained on ImageNet. Domains far from ImageNet (faces, art, text images) produce meaningless FID. Use a domain-specific feature extractor.
- **Gaming.** Overfitting to the Inception prior gives low FID without visual quality improvement. Beat it with CMMD (below).

### CLIP score — prompt adherence

Radford et al. (2021). For a generated image + prompt:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

Average across 30k generated images → a scalar comparable between models.

Failure modes:
- **CLIP's own blind spots.** CLIP has weak compositional reasoning ("a red cube on a blue sphere" often fails). Models can rank well on CLIP score without really following complex prompts.
- **Short prompt bias.** Short prompts have more CLIP-image matches in the wild. Longer prompts have lower CLIP scores mechanically.
- **Prompt gaming.** Including "high quality, 4k, masterpiece" in the prompt inflates CLIP score without improving image-text binding.

CMMD (Jayasumana et al., 2024) fixes some of these: uses CLIP features instead of Inception, maximum-mean discrepancy instead of Fréchet. Better at detecting subtle quality differences.

### Human preference — the ground truth

Pick a pool of prompts. Generate with model A and model B. Show pairs to humans (or a strong LLM judge). Aggregate wins into an Elo or Bradley-Terry score. Benchmarks:

- **PartiPrompts (Google)**: 1,600 diverse prompts, 12 categories.
- **HPSv2**: 107k human annotations, widely used as automated proxy.
- **ImageReward**: 137k prompt-image preference pairs, MIT-licensed.
- **PickScore**: trained on Pick-a-Pic 2.6M preferences.
- **Chatbot-Arena-style image arenas**: https://imagearena.ai/ and others.

Failure modes:
- **Judge variance.** Non-experts have different preferences than experts. Use both.
- **Prompt distribution.** Cherry-picked prompts favor one family. Always document.
- **LLM-judge reward hacking.** GPT-4-judge gets fooled by pretty-but-wrong outputs. Triangulate with human.

## Use together

A production eval report should include:

1. FID on 10-30k samples against a held-out real distribution (sample quality).
2. CLIP score / CMMD on the same samples vs their prompts (adherence).
3. Win rate in a blinded arena vs the previous model (overall preference).
4. Failure mode analysis: 50 randomly sampled outputs, flagged for known issues (hand anatomy, text rendering, consistent object count).

Any single metric is a lie. Three corroborating metrics + qualitative review are a claim.




## Further Reading

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) — FID paper.
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) — CMMD.
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020) — CLIP.
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) — HPSv2.
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) — ImageReward.
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) — PartiPrompts.
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) — failure-mode survey.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the probabilistic mechanism behind Evaluation — FID, CLIP Score, Human Preference.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the lesson's core generative step from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect samples and intermediate states to diagnose generation behavior.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the probabilistic mechanism behind Evaluation — FID, CLIP Score, Human Preference,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect samples and intermediate states to diagnose generation behavior,” and cite a repeatable check rather than relying on visual inspection alone.
