# Function Call Dispatcher — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to wrap a tool handler in a per-call timeout that returns a typed error instead of hanging the loop.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Apply exponential backoff retry with jitter and a maximum attempt count.
- **Evidence to retain:** the input, output, and invariant needed to deduplicate retries on an idempotency key so a retry that races with a slow original does not run twice.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can map handler exceptions and transport faults onto a single error envelope the harness loop already understands.
- Run the lesson tests after adapting the implementation to a new project.

