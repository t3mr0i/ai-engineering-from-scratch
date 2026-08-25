# Capstone 03 — Real-Time Voice Assistant (ASR to LLM to TTS)

> A voice agent that feels right has end-to-end latency under 800ms, knows when you have stopped talking, handles barge-in, and can call a tool without stalling. Retell, Vapi, LiveKit Agents, and Pipecat all hit this bar in 2026. They do it with the same shape: a streaming ASR, a turn-detector, a streaming LLM, and a streaming TTS, all wired through WebRTC with aggressive latency budgets at every hop. Build one, measure WER and MOS and false-cutoff rate, and run it under packet loss.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 (speech and audio), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 17 (infrastructure)
**Phases exercised:** P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 hours

## Learning Objectives

- Define measurable acceptance criteria for Capstone 03 — Real-Time Voice Assistant (ASR to LLM to TTS)
- Integrate the required components into one self-terminating workflow
- Exercise happy paths, edge cases, and failure recovery with reproducible fixtures
- Package the verified result as a reusable curriculum artifact

## Problem

Voice has been the fastest-moving AI UX category of 2025-2026. The technical ceiling dropped each quarter. OpenAI Realtime API, Gemini 2.5 Live, Cartesia Sonic-2, ElevenLabs Flash v3, LiveKit Agents 1.0, and Pipecat 0.0.70 all put sub-800ms first-audio-out within reach. The bar is not latency alone. It is the interaction feel: not cutting the user off, not getting cut off, recovering from a mid-sentence interruption, calling a tool mid-conversation without stalling the audio, surviving jittery mobile networks.

You cannot get there by stitching three REST calls. The architecture is pipelined streaming end to end. Build it and the failure modes become visible: a VAD tuned for phone audio firing on background TV, a turn-detector waiting for punctuation that never comes, a TTS that buffers 400ms before emitting. The capstone is to fix these one at a time under load and publish a latency-and-quality report.

## Concept

The pipeline has five streaming stages: **audio in** (WebRTC from browser or PSTN), **ASR** (streaming partial transcripts from Deepgram Nova-3 or faster-whisper), **turn detection** (VAD plus a small turn-detector model that reads partial transcripts for completion cues), **LLM** (streaming tokens as soon as the turn is judged complete), **TTS** (streaming audio out within ~200ms of the first LLM token).

Three cross-cutting concerns. **Barge-in**: when the user starts speaking while the agent is speaking, the TTS cancels and the ASR picks up immediately. **Tool use**: mid-conversation function calls (weather, calendar) must run on a side channel without stalling the audio; the agent pre-fills an acknowledgement token ("one second...") if latency exceeds 300ms. **Backpressure**: under packet loss, partial transcripts are held, VAD raises the speech-gate threshold, and the agent avoids speaking over an unacknowledged message.

The measurement bar is quantitative. WER under 8% on the Hamming VAD benchmark at 15 dB SNR. First-audio-out p50 under 800ms on 100 measured calls. False-cutoff rate under 3%. MOS above 4.2 on TTS. 50 concurrent calls on a single g5.xlarge. These numbers are the deliverable.

## Architecture

```
browser / Twilio PSTN
        |
        v
   WebRTC / SIP edge
        |
        v
  LiveKit Agents 1.0  (or Pipecat 0.0.70)
        |
   +----+--------------+--------------+-----------------+
   |                   |              |                 |
   v                   v              v                 v
  ASR              VAD v5         turn-detector     side-channel
(Deepgram         (Silero)          (LiveKit)        tools
 Nova-3 /         speech-gate    completion score    (weather,
 Whisper-v3)      per 20ms        on partials        calendar)
   |                   |              |
   +--------+----------+--------------+
            v
        LLM (streaming)
     GPT-4o-realtime / Gemini 2.5 Flash /
     cascaded Claude Haiku 4.5
            |
            v
        TTS streaming
     Cartesia Sonic-2 / ElevenLabs Flash v3
            |
            v
     audio back to caller
            |
            v
   OpenTelemetry voice traces -> Langfuse
```

## Stack

