# Pipeline Parallel and Bubble Analysis

> Tensor parallelism splits the matrix multiply across ranks. Pipeline parallelism splits the model across ranks, one stage per rank. Microbatches flow through the pipeline. The empty time at the start and end is the bubble; minimising it is the whole craft.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 min

## Learning Objectives

- Split a sequential model into N stages and simulate a forward pipeline across N ranks.
- Schedule M microbatches through the pipeline using the GPipe schedule (forward-only fill, then backward) and compute the bubble fraction.
- Compare bubble against the interleaved 1F1B schedule used in Megatron-LM and PipeDream.
- Defend stage assignment: equal compute per stage matters more than equal parameter count per stage.

## The Problem

A 70B-parameter model in fp16 needs 140 GB of parameters alone. No consumer GPU holds it. ZeRO-3 shards parameters across ranks but still needs every rank to allgather the full layer for each forward step, paying log(N) hops per layer. Pipeline parallel takes a different route: cut the model into N stages and put one stage on each rank. Forward of layer 1 finishes on rank 0 and hands the activation tensor to rank 1; rank 1 runs layer 2 and hands to rank 2; and so on. Backward flows in reverse. Memory drops linearly because each rank only holds one stage; compute is sequential, which is the bubble problem.

The bubble is the idle time at the start of the pipeline (waiting for the first microbatch to reach the last stage) and at the end (waiting for the last microbatch to drain back through). With M microbatches and N stages the per-stage bubble fraction is (N-1)/(M+N-1). At M=8, N=4 that is 27%. At M=64, N=4 it is 4.5%. The bubble shrinks when you have many microbatches per step, which means small per-microbatch batch sizes, which is the constraint that drives microbatch design.

## The Concept

```mermaid
flowchart LR
  R0[rank 0: stage 0 / layer 0] --> R1[rank 1: stage 1 / layer 1]
  R1 --> R2[rank 2: stage 2 / layer 2]
  R2 --> R3[rank 3: stage 3 / loss]
  R3 -.backward.-> R2
  R2 -.backward.-> R1
  R1 -.backward.-> R0
```

### GPipe schedule

Fill the pipeline forward with all M microbatches before starting any backward; then drain backward in reverse. Activations from every microbatch must be held until its backward, so memory grows linearly with M. Forward takes M+N-1 cycles, backward takes another M+N-1 cycles. Per-stage useful work is 2M cycles; per-stage bubble is 2(N-1) cycles. Bubble fraction is (N-1)/(M+N-1) when each forward and backward takes one unit of time. Picking M much greater than N hides the bubble.

### 1F1B schedule

Interleave: as soon as a microbatch's forward reaches the last stage, start its backward and let it stream back. The schedule alternates one forward and one backward per stage. Bubble is still N-1 but activation memory is bounded by the pipeline depth, not the microbatch count. Production pipelines use 1F1B (Megatron, PipeDream). The lesson implements GPipe first because it is simpler, and 1F1B as an exercise.

### Why equal compute per stage matters

If stage 0 takes 50 ms and stage 1 takes 100 ms, every cycle is gated on stage 1. The other stages idle 50 ms per cycle waiting for stage 1 to release. Equal parameter count is the wrong axis: a transformer's compute is dominated by attention plus MLP per layer, and embedding layers have many parameters but little compute. Stage assignment should equalise FLOPs per stage, not weights per stage.

### Microbatch versus batch

A pipeline runs M microbatches of size B each. The effective batch size is M*B. The gradient at the end of a pipeline step is the gradient on the combined M*B examples. Bubble fraction depends on M; the optimiser sees M*B. Tuning M means trading bubble (lower with high M) against per-microbatch memory (higher activation memory with high M for GPipe).




## Further Reading

- [Huang et al, GPipe: Efficient Training of Giant Neural Networks](https://arxiv.org/abs/1811.06965)
- [Narayanan et al, PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377)
- [Megatron-LM pipeline parallel docs](https://github.com/NVIDIA/Megatron-LM)
- Phase 19 Lesson 76 - the send/recv primitives the schedule uses
- Phase 19 Lesson 78 - ZeRO is orthogonal to pipeline and often combined

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Split a sequential model into N stages and simulate a forward pipeline across N ranks.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Schedule M microbatches through the pipeline using the GPipe schedule (forward-only fill, then backward) and compute the bubble fraction.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Compare bubble against the interleaved 1F1B schedule used in Megatron-LM and PipeDream.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Split a sequential model into N stages and simulate a forward pipeline across N ranks,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Compare bubble against the interleaved 1F1B schedule used in Megatron-LM and PipeDream,” and cite a repeatable check rather than relying on visual inspection alone.
