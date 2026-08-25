# Lesson demo for phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md.
# Audits the supplied Dockerfile and Compose file without requiring Docker.
# Keeps the example deterministic, offline, and stdlib-only.
# Reports reproducibility and persistence controls learners should inspect.
# Run with: python3 main.py

from __future__ import annotations

import json
import re
from pathlib import Path


CODE_DIR = Path(__file__).resolve().parent


def inspect_container_config(code_dir: Path = CODE_DIR) -> dict[str, object]:
    """Extract a small, auditable configuration summary from the lesson files."""

    dockerfile = (code_dir / "Dockerfile").read_text(encoding="utf-8")
    compose = (code_dir / "docker-compose.yml").read_text(encoding="utf-8")
    base = re.search(r"^FROM\s+(\S+)", dockerfile, re.MULTILINE)
    exposed = [int(port) for port in re.findall(r"^EXPOSE\s+(\d+)", dockerfile, re.MULTILINE)]
    return {
        "base_image": base.group(1) if base else None,
        "base_is_pinned": bool(base and ":" in base.group(1) and not base.group(1).endswith(":latest")),
        "workdir": re.search(r"^WORKDIR\s+(\S+)", dockerfile, re.MULTILINE).group(1),
        "exposed_ports": exposed,
        "gpu_reservation": "capabilities: [gpu]" in compose,
        "persistent_volume": "model_cache:" in compose,
    }


if __name__ == "__main__":
    print(json.dumps(inspect_container_config(), indent=2))
