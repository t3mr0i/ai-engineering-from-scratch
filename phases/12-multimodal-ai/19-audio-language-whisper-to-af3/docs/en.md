# Audio-Language Models: the Whisper to Audio Flamingo 3 Arc

> Whisper (Radford et al., December 2022) settled speech recognition — 680k hours of weakly-supervised multilingual speech, a simple encoder-decoder transformer, a benchmark that made every subsequent ASR release cite it. But recognition is not reasoning. Asking "what instruments are in this recording" or "what emotion is the speaker expressing" or "what happened at minute 3" requires audio understanding, not transcription. Qwen-Audio, SALMONN, LTU, and NVIDIA's Audio Flamingo 3 (AF3, July 2025) progressively built that stack: keep Whisper-class encoders, bolt on Q-formers, train on audio-text instruction data, add chain-of-thought reasoning. This lesson walks the arc.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 (Speech and Audio), Phase 12 · 03 (Q-Former)
**Time:** ~180 minutes

## Learning Objectives

- Compute a log-Mel spectrogram from a waveform: windowing, FFT, filter banks, log transform.
- Compare encoder options: Whisper encoder, BEATs, AF-Whisper hybrid. When each wins.
- Build an audio Q-former: N learnable queries cross-attending to spectrogram patches.
- Explain cascaded (Whisper-then-LLM) vs end-to-end audio-LLM training: why end-to-end scales better for reasoning.

## The Problem

Speech recognition was solved by Whisper. OCR-of-audio is a commodity. But "commodity" stops at transcription. If the model cannot reason over what it heard — timing, speakers, emotion, music structure, environmental sounds — transcription alone cannot drive product features.

Three obvious routes:

1. Cascade: Whisper transcribes, LLM reasons over the transcript. Works for pure-speech scenarios. Fails for music, environmental audio, multi-speaker overlap, emotion.

2. End-to-end audio-LLM: an audio encoder feeds audio tokens directly into an LLM, skipping transcription. Preserves acoustic information (emotion, speaker, environment). Needs new training data.

3. Hybrid: audio encoder + text decoder that can both transcribe and reason. Qwen-Audio and Audio Flamingo pick this route.

## The Concept

### Log-Mel spectrogram: the input feature

Every audio encoder starts with the same feature: a log-Mel spectrogram.

1. Resample to 16 kHz.
2. Short-time Fourier transform with 25ms windows, 10ms hop.
3. Take magnitude of the FFT result.
4. Apply Mel filter banks (typically 80 filters log-spaced 0-8000 Hz) to warp to perceptual frequency.
5. Log compress (log(1 + x)) for dynamic range.

Result: a 2D array of shape (T, 80) where T is the number of time frames. For a 30-second clip at 100 Hz frame rate: (3000, 80).

### Whisper's encoder

Whisper's encoder is a 12-layer ViT-style transformer processing the log-Mel spectrogram as a sequence of time frames. Output: one hidden-state vector per time frame.

For ASR, Whisper's decoder is a cross-attention transformer that generates text tokens conditioned on the encoder output. Standard encoder-decoder.

For ALMs (audio-LLMs), you want the encoder output as input to a different LLM. The pattern: Whisper encoder frozen, Q-former trainable, LLM frozen or tuned.

### BEATs and audio-specific encoders

Whisper was trained on speech-dominant data. It is weaker for music and environmental audio.

BEATs (Chen et al., 2022) is a self-supervised transformer trained on AudioSet. Captures music and environmental sounds better than Whisper at the same parameter count.

