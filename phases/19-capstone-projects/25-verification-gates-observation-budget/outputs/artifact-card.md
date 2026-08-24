# Capstone Lesson 25: Verification Gates and the Observation Budget — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to build a `VerificationGate` protocol with a deterministic `evaluate(call)` method.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compose budget, recency, whitelist, and regex gates into a chain with short-circuit semantics.
- **Evidence to retain:** the input, output, and invariant needed to track every observation through an `ObservationLedger` keyed by tool and turn.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can refuse a tool call when the cumulative observation budget would be exceeded.
- Run the lesson tests after adapting the implementation to a new project.

