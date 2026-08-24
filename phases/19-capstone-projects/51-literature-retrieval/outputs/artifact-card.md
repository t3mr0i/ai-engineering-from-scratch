# Literature Retrieval — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to model a small paper record with the fields the loop will read downstream.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Build a BM25 index over abstracts with stdlib data structures only.
- **Evidence to retain:** the input, output, and invariant needed to walk a citation graph to surface papers the lexical search missed.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can deduplicate hits across the lexical and graph passes by stable paper id.
- Run the lesson tests after adapting the implementation to a new project.

