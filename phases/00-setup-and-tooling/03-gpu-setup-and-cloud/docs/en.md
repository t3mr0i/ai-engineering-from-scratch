# GPU Setup & Cloud

> Measure the device you have before choosing the device you need.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 minutes

## Learning Objectives

- Run the `gpu_check.py` entrypoint through `code/main.py` and identify its CPU-only and CUDA branches.
- Verify PyTorch version, CUDA availability, device name, memory, and compute capability when a GPU is visible.
- Measure the local 4000×4000 matrix multiplication only after synchronizing CUDA work.
- Compute the demo's local fp16 parameter estimate from reported VRAM while stating what the estimate omits.
- Record a reproducible device report in the GPU setup artifact without treating a configuration request as proof of hardware.

## Why this lesson exists

The demo is deliberately safe on a machine without a GPU. `main.py` delegates to `gpu_check.py`; the script first tries to import PyTorch and, when that succeeds, checks `torch.cuda.is_available()`. A missing import prints a dependency message and returns with status 0; the no-GPU branch also exits without attempting CUDA allocations. The GPU branch prints the CUDA version, device name, total memory, compute capability, and a synchronized CPU/GPU matrix-multiplication comparison.

```mermaid
flowchart LR
    A[python3 code/main.py] --> B{PyTorch import works?}
    B -->|no| C[Report missing PyTorch]
    B -->|yes| D{torch.cuda.is_available()?}
    D -->|no| E[Report CPU-only path]
    D -->|yes| F[Device facts and synchronized benchmark]
```

## Build It

From the lesson directory, run:

```bash
python3 code/main.py
```

If the PyTorch import is unavailable, the observable result is the missing-PyTorch message and status 0. If PyTorch imports but no CUDA device is visible, the report includes the PyTorch version, `CUDA available: False`, and the no-GPU message. On a CUDA machine, the benchmark uses `size = 4000`, synchronizes before and after the GPU matmul, and prints `Speedup: ...x`. The branch and benchmark are observations of the host where you run them, not portable performance promises.

The final estimate is `vram_gb * 1e9 / 2 / 1e9`, which is approximately half the reported decimal GB count in billions of fp16 parameters. It does not reserve space for activations, optimizer state, framework overhead, or a KV cache. The code also does not run `nvidia-smi`; use that command separately when you need a driver-level view.

## Use It

Run `nvidia-smi` alongside the Python report when a local NVIDIA driver is present. For a cloud notebook, repeat the same Python command after selecting a GPU runtime and record the actual `torch.cuda.get_device_name(0)` result. A cloud provider's advertised device or a Compose setting is not evidence until PyTorch can see the device.

## Ship It

[`outputs/artifact-card.md`](../outputs/artifact-card.md) is the handoff. Add the command, the branch taken, the device name and memory if available, the benchmark size, and the estimate formula. If no GPU is available, record that the benchmark and estimate were skipped rather than filling in a guessed value.

## Exercises

1. Run `python3 code/main.py` and classify the output as missing-PyTorch, CPU-only, or CUDA. Quote the exact line that supports the classification.
2. On two machines or runtimes where PyTorch is available, compare `torch.cuda.is_available()` and the device name. Keep the matrix size fixed; explain why the measured speedup can change between machines.
3. For a reported 24.0 decimal GB device, calculate the code's naive fp16 estimate: `24.0 / 2 = 12.0` billion parameters. List two kinds of memory the estimate does not account for.
4. Update the artifact with one observed report and an acceptance note that distinguishes “CUDA visible to PyTorch” from “a model fits and trains successfully.”

## Reference Solution

A complete run preserves the branch-specific output. The CUDA path must contain a device name, memory, compute capability, and synchronized CPU/GPU timing; the CPU path must not invent any of those values. The 24 GB arithmetic is 12.0B only because it follows this demo's two-byte rule, and it must be labelled as a rough local estimate. The tests can compile and exercise the entrypoint without creating a GPU, but they cannot prove cloud availability.

Run the lesson tests from `code/`:

```bash
python3 -m unittest discover tests -v
```
