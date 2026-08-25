# Vision Transformers: Patches, Tokens, and Attention

> Make the image-to-sequence conversion visible before discussing a larger model.

**Type:** Build
**Languages:** Python
**Prerequisites:** 03-cnns-lenet-to-resnet, Phase 03 self-attention concepts
**Time:** ~45 minutes

## Learning Objectives

- Calculate the number and width of non-overlapping image patches.
- Implement a checked NCHW-to-token conversion with NumPy.
- Explain how a class token and positional signal extend the token sequence.
- Compute scaled dot-product attention and verify its row normalization.
- Distinguish this bounded, untrained fixture from a production ViT checkpoint.

## Why turn pixels into tokens?

A transformer sees a sequence, not a two-dimensional array. `patchify` therefore
cuts an image into non-overlapping `P × P` blocks and flattens each block. For
an image with shape `(N, C, H, W)`, the token count is

```text
T = (H / P) * (W / P)
```

and each raw token has `C * P * P` values. The implementation requires `P` to
divide both spatial axes; silently dropping a border would change the input
contract and make shape comparisons misleading.

```mermaid
flowchart LR
    A["NCHW image"] --> B["non-overlapping P×P blocks"]
    B --> C["N × T × (C·P·P) tokens"]
    C --> D["linear projection to D"]
    D --> E["prepend CLS and add positions"]
    E --> F["multi-head attention"]
    F --> G["CLS logits"]
```

## Build It

The canonical artifact is `code/main.py`. It uses a `(2, 3, 32, 32)` fixture,
`patch_size=8`, `dim=24`, and `num_heads=3`. Run it from the lesson's `code/`
directory:

```bash
python3 main.py
```

The observable contract is:

| Stage | Shape or invariant |
| --- | --- |
| `patchify` | `(2, 16, 192)` because `4 × 4` patches each contain `3 × 8 × 8` values |
| class-token sequence | `(2, 17, 24)`; one token is prepended |
| attention weights | `(2, 3, 17, 17)` and each last-axis row sums to one |
| logits | `(2, 4)` for the four local fixture classes |

`scaled_dot_product_attention` divides the query-key scores by
`sqrt(head_dim)` and rejects an empty head before that square root. A boolean
mask can hide keys, but every query must retain at least one visible key.
`softmax` requires a non-boolean integer axis in range (negative axes are
normalized) and uses a max shift, so large finite scores do not create an
avoidable overflow. `add_cls_token` also rejects a zero-width embedding.

## Use It

Import the primitives into a caller that owns a batch of NCHW NumPy images:

```python
import numpy as np
from main import patchify, vit_forward

images = np.zeros((1, 3, 32, 32), dtype=float)
patches = patchify(images, patch_size=8)
result = vit_forward(images, patch_size=8, dim=24, num_heads=3, num_classes=4, seed=7)
assert patches.shape == (1, 16, 192)
assert result["attention"].shape == (1, 3, 17, 17)
```

The `result` mapping is a reusable inspection artifact: `patches` exposes the
image-to-token boundary, `tokens` contains the post-attention sequence,
`attention` exposes per-head weights, and `logits` is the output of a random,
untrained local classifier. It is not evidence of recognition accuracy.

## Ship It

`outputs/skill-vit-patch-and-pos-embed-inspector.md` turns the shape checks into
a handoff checklist, while `outputs/prompt-vit-vs-cnn-picker.md` records when
this token path is appropriate. Ship the four fields above together with the
input shape, patch size, seed, and the row-sum check. A downstream consumer can
then reproduce the artifact without depending on PyTorch, a checkpoint, or a
network download.

## Exercises

1. Run `python3 main.py` and write down why `32 / 8` produces 16 patch tokens
   and why the attention matrix has `17 × 17` entries after adding `[CLS]`.
2. Replace the input with `(1, 3, 32, 24)` and `patch_size=8`. Predict the new
   token count and verify it with `patchify`; then try `patch_size=7` and record
   the explicit divisibility error.
3. Construct two attention rows with `mask=[[True, False], [True, True]]`.
   Verify that the first row assigns zero weight to its hidden key and that an
   all-false row is rejected rather than normalized to a meaningless result.
4. Change only `seed` in `vit_forward` and compare `patches` with `logits`.
   Explain why the raw patches stay fixed while the untrained projection and
   classifier outputs change.

## Reference Solution

For the canonical fixture, the checkable reasoning is:

1. `H/P = W/P = 4`, so `T = 16`; each raw token has `3 * 8 * 8 = 192`
   values.
2. `add_cls_token` changes `(2, 16, 24)` into `(2, 17, 24)`, and splitting
   24 features over three heads gives `head_dim=8`.
3. Attention scores have shape `(2, 3, 17, 17)`. The boolean mask test has a
   zero in its hidden-key column and every valid row sums to one.
4. A non-dividing patch size or an invalid softmax axis raises `ValueError`; the
   implementation does not crop the image or leak a raw `IndexError`. Changing
   the seed leaves `patches` unchanged but changes the deterministic random
   projection/classifier outputs. These checks establish tensor plumbing, not
   pretrained recognition quality.
