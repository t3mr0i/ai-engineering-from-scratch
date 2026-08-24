# Parallel Tool Calls and Streaming with Tools

> Three independent weather lookups serialized is three round trips. Run them in parallel and total time collapses to the slowest single call. Every frontier provider now emits multiple tool calls in a single turn. The payoff is real; the plumbing is subtle. This lesson walks both halves: the parallel fan-out and the streamed-argument reassembly, with emphasis on the id-correlation trap.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 02 (function calling deep dive)
**Time:** ~75 minutes

## Learning Objectives

- Explain why `parallel_tool_calls: true` exists and when to disable it.
- Correlate streamed argument chunks to the right tool-call id during parallel fan-out.
- Reassemble partial `arguments` strings into complete JSON without parsing early.
- Run a three-city weather benchmark that demonstrates sequential vs parallel latency.

## The Problem

Without parallel calls, an agent answering "what is the weather in Bengaluru, Tokyo, and Zurich" does this:

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

Three LLM round trips, each of which also pays the executor latency. Roughly 4x the ideal wall-clock time.

With parallel calls:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

One LLM round trip. Executor time is the maximum of the three, not the sum. Production benchmarks on OpenAI, Anthropic, and Gemini show 60 to 70 percent wall-clock reduction on fan-out workloads.

The price is correlation complexity. When the three calls complete out of order, your results must carry the matching `tool_call_id` so the model can line them up. When results stream, you must assemble partial argument fragments into complete JSON before executing. Gemini 3 added unique ids in part to solve a real-world issue where two parallel calls to the same tool were indistinguishable.

## The Concept

### Enabling parallel

- **OpenAI.** `parallel_tool_calls: true` on by default. Set `false` to force serial.
- **Anthropic.** Parallel via `disable_parallel_tool_use: false` (default on Claude 3.5 and up). Set `true` for serial.
- **Gemini.** Always parallel-capable; `tool_config.function_calling_config.mode = "AUTO"` lets the model decide.

Disable parallel when tools have ordering dependencies (`create_file` then `write_file`), when one call's output informs another's input, or when the rate limiter cannot handle fan-out.

### Id correlation

Every call the model emits has an `id`. Every result the host returns must include the same id. Without this, results are ambiguous.

- **OpenAI.** `tool_call_id` on each tool-role message.
- **Anthropic.** `tool_use_id` on each `tool_result` block.
- **Gemini.** `id` on each `functionResponse` (Gemini 3 and up; Gemini 2 matched by name which broke for same-name parallel calls).

### Running calls concurrently

The host runs each call's executor on its own thread, coroutine, or remote worker. The simplest harness uses a thread pool; production uses asyncio with `asyncio.gather` or structured concurrency. Order of completion is unpredictable — the id is the identifier.

One common bug: reply with results in call-list order instead of completion order. This usually works because the model only cares about `tool_call_id`, but if a result is dropped or duplicated, out-of-order submission makes debugging harder. Prefer to reply in completion order with explicit ids.

### Streaming tool calls

When the model streams, `arguments` arrive in pieces. Three separate streams of chunks for three parallel calls interleave on the wire. You need one accumulator per id.

Shape by provider:

- **OpenAI.** Each chunk is `choices[0].delta.tool_calls[i].function.arguments` (partial string). The chunk carries `index` (position in the call list). You accumulate per-index, read `id` when it first appears, and parse JSON when `finish_reason = "tool_calls"`.
- **Anthropic.** Stream events are `message_start`, then one `content_block_start` per block with type `tool_use` (containing id, name, empty input). `content_block_delta` events carry `input_json_delta` chunks. `content_block_stop` closes each block.
- **Gemini.** `streamFunctionCallArguments` (Gemini 3 and up) emits chunks with a `functionCallId` so calls interleave cleanly. Before Gemini 3, streaming returned one complete call at a time.

### Partial JSON and the parse-early trap

You cannot parse `arguments` until it is complete. Partial JSON such as `{"city": "Beng` is not valid and will raise. The correct gate is the provider's end-of-call signal: OpenAI's `finish_reason = "tool_calls"`, Anthropic's `content_block_stop`, or Gemini's stream-end event. Only then attempt `json.loads`. A more robust approach uses an incremental JSON parser that yields events as structure completes; OpenAI's streaming guide recommends this for UX that shows a live "thinking" indicator. Brace-counting is unreliable as a completeness test (braces inside quoted strings or escaped content cause false positives) and should only be used as an informal debug heuristic.

### Out-of-order completion

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

The host reply must still cite the ids:

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

Order in the reply does not matter for correctness on OpenAI or Anthropic. Gemini accepts any order so long as ids match.

### Benchmark: sequential vs parallel

The harness in `code/main.py` simulates three executors with 400, 600, and 800 ms latency. Sequential runs it in 1800 ms total. Parallel runs it in max(400, 600, 800) = 800 ms. The difference is constant, not proportional, so the savings grow with tool count.

Real-world caveat: parallel calls stress downstream APIs. A 10-way fan-out to a rate-limited service will fail. Phase 13 · 17 covers gateway-level backpressure; retry semantics are planned for a future phase.

### Streaming fan-out wall-clock

If the model itself streams, you can start executing as soon as one call's arguments are complete, rather than waiting for all calls to finalize. This is an optimization OpenAI documents but not all SDKs expose. The harness in this lesson does it: as soon as the simulated stream yields a complete argument object, the host kicks off that call.



## Further Reading

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) — default behavior and the opt-out flag
- [Anthropic — Tool use: implementing tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implementing-tool-use) — `disable_parallel_tool_use` and result batching
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling) — id-correlated parallel calls from Gemini 3
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) — chunked argument reassembly for OpenAI streams
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming) — `content_block_delta` with `input_json_delta`

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain why `parallel_tool_calls: true` exists and when to disable it.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Correlate streamed argument chunks to the right tool-call id during parallel fan-out.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Reassemble partial `arguments` strings into complete JSON without parsing early.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain why `parallel_tool_calls: true` exists and when to disable it,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Reassemble partial `arguments` strings into complete JSON without parsing early,” and cite a repeatable check rather than relying on visual inspection alone.
