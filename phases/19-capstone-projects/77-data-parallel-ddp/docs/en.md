# Data Parallel DDP From Scratch

> DistributedDataParallel is a hook on top of allreduce. Wrap a model, broadcast the initial parameters from rank 0 so every rank starts identical, install a backward hook on every parameter that issues an allreduce of the gradient, and the rest is gradient descent. The whole pattern is 200 lines.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 min

## Learning Objectives

- Wire a `DistributedDataParallel`-shaped wrapper that broadcasts initial parameters and allreduces gradients after backward.
- Spawn N CPU ranks with `torch.multiprocessing.spawn` over the gloo backend with file-based rendezvous.
- Prove gradient-sync correctness by training the same model on the same data sequentially and showing per-step parameter equivalence.
- Defend the use of buckets (gradient fusion) and overlap (comm during backward) as the two changes that turn a working DDP into a production DDP.

## The Problem

A 1-billion-parameter model with 12 GB of activations does not fit on one consumer GPU. Even when it fits, training takes weeks. Data parallel splits the batch across N ranks, each rank computes the forward and backward on its shard, and at every step every rank's gradients are summed so all N copies stay identical. The summed gradient is what the optimiser steps on.

Without gradient sync, the N replicas diverge by step 2. The model is not "one model trained on more data" anymore, it is N separate models that happen to share initial weights. With gradient sync done badly (one allreduce per parameter, no overlap, no bucketing) the network is the bottleneck and the GPUs idle waiting for the wire. The craft of DDP is making the gradient sync nearly free relative to compute. The canonical PyTorch DDP achieves that by bucketing gradients, overlapping allreduce with the next layer's backward, and using NCCL on NVLink. We can do all three on CPU with gloo and learn the same lessons.

## The Concept

```mermaid
sequenceDiagram
  participant R0 as rank 0
  participant R1 as rank 1
  participant R2 as rank 2
  participant R3 as rank 3
  R0->>R1: broadcast params
  R0->>R2: broadcast params
  R0->>R3: broadcast params
  Note over R0,R3: forward + backward on own shard
  R0->>R1: allreduce grad bucket
  R1->>R2: allreduce grad bucket
  R2->>R3: allreduce grad bucket
  R3->>R0: allreduce grad bucket
  Note over R0,R3: optimizer.step on identical grads
```

### The three operations DDP needs

| Stage | Collective | Why |
|-------|-----------|-----|
| Init | broadcast from rank 0 | Every rank starts with the same parameters |
| After backward | allreduce of each grad | The mean gradient is what the optimiser steps on |
| Sometimes | broadcast of buffers | Batchnorm running stats stay synchronised |

### Why mean and not sum

Allreduce-SUM divided by world_size gives the mean gradient. The mean is invariant to world_size: a learning rate tuned at one rank works at four ranks because the per-step gradient magnitude does not change. Allreduce-SUM without the division forces you to retune the learning rate every time you change cluster size. DDP wraps the SUM and divides; do the same in the lesson.

### Why bucket gradients

A transformer has thousands of parameter tensors. One allreduce per tensor pays the gloo latency floor thousands of times. DDP groups gradients into ~25 MB buckets and issues one allreduce per bucket. The same total bytes move across the wire but the latency is amortised over the bucket. For the lesson's tiny model we group everything into one bucket; the structure is what carries across.

### Why pin the seed

Every rank must call `torch.manual_seed(seed + rank)` for shuffling but `torch.manual_seed(seed)` for parameter init. A single shared seed means every rank sees the same batch order (defeating data parallel); a rank-specific seed for params means initial parameters disagree by float epsilon and gradient sync no longer makes the replicas identical. Get the seed pattern right or the test for parameter equivalence fails on step 1.




## Further Reading

- [PyTorch DistributedDataParallel docs](https://pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html)
- [PyTorch DDP internals tutorial](https://pytorch.org/tutorials/intermediate/ddp_tutorial.html)
- [Li et al, PyTorch Distributed: Experiences on Accelerating Data Parallel Training](https://arxiv.org/abs/2006.15704)
- Phase 19 Lesson 76 - the collectives DDP is built on
- Phase 19 Lesson 78 - ZeRO sharding replaces the per-param allreduce with reduce_scatter

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Wire a `DistributedDataParallel`-shaped wrapper that broadcasts initial parameters and allreduces gradients after backward.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Spawn N CPU ranks with `torch.multiprocessing.spawn` over the gloo backend with file-based rendezvous.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Prove gradient-sync correctness by training the same model on the same data sequentially and showing per-step parameter equivalence.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Wire a `DistributedDataParallel`-shaped wrapper that broadcasts initial parameters and allreduces gradients after backward,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Prove gradient-sync correctness by training the same model on the same data sequentially and showing per-step parameter equivalence,” and cite a repeatable check rather than relying on visual inspection alone.
