# Docker for AI — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to build a GPU-enabled Docker image with CUDA, PyTorch, and AI libraries from a Dockerfile.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Mount host directories as volumes to persist models, datasets, and code across container rebuilds.
- **Evidence to retain:** the input, output, and invariant needed to configure the NVIDIA Container Toolkit to expose GPUs inside containers.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can orchestrate multi-service AI applications (inference server + vector database) using Docker Compose.
- Run the lesson tests after adapting the implementation to a new project.

