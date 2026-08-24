# Sharded Checkpoint and Atomic Resume — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to save a multi-rank checkpoint as a per-rank shard file plus a manifest that records which rank owns what.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Use the atomic write pattern (write to a temp path then rename) so a crash mid-write never produces a half-finished checkpoint.
- **Evidence to retain:** the input, output, and invariant needed to resume from the manifest, verifying byte-equal state for both fp16 parameters and the ZeRO optimiser state on every rank.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can defend the manifest schema against the three failure modes: world-size change, shard count mismatch, and partial write.
- Run the lesson tests after adapting the implementation to a new project.

