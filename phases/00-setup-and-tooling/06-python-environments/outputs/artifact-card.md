# Python Environments — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to identify an isolated interpreter and, when provisioning is intentional, install the allowlisted NumPy baseline using `uv` or `venv`.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compare the read-only report from the system interpreter with a disposable venv; do not treat the report as a lockfile.
- **Evidence to retain:** both JSON reports, the interpreter paths, and the package policy needed to diagnose global installs or incompatible framework environments.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Preserve the before/after reports and name which interpreter owns NumPy.
- Treat the artifact as accepted only when the isolation decision is backed by `sys.prefix` and `sys.base_prefix`.
- Run the lesson tests after adapting the implementation to a new project.
