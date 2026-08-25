# Build configuration for phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md.
# Uses a pinned CUDA base and only allowlisted Python packages for the local image.
# The lesson's Python audit is static; building still requires Docker, a registry, and host drivers.
# The image contains a short self-terminating Python command rather than a hidden service.

FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir \
    numpy \
    safetensors \
    torch==2.4.1 \
    --index-url https://download.pytorch.org/whl/cu124

WORKDIR /workspace

VOLUME ["/workspace", "/models"]

CMD ["python3", "-c", "print('AI dev container ready')"]
