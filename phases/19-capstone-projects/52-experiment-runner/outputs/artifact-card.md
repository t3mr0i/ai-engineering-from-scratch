# Experiment Runner — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to encode an experiment as a typed spec the runner can serialise to a subprocess.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Launch a subprocess with a hard wall clock timeout and a soft memory cap, and surface both as terminal conditions.
- **Evidence to retain:** the input, output, and invariant needed to capture stdout, stderr, and the structured metrics blob into a single result record.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can build an ablation table that sweeps one configuration knob at a time over a fixed base spec.
- Run the lesson tests after adapting the implementation to a new project.

