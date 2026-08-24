# Training Loop and Evaluation

> A loop that does not measure is a loop that lies. This lesson builds the training loop that drives the GPT model: AdamW with weight decay split, a warmup plus cosine learning rate schedule, a `calc_loss_batch` helper, an `evaluate_model` pass on held out data, a `generate_and_print_sample` qualitative probe every K steps, and a JSONL log of losses you can plot after. The same skeleton trains every decoder LLM you will ever build.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 lessons 30 to 35
**Time:** ~90 minutes

## Learning Objectives

- Build a training loop that computes cross entropy loss with the correct input and target alignment for next token prediction.
- Configure AdamW with weight decay applied to weight tensors and not to LayerNorm or bias tensors.
- Implement a learning rate schedule with linear warmup and cosine decay, and read the resulting LR over time.
- Evaluate on a held out split with `evaluate_model` so the eval loss is comparable across runs.
- Generate a qualitative sample every K steps with `generate_and_print_sample` to catch divergence before the loss curve does.
- Persist per step loss to JSONL so you can reload, plot, and ship the training log as a deliverable.

## The Problem

A training script that prints the loss but does nothing else fails three ways. It cannot tell you if the loss is decreasing for the right reason (the model could overfit the training set and never learn). It cannot tell you if a divergence is starting (the loss can spike for one step and recover, or one step and crash). It cannot tell you what the model has learned (loss is a scalar; a generated sample is a paragraph). All three failures hide unless the loop measures.

The loop in this lesson measures three ways. Loss on the training batch every step. Loss on a held out batch every K steps. A generated continuation from a fixed prompt every K steps. The training log lands in JSONL so the artifact is the loop's testimony.

## The Concept

```mermaid
flowchart TB
  D[(Token tensor<br/>train + val)] --> B[Make batches<br/>input + target shift by one]
  B --> F[Forward<br/>logits]
  F --> L[Cross entropy<br/>flatten over batch and time]
  L --> Bw[Backward]
  Bw --> Cg[Clip grad norm]
  Cg --> Step[AdamW step]
  Step --> Sched[Cosine LR schedule]
  Sched --> JL[Append step record<br/>to losses.jsonl]
  JL --> Probe{Step is a probe step?}
  Probe -- yes --> Eval[evaluate_model on val]
  Probe -- yes --> Sample[generate_and_print_sample]
  Probe -- no --> Next[Next step]
  Eval --> Next
  Sample --> Next
```

The two non-obvious pieces are the loss alignment and the AdamW decay split.

### Loss alignment

The model predicts the next token at every position. If the input batch is tokens `[t0, t1, t2, t3]`, the target batch must be `[t1, t2, t3, t4]`. Cross entropy is computed on the flat shape `(batch * seq, vocab)` against the flat target `(batch * seq,)`. Forget the shift and you train the model to predict itself, which converges to zero loss while learning nothing useful.

### AdamW decay split

Weight decay regularizes weight tensors but not normalization scales or biases. Putting decay on the LayerNorm scale slowly drives the scale to zero and breaks normalization. Putting decay on a bias is mathematically harmless but a waste of cycles. The standard split is: matrix shaped tensors (linear weights, embedding tables) get decay, anything that looks like a scale or shift does not.

### Warmup plus cosine schedule

Warmup ramps the learning rate from zero to the target over a few hundred steps so the optimizer state has time to populate. Cosine decay drops the learning rate back toward zero over the remaining steps so the final phase fine tunes the weights at a small step size. The combination is the most common schedule in open weights LLM training because it removes most of the brittle moments in the first thousand steps and the last thousand steps.

### Held out evaluation

`evaluate_model` runs a fixed number of batches from the validation split, accumulates loss, divides by the batch count, and returns. No gradient. No dropout. The number is reproducible across runs given the same seed and the same split. Reporting the held out loss next to the training loss is how you spot overfitting.

### Qualitative sampling as an early signal

A model whose training loss drops nicely but whose generated samples are all the same token is broken. A model whose loss curve looks flat but whose generated samples sharpen into coherent words is learning. The qualitative probe runs faster than reading the full curve and catches modes the scalar misses.


## Use It

- The loop in this lesson is the same skeleton that trains a 124M model on real data. Swap the synthetic token tensor for a `datasets`-style loader and the loop runs unchanged.
- The JSONL log is the deliverable that turns a training run into evidence. The next lesson uses one to compare a freshly trained checkpoint with a pretrained one.
- The qualitative sample probe is the catch-all that scalar loss cannot replace.


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Loss alignment | "Shift by one" | Input tokens at positions 0..T-1, target tokens at positions 1..T; cross entropy is computed on flattened shapes |
| Decay split | "Two groups" | AdamW receives matrix shaped tensors with weight decay and scale or bias tensors with none |
| Warmup | "Ramp" | The learning rate climbs from zero to its target over a fixed number of steps so the optimizer state can populate |
| Eval batches | "Held out batches" | A fixed slice of the validation token tensor, sliced once at script start, used identically every probe |
| Qualitative probe | "Sample print" | A short generation from a fixed prompt printed every K steps to catch failure modes loss alone hides |

## Further Reading

- Phase 19 lesson 35 for the model the loop drives.
- Phase 19 lesson 37 for loading pretrained weights into the same model.
- Phase 10 lesson 04 (pre training mini GPT) for the procedure on real data.
- Phase 10 lesson 10 (evaluation) for the broader eval surface beyond cross entropy loss.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Build a training loop that computes cross entropy loss with the correct input and target alignment for next token prediction.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Configure AdamW with weight decay applied to weight tensors and not to LayerNorm or bias tensors.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Implement a learning rate schedule with linear warmup and cosine decay, and read the resulting LR over time.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Build a training loop that computes cross entropy loss with the correct input and target alignment for next token prediction,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Implement a learning rate schedule with linear warmup and cosine decay, and read the resulting LR over time,” and cite a repeatable check rather than relying on visual inspection alone.
