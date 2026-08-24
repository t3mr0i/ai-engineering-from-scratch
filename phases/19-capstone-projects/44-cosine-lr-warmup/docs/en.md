# Cosine LR with Linear Warmup

> The learning-rate schedule is the second most important decision after the loss function. AdamW with a cosine decay and a linear warmup is the modern default for language-model training because it lets the model see a small effective step size during the brittle first thousand updates, ramps up to a configured peak, and decays smoothly back toward zero. This lesson builds that schedule, plots the curve over training steps, logs gradient norms next to the schedule, and proves the schedule honors warmup, peak, and decay boundaries.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 lessons 30-37
**Time:** ~90 minutes

## Learning Objectives

- Implement an AdamW optimizer wired to a cosine learning-rate schedule with linear warmup.
- Compute the schedule's exact value at any step without floating-point drift across runs.
- Log gradient L2 norm side by side with the learning rate so training health is observable.
- Render the schedule to a text plot the eye can read and a CSV any tool can consume.

## The Problem

The first thousand training updates are the loudest. The model's weights are still close to initialization. The optimizer's running second-moment estimate has not stabilised. The gradient norm is large and noisy. If the learning rate is at its peak during these updates the model either diverges outright or settles into a loss plateau it never escapes. The two well-known fixes are gradient clipping, which is the subject of Phase 19 lesson 45, and a learning-rate schedule that starts small and ramps up.

The cosine-with-warmup schedule has three regions. From step zero to step `warmup_steps` the learning rate scales linearly from zero to the configured peak `lr_max`. From step `warmup_steps` to step `total_steps` the learning rate follows the upper half of a cosine curve, decaying from `lr_max` to `lr_min`. After `total_steps` the learning rate is pinned at `lr_min` so a misconfigured trainer that overshoots does not silently exit the schedule.

The build problem is that schedules are easy to get wrong off by one. The off-by-one shows up six hours into a training run as a learning rate that is 1 percent too high or too low at the moment the model starts overfitting, which is invisible unless the schedule is exhaustively tested at boundaries.

## The Concept

```mermaid
flowchart TD
  Step[Training step] --> Branch{step state}
  Branch -- step <= warmup --> Linear[Linear ramp from 0 to lr_max]
  Branch -- warmup < step <= total --> Cosine[Cosine decay from lr_max to lr_min]
  Branch -- step > total --> Floor[Pin at lr_min]
  Linear --> Apply[AdamW.step]
  Cosine --> Apply
  Floor --> Apply
  Apply --> GradNorm[Compute gradient L2 norm]
  GradNorm --> Log[Step log row]
  Log --> Plot[Text plot + CSV]
```

### Warmup formula

For `step` in `[0, warmup_steps]` with `warmup_steps > 0`, the learning rate is `lr_max * step / warmup_steps`. The degenerate `warmup_steps = 0` case is treated as "no warmup": the schedule starts directly at `lr_max` at step zero and immediately enters cosine decay. Some test harnesses pass `warmup_steps = 0` to check the schedule still produces a usable curve.

### Cosine formula

For `step` in `(warmup_steps, total_steps]` the learning rate is `lr_min + 0.5 * (lr_max - lr_min) * (1 + cos(pi * progress))` where `progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)`. At `step = warmup_steps` the cosine evaluates to `cos(0) = 1`, which gives `lr_max`, matching the warmup endpoint exactly. At `step = total_steps` the cosine evaluates to `cos(pi) = -1`, which gives `lr_min`, matching the decay endpoint exactly.

The continuity at both endpoints is not an accident. It is the reason the schedule is implemented as a single function over `step`, not as three different functions glued together. A glued schedule loses one boundary the first time `lr_max` is changed.

### Floor after total steps

For `step > total_steps` the learning rate stays at `lr_min`. The contract is explicit: the schedule does not error out and does not extrapolate; it pins at the floor and lets the trainer log a warning. Trainers that need to extend training change the schedule's `total_steps`, not the loop.

### Gradient norm logging alongside the rate

The schedule is half of training health. The gradient norm is the other half. The training loop logs both per step. A divergent training run shows the gradient norm spike before the loss does; a well-tuned warmup keeps the norm rising linearly with the rate; a too-aggressive peak shows up as a norm that stays high after warmup. The dataset on disk is `step, lr, grad_l2_norm, loss`. The CSV is the only durable record.




## Further Reading

- [Loshchilov and Hutter, SGDR: Stochastic Gradient Descent with Warm Restarts (arXiv 1608.03983)](https://arxiv.org/abs/1608.03983) - the cosine schedule's reference paper
- [Loshchilov and Hutter, Decoupled Weight Decay Regularization (arXiv 1711.05101)](https://arxiv.org/abs/1711.05101) - AdamW's reference paper
- [PyTorch torch.optim.lr_scheduler](https://docs.pytorch.org/docs/stable/optim.html#how-to-adjust-learning-rate) - how step functions compose with framework schedulers
- Phase 19 · 42 - the downloader whose corpus this schedule consumes
- Phase 19 · 43 - the dataloader the schedule co-evolves with
- Phase 19 · 45 - gradient clipping and AMP, the next layer in the loop

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Implement an AdamW optimizer wired to a cosine learning-rate schedule with linear warmup.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Compute the schedule's exact value at any step without floating-point drift across runs.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Log gradient L2 norm side by side with the learning rate so training health is observable.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Implement an AdamW optimizer wired to a cosine learning-rate schedule with linear warmup,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Log gradient L2 norm side by side with the learning rate so training health is observable,” and cite a repeatable check rather than relying on visual inspection alone.
