# Data Parallel DDP From Scratch — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to wire a `DistributedDataParallel`-shaped wrapper that broadcasts initial parameters and allreduces gradients after backward.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Spawn N CPU ranks with `torch.multiprocessing.spawn` over the gloo backend with file-based rendezvous.
- **Evidence to retain:** the input, output, and invariant needed to prove gradient-sync correctness by training the same model on the same data sequentially and showing per-step parameter equivalence.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can defend the use of buckets (gradient fusion) and overlap (comm during backward) as the two changes that turn a working DDP into a production DDP.
- Run the lesson tests after adapting the implementation to a new project.

