# Pipeline Parallel and Bubble Analysis — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to split a sequential model into N stages and simulate a forward pipeline across N ranks.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Schedule M microbatches through the pipeline using the GPipe schedule (forward-only fill, then backward) and compute the bubble fraction.
- **Evidence to retain:** the input, output, and invariant needed to compare bubble against the interleaved 1F1B schedule used in Megatron-LM and PipeDream.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can defend stage assignment: equal compute per stage matters more than equal parameter count per stage.
- Run the lesson tests after adapting the implementation to a new project.

