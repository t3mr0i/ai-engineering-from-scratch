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




## Further Reading

- [Pipecat docs](https://docs.pipecat.ai/getting-started/introduction) — frame-based pipeline, processors, transports
- [LiveKit Agents docs](https://docs.livekit.io/agents/) — WebRTC + voice primitives
- [Vapi](https://vapi.ai/) — managed voice platform
- [Retell AI](https://www.retellai.com/) — managed voice, latency-benchmarked

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Describe Pipecat's frame-based pipeline: DOWNSTREAM (source→sink) and UPSTREAM (control).
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Name the canonical voice pipeline stages and which transports Pipecat supports.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Explain LiveKit Agents' two voice agent classes (MultimodalAgent, VoicePipelineAgent) and when each fits.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Describe Pipecat's frame-based pipeline: DOWNSTREAM (source→sink) and UPSTREAM (control),” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Explain LiveKit Agents' two voice agent classes (MultimodalAgent, VoicePipelineAgent) and when each fits,” and cite a repeatable check rather than relying on visual inspection alone.
