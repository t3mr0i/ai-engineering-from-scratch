# Python Environments — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to create isolated virtual environments using `uv`, `venv`, or `conda`.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Write a `pyproject.toml` with optional dependency groups and generate lockfiles for reproducibility.
- **Evidence to retain:** the input, output, and invariant needed to diagnose and fix common pitfalls: global installs, pip/conda mixing, CUDA version mismatches.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can implement a per-phase environment strategy for projects with conflicting dependencies.
- Run the lesson tests after adapting the implementation to a new project.

