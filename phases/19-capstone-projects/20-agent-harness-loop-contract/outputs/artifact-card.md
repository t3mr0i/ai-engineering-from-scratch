# Agent Harness Loop Contract — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to specify an agent harness loop as a deterministic state machine with explicit transitions.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement ten lifecycle hook topics that operators wire policy, telemetry, and guardrails into.
- **Evidence to retain:** the input, output, and invariant needed to define two pull points where the loop yields control back to the caller and resumes on a fresh input.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can enforce per-session budgets (turns, tool calls, wall-clock) without leaking partial state on exceeding.
- Run the lesson tests after adapting the implementation to a new project.

