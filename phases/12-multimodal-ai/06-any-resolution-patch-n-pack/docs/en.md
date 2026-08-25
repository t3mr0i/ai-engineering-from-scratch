# Any-Resolution Vision: Patch-n'-Pack and NaFlex

> Real images are not 224x224 squares. A receipt is 9:16, a chart is 16:9, a medical scan might be 4096x4096, a mobile screenshot is 9:19.5. The pre-2024 VLM answer — resize everything to a fixed square — threw away the signal that makes OCR, document understanding, and high-resolution scene parsing work. NaViT (Google, 2023) showed you could pack variable-resolution patches into a single transformer batch with block-diagonal masking. Qwen2-VL's M-RoPE (2024) dropped absolute positional tables entirely. LLaVA-NeXT's AnyRes tiled high-resolution images into a base + sub-images. SigLIP 2's NaFlex variant (2025) is now the default encoder for open VLMs that want a single checkpoint to serve every aspect ratio. This lesson implements patch-n'-pack end to end.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## Learning Objectives

- Pack patches from a batch of variable-resolution images into one sequence and build the block-diagonal attention mask.
- Pick between AnyRes tiling (LLaVA-NeXT), NaFlex (SigLIP 2), and M-RoPE (Qwen2-VL) for a given task.
- Compute token budgets for OCR, charts, and photography without resizing.
- Name the three failure modes of square-resize: squished text, cropped content, wasted tokens on padding.

## The Problem

Transformers expect a sequence. A batch is a stack of sequences the same length. If your images are 224x224, you get 196 patch tokens every time, padding not required, job done. Train on 224, infer on 224, never think about resolution again.

The world does not cooperate. Documents are portrait (8.5x11 inches, 2:3-ish). Chart screenshots are landscape (16:9). Receipts are tall and thin (1:3). Medical imaging ships at 2048x2048 or larger. Mobile device screenshots are 1170x2532 (0.46:1).

Three pre-2024 options and why each fails:

1. Resize to a fixed square (224x224 or 336x336). The squish distorts text and faces. The downscale destroys chart labels and OCR content. Standard practice until LLaVA-1.5.
2. Crop to a fixed aspect ratio. You throw away most of the image, and picking the crop location is its own vision problem.
3. Pad to the longest side. Fixes distortion but wastes 50%+ of tokens on padding for portrait images. Quadratic attention cost on all those pad tokens.

The 2024-2025 answer: let the transformer eat patches at the image's native resolution, and figure out how to pack a heterogeneous batch into one sequence without wasted compute.

## The Concept

### NaViT and patch-n'-pack

NaViT (Dehghani et al., 2023) was the paper that showed this works at scale. The idea is mechanical:

1. For each image in the batch, compute its native patch grid at a chosen patch size (say 14).
2. Flatten each image's patches into its own variable-length sequence.
3. Concatenate all images' patches into one long sequence for the batch.
4. Build a block-diagonal attention mask so image A's patches only attend within image A.
5. Carry per-patch position information (2D RoPE or fractional position embeddings).

A batch of three images at 336x336 (576 tokens), 224x224 (256 tokens), and 448x336 (768 tokens) becomes one 1600-token sequence with a 1600x1600 block-diagonal mask. No padding. No wasted compute. The transformer handles arbitrary aspect ratios.

NaViT also introduced fractional patch dropping during training — drop 50% of patches at random across the batch — which both regularizes and speeds training. SigLIP 2 inherited this.

### AnyRes (LLaVA-NeXT)

LLaVA-NeXT's AnyRes is the pragmatic alternative. Given a high-resolution image and a fixed encoder (CLIP or SigLIP at 336), tile the image:

1. Pick a grid layout from a predefined set — (1x1), (1x2), (2x1), (1x3), (3x1), (2x2), etc. — that best fits the image's aspect ratio.
2. Tile the full image into the grid; each tile becomes a 336x336 crop.
3. Also produce a thumbnail: the whole image resized to 336x336 as a global-context token.
4. Encode every tile through the frozen 336-encoder. Concatenate the tile tokens + thumbnail tokens.

For a 672x672 image at 2x2 grid plus thumbnail: 4 * 576 + 576 = 2880 visual tokens. Expensive but effective — the LLM sees both local detail and global context.

