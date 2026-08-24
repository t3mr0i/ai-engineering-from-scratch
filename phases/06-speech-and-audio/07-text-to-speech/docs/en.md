# Text-to-Speech (TTS) — From Tacotron to F5 and Kokoro

> ASR inverts speech to text; TTS inverts text to speech. The 2026 stack is three parts: text → tokens, tokens → mel, mel → waveform. Each part has a default model that fits in a laptop.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 09 (Seq2Seq), Phase 7 · 05 (Full Transformer)
**Time:** ~75 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Text-to-Speech (TTS) — From Tacotron to F5 and Kokoro
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Text-to-Speech (TTS) — From Tacotron to F5 and Kokoro

## The Problem

You have a string: "Please remind me to water the plants at 6 pm." You need a 3-second audio clip that sounds natural, has correct prosody (pauses, stress), pronounces "plants" with the right vowel, and runs in under 300 ms on a CPU for a live voice assistant. You also need to swap voices, handle code-switched input ("remind me at 6 pm, daijoubu?"), and not embarrass yourself on names.

Modern TTS pipelines look like this:

1. **Text frontend.** Normalize text (dates, numbers, emails), convert to phonemes or subword tokens, predict prosody features.
2. **Acoustic model.** Text → mel spectrogram. Tacotron 2 (2017), FastSpeech 2 (2020), VITS (2021), F5-TTS (2024), Kokoro (2024).
3. **Vocoder.** Mel → waveform. WaveNet (2016), WaveRNN, HiFi-GAN (2020), BigVGAN (2022), neural codec vocoders in 2024+.

In 2026 the acoustic + vocoder split blurs with end-to-end diffusion and flow-matching models. But the mental model of three parts still holds for debugging.

## The Concept

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017).** Seq2seq: char-embedding → BiLSTM encoder → location-sensitive attention → autoregressive LSTM decoder emits mel frames. Slow (AR), wobbly on long text. Still cited as a baseline.

**FastSpeech 2 (2020).** Non-autoregressive. Duration predictor outputs how many mel frames each phoneme gets. 1-pass, 10× faster than Tacotron. Loses some naturalness (monotonic alignment) but ships everywhere.

**VITS (2021).** Jointly trains encoder + flow-based duration + HiFi-GAN vocoder end-to-end with variational inference. High quality, single model. Dominant open-source TTS 2022–2024. Variants: YourTTS (multi-speaker zero-shot), XTTS v2 (2024, Coqui).

**F5-TTS (2024).** Diffusion transformer over flow matching. Natural prosody, zero-shot voice cloning with 5 seconds of reference audio. Top of the 2026 open-source TTS leaderboards. 335M params.

**Kokoro (2024).** Small (82M), CPU-runnable, best-in-class English TTS for real-time use. Closed-vocabulary English-only, apache-2.0.

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3.** Commercial state of the art. ElevenLabs v2.5 emotion tags ("[whispered]", "[laughing]") and character voices dominate audiobook production in 2026.

### Vocoder evolution

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | offline only | SOTA at release |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | near-human |
| 2022 | BigVGAN | 50× realtime | generalizes across speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | integrated with AR models | discrete tokens, bit-efficient |

By 2026 most "TTS" models are end-to-end from text to waveform; the mel spectrogram is an internal representation.

### Evaluation

- **MOS (Mean Opinion Score).** 1–5 scale, crowd-sourced. Still the gold standard; painfully slow.
- **CMOS (Comparative MOS).** A-vs-B preference. Tighter confidence intervals per annotation.
- **UTMOS, DNSMOS.** Reference-free neural MOS predictors. Used for leaderboards.
- **CER (Character Error Rate) via ASR.** Run TTS output through Whisper, compute CER against the input text. Proxy for intelligibility.
- **SECS (Speaker Embedding Cosine Similarity).** Voice-cloning quality.

2026 numbers on LibriTTS test-clean:

| Model | UTMOS | CER (via Whisper) | Size |
|-------|-------|-------------------|------|
| Ground truth | 4.08 | 1.2% | — |
| F5-TTS | 3.95 | 2.1% | 335M |
| XTTS v2 | 3.81 | 3.5% | 470M |
| VITS | 3.62 | 3.1% | 25M |
| Kokoro v0.19 | 3.87 | 1.8% | 82M |
| Parler-TTS Large | 3.76 | 2.8% | 2.3B |




## Further Reading

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) — the seq2seq baseline.
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) — end-to-end flow-based.
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) — current open-source SOTA.
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646) — the vocoder that still ships in 2026.
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) — 2024 CPU-friendly English TTS.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the signal-processing and modeling concepts behind Text-to-Speech (TTS) — From Tacotron to F5 and Kokoro.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the lesson's core audio operation from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect time-, frequency-, or token-domain intermediates produced by the pipeline.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the signal-processing and modeling concepts behind Text-to-Speech (TTS) — From Tacotron to F5 and Kokoro,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect time-, frequency-, or token-domain intermediates produced by the pipeline,” and cite a repeatable check rather than relying on visual inspection alone.
