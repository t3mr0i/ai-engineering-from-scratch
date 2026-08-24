# End-to-End Coding Agent on the Harness — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compose the gate chain, sandbox, eval harness, and span builder into a single agent loop.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement a deterministic policy that uses read_file, run_tests, and write_file to fix a fixture bug.
- **Evidence to retain:** the input, output, and invariant needed to enforce a global step budget plus an observation token budget across an end-to-end run.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can emit complete OTel GenAI traces and Prometheus metrics for the full run.
- Run the lesson tests after adapting the implementation to a new project.

