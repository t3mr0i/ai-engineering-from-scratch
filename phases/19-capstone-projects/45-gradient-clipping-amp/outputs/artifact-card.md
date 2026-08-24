# Gradient Clipping and Mixed Precision — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compute the global L2 norm over all parameter gradients and clip in place when it exceeds a configured threshold.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Wrap a training step in autocast plus a GradScaler so FP16 forward and backward passes survive overflow.
- **Evidence to retain:** the input, output, and invariant needed to detect NaN and Inf in the loss or gradient, skip the optimizer step, and log the skip.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can report the GradScaler's scaling factor every step so a long sequence of skips is visible immediately.
- Run the lesson tests after adapting the implementation to a new project.

