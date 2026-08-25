# CLIP and Contrastive Vision-Language Pretraining

> OpenAI's CLIP (2021) proved a single idea big enough to power the next five years: align an image encoder and a text encoder in the same vector space using only noisy web image-caption pairs and a contrastive loss. Zero supervised labels. 400M pairs. The resulting embedding space does zero-shot classification, image-text retrieval, and plugs into every 2026 VLM as its vision tower. SigLIP 2 (2025) replaced softmax with sigmoid and scaled past CLIP at lower cost. This lesson walks the math from InfoNCE to sigmoid pairwise loss and builds the training step in stdlib Python.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 7 (Transformers)
**Time:** ~180 minutes

## Learning Objectives

- Derive InfoNCE loss from mutual information and implement a numerically-stable vectorized version.
- Explain why sigmoid pairwise loss (SigLIP) scales to batch 32768+ without the all-gather overhead softmax demands.
- Run zero-shot ImageNet classification by constructing text templates (`a photo of a {class}`) and taking argmax over cosine similarity.
- Name the four levers CLIP / SigLIP pretraining gives you: batch size, temperature, prompt template, data quality.

## The Problem

Pre-CLIP vision was supervised. Collect labeled datasets (ImageNet: 1.2M images, 1000 classes), train a CNN, ship it. Labels are expensive, labels bias to what labelers can agree on, and labels do not transfer to new tasks without finetuning.

The image-caption web has one billion-plus loosely-labeled pairs for free. A picture of a golden retriever with alt text "my dog Max in the park" carries a supervisory signal — the text describes the image. The question: can you turn this into useful training?

CLIP's answer: treat image-caption pairs as a matching task. Given a batch of N images and N captions, learn to match each image to its own caption against N-1 distractors. The supervision is "these two things belong together; these N-1 do not." No class labels. No human annotation. Just a contrastive loss.

The resulting embedding space does more than CLIP was trained for. ImageNet zero-shot works because "a photo of a cat" embeds near pictures of cats that were never explicitly labeled cats. This is the bet that spawned every 2026 VLM.

## The Concept

### The dual encoder

CLIP has two towers:

- Image encoder `f`: ViT or ResNet, outputs a D-dim vector per image.
- Text encoder `g`: small transformer, outputs a D-dim vector per caption.

Both towers normalize their outputs to unit length. Similarity is `cos(f(x), g(y)) = f(x)^T g(y)` since both are unit-norm.

For a batch of N (image, caption) pairs, build the similarity matrix `S` of shape `(N, N)`:

```
S[i, j] = cos(f(x_i), g(y_j)) / tau
```

where `tau` is a learned temperature (CLIP initializes to 0.07; learned in log-space).

### InfoNCE loss

CLIP uses a symmetric cross-entropy over rows and columns:

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

This is InfoNCE. The softmax in CE forces each image to match its caption more than every other caption in the batch. The "negatives" are all other batch items. Bigger batches = more negatives = stronger signal. CLIP trained at batch 32k; scale matters.

### Temperature

`tau` controls the sharpness of the softmax. Low tau → sharp distribution, hard negative mining effect. High tau → soft, all samples contribute. CLIP learns log(1/tau), clipped to prevent collapse. SigLIP 2 fixes the initial tau and uses a learned bias instead.

### Why sigmoid scales better (SigLIP)

Softmax needs the whole similarity matrix in sync. In distributed training you must all-gather every embedding to every replica, then do the softmax. This is quadratic in world size for communication.

SigLIP replaces softmax with element-wise sigmoid: for each pair `(i, j)`, the loss is a binary classification of "are these the matching pair?" positive class labels are the diagonal, everything else is negative. The loss is:

```
L = -1/N sum over (i, j) [ y_ij log sigmoid(S[i,j]) + (1-y_ij) log sigmoid(-S[i,j]) ]
```

`y_ij = 1` if `i == j`, else 0. Each pair's loss is independent. No all-gather needed. Each GPU computes its local block and sums. SigLIP 2 scales to batch 32k-512k cheaply where CLIP would need proportionally more communication.

### Zero-shot classification

Given N class names, for each class build a text template:

```
"a photo of a {class}"
```

Embed each template with the text encoder. Embed your image with the image encoder. Argmax cosine similarity = predicted class. No training on the target classes.

Prompt templates matter. CLIP's original paper used 80 templates per class (plain, artistic, photo, painting, etc.) and averaged the embeddings. +3 ImageNet points. Modern usage typically picks one or two templates.

