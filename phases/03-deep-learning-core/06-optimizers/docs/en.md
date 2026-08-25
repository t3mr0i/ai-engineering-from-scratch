# Optimizers

> Optimizers turn a gradient into a parameter step while carrying carefully defined state between steps.

**Type:** Build
**Languages:** Python
**Prerequisites:** Lesson 03.05 Loss Functions
**Time:** ~70 minutes

## Learning Objectives

- Implement SGD and the momentum recurrence from explicit gradients.
- Derive Adam's first and second moments and their bias correction.
- Distinguish Adam's adaptive direction from AdamW's decoupled weight decay.
- Validate hyperparameters and parameter/gradient shapes before updating.
- Reset optimizer state when starting a fresh parameter trajectory.

## Update rules

For a parameter (p) and gradient (g), SGD performs `p -= lr*g`. Momentum keeps (v_t=\beta v_{t-1}+g_t) and uses `p -= lr*v_t`. Adam keeps exponential moments

```text
m_t = beta1*m_(t-1) + (1-beta1)*g_t
v_t = beta2*v_(t-1) + (1-beta2)*g_t*g_t
m_hat = m_t / (1-beta1**t)
v_hat = v_t / (1-beta2**t)
p -= lr*m_hat/(sqrt(v_hat)+epsilon)
```

On Adam's first step with gradient `g`, bias correction makes `m_hat=g` and `v_hat=g²`, even though the raw moments are only `(1-beta1)g` and `(1-beta2)g²`. If `d_adam` is the bias-corrected direction and `p_old` is the pre-step value, this implementation uses the decoupled equation `p_new = p_old - lr*d_adam - lr*weight_decay*p_old`. The decay term therefore never scales the adaptive Adam update.

## Build It

Run `python3 main.py` from `code/`. It applies 100 updates to `(x-3)^2` from `x=10` with each optimizer and prints the final `x` and loss. `bias_correction_demo()` reports raw first moments `0.1` and `0.001` for a unit gradient with the default betas, while the corrected values are 1 and 1.

Every optimizer requires a positive finite learning rate, equal nonempty finite parameter/gradient lists, and valid beta/epsilon ranges. Momentum and Adam reject a changed parameter width until `reset_state()` is called; this avoids accidentally reusing moments for unrelated parameters.

## Use It

1. Apply `SGD(lr=0.1)` to `[1.0]` with gradient `[0.5]`; verify `0.95`.
2. Apply momentum twice with `beta=0.9` and gradient `0.5`; the second velocity is `0.95`, not `0.5`.
3. Apply Adam once with gradient `2`; inspect raw moments and calculate the corrected values before checking the parameter step.
4. Apply `AdamW(lr=0.1, weight_decay=0.5)` to parameter `2` with zero gradient. The decoupled equation gives `2 - 0 - 0.1*0.5*2 = 1.9`; with a nonzero gradient, calculate both terms from the pre-step value.

## Ship It

`outputs/prompt-optimizer-selector.md` is a selection card keyed to the observed problem: plain SGD for a transparent baseline, momentum for consistent directional gradients, Adam for adaptive scales, and AdamW when decoupled shrinkage is intended. It does not claim one optimizer wins on every dataset.

## Exercises

1. Derive the first momentum and Adam updates for a negative gradient and check the signs in code.
2. Train the quadratic wrapper for ten steps with SGD and record that its loss decreases; repeat with an intentionally oversized learning rate and describe the observed instability.
3. Train an Adam instance on a one-parameter trajectory, call `reset_state`, then use two parameters. Verify the new moment arrays have width two.
4. Add validation tests for `beta=1`, `epsilon=0`, mismatched list lengths, and a NaN gradient.

## Reference Solution

SGD maps `(p,g,lr)=(1,0.5,0.1)` to `0.95`. Momentum's second velocity with two gradients of `0.5` is `0.9*0.5+0.5=0.95`. Adam's first corrected moments equal the gradient and its square. For `p=2,g=1,lr=0.1,weight_decay=0.5`, the first Adam direction is 1 and AdamW returns `2-0.1*1-0.1*0.5*2=1.8`; with `g=0`, it returns 1.9. The tests also show that state reset and finite hyperparameters are explicit contracts.
