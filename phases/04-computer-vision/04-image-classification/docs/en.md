# Image Classification: A Reproducible NumPy Pipeline

> A classifier is a chain of data contracts, not just a final `argmax`.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 04 Lesson 01 (Image Fundamentals), Phase 03 Lesson 05 (Regularization)
**Time:** ~60 minutes

## Learning Objectives

- Generate and inspect a small HWC image fixture without confusing it with CIFAR or a benchmark dataset.
- Apply channel-wise standardization and seeded geometric transforms while preserving shape.
- Compute stable softmax and hard/soft-target cross-entropy for extreme logits.
- Explain how mixup creates convex image and label pairs.
- Read a confusion matrix and per-class precision, recall, and F1 rather than relying on one accuracy value.

## Local classification contract

`synthetic_cifar` is a deliberately named local fixture: it creates `float32` NHWC images in `[0,1]`, with deterministic color/texture classes. It is not a download of CIFAR and its accuracy is not evidence about a production model. `image_features` reduces the fixture to channel means, standard deviations, and edge summaries so the training loop remains short enough to inspect.

`standardize` requires a `(3,)` mean and positive `(3,)` standard deviation. The two spatial transforms use an explicitly supplied `numpy.random.Generator`; passing the same generator seed makes an experiment reproducible. `mixup_batch` samples a positive Beta parameter, permutes the batch, and returns both mixed images and one-hot soft labels. It rejects malformed labels rather than converting strings or fractional class IDs.

The stable softmax subtracts the row maximum before exponentiating. Hard-target cross-entropy uses `logaddexp`, and soft-target cross-entropy checks that each target row is nonnegative and sums to one. `train_linear_classifier` is a small gradient-descent head over `image_features`; it demonstrates loss reduction, not a CNN or a general vision result.

```mermaid
flowchart LR
    A["NHWC fixture"] --> B["seeded transform"]
    B --> C["standardize"]
    C --> D["image_features"]
    D --> E["linear logits"]
    E --> F["stable CE / report"]
```

## Build It

Run:

```bash
python3 main.py
```

The canonical run creates 72 images across three local classes, extracts six features per image, trains for 60 short iterations, and prints the first/last loss, accuracy, confusion matrix, and macro F1. The exact values are a fixture observation. The acceptance condition is finite output and a lower final loss, not a claim about CIFAR performance.

## Use It

```python
import sys
sys.path.insert(0, "code")
import main as classification

images, labels = classification.synthetic_cifar(8, 3, 12, seed=4)
features = classification.image_features(images)
weights, bias, history = classification.train_linear_classifier(features, labels, 3, epochs=20, lr=0.6, seed=8)
assert history[-1] < history[0]
```

For a real dataset, preserve the split before applying augmentation and use the same mean/std definition in the validation path. The local API does not claim to prevent leakage for an external data loader; the caller must own that split boundary.

## Ship It

`per_class_report` accepts only a finite, non-negative, non-empty square matrix of true integer counts; booleans, object arrays, fractional counts, and `NaN` are rejected rather than silently rounded. `outputs/skill-classification-diagnostics.md` is a reporting checklist for the confusion matrix and per-class metrics. `outputs/prompt-classifier-pipeline-auditor.md` asks for image shape, label range, transform seed, loss trend, and a confusion matrix. Together they make a small classifier's failure mode inspectable without hiding it behind a framework trainer.

## Exercises

1. Generate `synthetic_cifar(4,3,8,seed=0)`, call `image_features`, and verify `(12,6)`. Explain which three feature columns measure color level and which three measure variation.
2. Evaluate `softmax([[1000,1001,-1000]])` and confirm finite probabilities summing to one. Then call `cross_entropy` with label `3` for two classes and preserve the exact validation error.
3. Use two constant images, labels `[0,1]`, and `mixup_batch(..., alpha=0.5, rng=default_rng(3))`. Check that each mixed label row sums to one and that each pixel remains between the source values.
4. Train the linear head for 30 epochs, save the confusion matrix, and identify a class with a false positive if one exists. Do not call a high fixture accuracy a benchmark result.

## Reference Solution

The local fixture produces six features per image and the stable softmax remains finite at logits near `1000`. A mixed target is a convex combination of two one-hot rows, so its row sum is one. The training history should decrease on the seeded color/texture fixture; the final confusion matrix and macro F1 are the shipped evidence. Invalid class IDs, malformed mean/std vectors, nonpositive mixup alpha, and mismatched prediction lengths are rejected explicitly.
