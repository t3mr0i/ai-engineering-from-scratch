# ZeRO Optimizer State Sharding — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to shard optimiser state (first moment, second moment, fp32 master copy) across N ranks so each rank owns 1/N.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Use reduce_scatter to deliver each rank only its shard's gradient sum, then allgather to broadcast the updated parameter shards back.
- **Evidence to retain:** the input, output, and invariant needed to compute the memory savings table for stage 1, stage 2, stage 3 against vanilla DDP.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can defend the choice of stage 1 vs stage 2 vs stage 3 on model size and bandwidth budget.
- Run the lesson tests after adapting the implementation to a new project.

