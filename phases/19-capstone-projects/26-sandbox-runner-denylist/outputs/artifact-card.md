# Capstone Lesson 26: Sandbox Runner with Denylist and Path Jail — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to build a `Sandbox` class wrapping `subprocess.run` with timeout, capture, and truncation.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Refuse a command by name against a denylist and by structure against an argv inspector.
- **Evidence to retain:** the input, output, and invariant needed to refuse any path argument that resolves outside a declared project root.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can refuse shell metacharacters when shell mode is off.
- Run the lesson tests after adapting the implementation to a new project.

