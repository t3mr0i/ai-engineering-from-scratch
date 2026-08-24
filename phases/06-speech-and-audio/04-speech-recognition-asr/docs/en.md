# Speech Recognition (ASR) — CTC, RNN-T, Attention

> Speech recognition is audio classification at every timestep, glued together by a sequence model that knows English and silence. CTC, RNN-T, and attention are the three ways to do it. Pick one and understand why.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (CNNs & RNNs for Text), Phase 5 · 10 (Attention)
**Time:** ~45 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Speech Recognition (ASR) — CTC, RNN-T, Attention
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Speech Recognition (ASR) — CTC, RNN-T, Attention

## The Problem

You have a 10-second 16 kHz clip. You want a string: "turn on the kitchen lights". The challenge is structural: audio frames do not align one-to-one with characters. The word "okay" might take 200 ms or 1200 ms. Silence punctuates the utterance. Some phonemes are longer than others. The number of output tokens is not known in advance.

Three formulations solve this:

1. **CTC (Connectionist Temporal Classification).** Emit per-frame token probabilities including a special *blank*. Collapse repeats and blanks at decode time. Non-autoregressive, fast. Used by wav2vec 2.0, MMS.
2. **RNN-T (Recurrent Neural Network Transducer).** Joint network predicts next token given encoder frame and previous tokens. Streamable. Used by Google's on-device ASR, NVIDIA Parakeet.
3. **Attention encoder-decoder.** Encoder compresses audio to hidden states, decoder cross-attends to generate tokens autoregressively. Used by Whisper, SeamlessM4T.

In 2026, SOTA WER on LibriSpeech test-clean is 1.4% (Parakeet-TDT-1.1B, NVIDIA) and 1.58% (Whisper-Large-v3-turbo). The differences are tiny; the deployment differences are huge.

## The Concept

![Three ASR formulations: CTC, RNN-T, attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC intuition.** Let the encoder output `T` frame-level distributions over `V+1` tokens (V chars + blank). For a target string `y` of length `U < T`, any frame alignment that collapses to `y` counts. CTC loss sums over all such alignments. Inference: per-frame argmax, collapse repeats, remove blanks.

Advantages: non-autoregressive, streamable, zero lookahead. Drawback: *conditional independence assumption* — each frame prediction is independent of the others, so there is no internal language model. Fix with an external LM via beam search or shallow fusion.

**RNN-T intuition.** Adds a *predictor* network that embeds the token history and a *joiner* that combines predictor state with encoder frame into a joint distribution over `V+1` (the `+1` is a null / no-emit). Explicitly models the conditional dependence CTC ignored. Streamable because each step conditions only on past frames and past tokens.

Advantages: streamable + internal LM. Drawback: training is more complex and memory-hungry (3D loss lattice); RNN-T loss kernels are a whole library category on their own.

**Attention encoder-decoder.** Encoder (6-32 transformer layers) over log-mel frames. Decoder (6-32 transformer layers) cross-attends to encoder outputs to generate tokens autoregressively. No alignment constraint — attention can look anywhere in the audio. Non-streamable unless you restrict attention (chunked Whisper-Streaming, 2024).

Advantages: highest quality on offline ASR, easy to train with standard seq2seq tooling. Drawback: autoregressive latency is proportional to output length; cannot stream without engineering.

### WER: the one number

**Word Error Rate** = `(S + D + I) / N`, where S=substitutions, D=deletions, I=insertions, N=reference word count. Matches Levenshtein edit distance at the word level. Lower is better. A WER above 20% is generally unusable; below 5% is human-parity for read speech. 2026 numbers on standard benchmarks:

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

All these are encoder-decoder or RNN-T based. Pure CTC systems (wav2vec 2.0) sit around 1.8–2.1% on test-clean.




## Further Reading

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) — the CTC paper.
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) — the RNN-T paper.
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) — the 2022 canonical paper; v3-turbo extension in 2024.
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) — 2026 Open ASR Leaderboard leader.
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) — live benchmark across 25+ models.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the signal-processing and modeling concepts behind Speech Recognition (ASR) — CTC, RNN-T, Attention.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the lesson's core audio operation from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect time-, frequency-, or token-domain intermediates produced by the pipeline.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the signal-processing and modeling concepts behind Speech Recognition (ASR) — CTC, RNN-T, Attention,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect time-, frequency-, or token-domain intermediates produced by the pipeline,” and cite a repeatable check rather than relying on visual inspection alone.
