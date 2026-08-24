# Code Exec Metric — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to extract a code block from a free-form generation in a way that matches the post-process rule from lesson 70.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Execute candidate code in an isolated subprocess with a wall-clock timeout, output cap, and an import denylist.
- **Evidence to retain:** the input, output, and invariant needed to score a task as the fraction of supplied assertion strings that pass against the candidate.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can compute pass-at-k for tasks that sample multiple generations from one model.
- Run the lesson tests after adapting the implementation to a new project.

