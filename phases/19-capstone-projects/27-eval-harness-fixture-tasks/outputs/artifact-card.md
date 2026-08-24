# Eval Harness with Fixture Tasks — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to define a fixture task as a triple of goal, setup, and verifier.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Score multiple sample runs per task and compute pass@1 and pass@k.
- **Evidence to retain:** the input, output, and invariant needed to aggregate latency and cost into mean and 95th-percentile metrics.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can wire deterministic verifiers (file diff, exit code, regex match) into reusable functions.
- Run the lesson tests after adapting the implementation to a new project.

