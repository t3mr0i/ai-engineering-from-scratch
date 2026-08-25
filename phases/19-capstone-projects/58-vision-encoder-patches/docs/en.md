# Vision Encoder Patches

> A vision model that reads pixels needs a tokenizer for pixels. Patch embedding is that tokenizer. Cut the image into a grid of squares, flatten each square, project it through one linear layer, then add a 2D position signal so the transformer knows where each square sat in the original image.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 lessons 30-37 (Track B foundations)
**Time:** ~90 minutes

## Learning Objectives

- Tokenize an image into a fixed-length sequence of patch embeddings.
- Implement a `Conv2d`-based patch projection that matches the math of unfold-then-linear.
- Build a deterministic 2D sinusoidal position embedding so token order encodes spatial position.
- Verify patch count, embedding shape, and `Conv2d`/unfold equivalence on a synthetic fixture.

## The Problem

A transformer eats a sequence of vectors. An image is a 3-channel grid. Reading every pixel as a token explodes the sequence length: a 224x224 RGB image is 150,528 tokens, which a 12-layer transformer cannot afford in attention. Reading the image as one giant flat vector throws away locality, which the attention layer cannot recover from. The job of the encoder front end is to compress the pixel grid into a few hundred tokens that each summarize a square region.

Patch embedding solves this with one linear projection. A 224x224 image cut into 16x16 patches produces a 14x14 grid of 196 patches. Each patch is flattened from `(3, 16, 16) = 768` pixel values into one vector, then a linear layer maps it to the model's hidden dimension. The transformer sees 196 tokens of dimension `hidden` (commonly 768) plus a CLS token. That is a sequence the rest of the network can chew on.

## The Concept

```mermaid
flowchart LR
  Image[224x224x3 image] --> Cut[cut into 16x16 patches]
  Cut --> Grid[14x14 grid of patches]
  Grid --> Flatten[flatten each patch]
  Flatten --> Proj[linear projection]
  Proj --> Tokens[196 tokens of dim hidden]
  Tokens --> Pos[add 2D sinusoidal position]
  Pos --> Out[final token sequence]
```

### Why patches, not pixels

Attention is quadratic in sequence length. A 196-token sequence costs `196 * 196 = 38,416` attention scores per head per layer; a 150,528-token sequence costs `150,528 * 150,528 = 22.6 billion`. Patches buy a 590,000x reduction in attention compute, and a single 16x16 region carries enough signal for high-level vision tasks. The cost is a loss of fine-grained spatial detail inside one patch, which is why downstream multimodal stacks often run a second high-resolution branch when fine localization matters.

### Why a linear projection is enough

Each patch is treated as an independent vector. The projection learns a basis: edge detectors, color filters, simple textures. A single linear layer is small (`768 * 768 = 589,824` parameters for ViT-Base) and trains fast. Deeper convolutional stems exist (the "hybrid" ViT), but a flat linear projection is the standard, and most modern open-weight encoders ship with this exact shape.

### The `Conv2d` trick

A `Conv2d(in_channels=3, out_channels=hidden, kernel_size=patch_size, stride=patch_size)` with no padding gives the same numerical result as unfold-then-linear, because each output position dot-products the patch pixels against one filter. The convolution is the patch projection, and most production codebases ship it that way because it is faster on GPU and uses one fewer reshape.

### Position embeddings

Tokens carry no order out of the projection. The 2D sinusoidal embedding gives each token a fixed signal that encodes its `(row, col)` position. Half the embedding dimension encodes row position with sin/cos at multiple frequencies; the other half encodes column position. The encoding is deterministic so you can swap resolutions without retraining, and it interpolates cleanly to grids the model never saw at training time.

| Component | Shape | Parameters |
|-----------|-------|------------|
| Patch projection (`Conv2d`) | `(hidden, 3, patch, patch)` | `3 * P * P * hidden + hidden` |
| Position embedding (fixed) | `(num_patches, hidden)` | 0 (computed, not learned) |
| CLS token (learned) | `(1, hidden)` | `hidden` |

For ViT-Base/16 at 224 resolution: 590,592 parameters in the projection, 768 in the CLS token, and zero for sinusoidal position. The next lesson (59) stacks a 12-layer transformer on top of this front end.

### Equivalence as a sanity check

The patch step has two spellings: a `Conv2d` projection and an explicit unfold-then-linear. They must produce the same output for the same weights. If they do not, the unfold math is wrong, and the rest of the encoder is built on sand. The tests in this lesson exercise that equivalence.


## Use It

The same patch front end shows up in every modern vision-language model: CLIP ViT-L/14, SigLIP, DINOv2, the Qwen-VL family, and the InternVL stack all start from a `Conv2d` patch projection plus a position signal. Differences across families live downstream (CLS vs no-CLS pooling, register tokens, varying patch sizes 14 vs 16, dynamic resolution via interpolated positions). The frontend in this lesson is the substrate every one of those models stands on.

## Tests

`code/test_main.py` covers:

- patch count matches `(image_size / patch_size) ** 2`
- output shape matches `(batch, num_patches + 1, hidden)`
- the `Conv2d` projection equals manual unfold-then-linear on a small fixture
- sinusoidal position table is deterministic across calls
- CLS token broadcasts across batch dim without leakage

Run them:

```bash
python3 -m unittest code/test_main.py
```


## Key Terms

| Term | What it means |
|------|---------------|
| Patch | A square sub-region of the image, typically 14x14 or 16x16 |
| Patch embedding | Linear projection of one flattened patch to the hidden dim |
| Sequence length | Number of tokens after patch tokenization, usually plus CLS |
| Sinusoidal position | Fixed sin/cos signal that encodes 2D grid coordinates |
| CLS token | Learned vector prepended to the sequence as the pooling head |

## Build It

Reconstruct **Vision Encoder Patches** by following `FrontEndConfig` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Ship It

Hand off `outputs/artifact-card.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- An Image is Worth 16x16 Words (ViT, 2021) for the original patch-embed framing.
- Attention Is All You Need (2017) for the sinusoidal position formula adapted here to 2D.
- DINOv2 paper for register tokens, an extension you can add as exercise 6.

## Exercises

Use `FrontEndConfig` as the trace: start from tokens=["red","fox"], keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `FrontEndConfig`, `grid_size`, `num_patches`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Tokenize an image into a fixed-length sequence of patch embeddings.**.
2. **Vary one named input.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Implement a `Conv2d`-based patch projection that matches the math of unfold-then-linear.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Build a deterministic 2D sinusoidal position embedding so token order encodes spatial position.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/artifact-card.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Verify patch count, embedding shape, and `Conv2d`/unfold equivalence on a synthetic fixture.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Vision Encoder Patches** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `FrontEndConfig`, `grid_size`, `num_patches` traced to the value or shape that supports **Tokenize an image into a fixed-length sequence of patch embeddings.**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Implement a `Conv2d`-based patch projection that matches the math of unfold-then-linear.**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Build a deterministic 2D sinusoidal position embedding so token order encodes spatial position.**; and
- an updated `outputs/artifact-card.md` example with a concrete input, expected output field, and acceptance check tied to **Verify patch count, embedding shape, and `Conv2d`/unfold equivalence on a synthetic fixture.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
