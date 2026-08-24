# Audio Classification — From k-NN on MFCCs to AST and BEATs

> Everything from "dog barking vs siren" to "which language is this" is audio classification. The features are mels. The architecture moves each decade. The evaluation stays AUC, F1, and per-class recall.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 3 · 06 (CNNs), Phase 5 · 08 (CNNs & RNNs for Text)
**Time:** ~75 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Audio Classification — From k-NN on MFCCs to AST and BEATs
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Audio Classification — From k-NN on MFCCs to AST and BEATs

## The Problem

You get a 10-second clip. You want to know: "what is it?" Urban sound (siren, drill, dog), speech command (yes/no/stop), language ID (en/es/ar), speaker emotion (angry/neutral), or environmental sound (indoor/outdoor, babble). All of these are *audio classification*, and in 2026 the baseline architecture is mature: log-mel → CNN or Transformer → softmax.

The core difficulty is not the network. It is data. Audio datasets have brutal class imbalance, strong domain shift (clean vs noisy), and label noise (who decided "urban babble" vs "restaurant noise"?). The 80% of the problem is curation, augmentation, and evaluation, not swapping CNN for Transformer.

## The Concept

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**k-NN on MFCCs (the 1990s baseline).** Flatten MFCCs per clip, compute cosine similarity to a labeled bank, return majority vote of the top K. Surprisingly strong on clean, small datasets (Speech Commands, ESC-50). Runs with no GPU.

**2D CNN on log-mels (2015-2019).** Treat the `(T, n_mels)` log-mel as an image. Apply ResNet-18 or VGG-style. Global mean pool the time axis. Softmax over classes. Still the baseline in most 2026 kaggle competitions.

**Audio Spectrogram Transformer, AST (2021-2024).** Patchify the log-mel (e.g. 16×16 patches), add position embeddings, feed to a ViT. State of the art on AudioSet (mAP 0.485) for supervised learning.

**BEATs and WavLM-base (2024-2026).** Self-supervised pretraining on millions of hours. Fine-tune on your task with 1-10% of the supervised data you would have needed. In 2026 this is the default starting point for non-speech audio. BEATs-iter3 beats AST by 1-2 mAP on AudioSet while using 1/4 the compute.

**Whisper-encoder as a frozen backbone (2024).** Take Whisper's encoder, drop the decoder, attach a linear classifier. Near-SOTA on language ID and simple event classification with zero audio augmentation. The "free lunch" baseline.

### Class imbalance is the real challenge

ESC-50: 50 classes, 40 clips each — balanced, easy. UrbanSound8K: 10 classes, imbalanced 10:1. AudioSet: 632 classes with a 100,000:1 long tail. Techniques that work:

- Balanced sampling during training (not in evaluation).
- Mixup: linearly interpolate two clips (and their labels) as augmentation.
- SpecAugment: mask random time and frequency bands. Simple; critical.

### Evaluation

- Multiclass exclusive (Speech Commands): top-1 accuracy, top-5 accuracy.
- Multiclass multi-label (AudioSet, UrbanSound-style): mean average precision (mAP).
- Heavily imbalanced: per-class recall + macro F1.

2026 numbers you should know:

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |




## Further Reading

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) — the architecture of record from 2021–2024.
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) — the 2024+ default.
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) — the dominant audio augmentation.
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) — 50-class benchmark that lives on.
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) — 632-class YouTube taxonomy; still the gold standard.
