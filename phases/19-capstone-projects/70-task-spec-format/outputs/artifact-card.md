# Task Spec Format — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to define a JSONL task record schema that covers arithmetic, multiple-choice, code execution, classification, and free-text summarisation in one shape.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Pin a closed vocabulary of metric names so downstream lessons (71-73) can dispatch on a single field.
- **Evidence to retain:** the input, output, and invariant needed to specify few-shot examples and post-processing rules as part of the task, not the runner, so the same prompt produces the same target across models.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can implement a strict validator that rejects malformed records before they reach the runner.
- Run the lesson tests after adapting the implementation to a new project.