- Transport: LiveKit Agents 1.0 (WebRTC) plus Twilio PSTN gateway; Pipecat 0.0.70 as the alternate framework
- ASR: Deepgram Nova-3 (streaming, sub-300ms first partial) or faster-whisper Whisper-v3-turbo self-hosted
- VAD: Silero VAD v5 plus the LiveKit turn-detector (small transformer that reads partial transcripts)
- LLM: OpenAI GPT-4o-realtime for tight integration, Gemini 2.5 Flash Live, or cascaded Claude Haiku 4.5 (streaming completions, separate audio path)
- TTS: Cartesia Sonic-2 (lowest first-byte), ElevenLabs Flash v3, or open-source Orpheus for self-host
- Tools: FastMCP side-channel for weather/calendar/booking; agent pre-emits filler if tool takes >300ms
- Observability: OpenTelemetry voice spans, Langfuse voice traces with audio replay
- Deployment: single g5.xlarge (24GB VRAM) for self-hosted Whisper + Orpheus; hosted APIs for lowest latency




## Build It

Reconstruct **Capstone 03 — Real-Time Voice Assistant (ASR to LLM to TTS)** by following `Frame` on a 160-sample 16 kHz waveform. Run `python3 main.py` and verify that the duration/frame count is zero or the documented validation path is used; no plausible speech label should be fabricated.

## Use It

Call `Frame` from a small caller with a 160-sample 16 kHz waveform. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-voice-agent.md` with the command `python3 main.py`, the accepted input shape (a 160-sample 16 kHz waveform), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [LiveKit Agents 1.0](https://github.com/livekit/agents) — reference WebRTC agent framework
- [Pipecat](https://github.com/pipecat-ai/pipecat) — alternate Python-first streaming agent framework
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) — reference for integrated speech models
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) — streaming ASR reference
- [Silero VAD v5](https://github.com/snakers4/silero-vad) — VAD reference model
- [Cartesia Sonic-2](https://docs.cartesia.ai) — low-latency TTS reference
- [Retell AI architecture](https://docs.retellai.com) — production voice agent architecture
- [Vapi.ai production stack](https://docs.vapi.ai) — alternate production reference

## Exercises

Work from the smallest fixture that the Capstone 03 — Real-Time Voice Assistant (ASR to LLM to TTS) demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using a 160-sample 16 kHz waveform. Follow `Frame`, `synth_call`, `turn_completion_score`. Expect the duration/frame count is zero or the documented validation path is used; no plausible speech label should be fabricated; capture the first printed shape, metric, status, or summary field and state which part supports **Define measurable acceptance criteria for Capstone 03 — Real-Time Voice Assistant (ASR to LLM to TTS)**.
2. **Perturb one field.** Repeat the command after changing only the waveform amplitude: use the same waveform with its amplitude halved. Predict the direction of the change, then compare the two output values. Explain why **Integrate the required components into one self-terminating workflow** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty waveform (zero samples). Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Exercise happy paths, edge cases, and failure recovery with reproducible fixtures** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-voice-agent.md` and add a worked example using a 160-sample 16 kHz waveform. Include the input contract, one expected output field, and a named acceptance check for **Package the verified result as a reusable curriculum artifact**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Capstone 03 — Real-Time Voice Assistant (ASR to LLM to TTS)** should contain:

- the `python3 main.py` output for a 160-sample 16 kHz waveform, with `Frame`, `synth_call`, `turn_completion_score` traced to the value or shape that supports **Define measurable acceptance criteria for Capstone 03 — Real-Time Voice Assistant (ASR to LLM to TTS)**;
- a before/after comparison for the waveform amplitude, where the same waveform with its amplitude halved changes the observation in the direction predicted by **Integrate the required components into one self-terminating workflow**;
- a recorded result for an empty waveform (zero samples) that matches the implementation’s validation or empty-result contract and explains the evidence for **Exercise happy paths, edge cases, and failure recovery with reproducible fixtures**; and
- an updated `outputs/skill-voice-agent.md` example with a concrete input, expected output field, and acceptance check tied to **Package the verified result as a reusable curriculum artifact**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
