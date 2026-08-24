# End-to-End Research Demo — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to wire the auto-research loop end to end: hypothesis seed, experiment runner, scheduler, critic loop, paper writer.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compose the primitives from the four earlier Track D lessons through plain Python imports, not a framework.
- **Evidence to retain:** the input, output, and invariant needed to run the loop to a self-terminating end and emit a single demo report that lists every stage's output.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can keep the demo deterministic so the test suite can assert the final shape.
- Run the lesson tests after adapting the implementation to a new project.

