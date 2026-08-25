# Production Runtimes: Queue, Event, Cron

> Production agents run on six runtime shapes: request-response, streaming, durable execution, queue-based background, event-driven, and scheduled. Pick the shape before you pick the framework. Observability is load-bearing at every shape.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 22 (Voice)
**Time:** ~60 minutes

## Learning Objectives

- Name the six production runtime shapes and match each to a framework / product pattern.
- Explain why durable execution (LangGraph) matters for long-horizon tasks.
- Describe the event-driven runtime and when Claude Managed Agents fits.
- Explain the observability-as-load-bearing claim for multi-step agents.

## The Problem

Production agents fail in ways a Jupyter notebook doesn't surface: network timeouts at step 37, user hangs up mid-voice call, cron job dies on machine reboot, background worker runs out of memory. The runtime shape determines which failures are survivable.

## The Concept

### Request-response

- Synchronous HTTP. User waits for completion.
- Only viable for short tasks (<30s).
- Stacks: Agno (Python + FastAPI), Mastra (TypeScript + Express/Hono/Fastify/Koa).
- Observability: standard HTTP access logs + OTel spans.

### Streaming

- SSE or WebSocket for progressive output.
- LiveKit extends this to WebRTC for voice/video (Lesson 22).
- Stacks: any framework with streaming support + a frontend that handles SSE/WS.
- Observability: per-chunk timing, first-token latency, tail latency.

### Durable execution

- State checkpointed after every step; auto-resumes on failure.
- AutoGen v0.4 actor model isolates failures to one agent (Lesson 14).
- LangGraph's core differentiator (Lesson 13).
- Essential when step count is unknown and recovery cost is high.

### Queue-based / background

- Job enters a queue, workers pick up, results flow back via webhooks or pub/sub.
- Essential for long-horizon agents (dozens-to-hundreds of steps per task, per Anthropic's computer use announcement).
- Stacks: Celery (Python), BullMQ (Node), SQS + Lambda (AWS), custom.
- Observability: queue depth, per-job latency distribution, DLQ size.

### Event-driven

- Agents subscribe to triggers: new email, PR opened, cron fire.
- Claude Managed Agents covers this out of the box (Lesson 17).
- CrewAI Flows (Lesson 15) structures event-driven deterministic workflows.
- Observability: trigger source, event-to-start latency, agent latency.

### Scheduled

- Cron-shaped agents that run periodically.
- Combine with durable execution so a failing nightly run resumes next tick.
- Stacks: Kubernetes CronJob + a durable framework; hosted (Render cron, Vercel cron).

### 2026 deployment patterns

- **CrewAI Flows** for event-driven production.
- **Agno** stateless FastAPI for Python microservices.
- **Mastra** server adapters (Express, Hono, Fastify, Koa) for embedding.
- **Pipecat Cloud / LiveKit Cloud** for managed voice (Lesson 22).
- **Claude Managed Agents** for hosted long-running async.

### Observability is load-bearing

Without OpenTelemetry GenAI spans (Lesson 23) plus a Langfuse/Phoenix/Opik backend (Lesson 24), you cannot debug a multi-step agent that failed at step 40. This is not optional for production. It's the difference between "we debug fast" and "we replay from scratch with more logging."

### Where production runtimes fail

- **Wrong shape choice.** Picking request-response for a 5-minute task. Users hang up; workers pile up; retries compound.
- **No DLQ.** Queue workers without dead-letter. Failed jobs vanish.
- **Opaque background work.** Background agent runs without trace export. Failures are invisible until the user reports them.
- **Skipping durable state.** Any run > 30 seconds where you can't afford to restart needs durable execution.




## Build It

Reconstruct **Production Runtimes: Queue, Event, Cron** by following `request_response` on a graph with edges (0,1) and (1,2). Run `python3 main.py` and verify that degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly.

## Use It

Call `request_response` from a small caller with a graph with edges (0,1) and (1,2). Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-runtime-shape.md` with the command `python3 main.py`, the accepted input shape (a graph with edges (0,1) and (1,2)), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — durable execution details
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — hosted long-running async
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) — "dozens-to-hundreds of steps per task"
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — actor-model fault isolation

## Exercises

Work from the smallest fixture that the Production Runtimes: Queue, Event, Cron demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using a graph with edges (0,1) and (1,2). Follow `request_response`, `streaming`, `Job`. Expect degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly; capture the first printed shape, metric, status, or summary field and state which part supports **Name the six production runtime shapes and match each to a framework / product pattern.**.
2. **Perturb one field.** Repeat the command after changing only the edge list: use the same graph with an isolated node 3. Predict the direction of the change, then compare the two output values. Explain why **Explain why durable execution (LangGraph) matters for long-horizon tasks.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation a graph with no edges. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe the event-driven runtime and when Claude Managed Agents fits.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-runtime-shape.md` and add a worked example using a graph with edges (0,1) and (1,2). Include the input contract, one expected output field, and a named acceptance check for **Explain the observability-as-load-bearing claim for multi-step agents.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Production Runtimes: Queue, Event, Cron** should contain:

- the `python3 main.py` output for a graph with edges (0,1) and (1,2), with `request_response`, `streaming`, `Job` traced to the value or shape that supports **Name the six production runtime shapes and match each to a framework / product pattern.**;
- a before/after comparison for the edge list, where the same graph with an isolated node 3 changes the observation in the direction predicted by **Explain why durable execution (LangGraph) matters for long-horizon tasks.**;
- a recorded result for a graph with no edges that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe the event-driven runtime and when Claude Managed Agents fits.**; and
- an updated `outputs/skill-runtime-shape.md` example with a concrete input, expected output field, and acceptance check tied to **Explain the observability-as-load-bearing claim for multi-step agents.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
