# Long-Video Understanding at Million-Token Context

> A 1-hour 4K video at 24 FPS, patched and embedded, produces on the order of 60 million tokens. A 2-hour podcast episode transcribed is 30,000 tokens. A full Blu-ray feature film, even compressed with aggressive pooling, is hundreds of thousands of tokens. Google's Gemini 1.5 (March 2024) opened this era with a 10-million-token context, doing reliable needle-in-a-haystack recall over hour-long videos. LWM (Liu et al., February 2024) showed ring attention's scaling path. LongVILA and Video-XL scaled ingestion further. VideoAgent swapped raw context for agentic retrieval. Each approach is a different trade-off on compute, recall, and engineering complexity. This lesson reads them side by side.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 12 · 17 (video temporal tokens)
**Time:** ~180 minutes

## Learning Objectives

- Compute total visual-token counts for long-form video at varying FPS and pooling.
- Explain the three scaling paths: brute context (Gemini 1.5), ring attention (LWM), token compression (LongVILA / Video-XL).
- Compare raw-context video VLMs vs agentic-retrieval video VLMs (VideoAgent) on accuracy and latency.
- Design a needle-in-a-haystack test for a 30-minute video and measure recall at a specific minute.

## The Problem

A single frame of Qwen2.5-VL-sized patches at 384 native resolution is ~729 tokens. At 3x3 pooling that's 81 tokens per frame. A 30-minute clip at 1 FPS = 1800 frames = 145,800 tokens. Doable by 2025 open VLMs, tight. At 2 FPS, 291,600 tokens — only the biggest contexts fit.

A 2-hour movie at 1 FPS is 583k tokens. Beyond most 2026 open models; requires Gemini 2.5 Pro or pooling more aggressively.

Three scaling paths emerged.

## The Concept

### Path 1: Brute context (Gemini 1.5, Claude Opus)

Throw hardware at the problem. Scale context to millions of tokens, process everything in one forward pass.

Gemini 1.5 Pro launched with 1M tokens; Gemini 1.5 Ultra to 10M; Gemini 2.5 Pro in 2026 does hours of video reliably. The paper (arXiv:2403.05530) documents needle-in-a-haystack recall at 99.7% up to ~9.5M tokens.

Engineering: a custom attention implementation with memory hierarchy (local + global + sparse) plus MoE expert routing for long-context efficiency. Not published in full detail. Not open-source.

### Path 2: Ring attention (LWM, LongVILA)

Ring attention distributes long sequences across devices in a "ring" where each device holds a chunk. Attention across the full sequence happens by each device sending its chunk to the next in a ring pattern, computing partial attention, and aggregating.

LWM (Liu et al., 2024) trained a 1M-token context model this way. Training compute scales linearly with context, not quadratically — the quadratic hit on attention is amortized across the ring's devices.

LongVILA (arXiv:2408.10188) adapted the pattern to VLMs. 1400-frame videos at 192 tokens per frame = 268k context, trained with ring attention across 8-way parallelism.

### Path 3: Token compression (Video-XL, LongVA)

Cheaper than brute context: compress aggressively before the LLM sees the sequence.

Video-XL (arXiv:2409.14485) uses a visual summary token: each clip of N frames produces a single "summary" token that attends over the N. At inference, the LLM sees one summary token per clip, drastically shrinking the context.

LongVA extends LLM context from 200k to 2M with a "long context transfer" technique. Train on long-context text, transfer to long-context video via shared representation.

Token compression trades off recall at specific timestamps for scalability. The model knows generally what happened but sometimes misses exact frames.

### Path 4: Agentic retrieval (VideoAgent)

Do not feed the full video to the LLM. Instead, treat the video as a database and use an LLM to query it.

VideoAgent (arXiv:2403.10517):

1. LLM reads the question.
2. LLM asks a retrieval tool for relevant clips ("show me segments with a cat").
3. Tool returns matching clip timestamps.
4. LLM reads those clips via a VLM.
5. LLM composes the answer or asks follow-up queries.

This is the LLM-as-agent pattern applied to long video. Cheaper inference (only relevant clips encoded), harder engineering (retrieval quality becomes the bottleneck).

### Needle-in-a-haystack benchmarks

The standard long-context test: insert a unique visual or textual marker at a random point in the video, then ask a query that requires recalling it.

Metric: Recall@k across video length and marker position.

Gemini 2.5 Pro scores >99% recall at up to 90-minute videos. Open 72B models (Qwen2.5-VL-72B, InternVL3-78B) score ~85-90% at 30 minutes and degrade past 60.

VideoAgent can match or beat raw-context models at 2+ hours because retrieval hits the needle if the tool is good.

### Which path to pick

For a 15-minute clip at frontier accuracy: open 72B + native context usually works. Pick Qwen2.5-VL-72B.

For 30-minute to 1-hour content: LongVILA or Video-XL for open; Gemini 2.5 Pro for closed. The quality bar matters — frontier goes closed.

For 2+ hour content: VideoAgent or similar retrieval patterns. Alternatively, summarize to smaller chunks and feed hierarchical summaries.

### 2026 production pattern

In practice, production long-video pipelines are hybrid:

1. Run dynamic-FPS sampling + aggressive pooling on the entire video (get a 100k-token global representation).
2. Pass to a 72B VLM for a global summary.
3. If user asks detailed questions, run agentic retrieval using the summary as an index.

This combines brute-context for global understanding and retrieval for local detail.



## Build It

Reconstruct **Long-Video Understanding at Million-Token Context** by following `tokens` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `tokens` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-long-video-strategy-planner.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Gemini Team — Gemini 1.5 (arXiv:2403.05530)](https://arxiv.org/abs/2403.05530)
- [Liu et al. — LWM / RingAttention (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Xue et al. — LongVILA (arXiv:2408.10188)](https://arxiv.org/abs/2408.10188)
- [Shu et al. — Video-XL (arXiv:2409.14485)](https://arxiv.org/abs/2409.14485)
- [Wang et al. — VideoAgent (arXiv:2403.10517)](https://arxiv.org/abs/2403.10517)

## Exercises

Keep two runs side by side for **Long-Video Understanding at Million-Token Context**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `tokens`, `budget_table`, `Needle`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Compute total visual-token counts for long-form video at varying FPS and pooling.**.
2. **Run a two-value comparison.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Explain the three scaling paths: brute context (Gemini 1.5), ring attention (LWM), token compression (LongVILA / Video-XL).** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Compare raw-context video VLMs vs agentic-retrieval video VLMs (VideoAgent) on accuracy and latency.** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-long-video-strategy-planner.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Design a needle-in-a-haystack test for a 30-minute video and measure recall at a specific minute.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Long-Video Understanding at Million-Token Context** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `tokens`, `budget_table`, `Needle` traced to the value or shape that supports **Compute total visual-token counts for long-form video at varying FPS and pooling.**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Explain the three scaling paths: brute context (Gemini 1.5), ring attention (LWM), token compression (LongVILA / Video-XL).**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Compare raw-context video VLMs vs agentic-retrieval video VLMs (VideoAgent) on accuracy and latency.**; and
- an updated `outputs/skill-long-video-strategy-planner.md` example with a concrete input, expected output field, and acceptance check tied to **Design a needle-in-a-haystack test for a 30-minute video and measure recall at a specific minute.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
