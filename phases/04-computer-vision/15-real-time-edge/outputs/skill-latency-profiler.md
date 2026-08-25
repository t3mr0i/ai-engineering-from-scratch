---
name: skill-latency-profiler
description: Profile a local PyTorch model with warmup, synchronization, percentiles, and an explicit deployment caveat
version: 1.1.0
phase: 4
lesson: 15
tags: [edge, deployment, profiling, benchmarking]
---

# Latency Profiler

Use this handoff when a team needs a reproducible first measurement rather than a guessed SLA.

## Inputs

- `model`: a `torch.nn.Module`.
- `input_shape`: a positive `(N, C, H, W)` tuple.
- `device`: `cpu`, or an explicitly available `cuda`/`mps` device.
- `warmup`: a non-negative integer.
- `iters`: a positive integer.

## Procedure

1. Validate the shape and controls before touching the model.
2. Move the model to the requested device and run the warmup calls under `no_grad`.
3. Synchronize asynchronous devices before and after each timed call.
4. Sort the finite millisecond samples and report p50, p95, p99, and mean.
5. Record the device, input shape, model revision, and task-quality result beside the numbers.

## Minimal call

```python
from pathlib import Path
import importlib.util

lesson = Path("phases/04-computer-vision/15-real-time-edge/code/main.py")
spec = importlib.util.spec_from_file_location("edge_lesson", lesson)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

model = module.TinyDepthwiseBackbone()
print(module.measure_latency(model, (1, 3, 16, 16), warmup=2, iters=5))
```

## Interpretation

- Parameter and FLOP counts are architecture facts for the local model.
- Latency is an observation on the machine that ran the script; it is not transferable to a phone or accelerator.
- A deployment gate must add memory, power, accuracy, and target-device measurements.
- If PyTorch is absent, report the bounded dependency message and schedule the measurement in an environment that has the allowlisted package; never substitute a fabricated number.
