# Docker for AI — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to inspect a pinned CUDA image, GPU reservation, and model-data mounts while keeping the Python layer allowlisted.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Change a temporary Dockerfile or Compose copy, then compare the static JSON before any build.
- **Evidence to retain:** the JSON summary, Compose syntax output, image build result, and host GPU/runtime result as separate records.

## Reuse checklist

- Record the exact configuration paths and mount purpose.
- Keep `/workspace`, datasets, and the named `model_cache` volume distinct.
- Treat the Python audit as configuration evidence, not proof that Docker, CUDA drivers, or a runtime service works.
- Run the lesson tests after adapting the configuration to a new project.