AF-Whisper (Audio Flamingo 3's hybrid): concat Whisper + BEATs features as the audio input. Whisper carries linguistic signal, BEATs carries acoustic signal.

### Audio Q-former

Same pattern as BLIP-2's visual Q-former. A fixed number of learnable queries (often 32 or 64) cross-attend over the audio encoder's output frames. The queries become audio tokens consumed by the LLM.

Training alignment stage: Q-former alone, contrastive + captioning losses on audio-text pairs (AudioCaps, Clotho). Instruction stage: end-to-end, unfreeze LLM, train on instruction data.

### The arc — SALMONN, Qwen-Audio, AF3

SALMONN (Tang et al., 2023): Whisper + BEATs + Q-former + LLaMA. The first open audio-LLM with serious reasoning ability. Benchmarks on MMAU show ~0.55 composite.

Qwen-Audio (Chu et al., 2023): similar architecture, trained on a richer dataset, tuned for multi-turn dialogue. MMAU ~0.60.

LTU — Listen, Think, Understand (Gong et al., 2023): explicit reasoning data, focus on chain-of-thought over audio clips. Smaller but more focused.

Audio Flamingo 3 (Goel et al., July 2025): the current open SOTA. 8B LLM backbone (Qwen2 7B), Whisper-large encoder concat BEATs, 64-query Q-former, training on 1M+ audio-text instruction pairs. MMAU 0.72, matches proprietary frontier on some sub-tasks.

AF3 also introduces on-demand chain-of-thought for audio: the model can optionally emit thinking tokens ("let me identify the instruments first: ...") before the final answer. Accuracy on complex reasoning tasks lifts 3-5 points when thinking is enabled.

### Cascaded vs end-to-end

Cascaded pipeline:

1. Whisper transcribes audio → text.
2. LLM reasons over text.

Works perfectly for "summarize this podcast." Fails for:
- "What's the mood of this song?" — mood is in the sound, not words.
- "Who is speaking, Alice or Bob?" — requires speaker identification.
- "At what second does the explosion happen?" — temporal grounding lost in text.
- "Is this real or generated audio?" — deepfake detection needs acoustic features.

End-to-end preserves acoustic signal. Qwen-Audio and AF3 handle music, environment, and emotion natively.

### 2026 production recipe

For a new audio-understanding product:

- Cascaded if: transcription is the goal, no music, no emotion inference.
- AF3 / Qwen-Audio-family if: music, emotion, multi-speaker, or complex audio reasoning.

Cascaded is cheaper and simpler. End-to-end is more capable.

### MMAU — the audio reasoning benchmark

MMAU (Massive Multimodal Audio Understanding) is the 2024-2025 audio reasoning benchmark:

- 10,000 audio-text QA pairs across speech, music, environmental sounds.
- Covers classification, temporal reasoning, causal reasoning, open-ended QA.
- Tests what cascaded pipelines systematically miss.

Open SOTA (AF3) at 0.72; proprietary frontier ~0.78 (Gemini 2.5 Pro, Claude Opus 4.7). The gap is smaller than VideoMME's open-vs-closed delta, indicating audio-LLMs are maturing.



## Build It

Reconstruct **Audio-Language Models: the Whisper to Audio Flamingo 3 Arc** by following `synth_waveform` on a 160-sample 16 kHz waveform. Run `python3 main.py` and verify that the duration/frame count is zero or the documented validation path is used; no plausible speech label should be fabricated.

## Use It

Call `synth_waveform` from a small caller with a 160-sample 16 kHz waveform. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-audio-llm-pipeline-picker.md` with the command `python3 main.py`, the accepted input shape (a 160-sample 16 kHz waveform), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Radford et al. — Whisper (arXiv:2212.04356)](https://arxiv.org/abs/2212.04356)
- [Chu et al. — Qwen-Audio (arXiv:2311.07919)](https://arxiv.org/abs/2311.07919)
- [Goel et al. — Audio Flamingo 3 (arXiv:2507.08128)](https://arxiv.org/abs/2507.08128)
- [Tang et al. — SALMONN (arXiv:2310.13289)](https://arxiv.org/abs/2310.13289)
- [Gong et al. — LTU (arXiv:2305.10790)](https://arxiv.org/abs/2305.10790)

## Exercises

Work from the smallest fixture that the Audio-Language Models: the Whisper to Audio Flamingo 3 Arc demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using a 160-sample 16 kHz waveform. Follow `synth_waveform`, `window_frames`, `naive_dft_mag`. Expect the duration/frame count is zero or the documented validation path is used; no plausible speech label should be fabricated; capture the first printed shape, metric, status, or summary field and state which part supports **Compute a log-Mel spectrogram from a waveform: windowing, FFT, filter banks, log transform.**.
2. **Perturb one field.** Repeat the command after changing only the waveform amplitude: use the same waveform with its amplitude halved. Predict the direction of the change, then compare the two output values. Explain why **Compare encoder options: Whisper encoder, BEATs, AF-Whisper hybrid. When each wins.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty waveform (zero samples). Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Build an audio Q-former: N learnable queries cross-attending to spectrogram patches.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-audio-llm-pipeline-picker.md` and add a worked example using a 160-sample 16 kHz waveform. Include the input contract, one expected output field, and a named acceptance check for **Explain cascaded (Whisper-then-LLM) vs end-to-end audio-LLM training: why end-to-end scales better for reasoning.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Audio-Language Models: the Whisper to Audio Flamingo 3 Arc** should contain:

- the `python3 main.py` output for a 160-sample 16 kHz waveform, with `synth_waveform`, `window_frames`, `naive_dft_mag` traced to the value or shape that supports **Compute a log-Mel spectrogram from a waveform: windowing, FFT, filter banks, log transform.**;
- a before/after comparison for the waveform amplitude, where the same waveform with its amplitude halved changes the observation in the direction predicted by **Compare encoder options: Whisper encoder, BEATs, AF-Whisper hybrid. When each wins.**;
- a recorded result for an empty waveform (zero samples) that matches the implementation’s validation or empty-result contract and explains the evidence for **Build an audio Q-former: N learnable queries cross-attending to spectrogram patches.**; and
- an updated `outputs/skill-audio-llm-pipeline-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Explain cascaded (Whisper-then-LLM) vs end-to-end audio-LLM training: why end-to-end scales better for reasoning.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
