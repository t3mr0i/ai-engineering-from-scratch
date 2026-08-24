# Neural Audio Codecs — EnCodec, SNAC, Mimi, DAC and the Semantic-Acoustic Split

> 2026 audio generation is almost all tokens. EnCodec, SNAC, Mimi, and DAC turn continuous waveforms into discrete sequences that a transformer can predict. The semantic-vs-acoustic token split — first-codebook as semantic, rest as acoustic — is the most important architectural shift since the Transformer for audio.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Neural Audio Codecs — EnCodec, SNAC, Mimi, DAC and the Semantic-Acoustic Split
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Neural Audio Codecs — EnCodec, SNAC, Mimi, DAC and the Semantic-Acoustic Split

## The Problem

Language models work on discrete tokens. Audio is continuous. If you want an LLM-style model for speech / music — MusicGen, Moshi, Sesame CSM, VibeVoice, Orpheus — you first need a **neural audio codec**: a learned encoder that discretizes audio into a small vocabulary of tokens, and a matching decoder that reconstructs the waveform.

Two families have emerged:

1. **Reconstruction-first codecs** — EnCodec, DAC. Optimize perceptual audio quality. Tokens are "acoustic" — they capture everything including speaker identity, timbre, background noise.
2. **Semantic-first codecs** — Mimi (Kyutai), SpeechTokenizer. Force the first codebook to encode linguistic / phonetic content (often by distilling from WavLM). Subsequent codebooks are acoustic detail.

The 2024-2026 insight: **a pure reconstruction codec gives you blurry speech when you try to generate from text.** The LLM over codec tokens has to learn both language structure AND acoustic structure in the same codebook, which doesn't scale. Separating them — semantic codebook 0, acoustic codebooks 1-N — is what makes Moshi and Sesame CSM work.

## The Concept

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### The core trick: Residual Vector Quantization (RVQ)

Rather than one big codebook (which would need millions of codes for good quality), all modern audio codecs use **RVQ**: a cascade of small codebooks. The first codebook quantizes the encoder output; the second quantizes the residual; etc. Each codebook is 1024 codes. 8 codebooks = effective vocabulary of 1024^8 = 10^24.

At inference time, the decoder sums all chosen codes per frame to reconstruct.

### The four codecs that matter in 2026

**EnCodec (Meta, 2022).** The baseline. Encoder-decoder over waveform, RVQ bottleneck. 24 kHz, 32 codebooks possible, default 4 codebooks @ 1.5 kbps. Uses `1D conv + transformer + 1D conv` architecture. Used by MusicGen.

**DAC (Descript, 2023).** RVQ with L2-normalized codebooks, periodic activation functions, improved losses. Highest reconstruction fidelity of any open codec — sometimes indistinguishable from original speech with 12 codebooks. 44.1 kHz full-band.

**SNAC (Hubert Siuzdak, 2024).** Multi-scale RVQ — the coarse codebooks operate at a lower frame rate than fine ones. Effectively models audio hierarchically: a coarse "sketch" at ~12 Hz plus detail at 50 Hz. Used by Orpheus-3B because the hierarchical structure maps well onto LM-based generation.

**Mimi (Kyutai, 2024).** The 2026 game-changer. 12.5 Hz frame rate (extremely low), 8 codebooks @ 4.4 kbps. Codebook 0 is **distilled from WavLM** — trained to predict WavLM's speech-content features. Codebooks 1-7 are acoustic residuals. This split powers Moshi (Lesson 15) and Sesame CSM.

### Frame rates matter for language modeling

Lower frame rate = shorter sequence = faster LM.

| Codec | Frame rate | 1 s = N frames | Good for |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | music, general audio |
| DAC-44.1k | 86 Hz | 86 | high-fidelity music |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM efficient |
| Mimi | 12.5 Hz | 12.5 | streaming speech |

At 12.5 Hz, a 10-second utterance is only 125 codec frames — a transformer can easily predict them.

### Semantic vs acoustic tokens

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token (codebook 0 in Mimi).** Encodes what was said — phonemes, words, content. Distilled from WavLM via an auxiliary prediction loss.
- **Acoustic tokens (codebooks 1-7).** Encode timbre, speaker identity, prosody, background noise, fine detail.

An AR LM predicts the semantic token first (conditioned on text), then predicts acoustic tokens (conditioned on semantic + speaker reference). This factorization is why modern TTS can zero-shot-clone voices: the semantic model handles content; the acoustic model handles timbre.

### 2026 reconstruction quality (bits per sec, lower bitrate is better)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

Traditional codecs like Opus still win per bit on perceptual quality. Neural codecs win on **discrete tokens** (which Opus does not produce) and **generative-model quality** (what the LM can do with those tokens).




## Further Reading

- [Défossez et al. (2023). EnCodec](https://arxiv.org/abs/2210.13438) — the RVQ baseline.
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546) — highest-fidelity open.
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) — multi-scale RVQ.
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) — semantic-acoustic split, WavLM distillation.
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) — the two-stage semantic/acoustic paradigm.
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) — the original streamable RVQ codec.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the signal-processing and modeling concepts behind Neural Audio Codecs — EnCodec, SNAC, Mimi, DAC and the Semantic-Acoustic Split.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the lesson's core audio operation from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect time-, frequency-, or token-domain intermediates produced by the pipeline.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the signal-processing and modeling concepts behind Neural Audio Codecs — EnCodec, SNAC, Mimi, DAC and the Semantic-Acoustic Split,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect time-, frequency-, or token-domain intermediates produced by the pipeline,” and cite a repeatable check rather than relying on visual inspection alone.
