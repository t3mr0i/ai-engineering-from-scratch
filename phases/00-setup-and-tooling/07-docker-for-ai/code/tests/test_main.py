# Behavioral tests for the static Docker/Compose audit described in docs/en.md.
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import re
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"

sys.path.insert(0, str(CODE))
from main import inspect_container_config  # noqa: E402


class ContainerAuditTests(unittest.TestCase):
    def test_checked_in_summary_matches_the_configuration(self) -> None:
        self.assertEqual(
            inspect_container_config(),
            {
                "base_image": "nvidia/cuda:12.4.1-devel-ubuntu22.04",
                "base_is_pinned": True,
                "workdir": "/workspace",
                "exposed_ports": [],
                "gpu_reservation": True,
                "persistent_volume": True,
            },
        )

    def test_dockerfile_contains_only_allowlisted_python_packages(self) -> None:
        dockerfile = (CODE / "Dockerfile").read_text(encoding="utf-8")
        install_block = dockerfile.split("RUN python3 -m pip install", maxsplit=1)[1]
        packages = set(re.findall(r"^\s{4}([a-z][a-z0-9_-]*(?:==[0-9.]+)?)\s*\\?$", install_block, re.MULTILINE))
        self.assertEqual(packages, {"numpy", "safetensors", "torch==2.3.1"})

    def test_compose_requests_gpu_and_named_model_cache(self) -> None:
        compose = (CODE / "docker-compose.yml").read_text(encoding="utf-8")
        self.assertIn("capabilities: [gpu]", compose)
        self.assertIn("model_cache:", compose)
        self.assertNotIn("image:", compose)
        self.assertNotIn("notebook", compose)

    def test_compose_has_no_unadvertised_ports(self) -> None:
        compose = (CODE / "docker-compose.yml").read_text(encoding="utf-8")
        self.assertNotIn("ports:", compose)
        self.assertNotIn("EXPOSE", (CODE / "Dockerfile").read_text(encoding="utf-8"))

    def test_source_compiles_and_has_entrypoint(self) -> None:
        source = MAIN.read_text(encoding="utf-8")
        compile(source, str(MAIN), "exec")
        self.assertIn("__main__", source)

    def test_demo_emits_expected_json_and_exits_zero(self) -> None:
        result = subprocess.run(
            [sys.executable, MAIN.name],
            cwd=CODE,
            text=True,
            capture_output=True,
            check=False,
            timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        summary = json.loads(result.stdout)
        self.assertTrue(summary["gpu_reservation"])
        self.assertTrue(summary["persistent_volume"])
        self.assertEqual(summary["exposed_ports"], [])

    def test_demo_output_is_bounded_and_static(self) -> None:
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, text=True, capture_output=True, check=False)
        self.assertLess(len(result.stdout) + len(result.stderr), 50_000)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
