# GPU Setup & Cloud

> Training on CPU is fine for learning. Training for real needs a GPU.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 minutes

## Learning Objectives

- Verify local GPU availability using `nvidia-smi` and PyTorch's CUDA API
- Configure Google Colab with a T4 GPU for free cloud-based experiments
- Benchmark matrix multiplication on CPU vs GPU and measure the speedup
- Estimate the largest model that fits in your VRAM using the fp16 rule of thumb

## The Problem

Most lessons in phases 1-3 run fine on CPU. But once you start training CNNs, transformers, or LLMs (phases 4+), you need GPU acceleration. A training run that takes 8 hours on CPU takes 10 minutes on GPU.

You have three options: local GPU, cloud GPU, or Google Colab (free).

## The Concept

```
Your options:

1. Local NVIDIA GPU
   Cost: $0 (you already have it)
   Setup: Install CUDA + cuDNN
   Best for: Regular use, large datasets

2. Google Colab (free tier)
   Cost: $0
   Setup: None
   Best for: Quick experiments, no GPU at home

3. Cloud GPU (Lambda, RunPod, Vast.ai)
   Cost: $0.20-2.00/hr
   Setup: SSH + install
   Best for: Serious training, large models
```

## Build It

### Option 1: Local NVIDIA GPU

Check if you have one:

```bash
nvidia-smi
```

Install PyTorch with CUDA:

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### Option 2: Google Colab

1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Runtime > Change runtime type > T4 GPU
3. Run `!nvidia-smi` to verify

Upload notebooks from this course directly to Colab.

### Option 3: Cloud GPU

For Lambda Labs, RunPod, or Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### No GPU? No problem.

Most lessons work on CPU. The ones that need GPU will say so and include Colab links.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")
```

## Build It: GPU vs CPU benchmark

```python
import torch
import time

size = 5000

a_cpu = torch.randn(size, size)
b_cpu = torch.randn(size, size)

start = time.time()
c_cpu = a_cpu @ b_cpu
cpu_time = time.time() - start
print(f"CPU: {cpu_time:.3f}s")

if torch.cuda.is_available():
    a_gpu = a_cpu.to("cuda")
    b_gpu = b_cpu.to("cuda")

    torch.cuda.synchronize()
    start = time.time()
    c_gpu = a_gpu @ b_gpu
    torch.cuda.synchronize()
    gpu_time = time.time() - start
    print(f"GPU: {gpu_time:.3f}s")
    print(f"Speedup: {cpu_time / gpu_time:.0f}x")
```


This benchmark needs `torch` and an actual GPU to run for real, so it can't
execute in-browser. The VRAM budgeting math behind "will my model fit,"
though, is just arithmetic -- rebuild it below.

```python fillin
# fp16 rule of thumb: ~2 bytes/param. The naive estimate below ignores
# that activations and KV cache also eat into VRAM.
def naive_max_params_billions(vram_gb, bytes_per_param):
    return (vram_gb * 1e9) / bytes_per_param / 1e9

vram_gb = 24  # e.g. RTX 4090
print("naive fp16:", naive_max_params_billions(vram_gb, 2), "B params")  # looks fine on paper, OOMs in practice

def max_params_billions(vram_gb, bytes_per_param, overhead_frac=0.2):
    usable_gb = vram_gb * (1 - {{blank:overhead_frac}})
    return (usable_gb * 1e9) / {{blank:bytes_per_param}} / 1e9

fp16_result = max_params_billions(vram_gb, {{blank:2}})
int8_result = max_params_billions(vram_gb, {{blank:1}})

expected_fp16 = 9.6
expected_int8 = 19.2
if abs(fp16_result - expected_fp16) < 1e-9 and abs(int8_result - expected_int8) < 1e-9:
    print("PASS")
else:
    print("WRONG:", fp16_result, int8_result)
```

Reserving 20% of VRAM for activations/KV cache turns a naive "12B fits in
24GB" into the real answer: ~9.6B in fp16, ~19.2B if you quantize to int8.


## Key Terms

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA's parallel computing platform that lets you run code on the GPU |
| VRAM | "GPU memory" | Video RAM on the GPU, separate from system RAM. Limits model size. |
| fp16 | "Half precision" | 16-bit floating point, uses half the memory of fp32 with minimal accuracy loss |
| Tensor Core | "Fast matrix hardware" | Specialized GPU cores for matrix multiplication, 4-8x faster than regular cores |

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Verify local GPU availability using `nvidia-smi` and PyTorch's CUDA API.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Configure Google Colab with a T4 GPU for free cloud-based experiments.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Benchmark matrix multiplication on CPU vs GPU and measure the speedup.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Verify local GPU availability using `nvidia-smi` and PyTorch's CUDA API,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Benchmark matrix multiplication on CPU vs GPU and measure the speedup,” and cite a repeatable check rather than relying on visual inspection alone.
