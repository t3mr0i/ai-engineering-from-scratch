# End-to-End Distributed Training — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compose DDP (lesson 77) plus ZeRO-1 (lesson 78) plus sharded checkpoints (lesson 80) into one training loop.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Train a 2-layer transformer language model on a small synthetic corpus for 20 steps across 4 simulated ranks.
- **Evidence to retain:** the input, output, and invariant needed to print a per-step loss table, a per-rank memory profile, and a checkpoint manifest that resumes byte-equal on the same world size.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can defend the composition: each piece is independently testable in earlier lessons and this lesson proves they compose.
- Run the lesson tests after adapting the implementation to a new project.

