# Tool Registry with Schema Validation — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to hold a typed registry of tool name → schema → handler that the dispatcher can ask once and trust afterwards.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement a JSON Schema 2020-12 subset that covers the keywords ninety percent of tool calls actually use.
- **Evidence to retain:** the input, output, and invariant needed to return precise, json-pointer-shaped error paths so the model can self-correct in one round trip.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can reject re-registration without explicit override, since silent overwrites are how production tool catalogs drift.
- Run the lesson tests after adapting the implementation to a new project.

