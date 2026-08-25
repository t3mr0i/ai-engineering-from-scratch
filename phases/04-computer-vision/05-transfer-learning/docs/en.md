# Transfer Learning: Freeze the Backbone, Train the Head

> Transfer learning is a parameter-ownership decision before it is an optimizer decision.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 04 Lesson 04 (Image Classification), Phase 03 Lesson 06 (Optimizers)
**Time:** ~55 minutes

## Learning Objectives

- Separate a fixed feature extractor from a task-specific linear classification head.
- Count frozen and trainable parameters and state exactly what an update can change.
- Use deterministic local image features to test a transfer-learning loop without downloading weights.
- Explain discriminative learning rates as a staged schedule, not a guarantee of better accuracy.
- Validate feature, label, class-count, and learning-rate contracts before training.

## What this lesson does and does not claim

Real transfer learning often starts with a backbone trained on a large image corpus. This repository's allowlist and offline lesson contract make a downloaded checkpoint inappropriate for the canonical demo. `backbone_features` is therefore a deterministic local stand-in: channel means, channel variation, and horizontal/vertical edge summaries. It requires at least `2x2` spatial inputs because each edge summary is a mean over adjacent differences. It is frozen by convention because the function has no training state. `train_head` fits only a NumPy linear head on those features.

This distinction is important. The code demonstrates the ownership boundary and the accounting that carry over to a framework implementation; it does not claim ImageNet features, ResNet accuracy, or a useful pretrained checkpoint. `parameter_counts(..., freeze_backbone=True)` reports the head as trainable and the backbone as frozen. If the flag is false, both counts become trainable.

```mermaid
flowchart LR
    A["NHWC local images"] --> B["frozen backbone_features"]
    B --> C["N x F matrix"]
    C --> D["trainable linear head"]
    D --> E["logits / task report"]
```

`discriminative_lrs` assigns a positive base rate to named stages, multiplying earlier stages by `decay` more times than later stages. It is a transparent configuration helper; it does not mutate parameters or assert that one schedule is universally optimal. `init_head` is seeded, and `train_head` reports a loss history so a reviewer can see whether the local fixture is learnable.

## Build It

Run:

```bash
python3 main.py
```

The run creates 60 local images in three classes, extracts 12 features each, trains a head, prints the frozen-backbone/head parameter accounting, and lists rates for `stem`, `stage1`, `stage2`, and `head`. The expected observation is a finite decreasing head loss on this fixture. No network, model registry, or external weight file is touched.

## Use It

```python
import sys
sys.path.insert(0, "code")
import main as transfer

images, labels = transfer.synthetic_dataset(6, 3, 12, seed=5)
features = transfer.backbone_features(images)
w, b, history = transfer.train_head(features, labels, 3, epochs=30, lr=0.6, seed=2)
assert history[-1] < history[0]
assert transfer.parameter_counts(1_000_000, w.size + b.size)["trainable"] == w.size + b.size
```

When adapting this pattern to a real model, record which layers are frozen, whether batch-normalization statistics are frozen, and which parameters each optimizer group owns. A low learning rate is not a substitute for checking those boundaries.

## Ship It

`outputs/skill-freeze-inspector.md` records the backbone/head counts, feature shape, trainable mask, and rates. `outputs/prompt-fine-tune-planner.md` asks for an explicit freeze stage and an acceptance metric. Both artifacts label the local feature extractor as illustrative so they cannot be mistaken for a downloaded checkpoint report.

## Exercises

1. Run `backbone_features` on `synthetic_dataset(3,3,8,seed=5)` and verify `(9,12)`. Split the 12 columns into means, standard deviations, horizontal edges, and vertical edges.
2. Compare `parameter_counts(100,12,True)` and `parameter_counts(100,12,False)`. State which tensors a head-only update may change.
3. Compute `discriminative_lrs(["stem","stage1","head"], base_lr=1e-3, decay=0.1)`. Explain why the head rate is largest in this helper and why that is only a policy choice.
4. Train the head twice with seed `2` and assert identical histories. Then pass `lr=0` or an out-of-range label and record the explicit error.

## Reference Solution

The local feature vector has 12 entries: three means, three standard deviations, and two three-channel edge summaries. With a frozen 100-parameter backbone and a 12-parameter head, only 12 parameters are trainable. For decay `0.1`, the stage rates increase toward the head. Repeated seeded training is identical, and the loss decreases on the local fixture; no observation supports a claim about external pretrained weights.
