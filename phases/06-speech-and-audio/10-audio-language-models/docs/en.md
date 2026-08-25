# Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio

> 2026 audio-language models reason over speech + environmental sound + music. Qwen2.5-Omni-7B matches GPT-4o Audio on MMAU-Pro. Audio Flamingo Next beats Gemini 2.5 Pro on LongAudioBench. The gap between open and closed is essentially closed — except on multi-audio tasks, where everyone is near random.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 minutes

## Learning Objectives

- Explain the signal-processing and modeling concepts behind Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio
- Implement the lesson's core audio operation from first principles
- Inspect time-, frequency-, or token-domain intermediates produced by the pipeline
- Evaluate quality, latency, and robustness trade-offs for Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio

## The Problem

You have 5 seconds of audio: dog barks, someone yells "stop!", then silence. Useful questions span multiple axes:

- **Transcription.** "What was said?" — ASR territory.
- **Semantic reasoning.** "Is the person in danger?" — requires joint understanding of the bark + yell + silence.
- **Music reasoning.** "What instruments play the melody?"
- **Long-audio retrieval.** "Where in this 90-minute lecture did the instructor explain gradient descent?"

A single model that answers all of these with one prompt is an **audio-language model** (LALM / ALM). Separate from pure ASR: LALMs produce free-form natural-language answers, not just transcripts.

## The Concept

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### The three-component template

Every 2026 LALM has the same skeleton:

1. **Audio encoder.** Whisper encoder · BEATs · CLAP · WavLM · or a custom encoder per model.
2. **Projector.** Linear or MLP bridging audio-encoder features into the LLM's token embedding space.
3. **LLM.** Llama / Qwen / Gemma-based decoder. Takes interleaved text + audio tokens; generates text.

Training:

- **Stage 1.** Freeze encoder + LLM; train projector only on ASR / captioning data.
- **Stage 2.** Full / LoRA fine-tune on instruction-following audio tasks (QA, reasoning, music understanding).
- **Stage 3 (optional).** Voice-in / voice-out adds a speech decoder. Qwen2.5-Omni and AF3-Chat do this.

### The 2026 model map

| Model | Backbone | Audio encoder | Output modality | Access |
|-------|----------|---------------|-----------------|--------|
| Qwen2.5-Omni-7B | Qwen2.5-7B | Custom + Whisper | text + speech | Apache-2.0 |
| Qwen3-Omni | Qwen3 | Custom | text + speech | Apache-2.0 |
| Audio Flamingo 3 | Qwen2 | AF-CLAP | text | NVIDIA non-commercial |
| Audio Flamingo Next | Qwen2 | AF-CLAP v2 | text | NVIDIA non-commercial |
| SALMONN | Vicuna | Whisper + BEATs | text | Apache-2.0 |
| LTU / LTU-AS | Llama | CAV-MAE | text | Apache-2.0 |
| GAMA | Llama | AST + Q-Former | text | Apache-2.0 |
| Gemini 2.5 Flash/Pro (closed) | Gemini | proprietary | text + speech | API |
| GPT-4o Audio (closed) | GPT-4o | proprietary | text + speech | API |

### Benchmark reality check (2026)

**MMAU-Pro.** 1800 QA pairs covering speech / sound / music / mixed. Multi-audio subset included.

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | SOTA on LongAudioBench | — | — | — | — |

The **multi-audio column is damning for everyone.** Random chance on 4-option multiple choice = 25%; most models score around there. LALMs still struggle to compare two clips.

### Where LALMs are useful in 2026

- **Compliance audit of call-center recordings.** "Did the agent mention the required disclosure?"
- **Accessibility.** Describe sound events to deaf users (not just transcription).
- **Content moderation.** Detect violent language + threatening tone + background context.
- **Podcast / meeting chaptering.** Semantic summary, not just speaker turns.
- **Music catalog analysis.** "Find all tracks with a B-section key change."

### Where they are NOT (yet) useful

- Fine-grained music theory (below chord-level).
- Speaker-attributed reasoning over long conversations (degrades past 10 minutes).
- Multi-audio comparison (22-26% is barely above random).
- Real-time streaming reasoning (most are offline batch inference).




## Build It

Reconstruct **Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio** by following `fake_audio_encoder` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `fake_audio_encoder` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-alm-picker.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Chu et al. (2024). Qwen2-Audio](https://arxiv.org/abs/2407.10759) — reference architecture.
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) — speech-in-speech-out.
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) — the open long-audio leader.
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) — LongAudioBench SOTA.
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) — dual-encoder pioneer.
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/) — live 2026 rankings.

## Exercises

Use `fake_audio_encoder` as the trace: start from tokens=["red","fox"], keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `fake_audio_encoder`, `projector`, `interleave_with_text`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the signal-processing and modeling concepts behind Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio**.
2. **Vary one named input.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Implement the lesson's core audio operation from first principles** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect time-, frequency-, or token-domain intermediates produced by the pipeline** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-alm-picker.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Evaluate quality, latency, and robustness trade-offs for Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `fake_audio_encoder`, `projector`, `interleave_with_text` traced to the value or shape that supports **Explain the signal-processing and modeling concepts behind Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Implement the lesson's core audio operation from first principles**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect time-, frequency-, or token-domain intermediates produced by the pipeline**; and
- an updated `outputs/skill-alm-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate quality, latency, and robustness trade-offs for Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
