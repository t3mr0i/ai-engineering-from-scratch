# Audio Fundamentals — Waveforms, Sampling, Fourier Transform

> Waveforms are the raw signal. Spectrograms are the representation. Mel features are the ML-friendly form. Every modern ASR and TTS pipeline walks this ladder, and the first rung is understanding sampling and Fourier.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Vectors & Matrices), Phase 1 · 14 (Probability Distributions)
**Time:** ~45 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Audio Fundamentals — Waveforms, Sampling, Fourier Transform
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Audio Fundamentals — Waveforms, Sampling, Fourier Transform

## The Problem

A microphone produces a pressure-vs-time signal. Your neural net consumes tensors. Between them sits a stack of conventions that, when violated, produce silent bugs: the model trains fine but the WER doubles, or TTS ships a hiss, or a voice cloning system memorizes the microphone instead of the speaker.

Every bug in speech systems traces back to one of three questions:

1. What sample rate was the data recorded at, and what does the model expect?
2. Is the signal aliased?
3. Are you operating on raw samples or on a frequency representation?

Get these right and the rest of Phase 6 is tractable. Get them wrong and even Whisper-Large-v4 produces garbage.

## The Concept

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform.** A one-dimensional array of floats in `[-1.0, 1.0]`. Indexed by sample number. To convert to seconds, divide by the sample rate: `t = n / sr`. A 10-second clip at 16 kHz is an array of 160,000 floats.

**Sampling rate (sr).** How many samples per second. Common rates in 2026:

| Rate | Use |
|------|-----|
| 8 kHz | Telephony, legacy VOIP. Nyquist at 4 kHz kills consonants. Avoid for ASR. |
| 16 kHz | ASR standard. Whisper, Parakeet, SeamlessM4T v2 all consume 16 kHz. |
| 22.05 kHz | TTS vocoder training for older models. |
| 24 kHz | Modern TTS (Kokoro, F5-TTS, xTTS v2). |
| 44.1 kHz | CD audio, music. |
| 48 kHz | Film, pro audio, high-fidelity TTS (VALL-E 2, NaturalSpeech 3). |

**Nyquist-Shannon.** A sample rate of `sr` can unambiguously represent frequencies up to `sr/2`. The `sr/2` boundary is the *Nyquist frequency*. Energy above Nyquist gets *aliased* — folded down into lower frequencies — and corrupts the signal. Always low-pass filter before downsampling.

**Bit depth.** 16-bit PCM (signed int16, range ±32,767) is the universal exchange format. 24-bit for music, 32-bit float for internal DSP. Libraries like `soundfile` read int16 but expose float32 arrays in `[-1, 1]`.

**Fourier Transform.** Any finite signal is a sum of sinusoids at different frequencies. The Discrete Fourier Transform (DFT) computes, for `N` samples, `N` complex coefficients — one per frequency bin. `bin k` maps to frequency `k · sr / N` Hz. Magnitude is amplitude at that frequency, angle is phase.

**FFT.** Fast Fourier Transform: an `O(N log N)` algorithm for the DFT when `N` is a power of 2. Every audio library uses FFT under the hood. A 1024-sample FFT at 16 kHz gives 512 usable frequency bins spanning 0–8 kHz at 15.6 Hz resolution.

**Framing + window.** We do not FFT an entire clip. We chop it into overlapping *frames* (typically 25 ms with 10 ms hop), multiply each frame by a window function (Hann, Hamming) to kill edge discontinuities, then FFT each frame. This is the Short-Time Fourier Transform (STFT). Lesson 02 picks up from here.




## Further Reading

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) — the paper behind the sampling theorem.
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) — free, canonical DSP textbook.
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) — practical walkthrough with code.
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434) — reference for why real-world audio is not a clean sinusoid.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/) — frequency bin intuition cleared up in 10 minutes.
