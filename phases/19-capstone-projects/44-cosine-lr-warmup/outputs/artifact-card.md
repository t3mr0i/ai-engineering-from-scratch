# Cosine LR with Linear Warmup — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement an AdamW optimizer wired to a cosine learning-rate schedule with linear warmup.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compute the schedule's exact value at any step without floating-point drift across runs.
- **Evidence to retain:** the input, output, and invariant needed to log gradient L2 norm side by side with the learning rate so training health is observable.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can render the schedule to a text plot the eye can read and a CSV any tool can consume.
- Run the lesson tests after adapting the implementation to a new project.

