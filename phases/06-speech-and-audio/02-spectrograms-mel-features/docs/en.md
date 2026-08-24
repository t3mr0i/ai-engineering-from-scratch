# Spectrograms, Mel Scale & Audio Features

> Neural nets do not consume raw waveforms well. They consume spectrograms. They consume mel spectrograms even better. Every ASR, TTS, and audio classifier in 2026 lives or dies by this single preprocessing choice.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Spectrograms, Mel Scale & Audio Features
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Spectrograms, Mel Scale & Audio Features

## The Problem

Take a 10-second 16 kHz clip. That is 160,000 floats, all in `[-1, 1]`, almost perfectly uncorrelated with the label "dog barking" or "the word cat". The raw waveform has the information but in a form the model cannot easily extract. Two identical phonemes spoken 100 ms apart have completely different raw samples.

A spectrogram fixes this. It collapses the temporal detail where human perception ignores it (microsecond jitter) and preserves the structure where perception attends (which frequencies are energetic, over time windows of ~10–25 ms).

Mel spectrograms push further. Humans perceive pitch logarithmically: 100 Hz vs 200 Hz sounds "the same distance apart" as 1000 Hz vs 2000 Hz. The mel scale warps the frequency axis to match. A mel-scaled spectrogram is the single most important feature in speech ML from 2010 through 2026.

## The Concept

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).** Slice the waveform into overlapping frames (typical: 25 ms window, 10 ms hop = 400 samples / 160 samples at 16 kHz). Multiply each frame by a window function (Hann is the default; Hamming slightly different tradeoff). FFT each frame. Stack the magnitude spectra into a matrix of shape `(n_frames, n_freq_bins)`. That is your spectrogram.

**Log-magnitude.** Raw magnitudes span 5-6 orders of magnitude. Take `log(|X| + 1e-6)` or `20 * log10(|X|)` to compress dynamic range. Every production pipeline uses log-magnitude, not raw magnitude.

**Mel scale.** Frequency `f` in Hz maps to mel `m` by `m = 2595 * log10(1 + f / 700)`. The mapping is roughly linear below 1 kHz and roughly logarithmic above. 80 mel bins covering 0–8 kHz is the standard ASR input.

**Mel filterbank.** A set of triangular filters spaced equally on the mel scale. Each filter is a weighted sum of adjacent FFT bins. Multiplying the STFT magnitude by the filterbank matrix gives the mel spectrogram in one matmul.

**Log-mel spectrogram.** `log(mel_spec + 1e-10)`. Whisper's input. Parakeet's input. SeamlessM4T's input. The universal 2026 audio frontend.

**MFCCs.** Take the log-mel spectrogram, apply a DCT (type II), keep the first 13 coefficients. Decorrelates the features and compresses further. Dominant feature until about 2015 when CNNs/Transformers on raw log-mels caught up. Still used in speaker recognition (x-vectors, ECAPA).

**Resolution trade.** Larger FFT = better frequency resolution but worse time resolution. 25 ms / 10 ms is the audio-ML default; 50 ms / 12.5 ms for music; 5 ms / 2 ms for transient detection (drum hits, plosives).




## Further Reading

- [Davis, Mermelstein (1980). Comparison of parametric representations for monosyllabic word recognition](https://ieeexplore.ieee.org/document/1163420) — the MFCC paper.
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) — the original mel scale.
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) — read the reference implementation.
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html) — reference for `mfcc`, `melspectrogram`, and hop/window.
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) — production-scale pipeline for Parakeet + Canary models.
