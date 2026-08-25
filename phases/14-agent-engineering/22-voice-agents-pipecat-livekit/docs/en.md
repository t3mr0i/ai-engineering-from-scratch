# Voice Agents: Pipecat and LiveKit

> Voice agents are a first-class production category in 2026. Pipecat gives you a Python frame-based pipeline (VAD → STT → LLM → TTS → transport). LiveKit Agents bridges AI models to users over WebRTC. Production latency targets land at 450–600ms end-to-end for premium stacks.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## Learning Objectives

- Describe Pipecat's frame-based pipeline: DOWNSTREAM (source→sink) and UPSTREAM (control).
- Name the canonical voice pipeline stages and which transports Pipecat supports.
- Explain LiveKit Agents' two voice agent classes (MultimodalAgent, VoicePipelineAgent) and when each fits.
- Summarize 2026 production latency expectations and how they drive architecture choices.

## The Problem

Voice agents are not a text loop with TTS bolted on. Latency budgets are brutal (~600ms), partial audio is the default, turn detection is a model, and transports range from telephony SIP to WebRTC. Either you build a frame-based pipeline (Pipecat) or you lean on a platform (LiveKit).

## The Concept

### Pipecat (pipecat-ai/pipecat)

- Python frame-based pipeline framework.
- `Frame` → `FrameProcessor` chain.
- Two flow directions:
  - **DOWNSTREAM** — source → sink (audio in, TTS out).
  - **UPSTREAM** — feedback and control (cancellation, metrics, barge-in).
- `PipelineTask` manages lifecycle with events (`on_pipeline_started`, `on_pipeline_finished`, `on_idle_timeout`) and observers for metrics/tracing/RTVI.

Typical pipeline:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

Transports: Daily, LiveKit, SmallWebRTCTransport, FastAPI WebSocket, WhatsApp.

Pipecat Flows adds structured conversations (state machines). Pipecat Cloud is the managed runtime.

### LiveKit Agents (livekit/agents)

- Bridges AI models to users over WebRTC.
- Key concepts: `Agent`, `AgentSession`, `entrypoint`, `AgentServer`.
- Two voice agent classes:
  - **MultimodalAgent** — direct audio via OpenAI Realtime or equivalent.
  - **VoicePipelineAgent** — STT → LLM → TTS cascade; gives text-level control.
- Semantic turn detection via a transformer model.
- Native MCP integration.
- Telephony via SIP.
- 50+ models with no API keys via LiveKit Inference; 200+ more via plugins.

### Commercial platforms

Vapi (~450–600ms on an optimized premium stack) and Retell (~600ms end-to-end across 180 test calls) build on top of these. Pick a platform when you want a managed voice stack without a WebRTC team.

### Where this pattern goes wrong

- **No barge-in handling.** User interrupts; agent keeps talking. Requires UPSTREAM cancel frames in Pipecat, equivalent in LiveKit.
- **STT confidence ignored.** Low-confidence transcripts fed to the LLM as if gospel. Gate on confidence or request confirmation.
- **TTS mid-sentence cutoff.** When the pipeline cancels mid-utterance, TTS needs to know or cut audio.
- **Latency budget ignored.** Every component adds 50–200ms. Sum your chain before shipping.

### Typical 2026 latencies

- VAD: 20–60ms
- STT partial: 100–250ms
- LLM first token: 150–400ms
- TTS first audio: 100–200ms
- Transport RTT: 30–80ms

End-to-end 450–600ms is premium. 800–1200ms is common. Anything > 1500ms feels broken.




## Build It

Reconstruct **Voice Agents: Pipecat and LiveKit** by following `Frame` on a 160-sample 16 kHz waveform. Run `python3 main.py` and verify that the duration/frame count is zero or the documented validation path is used; no plausible speech label should be fabricated.

## Use It

Call `Frame` from a small caller with a 160-sample 16 kHz waveform. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-voice-pipeline.md` with the command `python3 main.py`, the accepted input shape (a 160-sample 16 kHz waveform), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Pipecat docs](https://docs.pipecat.ai/getting-started/introduction) — frame-based pipeline, processors, transports
- [LiveKit Agents docs](https://docs.livekit.io/agents/) — WebRTC + voice primitives
- [Vapi](https://vapi.ai/) — managed voice platform
- [Retell AI](https://www.retellai.com/) — managed voice, latency-benchmarked

## Exercises

Keep two runs side by side for **Voice Agents: Pipecat and LiveKit**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using a 160-sample 16 kHz waveform. Follow `Frame`, `Processor`, `process`. Expect the duration/frame count is zero or the documented validation path is used; no plausible speech label should be fabricated; capture the first printed shape, metric, status, or summary field and state which part supports **Describe Pipecat's frame-based pipeline: DOWNSTREAM (source→sink) and UPSTREAM (control).**.
2. **Run a two-value comparison.** Repeat the command after changing only the waveform amplitude: use the same waveform with its amplitude halved. Predict the direction of the change, then compare the two output values. Explain why **Name the canonical voice pipeline stages and which transports Pipecat supports.** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation an empty waveform (zero samples). Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain LiveKit Agents' two voice agent classes (MultimodalAgent, VoicePipelineAgent) and when each fits.** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-voice-pipeline.md` and add a worked example using a 160-sample 16 kHz waveform. Include the input contract, one expected output field, and a named acceptance check for **Summarize 2026 production latency expectations and how they drive architecture choices.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Voice Agents: Pipecat and LiveKit** should contain:

- the `python3 main.py` output for a 160-sample 16 kHz waveform, with `Frame`, `Processor`, `process` traced to the value or shape that supports **Describe Pipecat's frame-based pipeline: DOWNSTREAM (source→sink) and UPSTREAM (control).**;
- a before/after comparison for the waveform amplitude, where the same waveform with its amplitude halved changes the observation in the direction predicted by **Name the canonical voice pipeline stages and which transports Pipecat supports.**;
- a recorded result for an empty waveform (zero samples) that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain LiveKit Agents' two voice agent classes (MultimodalAgent, VoicePipelineAgent) and when each fits.**; and
- an updated `outputs/skill-voice-pipeline.md` example with a concrete input, expected output field, and acceptance check tied to **Summarize 2026 production latency expectations and how they drive architecture choices.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
