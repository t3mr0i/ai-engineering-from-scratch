# Transformer Block from Scratch

> One block is the unit of every modern decoder LLM. Layer norm, multi head attention, residual, MLP, residual. The pre-LN variant trains stably without warmup. The post-LN variant is what the original paper shipped. This lesson builds both, side by side, and shows which one survives a 12 layer stack at common learning rates.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 lessons 30 to 33 (tokenizer, embeddings, attention math, batched data loader)
**Time:** ~90 minutes

## Learning Objectives

- Build a transformer block in PyTorch from the four moving pieces: LayerNorm, multi head causal attention, residual connections, position wise MLP.
- Place the LayerNorms in two configurations (pre-LN and post-LN) and explain why one trains stably without warmup.
- Implement causal masking inside the multi head attention so token `i` cannot see tokens `j > i`.
- Track gradient flow through both variants on a 12 layer stack and read the result without hand waving.
- Reuse the block as a drop-in unit when the next lesson assembles a 124 million parameter GPT.

## The Problem

A transformer is one block repeated. Get the block wrong once, repeat it twelve times, and you ship a model that diverges in the first epoch or that needs warmup hacks the rest of the way. The two failure modes you will see in this lesson are not exotic. They show up the first time a learner stacks blocks naively. One is the attention layer attending to the future. The other is the LayerNorm placed where it cannot tame the residual signal at depth.

The fix is mechanical once you see it. The block has exactly two residual paths and exactly two normalization positions. Choose the positions correctly and the rest of the stack is just bookkeeping.

## The Concept

Every decoder only transformer block is a function that takes a tensor of shape `(batch, sequence, embedding)` and returns a tensor of the same shape. Inside, two sublayers do the work.

```mermaid
flowchart TB
  X[Input embedding<br/>shape B, T, D] --> N1[LayerNorm 1]
  N1 --> MHA[Multi head causal attention]
  MHA --> R1[Add residual]
  X --> R1
  R1 --> N2[LayerNorm 2]
  N2 --> MLP[Position wise MLP<br/>D to 4D to D]
  MLP --> R2[Add residual]
  R1 --> R2
  R2 --> Y[Output, same shape]
```

This is the pre-LN variant. The LayerNorm sits inside the residual branch, before the sublayer. The residual connection carries the unnormalized signal forward.

The post-LN variant moves the LayerNorm to after the residual add.

```mermaid
flowchart TB
  X[Input] --> MHA[Multi head causal attention]
  MHA --> R1[Add residual]
  X --> R1
  R1 --> N1[LayerNorm 1]
  N1 --> MLP[Position wise MLP]
  MLP --> R2[Add residual]
  N1 --> R2
  R2 --> N2[LayerNorm 2]
  N2 --> Y[Output]
```

Shape is identical. Training behavior is not. With post-LN, the gradient that flows back through the residual path must pass through the LayerNorm. At depth twelve and learning rate `3e-4`, that gradient shrinks fast enough to need a warmup schedule. Pre-LN leaves the residual path unnormalized, so gradients propagate cleanly to the embedding layer. Pre-LN is the configuration GPT-2 onward ships with for that reason.

### Causal multi head attention

The attention sublayer projects the input three ways into query, key, value tensors. Each is reshaped from `(B, T, D)` to `(B, H, T, D/H)` where `H` is the head count. Scaled dot product attention computes `softmax(Q K^T / sqrt(d_k))` per head, masks the upper triangle to negative infinity, applies the mask via softmax, then multiplies by `V`. Heads are concatenated back into a single `(B, T, D)` tensor and projected once more. The mask is the only piece that makes the model causal. Forget the mask and you train a model that cheats.

### The MLP

The position wise MLP applies the same two layer network to every token independently. The hidden width is four times the embedding width, the activation is GELU, and a dropout follows the second linear. No tokens talk to each other inside the MLP. All token mixing happens in attention.

### Residual connections do two things

They make the gradient path additive across depth, which keeps the gradient norm in scale through twelve layers. They also let each block learn an additive update to the running representation rather than a full replacement. Both effects are why the block scales.


## Use It

- The block in this lesson plugs straight into the GPT assembly in lesson 35 without modification.
- The pre-LN variant is what every modern open weights LLM uses. The post-LN variant is what the original 2017 attention paper used. Knowing both is enough to read any decoder architecture you will encounter.
- Swap the GELU for SiLU and you have the LLaMA family activation. Swap the LayerNorm for RMSNorm and you have the LLaMA family normalization. Same skeleton.


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Pre-LN | "Pre norm" | LayerNorm inside the residual branch, before each sublayer; the residual carries the unnormalized signal |
| Post-LN | "Post norm" | LayerNorm after the residual add; what the 2017 paper shipped and what needs warmup |
| Causal mask | "Triangle mask" | The upper triangle of the attention logits set to negative infinity so token i cannot read token j when j is greater than i |
| Fused QKV | "Combined projection" | One linear of width 3D instead of three linears of width D; one kernel, one matmul |
| Residual stream | "Skip connection" | The unnormalized tensor that flows top to bottom through every block; what each block adds to |

## Further Reading

- Phase 7 lesson 02 (self attention from scratch) for the attention math underneath this block.
- Phase 7 lesson 05 (full transformer) for the encoder decoder version of the same skeleton.
- Phase 10 lesson 04 (pre training mini GPT) for the training procedure that this block plugs into.
- Phase 19 lesson 35 (this track) which stacks twelve of these blocks into a GPT model.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Build a transformer block in PyTorch from the four moving pieces: LayerNorm, multi head causal attention, residual connections, position wise MLP.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Place the LayerNorms in two configurations (pre-LN and post-LN) and explain why one trains stably without warmup.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Implement causal masking inside the multi head attention so token `i` cannot see tokens `j > i`.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Build a transformer block in PyTorch from the four moving pieces: LayerNorm, multi head causal attention, residual connections, position wise MLP,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Implement causal masking inside the multi head attention so token `i` cannot see tokens `j > i`,” and cite a repeatable check rather than relying on visual inspection alone.
