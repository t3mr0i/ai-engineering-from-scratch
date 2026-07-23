# Audio Evaluation — WER, MOS, UTMOS, MMAU, FAD, and the Open Leaderboards

> You cannot ship what you cannot measure. This lesson names the 2026 metrics for every audio task: ASR (WER, CER, RTFx), TTS (MOS, UTMOS, SECS, WER-on-ASR-round-trip), audio-language (MMAU, LongAudioBench), music (FAD, CLAP), and speaker (EER). Plus the leaderboards where you compare.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## The Problem

Every audio task has multiple metrics, each measuring a different axis. Using the wrong metric is how you ship a model that looks great on your dashboard and terribly in production. The 2026 canonical list:

| Task | Primary | Secondary |
|------|---------|-----------|
| ASR | WER | CER · RTFx · first-token latency |
| TTS | MOS / UTMOS | SECS · WER-on-ASR-round-trip · CER · TTFA |
| Voice cloning | SECS (ECAPA cosine) | MOS · CER |
| Speaker verification | EER | minDCF · FAR / FRR at operating point |
| Diarization | DER | JER · speaker confusion |
| Audio classification | top-1 · mAP | macro F1 · per-class recall |
| Music generation | FAD | CLAP · listening panel MOS |
| Audio language model | MMAU-Pro | LongAudioBench · AudioCaps FENSE |
| Streaming S2S | latency P50/P95 | WER · MOS |

## The Concept

![Audio evaluation matrix — metrics vs tasks vs 2026 leaderboards](../assets/eval-landscape.svg)

### ASR metrics

**WER (Word Error Rate).** `(S + D + I) / N`. Lowercase, strip punctuation, normalize numbers before scoring. Use `jiwer` or OpenAI's `whisper_normalizer`. &lt; 5% = human-parity read speech.

**CER (Character Error Rate).** Same formula, character-level. Used for tone languages (Mandarin, Cantonese) where word segmentation is ambiguous.

**RTFx (inverse real-time factor).** Audio seconds processed per wall-clock second. Higher is better. Parakeet-TDT hits 3380×. Whisper-large-v3 is ~30×.

**First-token latency.** Wall-clock from audio input to first transcript token. Critical for streaming. Deepgram Nova-3: ~150 ms.

### TTS metrics

**MOS (Mean Opinion Score).** 1-5 human rating. Gold standard but slow. Collect 20+ listeners per sample, 100+ samples per model.

**UTMOS (2022-2026).** Learned MOS predictor. Correlates ~0.9 with human MOS on standard benchmarks. F5-TTS: UTMOS 3.95; ground truth: 4.08.

**SECS (Speaker Encoder Cosine Similarity).** For voice cloning. ECAPA embedding cosine between reference and cloned output. &gt; 0.75 = recognizable clone.

**WER-on-ASR-round-trip.** Run Whisper over TTS output, compute WER against the input text. Catches intelligibility regressions. 2026 SOTA: &lt; 2% CER.

**TTFA (time-to-first-audio).** Wall-clock latency. Kokoro-82M: ~100 ms; F5-TTS: ~1 s.

### Voice-cloning-specific

**SECS + MOS + CER** as a triple. Cloning that scores high SECS but low MOS means timbre-right-but-unnatural; the opposite means natural voice but wrong speaker.

### Speaker verification

**EER (Equal Error Rate).** The threshold where False Accept Rate equals False Reject Rate. ECAPA on VoxCeleb1-O: 0.87%.

**minDCF (min Detection Cost).** Weighted cost at a chosen operating point (often FAR=0.01). More production-relevant than EER.

### Diarization

**DER (Diarization Error Rate).** `(FA + Miss + Confusion) / total_speaker_time`. Missed speech + false-alarm speech + speaker-confusion, each as a fraction. AMI meetings: DER ~10-20% is realistic. pyannote 3.1 + Precision-2 commercial: &lt;10% DER on well-recorded audio.

**JER (Jaccard Error Rate).** Alternative to DER, robust to short-segment bias.

### Audio classification

Multi-label: **mAP (mean Average Precision)** over all classes. AudioSet: 0.548 mAP for BEATs-iter3.

Multi-class exclusive: **top-1, top-5 accuracy**. Speech Commands v2: 99.0% top-1 (Audio-MAE).

Imbalanced: **macro F1** + **per-class recall**. Report per-class — aggregate accuracy hides which classes fail.

### Music generation

**FAD (Fréchet Audio Distance).** Distance between VGGish-embedding distributions of real vs generated audio. MusicGen-small on MusicCaps: 4.5. MusicLM: 4.0. Lower better.

**CLAP Score.** Text-audio alignment score using CLAP embeddings. &gt; 0.3 = reasonable alignment.

**Listening panel MOS.** Still the final word for consumer-grade music. Suno v5 ELO 1293 on TTS Arena (from paired human preferences).

### Audio-language benchmarks

**MMAU (Massive Multi-Audio Understanding).** 10k audio-QA pairs.

**MMAU-Pro.** 1800 hard items, four categories: speech / sound / music / multi-audio. Random chance 25% on 4-way. Gemini 2.5 Pro overall ~60%; multi-audio ~22% across all models.

**LongAudioBench.** Multi-minute clips with semantic queries. Audio Flamingo Next beats Gemini 2.5 Pro.

**AudioCaps / Clotho.** Captioning benchmarks. SPICE, CIDEr, FENSE metrics.

### Streaming speech-to-speech

**Latency P50 / P95 / P99.** Wall-clock from end-of-user-speech to first audible response. Moshi: 200 ms; GPT-4o Realtime: 300 ms.

**WER / MOS** on the output.

**Barge-in responsiveness.** Time from user interrupt to assistant mute. Target &lt; 150 ms.

### The 2026 leaderboards

| Leaderboard | Tracks | URL |
|------------|--------|-----|
| Open ASR Leaderboard (HF) | English + multilingual + long-form | `huggingface.co/spaces/hf-audio/open_asr_leaderboard` |
| TTS Arena (HF) | English TTS | `huggingface.co/spaces/TTS-AGI/TTS-Arena` |
| Artificial Analysis Speech | TTS + STT, ELO from paired votes | `artificialanalysis.ai/speech` |
| MMAU-Pro | LALM reasoning | `mmaubenchmark.github.io` |
| SpeakerBench / VoxSRC | Speaker recognition | `voxsrc.github.io` |
| MMAU music subset | Music LALM | (within MMAU) |
| HEAR benchmark | Self-supervised audio | `hearbenchmark.com` |




## Further Reading

- [jiwer](https://github.com/jitsi/jiwer) — WER/CER library with normalization utilities.
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152) — learned MOS predictor.
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) — the music-gen standard.
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) — 2026 live rankings.
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) — human-vote TTS leaderboard.
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) — LALM reasoning leaderboard.
- [HEAR benchmark](https://hearbenchmark.com/) — audio SSL benchmarks.
