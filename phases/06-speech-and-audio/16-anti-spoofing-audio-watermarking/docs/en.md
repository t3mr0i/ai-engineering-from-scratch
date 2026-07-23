# Voice Anti-Spoofing & Audio Watermarking — ASVspoof 5, AudioSeal, WaveVerify

> Voice cloning shipped faster than defenses. 2026 production voice systems need two things: a detector (AASIST, RawNet2) that classifies real vs fake speech, and a watermark (AudioSeal) that survives compression and editing. Ship both or do not ship voice cloning.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 08 (Voice Cloning)
**Time:** ~75 minutes

## The Problem

Three related defenses:

1. **Anti-spoofing / deepfake detection.** Given an audio clip, is it synthetic or real? ASVspoof benchmarks (ASVspoof 2019 → 2021 → 5) are the gold standard.
2. **Audio watermarking.** Embed an imperceptible signal in generated audio that a detector can extract later. AudioSeal (Meta) and WavMark are the open options.
3. **Authenticated provenance.** Cryptographic signing of audio files + metadata. C2PA / Content Authenticity Initiative.

Detection handles adversaries who don't cooperate. Watermarking handles compliance — AI-generated audio should be identifiable as such. Both are required in 2026.

## The Concept

![Anti-spoofing vs watermarking vs provenance — three defense layers](../assets/spoofing-watermark.svg)

### ASVspoof 5 — the 2024-2025 benchmark

Biggest change from prior editions:

- **Crowdsourced data** (not studio clean) — realistic conditions.
- **~2000 speakers** (vs ~100 before).
- **32 attack algorithms.** TTS + voice conversion + adversarial perturbation.
- **Two tracks.** Countermeasure (CM) standalone detection; Spoofing-robust ASV (SASV) for biometric systems.

State-of-the-art on ASVspoof 5: ~7.23% EER. On the older ASVspoof 2019 LA: 0.42% EER. Real-world deployment: expect 5-10% EER on in-the-wild clips.

### AASIST and RawNet2 — detection model families

**AASIST** (2021, updated through 2026). Graph-attention on spectral features. Current SOTA on ASVspoof 5 countermeasure task.

**RawNet2.** Convolutional front-end over raw waveform + TDNN backbone. Simpler baseline; still competitive with fine-tuning.

**NeXt-TDNN + SSL features.** 2025 variant: ECAPA-style + WavLM features + focal loss. Achieves the 0.42% EER on ASVspoof 2019 LA.

### AudioSeal — the 2024 watermark default

Meta's **AudioSeal** (Jan 2024, v0.2 Dec 2024). Key design:

- **Localized.** Detects the watermark per-frame at 16 kHz sample resolution (1/16000 s).
- **Generator + detector jointly trained.** Generator learns to embed inaudible signal; detector learns to find it through augmentations.
- **Robust.** Survives MP3 / AAC compression, EQ, speed-shift ±10%, noise mix +10 dB SNR.
- **Fast.** Detector runs at 485× realtime; 1000× faster than WavMark.
- **Capacity.** 16-bit payload (can encode model ID, generation timestamp, user ID) embeddable in each utterance.

### WavMark

The pre-AudioSeal open baseline. Invertible neural network, 32 bits/sec. Problems:

- Synchronization brute-force is slow.
- Can be removed by Gaussian noise or MP3 compression.
- Not real-time friendly.

### WaveVerify (July 2025)

Addresses AudioSeal's weaknesses — specifically temporal manipulations (reversal, speed). Uses FiLM-based generator + Mixture-of-Experts detector. Competitive with AudioSeal on standard attacks; handles temporal edits.

### The gap adversaries exploit

From AudioMarkBench: "under pitch shift, all watermarks show Bit Recovery Accuracy below 0.6, indicating near-complete removal." **Pitch-shift is the universal attack.** No 2026 watermark is fully robust to aggressive pitch modification. This is why you need detection (AASIST) alongside watermarking.

### C2PA / Content Authenticity Initiative

Not an ML technique — a manifest format. Audio files carry cryptographically signed metadata about creation tool, author, date. Audobox / Seamless use it. Good for provenance; does nothing if a bad actor re-encodes and strips metadata.


## Use It

| Use case | Defense |
|----------|---------|
| Shipping TTS / voice cloning | AudioSeal embed on every output (non-negotiable) |
| Biometric voice unlock | AASIST + ECAPA ensemble; liveness challenge |
| Call-center fraud detection | AASIST on 20% sample of incoming calls |
| Podcast authenticity | C2PA signing on upload, AudioSeal if AI-generated |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## Pitfalls

- **Watermark without detector ever running.** Pointless. Ship the detector in your CI.
- **Detection without calibration.** AASIST trained on ASVspoof LA overfits; real-world accuracy drops. Calibrate on your domain.
- **Pitch-shift gap.** Aggressive pitch shift removes most watermarks. Have a detection fallback.
- **Metadata strip-and-rehost.** C2PA is trivially bypassable by re-encoding. Always add cryptographic + perceptual (watermark) defense together.
- **Liveness as detection.** Ask user to say a random phrase. Prevents replay attacks but not real-time cloning.

## Ship It

Save as `outputs/skill-spoof-defender.md`. Pick detection model, watermark, provenance manifest, and operational playbook for a voice-gen deployment.


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| ASVspoof | The benchmark | Biennial challenge; 2024 = ASVspoof 5. |
| CM (countermeasure) | Detector | Classifier: real speech vs synthetic / converted. |
| SASV | Speaker verif + CM | Integrated biometric + spoof detection. |
| AudioSeal | Meta watermark | Localized, 16-bit payload, 485× faster than WavMark. |
| Bit Recovery Accuracy | Watermark survival | Fraction of payload bits recovered after attack. |
| C2PA | Provenance manifest | Cryptographic metadata about creation / authorship. |
| AASIST | Detector family | Graph-attention-based anti-spoofing SOTA. |

## Further Reading

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) — the current benchmark.
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) — the watermark default.
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150) — MoE detector for temporal attacks.
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) — the SOTA detection backbone.
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) — robustness evaluation.
- [C2PA specification](https://c2pa.org/specifications/specifications/) — provenance manifest format.