AnyRes is the route of choice when your encoder is frozen and only supports one resolution. It explodes token count for large images (a 1344x1344 image at 4x4 grid is 9216 + 576 ≈ 9800 tokens, which fills most of a 8k LLM context).

### M-RoPE (Qwen2-VL)

Qwen2-VL introduced Multimodal Rotary Position Embedding. Instead of NaViT's fractional positions or AnyRes's tile-and-thumbnail, each patch carries a 3D position (temporal, height, width). The query/key rotations handle arbitrary H, W, and temporal length.

M-RoPE ships native dynamic resolution without retraining. At inference you feed any HxW image, the patch embedder produces H/14 x W/14 tokens, each token gets its (t=0, r=row, c=col) position, RoPE rotates attention with the right frequencies, done. Qwen2.5-VL and Qwen3-VL continue this. InternVL3's V2PE is the same idea with variable encoding per modality.

Unlike AnyRes, M-RoPE is O(H x W / P^2) tokens at native resolution — no multiplicative tile overhead. Unlike NaViT, it still expects a single image per forward. Batching across resolutions still needs patch-n'-pack on top.

### NaFlex (SigLIP 2)

NaFlex is the SigLIP 2 checkpoint's native-flex mode. A single model serves multiple sequence lengths (256, 729, 1024 tokens) at inference. Internally it uses NaViT-style patch-n'-pack during training and absolute fractional positions per patch. The selling point: one checkpoint, pick your token budget at inference based on the task.

For a semantic task (classification, retrieval), 256 tokens. For OCR or chart understanding, 1024 tokens. No retraining.

### The packing mask

The block-diagonal mask is where most implementations stumble. For a packed sequence of length `N_total` covering images `i=0..B-1` with lengths `n_i`, the mask `M` of shape `(N_total, N_total)` is 1 if both indices fall in the same image's block, else 0. You can build it from a cumulative length list:

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

This is one line in PyTorch with `torch.block_diag` or an explicit gather. FlashAttention's variable-length path (`cu_seqlens`) skips the mask entirely and attends within sequences using the cumulative-length tensor directly — ~10x faster than a dense mask for typical batches.

### Token budgets

Pick your strategy by task:

- OCR / documents: 1024-4096 tokens. SigLIP 2 NaFlex at 1024, or AnyRes 3x3 + thumbnail.
- Charts and UI: 729-1024 tokens at 384-448 native. Qwen2.5-VL dynamic resolution with max pixels cap.
- Natural photos: 256-576 tokens is fine. The downstream LLM sees enough. Pay for tokens where content density is high.
- Video: 64-128 tokens per frame after spatial pooling, 2-8 FPS. Lesson 12.17 covers this.

The 2026 production rule: pick a per-task max-pixels cap, encode at native aspect ratio up to that cap, pack the batch, and skip padding. Qwen2.5-VL exposes `min_pixels` and `max_pixels` for exactly this knob.



## Build It

Reconstruct **Any-Resolution Vision: Patch-n'-Pack and NaFlex** by following `Image` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `Image` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-resolution-budget-planner.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)

## Exercises

Use `Image` as the trace: start from tokens=["red","fox"], keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `Image`, `grid`, `seq`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Pack patches from a batch of variable-resolution images into one sequence and build the block-diagonal attention mask.**.
2. **Vary one named input.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Pick between AnyRes tiling (LLaVA-NeXT), NaFlex (SigLIP 2), and M-RoPE (Qwen2-VL) for a given task.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Compute token budgets for OCR, charts, and photography without resizing.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-resolution-budget-planner.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Name the three failure modes of square-resize: squished text, cropped content, wasted tokens on padding.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Any-Resolution Vision: Patch-n'-Pack and NaFlex** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `Image`, `grid`, `seq` traced to the value or shape that supports **Pack patches from a batch of variable-resolution images into one sequence and build the block-diagonal attention mask.**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Pick between AnyRes tiling (LLaVA-NeXT), NaFlex (SigLIP 2), and M-RoPE (Qwen2-VL) for a given task.**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Compute token budgets for OCR, charts, and photography without resizing.**; and
- an updated `outputs/skill-resolution-budget-planner.md` example with a concrete input, expected output field, and acceptance check tied to **Name the three failure modes of square-resize: squished text, cropped content, wasted tokens on padding.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
