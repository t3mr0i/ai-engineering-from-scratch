# Lesson demo for phases/00-setup-and-tooling/06-python-environments/docs/en.md.
# Inspects the active interpreter without creating or mutating an environment.
# Makes isolation, prefixes, and environment metadata observable with stdlib only.
# The demo is self-terminating and safe outside a virtual environment.
# Run with: python3 main.py

from __future__ import annotations

import json
import sys
from pathlib import Path


def environment_report() -> dict[str, object]:
    """Describe the active Python environment using stable interpreter metadata."""

    prefix = Path(sys.prefix).resolve()
    base_prefix = Path(sys.base_prefix).resolve()
    config = prefix / "pyvenv.cfg"
    return {
        "python": sys.version.split()[0],
        "executable": str(Path(sys.executable).resolve()),
        "prefix": str(prefix),
        "base_prefix": str(base_prefix),
        "isolated": prefix != base_prefix,
        "pyvenv_config": str(config) if config.is_file() else None,
    }


if __name__ == "__main__":
    print(json.dumps(environment_report(), indent=2))
