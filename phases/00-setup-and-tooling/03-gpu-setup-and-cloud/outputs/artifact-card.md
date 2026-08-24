# GPU Setup & Cloud — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to verify local GPU availability using `nvidia-smi` and PyTorch's CUDA API.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Configure Google Colab with a T4 GPU for free cloud-based experiments.
- **Evidence to retain:** the input, output, and invariant needed to benchmark matrix multiplication on CPU vs GPU and measure the speedup.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can estimate the largest model that fits in your VRAM using the fp16 rule of thumb.
- Run the lesson tests after adapting the implementation to a new project.

