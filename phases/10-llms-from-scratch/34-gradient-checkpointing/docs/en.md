# Gradient Checkpointing and Activation Recomputation

> Backprop keeps every intermediate activation. At 70B parameters and 128K context that is 3 TB of activations per rank. Checkpointing trades FLOPs for memory: recompute instead of save. The question is which segments to drop, and the answer is not "all of them."

**Type:** Build
**Languages:** Python (with numpy, optional torch)
**Prerequisites:** Phase 10 Lesson 04 (Pre-Training Mini-GPT), Phase 10 Lesson 05 (Scaling & Distributed)
**Time:** ~70 minutes

## The Problem

Training a transformer stores, for each layer, the inputs to every op that is differentiated in backward: the attention inputs, the Q/K/V projections, the softmax output, the FFN inputs, the norm outputs, and the residual stream. For a layer with hidden size `d`, sequence length `L`, batch `B`, this is on the order of `12 * B * L * d` floats per layer.

For `d=8192, L=8192, B=1`, that's 800 MB/layer in BF16. A 64-layer model is 51 GB of activations — and that's before you multiply by microbatch size, before you add attention-softmax intermediates (`L^2` per head), and before you factor tensor-parallel partial copies.

The two-sided bill: BF16 weights plus optimizer state might fit in 80GB, but activations push you past. Gradient checkpointing (aka activation recomputation) is the standard fix. Drop most activations; redo the forward during backward to get them back. Cost: extra FLOPs. Benefit: memory drops by the ratio of checkpoint segments to total layers.

Done naively, checkpointing costs roughly 33% more forward-pass FLOPs per step. Done well — selective checkpointing per the "smart selection" of Korthikanti et al. — you save 5x memory for under 5% FLOP overhead. And with FP8 matmuls, FSDP offload, and expert-parallel MoE this really matters: you can't afford either the memory or the wasted compute.

## The Concept

### What Backward Actually Needs

`output = layer(input)`. Backward wants `grad_input` and `grad_params`. To compute them it needs:

- `input` (to compute `grad_params = input.T @ grad_output` for linear layers)
- some activation derivative intermediates (the derivative of ReLU/GELU/softmax depends on the activation value)

The forward pass stores these automatically in the autograd graph. Every `tensor.retain_grad()` and every op that needs its input retains a reference.

### Naive Full Checkpointing

Split the network into `N` segments. During forward, store only the *input* to each segment. When backward needs intermediates, rerun the segment's forward pass to materialize them, then differentiate.

Example: 32-layer transformer split into 32 segments of 1 layer each.

- Memory: 32 layer-inputs (small) vs 32 * (activation volume per layer) (huge).
- Extra compute: 1 extra forward per segment, i.e., ~33% more forward FLOPs total (since backward is 2x forward, full step becomes 1 + 1 + 2 = 4 units instead of 1 + 2 = 3).

This is the original Chen et al. 2016 recipe: one checkpoint every `sqrt(L)` layers to balance memory and compute. For L=64, that's 8 checkpoints.

### Selective Checkpointing (Korthikanti 2022)

Not all activations cost the same. The attention softmax output is `B*L*L*heads` and grows *quadratically* with sequence length. The FFN hidden activation is `B*L*4d` and grows linearly. For long sequences the softmax dominates.

Selective checkpointing keeps the cheap-to-store activations (linear projections, residuals) and recomputes only the expensive ones (attention). You pay minimal FLOPs to recompute but save the O(L^2) memory.

Megatron-Core implements this as "selective" activation recomputation. Used in most 2024+ frontier training runs.

### Offload

Alternative to recompute: ship activations to CPU RAM between forward and backward. Requires PCIe bandwidth; beneficial when idle bandwidth exceeds the cost of rematerialization. Mixed strategies are common: checkpoint some layers, offload others.

FSDP2 ships offload as a first-class option. Offload shines when GPU is bottlenecked on memory but CPU-GPU transfer has headroom.

### Recompute Cost Model

Per-step FLOPs with naive checkpointing every `k` layers out of `L`:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

With selective checkpointing you recompute only the attention kernel, not the whole layer:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### Memory Savings Model

Activation volume per layer: `A`. For `L` layers, total activation memory: `L * A`.

Full checkpoint (segment size 1): store only `L * input_volume` (~`L * 1/10 A` for a standard transformer). Saves ~`9 * L * A * 1/10`.

Checkpoint every `k` layers: store `L/k * A` plus `k-1` layers' worth within the active segment.

At `k = sqrt(L)`, memory and recompute cost both scale with `sqrt(L)` — the optimal tradeoff for uniform-cost layers.

### When Not to Checkpoint

- The innermost layers of a pipeline stage already in-flight. They have to finish anyway.
- The first and last layers if they dominate the stage's compute (rare in transformers).
- Attention kernels already using FlashAttention — Flash already recomputes the softmax fast, so additional layer-level checkpointing adds little on top.

### Implementation Patterns

1. **Function wrapper:** wrap a segment in `torch.utils.checkpoint.checkpoint(fn, input)`. PyTorch stores only `input`, recomputes everything else on backward.

2. **Decorator-based:** label layers as checkpointable; the trainer decides at config time which segments get wrapped.

3. **Manual explicit recompute:** write the backward pass yourself, calling a custom `recompute_forward` that duplicates the forward with the stored input.

All three give the same functional result. Wrappers are the standard idiom.

### Interaction with TP / PP / FP8

- **Tensor parallel:** checkpoint inputs must be gathered or rescattered on recompute; handle the communication cost.
- **Pipeline parallel:** typical pattern is to checkpoint each pipeline-stage's forward so reverse-order microbatches can reuse activation memory.
- **FP8 recompute:** amax histories updated during recompute must match the original forward's, or the FP8 scale drifts. Most frameworks snapshot the scale.




## Further Reading

- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174) -- the original paper that formalized gradient checkpointing
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198) -- selective activation recomputation and the formal cost analysis
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645) -- alternative constant-memory approach via reverse-mode rematerialization
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840) -- activation offload at scale
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html) -- the standard API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html) -- selective, full, and block modes
