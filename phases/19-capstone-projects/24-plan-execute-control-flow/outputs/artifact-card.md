# Plan-Execute Control Flow — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to represent a plan as an ordered list of typed steps so the executor can reason about progress and outcome.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Execute steps sequentially with a controlled failure handoff back to the planner.
- **Evidence to retain:** the input, output, and invariant needed to replan from the current cursor with the prior error in the context so the next plan is informed.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can emit a plan diff on each revision so a downstream tracer or UI can show why the plan changed.
- Run the lesson tests after adapting the implementation to a new project.