### Linear probes and finetuning

Zero-shot is a baseline. A linear probe (train one linear layer on top of frozen CLIP features for your target classes) beats zero-shot on in-domain tasks. Full finetuning beats linear probe on in-domain but can hurt zero-shot transfer. Three regimes with three trade-offs.

### SigLIP 2: NaFlex and dense features

SigLIP 2 (2025) adds:
- NaFlex: single model handles variable aspect ratios and resolutions.
- Better dense features for segmentation and depth estimation, targeting use as a frozen backbone in VLMs.
- Multilingual: trained on 100+ languages where CLIP was English-only.
- 1B param scale where CLIP topped out at 400M.

In 2026 open VLMs, SigLIP 2 SO400m/14 is the default vision tower. CLIP remains the default for pure image-text retrieval where the specific LAION-2B training distribution matches your query pattern.

### ALIGN, BASIC, OpenCLIP, EVA-CLIP

ALIGN (Google, 2021): same idea as CLIP, 1.8B pair scale, 90% noisy. Proved noisy data scales. OpenCLIP (LAION): open reproduction of CLIP on LAION-400M / 2B, multiple scales, the go-to open checkpoint. EVA-CLIP: initializes from masked image modeling; strong backbone for VLMs. BASIC: Google's CLIP+ALIGN hybrid. All the same family, different data and tuning.

### The zero-shot ceiling

CLIP-class models cap around 76% ImageNet zero-shot (CLIP-G, OpenCLIP-G). Beyond requires either much larger data (SigLIP 2 gets 80%+) or architecture changes (supervised heads, more parameters). The benchmark is saturating; the real value is the embedding space that downstream VLMs consume.



## Build It

Reconstruct **CLIP and Contrastive Vision-Language Pretraining** by following `normalize` on an 8x8 synthetic image. Run `python3 main.py` and verify that the reported height/width or feature-map shape changes predictably, without inventing pixels.

## Use It

Call `normalize` from a small caller with an 8x8 synthetic image. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-clip-zero-shot.md` with the command `python3 main.py`, the accepted input shape (an 8x8 synthetic image), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020) — the CLIP paper.
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343) — SigLIP.
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) — multilingual + NaFlex.
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918) — scale with noisy web data.
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) — OpenCLIP scaling laws.

## Exercises

Use `normalize` as the trace: start from an 8x8 synthetic image, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using an 8x8 synthetic image. Follow `normalize`, `cosine`, `similarity_matrix`. Expect the reported height/width or feature-map shape changes predictably, without inventing pixels; capture the first printed shape, metric, status, or summary field and state which part supports **Derive InfoNCE loss from mutual information and implement a numerically-stable vectorized version.**.
2. **Vary one named input.** Repeat the command after changing only the center-pixel value: use the same image with one bright center pixel. Predict the direction of the change, then compare the two output values. Explain why **Explain why sigmoid pairwise loss (SigLIP) scales to batch 32768+ without the all-gather overhead softmax demands.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation a 1x1 image with all values zero. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Run zero-shot ImageNet classification by constructing text templates (`a photo of a {class}`) and taking argmax over cosine similarity.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-clip-zero-shot.md` and add a worked example using an 8x8 synthetic image. Include the input contract, one expected output field, and a named acceptance check for **Name the four levers CLIP / SigLIP pretraining gives you: batch size, temperature, prompt template, data quality.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **CLIP and Contrastive Vision-Language Pretraining** should contain:

- the `python3 main.py` output for an 8x8 synthetic image, with `normalize`, `cosine`, `similarity_matrix` traced to the value or shape that supports **Derive InfoNCE loss from mutual information and implement a numerically-stable vectorized version.**;
- a before/after comparison for the center-pixel value, where the same image with one bright center pixel changes the observation in the direction predicted by **Explain why sigmoid pairwise loss (SigLIP) scales to batch 32768+ without the all-gather overhead softmax demands.**;
- a recorded result for a 1x1 image with all values zero that matches the implementation’s validation or empty-result contract and explains the evidence for **Run zero-shot ImageNet classification by constructing text templates (`a photo of a {class}`) and taking argmax over cosine similarity.**; and
- an updated `outputs/skill-clip-zero-shot.md` example with a concrete input, expected output field, and acceptance check tied to **Name the four levers CLIP / SigLIP pretraining gives you: batch size, temperature, prompt template, data quality.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
