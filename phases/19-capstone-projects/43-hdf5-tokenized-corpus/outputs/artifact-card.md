# HDF5 Tokenized Corpus — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to stream documents into a resizable HDF5 integer dataset with deterministic chunking.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Shard the write across multiple HDF5 files so failure is bounded and parallelism is possible.
- **Evidence to retain:** the input, output, and invariant needed to read tokens back through HDF5's page-cache-backed chunked layout so the dataloader copies into batch buffers only at batch time.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can implement a sliding-window dataloader that emits fixed-length training sequences with explicit packing rules.
- Run the lesson tests after adapting the implementation to a new project.

