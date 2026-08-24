# Build a Voice Assistant Pipeline — The Phase 6 Capstone

> Everything from lessons 01-11, stitched together. Build a voice assistant that listens, reasons, and talks back. In 2026 that is a solved engineering problem, not a research problem — but the integration details decide whether it ships.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 05, 06, 07, 11; Phase 11 · 09 (Function Calling); Phase 14 · 01 (Agent Loop)
**Time:** ~120 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Build a Voice Assistant Pipeline — The Phase 6 Capstone
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Build a Voice Assistant Pipeline — The Phase 6 Capstone

## The Problem

Build an end-to-end assistant:

1. Captures mic input (16 kHz mono).
2. Detects start/end of user speech.
3. Transcribes streaming.
4. Passes transcript to an LLM that can call tools (timer, weather, calendar).
5. Streams LLM text to a TTS.
6. Plays audio back to the user.
7. Stops if the user interrupts mid-response.

Latency target: first TTS audio byte within 800 ms of the user finishing their utterance on a laptop CPU. Quality target: no missed words, no hallucinated subtitles on silence, no voice cloning leakage, no prompt injection success.

## The Concept

![Voice assistant pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### The seven components

1. **Audio capture.** Mic → 16 kHz mono → 20 ms chunks. Usually `sounddevice` in Python or native AudioUnit/ALSA/WASAPI in production.
2. **VAD (Lesson 11).** Silero VAD @ threshold 0.5, min speech 250 ms, silence hang-over 500 ms. Signals "start" and "end."
3. **Streaming STT (Lesson 4-5).** Whisper-streaming, Parakeet-TDT, or Deepgram Nova-3 (API). Partial + final transcripts.
4. **LLM with tool calling.** GPT-4o / Claude 3.5 / Gemini 2.5 Flash. JSON schema for tools. Stream tokens.
5. **Streaming TTS (Lesson 7).** Kokoro-82M (fastest open) or Cartesia Sonic (commercial). Start TTS after 20 LLM tokens.
6. **Playback.** Speaker out; opus-encode for low-bandwidth networks.
7. **Interruption handler.** If VAD fires during TTS playback, stop playback, cancel LLM, restart STT.

### The three failure modes you will hit

1. **First-word clip.** VAD starts a beat too late. User's "hey" is missing. Start threshold at 0.3, not 0.5.
2. **Mid-response interrupt confusion.** LLM keeps generating after user interrupts; assistant talks over user. Wire VAD → cancel-LLM.
3. **Silence hallucination.** Whisper outputs "Thanks for watching" on the silent warm-up frames. Always VAD-gate.

### 2026 production reference stacks

| Stack | Latency | License | Notes |
|-------|---------|---------|-------|
| LiveKit + Deepgram + GPT-4o + Cartesia | 350-500 ms | commercial API | Industry default 2026 |
| Pipecat + Whisper-streaming + GPT-4o + Kokoro | 500-800 ms | mostly open | DIY-friendly |
| Moshi (full-duplex) | 200-300 ms | CC-BY 4.0 | Single-model; different architecture, lesson 15 |
| Vapi / Retell (managed) | 300-500 ms | commercial | Fastest to launch; limited customization |
| Whisper.cpp + llama.cpp + Kokoro-ONNX | offline | open | Privacy / edge |




## Further Reading

- [LiveKit — voice agent quickstart](https://docs.livekit.io/agents/) — production-grade reference.
- [Pipecat — voice agent examples](https://github.com/pipecat-ai/pipecat) — DIY-friendly framework.
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) — the managed voice-native path.
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) — full-duplex reference (Lesson 15).
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/) — wake-word gating.
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — LLM function calling.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the signal-processing and modeling concepts behind Build a Voice Assistant Pipeline — The Phase 6 Capstone.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the lesson's core audio operation from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect time-, frequency-, or token-domain intermediates produced by the pipeline.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the signal-processing and modeling concepts behind Build a Voice Assistant Pipeline — The Phase 6 Capstone,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect time-, frequency-, or token-domain intermediates produced by the pipeline,” and cite a repeatable check rather than relying on visual inspection alone.
