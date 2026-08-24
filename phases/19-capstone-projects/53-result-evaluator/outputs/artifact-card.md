# Result Evaluator — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compare a candidate run against a baseline using direction aware improvement and a fixed threshold.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Run a paired t test from scratch over per seed metrics and read the resulting p value.
- **Evidence to retain:** the input, output, and invariant needed to normalise log scaled metrics so a downstream report can blend them with linear metrics.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can emit a per hypothesis verdict that the orchestrator can attach to the queue from lesson fifty.
- Run the lesson tests after adapting the implementation to a new project.

