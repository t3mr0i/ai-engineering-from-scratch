# Watermarking — SynthID, Stable Signature, C2PA

> Three technologies structure 2026 AI-generated-content provenance. SynthID (Google DeepMind) — image watermarking launched August 2023, text+video May 2024 (Gemini + Veo), text open-sourced October 2024 via Responsible GenAI Toolkit, unified multi-media detector November 2025 alongside Gemini 3 Pro. Text watermarking adjusts next-token sampling probabilities imperceptibly; image/video watermarks survive compression, cropping, filters, frame-rate changes. Stable Signature (Fernandez et al., ICCV 2023, arXiv:2303.15435) — fine-tunes the latent diffusion decoder so every output contains a fixed message; cropped (10% of content) generated images detected >90% at FPR<1e-6. Follow-up "Stable Signature is Unstable" (arXiv:2405.07145, May 2024) — fine-tuning removes the watermark while preserving quality. C2PA — cryptographically signed, tamper-evident metadata standard (C2PA 2.2 Explainer 2025). Watermarking and C2PA are complementary: metadata can be stripped but carries richer provenance; watermarks persist through transcoding but carry less information.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 minutes

## Learning Objectives

- Describe token-level watermarking (SynthID-text style) and the mechanism by which it is detectable.
- Describe Stable Signature and the 2024 removal attack that broke it.
- State C2PA's role and why it is complementary to watermarking.
- Describe the key limitations: model-specific signal, robustness under paraphrase, and meaning-preserving attacks (arXiv:2508.20228).

## The Problem

2023-2024 saw deepfakes and AI-generated content enter political and consumer contexts at scale. Watermarking is the proposed technical provenance signal: mark generations at creation time, detect them later. 2025 evidence: no watermark is unconditionally robust, but layered with C2PA metadata the combination provides a usable provenance story.

## The Concept

### Text watermarking (SynthID-text style)

The Kirchenbauer et al. 2023 mechanism, productionized by Google:

1. At each decoding step, hash the previous K tokens to produce a pseudorandom partition of the vocabulary into "green" and "red" sets.
2. Bias sampling toward the green set by adding δ to green logits.
3. The generation contains more green tokens than chance would produce.

Detection: rehash each prefix, count green tokens in the generation, compute a z-score. The z-score is >0 for watermarked text, ~0 for human text.

Properties:
- Imperceptible to readers (δ is small enough that quality loss is minor).
- Detectable with access to the vocabulary partition function.
- Not robust to paraphrase — rewriting the text destroys the signal.

SynthID-text is open-sourced October 2024 via Google's Responsible GenAI Toolkit.

### Stable Signature (image)

Fernandez et al. ICCV 2023. Fine-tune the latent diffusion decoder so every generated image contains a fixed binary message embedded in the latent representation. Detection is decoded from the latent with a neural decoder. Cropped (to 10% of content) images detected >90% at FPR<1e-6.

May 2024 "Stable Signature is Unstable" (arXiv:2405.07145): fine-tuning the decoder removes the watermark while preserving image quality. Adversarial post-generation fine-tuning is cheap; the watermark's adversarial robustness is limited.

### SynthID unified detector (November 2025)

Alongside Gemini 3 Pro: a multi-media detector that reads SynthID signals from text, image, audio, and video in one API. Unifies the Google provenance stack.

### C2PA

Coalition for Content Provenance and Authenticity. Cryptographically signed tamper-evident metadata standard. C2PA 2.2 Explainer (2025). A C2PA manifest records provenance claims (who created, when, what transformations) signed by the creator's key.

Complementary to watermarking:
- Metadata can be stripped; watermarks cannot (easily).
- Metadata is rich (full provenance chain); watermarks carry bits.
- C2PA depends on platform adoption; watermarks embed automatically.

Google integrates both in Search, Ads, and "About this image."

### Limitations

- **Model-specific.** SynthID watermarks generations from SynthID-enabled models. A generation from a model without SynthID is not watermarked, so "no SynthID signal" is not proof of authenticity.
- **Paraphrase.** Text watermarks do not survive meaning-preserving paraphrase.
- **Transformation attacks.** arXiv:2508.20228 (2025) shows meaning-preserving attacks that destroy both text watermarks and many image watermarks.
- **Fine-tune removal.** Per "Stable Signature is Unstable," post-generation fine-tuning removes embedded watermarks.

### EU AI Act Article 50

Transparency Code for AI-generated content labeling (first draft December 2025, second draft March 2026, expected final June 2026 per the [European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)). The Code remains in draft as of April 2026 and the timeline is subject to change. The regulatory layer that requires the technical layer. Deepfakes must be labeled.

### Where this fits in Phase 18

Lessons 22-23 are about what the model emits (private data, provenance signal). Lesson 27 covers training-data governance. Lesson 24 is the regulatory framework that requires these technical measures.



## Build It

Reconstruct **Watermarking — SynthID, Stable Signature, C2PA** by following `green_set` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `green_set` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-provenance-audit.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) — the token-watermark mechanism
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) — image watermark paper
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145) — the removal attack
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) — the cross-modal watermark
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) — metadata standard

## Exercises

Work from the smallest fixture that the Watermarking — SynthID, Stable Signature, C2PA demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `green_set`, `unwatermarked_sample`, `watermarked_sample`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Describe token-level watermarking (SynthID-text style) and the mechanism by which it is detectable.**.
2. **Perturb one field.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Describe Stable Signature and the 2024 removal attack that broke it.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **State C2PA's role and why it is complementary to watermarking.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-provenance-audit.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Describe the key limitations: model-specific signal, robustness under paraphrase, and meaning-preserving attacks (arXiv:2508.20228).**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Watermarking — SynthID, Stable Signature, C2PA** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `green_set`, `unwatermarked_sample`, `watermarked_sample` traced to the value or shape that supports **Describe token-level watermarking (SynthID-text style) and the mechanism by which it is detectable.**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Describe Stable Signature and the 2024 removal attack that broke it.**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **State C2PA's role and why it is complementary to watermarking.**; and
- an updated `outputs/skill-provenance-audit.md` example with a concrete input, expected output field, and acceptance check tied to **Describe the key limitations: model-specific signal, robustness under paraphrase, and meaning-preserving attacks (arXiv:2508.20228).**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
