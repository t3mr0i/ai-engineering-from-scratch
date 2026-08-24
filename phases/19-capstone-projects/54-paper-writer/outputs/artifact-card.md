# Paper Writer — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to treat a research paper as a structured artifact with a known section graph, not a freeform document.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Generate a LaTeX skeleton that declares its abstract, sections, figure slots, and bibliography keys before any prose is written.
- **Evidence to retain:** the input, output, and invariant needed to inject figures from experiment outputs (paths and captions) into the skeleton through a deterministic slot mechanism.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can wire a mocked prose generator that fills each section from a structured outline so the harness is testable without a model.
- Run the lesson tests after adapting the implementation to a new project.

