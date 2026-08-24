# Real-Time Audio Processing

> Batch pipelines process a file. Real-time pipelines process the next 20 milliseconds before the next 20 arrive. Every conversational AI, broadcast studio, and telephony bot lives and dies by this latency budget.

**Type:** Build
**Languages:** Python, Rust
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 6 · 04 (ASR), Phase 6 · 07 (TTS)
**Time:** ~75 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Real-Time Audio Processing
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Real-Time Audio Processing

## The Problem

You want a voice assistant that feels alive. Human conversational turn-taking latency is ~230 ms (silence-to-response). Anything above 500 ms feels robotic; above 1500 ms feels broken. The budget for a full **hear → understand → respond → speak** loop in 2026 is:

| Stage | Budget |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

Moshi (Kyutai, 2024) clocked 200 ms full-duplex. GPT-4o-realtime (2024) clocks ~320 ms. Cascaded pipelines in 2022 shipped at 2500 ms. The 10× improvement came from three techniques: (1) streaming everywhere, (2) asynchronous pipelining with partial results, (3) interruptible generation.

## The Concept

![Streaming audio pipeline with ring buffer, VAD gate, interruption](../assets/real-time.svg)

**Frame / chunk / window.** Real-time audio flows as fixed-size blocks. Common choice: 20 ms (320 samples at 16 kHz). Everything downstream must keep up with this cadence.

**Ring buffer.** Fixed-size circular buffer. Producer thread writes new frames, consumer thread reads. Prevents allocations in the hot path. Size ≈ maximum-latency × sample-rate; a 2-second 16 kHz ring = 32,000 samples.

**VAD (Voice Activity Detection).** Gates downstream work when nobody is speaking. Silero VAD 4.0 (2024) runs <1 ms per 30 ms frame on CPU. `webrtcvad` is the older alternative.

**Streaming ASR.** Models that emit partial transcripts as audio arrives. Parakeet-CTC-0.6B in streaming mode (NeMo, 2024) does 2–5% WER at 320 ms latency. Whisper-Streaming (Macháček et al., 2023) chunks Whisper for near-streaming at ~2 s latency.

**Interruption.** When the user speaks while the assistant is talking, you must (a) detect the barge-in, (b) stop the TTS, (c) discard the remaining LLM output. All within 100 ms, or the user perceives deaf assistant.

**WebRTC Opus transport.** 20 ms frames, 48 kHz, adaptive bitrate 8–128 kbps. Standard for browser and mobile. LiveKit, Daily.co, Pion are the 2026 stacks for building voice apps.

**Jitter buffer.** Network packets arrive out of order / late. The jitter buffer reorders and smooths; too small → audible gaps, too large → latency. 60–80 ms typical.

### Common gotchas

- **Thread contention.** Python's GIL + heavy models can starve the audio thread. Use a C-callback audio library (sounddevice, PortAudio) and keep Python off the hot path.
- **Sample-rate conversion latency.** Resampling inside the pipeline adds 5–20 ms. Either resample upfront or use a zero-latency resampler (PolyPhase, `soxr_hq`).
- **TTS priming.** Even fast TTS like Kokoro has a 100–200 ms warm-up on first request. Cache model + warm it with a dummy run before the first real turn.
- **Echo cancellation.** Without AEC, TTS output re-enters the mic and triggers ASR on the bot's own voice. WebRTC AEC3 is the open-source default.




## Further Reading

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) — chunked near-streaming Whisper.
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) — full-duplex 200 ms latency.
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) — production audio agent orchestration.
- [Silero VAD repo](https://github.com/snakers4/silero-vad) — sub-1 ms VAD, Apache 2.0.
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) — echo cancellation under open source.
