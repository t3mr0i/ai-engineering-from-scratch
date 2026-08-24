# Collective Ops From Scratch — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement ring allreduce in two passes (reduce-scatter then allgather) and prove the per-rank communication volume is 2(N-1)/N bytes per element.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Build broadcast, allgather, and reduce_scatter on top of point-to-point sends over `multiprocessing.Queue`.
- **Evidence to retain:** the input, output, and invariant needed to verify every primitive against a `torch.distributed` gloo reference for the same input.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can defend the choice of ring versus tree on cluster shape, latency floor, and bandwidth ceiling.
- Run the lesson tests after adapting the implementation to a new project.

